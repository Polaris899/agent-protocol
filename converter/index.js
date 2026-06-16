#!/usr/bin/env node

/**
 * GPTs → AMP Converter
 *
 * Converts OpenAI GPT Store configurations (openapi.yaml + instructions)
 * into Agent Manifest Protocol format (agent.json).
 *
 * Usage:
 *   node index.js --input ./gpt-config.yaml        # Single file
 *   node index.js --dir ./gpts/                     # Batch directory
 *   node index.js --scrape-gpts --limit 100         # Scrape GPT Store
 *   node index.js --url https://chatgpt.com/g/g-xxx # From URL
 */

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'fs';
import { join, dirname, extname, basename } from 'path';
import { fileURLToPath } from 'url';
import { parse } from './parsers/gpt-store.js';
import { toManifest } from './transformers/to-manifest.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {};

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--input': opts.input = args[++i]; break;
      case '--dir': opts.dir = args[++i]; break;
      case '--url': opts.url = args[++i]; break;
      case '--out-dir': opts.outDir = args[++i]; break;
      case '--scrape-gpts': opts.scrapeGpts = true; break;
      case '--limit': opts.limit = parseInt(args[++i]) || 50; break;
      case '--register': opts.register = true; break;
      default: opts._ = [...(opts._ || []), args[i]];
    }
  }
  return opts;
}

async function main() {
  const opts = parseArgs();

  if (opts.scrapeGpts) {
    await scrapeGptsStore(opts.limit, opts.outDir, opts.register);
    return;
  }

  if (opts.url) {
    await convertFromUrl(opts.url, opts.outDir, opts.register);
    return;
  }

  if (opts.dir) {
    await convertDir(opts.dir, opts.outDir, opts.register);
    return;
  }

  if (opts.input) {
    const result = await convertFile(opts.input, opts.outDir, opts.register);
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  console.error('Usage:');
  console.error('  node index.js --input ./gpt-config.yaml');
  console.error('  node index.js --dir ./gpts/');
  console.error('  node index.js --url https://chatgpt.com/g/g-xxxxx');
  console.error('  node index.js --scrape-gpts --limit 100');
  process.exit(1);
}

// ─── Single file conversion ────────────────────────────────────────────

async function convertFile(inputPath, outDir, register) {
  if (!existsSync(inputPath)) {
    console.error(`❌ 文件不存在: ${inputPath}`);
    process.exit(1);
  }

  const content = readFileSync(inputPath, 'utf-8');
  const raw = parse(content, extname(inputPath));
  const manifest = toManifest(raw);

  if (outDir) {
    if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
    const outPath = join(outDir, 'agent.json');
    writeFileSync(outPath, JSON.stringify(manifest, null, 2));
    console.log(`✅ 已写入: ${outPath}`);
  }

  if (register) {
    await registerToIndex(manifest);
  }

  return manifest;
}

// ─── Directory batch conversion ────────────────────────────────────────

async function convertDir(dirPath, outDir, register) {
  if (!existsSync(dirPath)) {
    console.error(`❌ 目录不存在: ${dirPath}`);
    process.exit(1);
  }

  const files = readdirSync(dirPath).filter(f =>
    f.endsWith('.yaml') || f.endsWith('.yml') || f.endsWith('.json')
  );

  console.log(`📁 发现 ${files.length} 个配置文件`);
  console.log();

  let success = 0;
  let fail = 0;

  for (const file of files) {
    try {
      const inputPath = join(dirPath, file);
      const name = basename(file, extname(file));
      const fileOutDir = outDir ? join(outDir, name) : null;

      console.log(`  🔄 ${file}...`);
      await convertFile(inputPath, fileOutDir, register);
      success++;
    } catch (err) {
      console.error(`  ❌ ${file}: ${err.message}`);
      fail++;
    }
  }

  console.log();
  console.log(`✅ 转换完成: ${success} 成功, ${fail} 失败`);
}

// ─── URL conversion ────────────────────────────────────────────────────

async function convertFromUrl(url, outDir, register) {
  console.log(`🌐 从 URL 抓取: ${url}`);
  console.log();

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AgentProtocol/0.1)',
      },
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const html = await res.text();

    // Try to extract GPT config from the page
    const raw = await extractGptFromPage(html, url);
    const manifest = toManifest(raw);

    if (outDir) {
      if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
      const outPath = join(outDir, 'agent.json');
      writeFileSync(outPath, JSON.stringify(manifest, null, 2));
      console.log(`✅ 已写入: ${outPath}`);
    }

    if (register) {
      await registerToIndex(manifest);
    }

    console.log(JSON.stringify(manifest, null, 2));
  } catch (err) {
    console.error(`❌ 抓取失败: ${err.message}`);
    process.exit(1);
  }
}

// ─── Extract GPT info from HTML page ───────────────────────────────────

