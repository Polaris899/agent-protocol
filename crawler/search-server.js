#!/usr/bin/env node

/**
 * Agent Protocol Search API Server
 *
 * Serves search queries from the local index on demand.
 * Works as a lightweight HTTP API for the CLI and Web UI.
 *
 * Usage: node search-server.js
 *        PORT=3456 node search-server.js
 */

import { readFileSync, existsSync } from 'fs';
import { createServer } from 'http';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, 'data');
const INDEX_PATH = join(DATA_DIR, 'index.json');

const PORT = parseInt(process.env.PORT || '3456');

let index = [];

function loadIndex() {
  if (!existsSync(INDEX_PATH)) {
    console.log('⚠  索引文件未找到，搜索将返回空结果。');
    console.log('   先运行: node crawl.js');
    index = [];
    return;
  }
  try {
    index = JSON.parse(readFileSync(INDEX_PATH, 'utf-8'));
    console.log(`📚 已加载 ${index.length} 个 Manifest`);
  } catch (err) {
    console.error('❌ 索引文件损坏:', err.message);
    index = [];
  }
}

function search(query, limit = 20) {
  const keywords = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (keywords.length === 0) return index.slice(0, limit);

  const scored = index.map(manifest => {
    let score = 0;
    const searchText = [
      manifest.name,
      manifest.description,
      manifest.id,
      ...(manifest.tags || []),
      ...(manifest.capabilities || []).map(c =>
        c.name + ' ' + (c.description || '') + ' ' + (c.intents || []).join(' ')
      ),
    ].join(' ').toLowerCase();

    for (const kw of keywords) {
      if (searchText.includes(kw)) {
        score += (searchText.match(new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
      }
    }

    // Boost exact name matches
    if (manifest.name && manifest.name.toLowerCase().includes(keywords[0])) score += 5;
    if (manifest.tags && manifest.tags.some(t => t.toLowerCase().includes(keywords[0]))) score += 3;

    return { manifest, score };
  });

  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(s => s.manifest);
}

function parseQuery(url) {
  const qs = new URL(url, 'http://localhost').searchParams;
  return {
    q: qs.get('q') || qs.get('query') || '',
    limit: Math.min(parseInt(qs.get('limit') || '20'), 50),
    format: qs.get('format') || 'json',
  };
}

// Create HTTP server
const server = createServer((req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, 'http://localhost');
  const path = url.pathname;

  // Health check
  if (path === '/health' || path === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      service: 'agent-protocol-search',
      version: '0.1.0',
      indexed: index.length,
    }));
    return;
  }

  // Stats
  if (path === '/stats') {
    const capCount = index.reduce((sum, m) => sum + (m.capabilities?.length || 0), 0);
    const tags = new Set();
    index.forEach(m => (m.tags || []).forEach(t => tags.add(t)));
    const engines = new Set();
    index.forEach(m => { if (m.runtime?.engine) engines.add(m.runtime.engine); });

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      total_manifests: index.length,
      total_capabilities: capCount,
      unique_tags: tags.size,
      unique_engines: [...engines],
      last_updated: index[0]?._indexed_at || null,
    }));
    return;
  }

  // Search API
  if (path === '/search' || path === '/api/search') {
    const { q, limit, format } = parseQuery(req.url);

    if (!q) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '缺少查询参数 q' }));
      return;
    }

    const results = search(q, limit);

    const response = {
      query: q,
      total: results.length,
      results,
    };

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(response, null, format === 'pretty' ? 2 : 0));
    return;
  }

  // Single manifest by ID
  if (path === '/manifest') {
    const id = url.searchParams.get('id');
    if (!id) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '缺少 id 参数' }));
      return;
    }

    const manifest = index.find(m => m.id === id);
    if (!manifest) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '未找到' }));
      return;
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(manifest, null, 2));
    return;
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
  console.log('┌──────────────────────────────────────────────┐');
  console.log('│  Agent Protocol Search API Server            │');
  console.log('├──────────────────────────────────────────────┤');
  console.log(`│  API:       http://localhost:${PORT}/search?q=天气  │`);
  console.log(`│  Health:    http://localhost:${PORT}/health        │`);
  console.log(`│  Stats:     http://localhost:${PORT}/stats         │`);
  console.log('└──────────────────────────────────────────────┘');
});

// Load index on start
loadIndex();

// Reload index on SIGHUP
process.on('SIGHUP', () => {
  console.log('🔄 重新加载索引...');
  loadIndex();
});
