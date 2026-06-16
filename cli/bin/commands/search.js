import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const INDEX_PATH = join(__dirname, '..', '..', '..', 'crawler', 'data', 'index.json');

export async function searchCommand(query, options) {
  const limit = parseInt(options.limit || '20');

  // Try remote API first if --remote flag
  if (options.remote) {
    const apiBase = process.env.AMP_REGISTRY_URL || 'https://api.agent-protocol.dev';
    try {
      const res = await fetch(`${apiBase}/search?q=${encodeURIComponent(query)}&limit=${limit}`);
      if (res.ok) {
        const data = await res.json();
        printResults(data.results || [], query);
        return;
      }
    } catch {}
  }

  // Local search
  if (!existsSync(INDEX_PATH)) {
    console.error('❌ 索引文件未找到。请先在项目根目录运行: node crawler/crawl.js');
    process.exit(1);
  }

  const index = JSON.parse(readFileSync(INDEX_PATH, 'utf-8'));
  const keywords = query.toLowerCase().split(/\s+/).filter(Boolean);

  const scored = index.map(m => {
    let score = 0;
    const text = [
      m.name, m.description, m.id,
      ...(m.tags || []),
      ...(m.capabilities || []).map(c => c.name + ' ' + (c.description || '') + ' ' + (c.intents || []).join(' '))
    ].join(' ').toLowerCase();

    for (const kw of keywords) {
      const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const matches = text.match(new RegExp(escaped, 'g'));
      if (matches) score += matches.length;
      if (m.name?.toLowerCase().includes(kw)) score += 5;
    }
    return { manifest: m, score };
  });

  const results = scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(s => s.manifest);

  printResults(results, query);
}

function printResults(results, query) {
  if (results.length === 0) {
    console.log(`\n  🔍 未找到匹配 "${query}" 的 Skill\n`);
    return;
  }

  console.log(`\n  📦 找到 ${results.length} 个匹配的 Skill（查询: "${query}"）\n`);
  console.log('  ' + '─'.repeat(60));

  results.forEach((m, i) => {
    const capCount = m.capabilities?.length || 0;
    const repo = m._repo || m.id?.replace(/\./g, '/') || 'unknown';
    console.log(`  ${i + 1}. ${m.name}  v${m.version || '0.1'}`);
    console.log(`     描述: ${(m.description || '暂无').slice(0, 80)}`);
    console.log(`     能力: ${capCount} 个 | 引擎: ${m.runtime?.engine || '未指定'}`);
    console.log(`     安装: agent install ${repo}`);
    console.log('');
  });
}
