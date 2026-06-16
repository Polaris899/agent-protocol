#!/usr/bin/env node

/**
 * Agent Manifest Crawler
 *
 * Searches GitHub for public agent.json files and builds a local index.
 * Designed to run as a cron job (hourly/daily).
 *
 * Usage:
 *   GITHUB_TOKEN=ghp_xxx node crawl.js
 *   GITHUB_TOKEN=ghp_xxx node crawl.js --full   # Full re-crawl (slow)
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, 'data');
const INDEX_PATH = join(DATA_DIR, 'index.json');
const CACHE_PATH = join(DATA_DIR, 'cache.json');

// Ensure data directory exists
if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const GITHUB_API = 'https://api.github.com';

// ─── Core crawl function ───────────────────────────────────────────────

async function crawlGitHub(query, page = 1) {
  const url = `${GITHUB_API}/search/code?q=${encodeURIComponent(query)}&per_page=100&page=${page}`;

  const headers = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'agent-protocol-crawler/0.1',
  };
  if (GITHUB_TOKEN) headers['Authorization'] = `Bearer ${GITHUB_TOKEN}`;

  const res = await fetch(url, { headers });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub API error (${res.status}): ${text.slice(0, 200)}`);
  }

  const data = await res.json();
  const rateLimit = {
    remaining: res.headers.get('x-ratelimit-remaining'),
    reset: res.headers.get('x-ratelimit-reset'),
  };

  return { items: data.items || [], total: data.total_count || 0, rateLimit };
}

async function fetchFile(url) {
  const headers = { 'User-Agent': 'agent-protocol-crawler/0.1', 'Accept': 'application/vnd.github.v3.raw' };
  if (GITHUB_TOKEN) headers['Authorization'] = `Bearer ${GITHUB_TOKEN}`;

  const res = await fetch(url, { headers });
  if (!res.ok) return null;
  return res.text();
}

// ─── Manifest validation ───────────────────────────────────────────────

function isValidManifest(obj) {
  if (!obj || typeof obj !== 'object') return false;
  if (!obj.id || typeof obj.id !== 'string') return false;
  if (!obj.name || typeof obj.name !== 'string') return false;
  if (!obj.version || typeof obj.version !== 'string') return false;
  if (!obj.capabilities || !Array.isArray(obj.capabilities) || obj.capabilities.length === 0) return false;
  return true;
}

// ─── Index storage ─────────────────────────────────────────────────────

function loadIndex() {
  if (!existsSync(INDEX_PATH)) return [];
  try {
    return JSON.parse(readFileSync(INDEX_PATH, 'utf-8'));
  } catch { return []; }
}

function loadCache() {
  if (!existsSync(CACHE_PATH)) return new Set();
  try {
    return new Set(JSON.parse(readFileSync(CACHE_PATH, 'utf-8')));
  } catch { return new Set(); }
}

function saveIndex(index) {
  writeFileSync(INDEX_PATH, JSON.stringify(index, null, 2));
}

function saveCache(cache) {
  writeFileSync(CACHE_PATH, JSON.stringify([...cache]));
}

// ─── Normalize a manifest for search ───────────────────────────────────

function normalizeManifest(raw, repo, path, htmlUrl) {
  const manifest = {
    _repo: repo,
    _path: path,
    _url: htmlUrl,
    _indexed_at: new Date().toISOString(),
    id: raw.id,
    name: raw.name,
    description: (raw.description || '').slice(0, 500),
    version: raw.version,
    author: raw.author || null,
    tags: raw.tags || [],
    license: raw.license || null,
    capabilities: (raw.capabilities || []).map(c => ({
      id: c.id,
      name: c.name,
      description: (c.description || '').slice(0, 300),
      intents: (c.intents || []).slice(0, 10),
      latency: c.latency || null,
      security_level: c.security_level || 'low',
      cost_per_call: c.cost_per_call || 0,
    })),
    runtime: raw.runtime ? { engine: raw.runtime.engine, type: raw.runtime.type || 'skill' } : null,
    trust: raw.trust ? {
      permissions: raw.trust.permissions || [],
      sandbox_level: raw.trust.sandbox_level || 'basic',
      verified_by: raw.trust.verified_by || [],
    } : null,
  };
  return manifest;
}

// ─── Simple text-based search ──────────────────────────────────────────

function searchIndex(index, query) {
  const keywords = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (keywords.length === 0) return index.slice(0, 20);

  const scored = index.map(manifest => {
    let score = 0;
    const searchText = [
      manifest.name,
      manifest.description,
      manifest.id,
      ...(manifest.tags || []),
      ...(manifest.capabilities || []).map(c => c.name + ' ' + c.description + ' ' + (c.intents || []).join(' ')),
    ].join(' ').toLowerCase();

    for (const kw of keywords) {
      if (searchText.includes(kw)) {
        score += (searchText.match(new RegExp(kw, 'g')) || []).length;
      }
    }

    // Bonus for exact matches in name
    if (manifest.name.toLowerCase().includes(keywords[0])) score += 5;
    // Bonus for tags match
    if ((manifest.tags || []).some(t => t.toLowerCase().includes(keywords[0]))) score += 3;

    return { manifest, score };
  });

  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(s => s.manifest);
}

// ─── Main ──────────────────────────────────────────────────────────────

async function main() {
  const isFullCrawl = process.argv.includes('--full');
  const searchQueries = [
    'filename:agent.json',
    'filename:agent.yaml',
  ];

  console.log(`🤖 Agent Manifest Crawler v0.1`);
  console.log(`   Mode: ${isFullCrawl ? 'FULL' : 'INCREMENTAL'}`);
  console.log(`   GitHub Token: ${GITHUB_TOKEN ? '✓ 已配置' : '✗ 未配置（速率限制: 60次/小时）'}`);
  console.log();

  let index = isFullCrawl ? [] : loadIndex();
  const seenUrls = isFullCrawl ? new Set() : loadCache();
  let totalFound = 0;
  let newFound = 0;

  for (const query of searchQueries) {
    console.log(`📡 搜索: ${query}`);

    for (let page = 1; page <= 10; page++) {  // max 10 pages = 1000 results
      try {
        const { items, total, rateLimit } = await crawlGitHub(query, page);
        if (page === 1) console.log(`   总共 ${total} 个结果`);

        console.log(`   第 ${page} 页: ${items.length} 个文件 (剩余次数: ${rateLimit.remaining})`);
        totalFound += items.length;

        for (const item of items) {
          if (seenUrls.has(item.html_url)) continue;
          seenUrls.add(item.html_url);

          // Fetch and parse the manifest
          const content = await fetchFile(item.git_url?.replace('git:', 'https:') || item.html_url?.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/'));
          if (!content) continue;

          let manifest;
          try {
            manifest = JSON.parse(content);
          } catch {
            continue;  // Not valid JSON, skip
          }

          if (!isValidManifest(manifest)) continue;

          const repo = item.repository?.full_name || 'unknown';
          const normalized = normalizeManifest(manifest, repo, item.path, item.html_url);

          // Replace or append
          const existingIdx = index.findIndex(m => m.id === normalized.id);
          if (existingIdx >= 0) {
            index[existingIdx] = normalized;
          } else {
            index.push(normalized);
          }
          newFound++;
        }

        // Check rate limit
        if (parseInt(rateLimit.remaining) < 10) {
          const resetTime = new Date(parseInt(rateLimit.reset) * 1000);
          console.log(`   ⏸ 速率限制不足，等待至 ${resetTime.toLocaleTimeString()}...`);
          break;
        }
      } catch (err) {
        console.error(`   ❌ 错误: ${err.message}`);
        break;
      }
    }
    console.log();
  }

  // Save
  saveIndex(index);
  saveCache(seenUrls);

  console.log(`📊 结果汇总:`);
  console.log(`   总文件检查: ${totalFound}`);
  console.log(`   新增/更新 Manifest: ${newFound}`);
  console.log(`   索引总量: ${index.length}`);
  console.log(`   缓存 URL: ${seenUrls.size}`);
  console.log();
  console.log(`📁 索引已保存: ${INDEX_PATH}`);
}

main().catch(console.error);
