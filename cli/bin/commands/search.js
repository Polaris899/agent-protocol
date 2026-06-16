import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..', '..');
const INDEX_PATH = join(ROOT, 'crawler', 'data', 'index.json');
const VEC_PATH = join(ROOT, 'crawler', 'vectorizer.cjs');

// Lazy-load vectorizer (CommonJS module inside ESM project)
let vectorizer;
function getVec() {
  if (!vectorizer) {
    const { createRequire } = await import('module');
    const require = createRequire(import.meta.url);
    vectorizer = require(VEC_PATH);
  }
  return vectorizer;
}

export async function searchCommand(query, options) {
  const limit = parseInt(options.limit || '20');
  const asJson = options.json || false;

  if (!existsSync(INDEX_PATH)) {
    console.error('❌ 索引文件未找到。请先在项目根目录运行: node crawler/crawl.js');
    process.exit(1);
  }

  const index = JSON.parse(readFileSync(INDEX_PATH, 'utf-8'));
  
  if (!query || !query.trim()) {
    printResults(index.slice(0, limit), query, asJson);
    return;
  }

  // Try semantic search first
  try {
    const vec = await getVec();
    const corpus = vec.buildCorpus(index);
    const results = vec.search(query, corpus, index, limit);
    printResults(results, query, asJson);
  } catch {
    // Fallback to keyword search
    const keywords = query.toLowerCase().split(/\s+/).filter(Boolean);
    const scored = index.map(m => {
      let score = 0;
      const text = [
        m.name, m.description, m.id,
        ...(m.tags || []),
        ...(m.capabilities || []).map(c => c.name + ' ' + (c.description || '') + ' ' + (c.intents || []).join(' '))
      ].join(' ').toLowerCase();
      for (const kw of keywords) {
        const matches = text.match(new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'));
        if (matches) score += matches.length;
      }
      return { manifest: m, score };
    });
    const results = scored.filter(s => s.score > 0).sort((a, b) => b.score - a.score).slice(0, limit).map(s => s.manifest);
    printResults(results, query, asJson);
  }
}

function printResults(results, query, asJson) {
  if (asJson) {
    console.log(JSON.stringify({ query, total: results.length, results }, null, 2));
    return;
  }

  if (results.length === 0) {
    console.log(`\n  🔍 未找到匹配 "${query}" 的 Skill\n`);
    return;
  }

  console.log(`\n  📦 找到 ${results.length} 个匹配的 Skill（查询: "${query}"）\n`);
  console.log('  ' + '─'.repeat(64));

  results.forEach((m, i) => {
    const capCount = m.capabilities?.length || 0;
    const repo = m._repo || m.id?.replace(/\./g, '/') || 'unknown';
    const score = m.score ? (m.score * 100).toFixed(1) + '%' : '';
    console.log(`  ${(i+1).toString().padStart(2)}. ${m.name}  v${m.version || '0.1'}  ${score}`);
    console.log(`     描述: ${(m.description || '暂无').slice(0, 80)}`);
    console.log(`     能力: ${capCount} 个 | 引擎: ${m.runtime?.engine || '未指定'}`);
    console.log(`     安装: agent install ${repo}`);
    console.log('');
  });
}