async function extractGptFromPage(html, url) {
  // Extract basic metadata from GPT Store page
  // In production, this would use a proper HTML parser
  const extractJson = (pattern) => {
    const match = html.match(pattern);
    return match ? match[1] : null;
  };

  // Try to find JSON-LD
  const jsonLdMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/);
  let ldData = null;
  if (jsonLdMatch) {
    try { ldData = JSON.parse(jsonLdMatch[1]); } catch {}
  }

  // Try to find __NEXT_DATA__
  const nextDataMatch = html.match(/<script[^>]*id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  let nextData = null;
  if (nextDataMatch) {
    try { nextData = JSON.parse(nextDataMatch[1]); } catch {}
  }

  // Extract GPT ID from URL
  const gptIdMatch = url.match(/\/g\/g-([a-zA-Z0-9]+)/);
  const gptId = gptIdMatch ? gptIdMatch[1] : 'unknown';

  return {
    source: 'gpt-store',
    gpt_id: gptId,
    url,
    name: ldData?.name || extractJson(/"name":"([^"]+gpt[^"]+)"/i) || 'Unknown GPT',
    description: ldData?.description || 'GPT Store Skill',
    instructions: extractJson(/"instructions":"([^"]+)"/) || 'Converted from GPT Store',
    // In production, we'd also extract openapi.yaml if available
  };
}

// ─── Register to index ─────────────────────────────────────────────────

async function registerToIndex(manifest) {
  const indexPath = join(__dirname, '..', 'crawler', 'data', 'index.json');

  let index = [];
  if (existsSync(indexPath)) {
    try {
      index = JSON.parse(readFileSync(indexPath, 'utf-8'));
    } catch { index = []; }
  }

  // Remove existing entry with same ID
  index = index.filter(m => m.id !== manifest.id);
  index.push(manifest);

  writeFileSync(indexPath, JSON.stringify(index, null, 2));
  console.log(`📦 已注册到索引 (共计 ${index.length} 个 Manifest)`);
}

// ─── Scrape GPT Store ──────────────────────────────────────────────────

async function scrapeGptsStore(limit, outDir, register) {
  console.log(`🕷️ 爬取 GPT Store (最多 ${limit} 个)...`);
  console.log(chalk ? '' : '');

  // GPT Store doesn't have a public API, but we can scrape categories
  // This is a placeholder – real implementation would use:
  // 1. GPT Store sitemap / category pages
  // 2. Community-maintained GPT directories
  // 3. User-submitted URLs

  console.log('  ⚠ GPT Store 没有公开的列表 API。');
  console.log('  请使用以下替代方案之一：');
  console.log();
  console.log('  1. 提供单个 URL:   node index.js --url <gpt-url>');
  console.log('  2. 批量目录:       node index.js --dir ./gpts/');
  console.log('  3. 手动收集后转换: 将 openapi.yaml 放在 ./gpts/ 目录');
  console.log();

  // For demo purposes: create sample extracted data
  const samples = [
    {
      name: 'PDF Analyst',
      description: 'Upload any PDF and I\'ll analyze, summarize, and extract key information for you.',
      instructions: 'You are a PDF analysis expert. When users upload PDF files, extract and summarize the content. Provide key insights, data points, and actionable information.',
      openapi: {
        paths: {
          '/upload': { post: { summary: 'Upload PDF file', parameters: [{ name: 'file', in: 'formData', type: 'file' }] } },
          '/analyze': { post: { summary: 'Analyze PDF content', requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { text: { type: 'string' }, questions: { type: 'array', items: { type: 'string' } } } } } } } } },
        }
      },
      source: 'gpt-store',
      gpt_id: 'pdf-analyst',
    },
    {
      name: 'Travel Planner',
      description: 'Plan your perfect trip! I help with itineraries, flight searches, hotel recommendations, and local tips.',
      instructions: 'You are a travel planning assistant. Help users plan trips including destinations, flights, hotels, attractions, and local cuisine.',
      openapi: {
        paths: {
          '/search-flights': { get: { summary: 'Search flights', parameters: [{ name: 'from', in: 'query' }, { name: 'to', in: 'query' }, { name: 'date', in: 'query' }] } },
          '/search-hotels': { get: { summary: 'Search hotels', parameters: [{ name: 'city', in: 'query' }, { name: 'checkIn', in: 'query' }, { name: 'checkOut', in: 'query' }] } },
        }
      },
      source: 'gpt-store',
      gpt_id: 'travel-planner',
    },
  ];

  for (const sample of samples) {
    const manifest = toManifest(sample);
    await registerToIndex(manifest);
    console.log(`  → ${chalk ? '' : ''}${manifest.name} 已注册`);
  }

  console.log();
  console.log('📊 模拟完成。真实 GPT Store 爬取需要：');
  console.log('  1. 一个 GPT Store 间接索引（如 community directories）');
  console.log('  2. 或用户主动提交 GPT URL');
}

main().catch(console.error);
