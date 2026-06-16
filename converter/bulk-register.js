#!/usr/bin/env node

/**
 * Bulk Register: converts generated GPT entries to AMP manifests
 * and registers them in crawler/data/index.json
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { toManifest } from './transformers/to-manifest.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const INDEX_PATH = join(__dirname, '..', 'crawler', 'data', 'index.json');

function main() {
  const args = process.argv.slice(2);
  const inputFile = args.find(a => a.startsWith('--input='))?.split('=')[1] || join(__dirname, 'gpt-bulk.json');

  console.log(`📖 读取: ${inputFile}`);
  const gpts = JSON.parse(readFileSync(inputFile, 'utf-8'));
  console.log(`📦 共 ${gpts.length} 个 GPT 条目`);

  // Load existing index
  let index = [];
  if (existsSync(INDEX_PATH)) {
    index = JSON.parse(readFileSync(INDEX_PATH, 'utf-8'));
    console.log(`📚 现有索引: ${index.length} 个 manifests`);
  }

  // Count existing entries by engine
  const existingOpenai = new Set(index.filter(m => m.runtime?.engine === 'openai-gpts').map(m => m.id));

  let added = 0;
  let skipped = 0;
  let errors = 0;

  for (const gpt of gpts) {
    try {
      const manifest = toManifest(gpt);
      
      // Check for duplicates
      if (existingOpenai.has(manifest.id)) {
        skipped++;
        continue;
      }

      // Add _repo for tracking
      const gptSlug = gpt.gpt_id || `gpt-${Date.now()}-${Math.random().toString(36).slice(2,6)}`;
      manifest._repo = `openai/gpt-${gptSlug}`;
      manifest._url = `https://chatgpt.com/g/g-${gptSlug}`;
      manifest._indexed_at = new Date().toISOString();

      index.push(manifest);
      existingOpenai.add(manifest.id);
      added++;
    } catch (err) {
      errors++;
      if (errors <= 3) console.error(`  ❌ ${gpt.name}: ${err.message}`);
    }
  }

  // Write updated index
  writeFileSync(INDEX_PATH, JSON.stringify(index, null, 2));
  console.log('\n📊 统计:');
  console.log(`  新增:  ${added}`);
  console.log(`  跳过 (重复): ${skipped}`);
  console.log(`  错误:  ${errors}`);
  console.log(`  索引总计: ${index.length} 个 manifests`);

  // Engine distribution
  const engines = {};
  for (const m of index) {
    const e = m.runtime?.engine || 'unknown';
    engines[e] = (engines[e] || 0) + 1;
  }
  console.log('\n引擎分布:');
  for (const [e, c] of Object.entries(engines).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${e.padEnd(20)} ${c}`);
  }
}

main();
