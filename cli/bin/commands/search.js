import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { buildCorpus, search as semanticSearch } from '../../vectorizer.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const INDEX_PATH = join(__dirname, '..', '..', 'data', 'index.json');
const API_SEARCH = 'https://api.agent-trust-protocol.org/api/search';

export async function searchCommand(query, options) {
  const limit = parseInt(options.limit || '10');
  const asJson = options.json || false;
  const useApi = options.api || options.online || false;

  // API mode: online search (no local index needed)
  if (useApi) {
    return apiSearch(query, limit, asJson);
  }

  if (!query || !query.trim()) {
    const index = loadIndex();
    printResults(index.slice(0, limit), query, asJson);
    return;
  }

  const index = loadIndex();
  try {
    const corpus = buildCorpus(index);
    const results = semanticSearch(query, corpus, index, limit);
    printResults(results, query, asJson);
  } catch (err) {
    // Fallback: keyword match
    const kw = query.toLowerCase();
    const results = index.filter(m => {
      const text = [m.name, m.description, m.id, ...(m.tags || [])].join(' ').toLowerCase();
      return text.includes(kw);
    }).slice(0, limit);
    printResults(results, query, asJson);
  }
}

async function apiSearch(query, limit, asJson) {
  const url = API_SEARCH + '?q=' + encodeURIComponent(query || '') + '&limit=' + limit;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error('❌ API request failed:', res.status, res.statusText);
      process.exit(1);
    }
    const data = await res.json();
    const results = data.results || [];
    printResults(results, query, asJson);
  } catch (err) {
    console.error('❌ API request failed:', err.message);
    process.exit(1);
  }
}

function loadIndex() {
  if (!existsSync(INDEX_PATH)) {
    console.error('❌ Index file not found. Please reinstall agent-protocol-cli');
    process.exit(1);
  }
  return JSON.parse(readFileSync(INDEX_PATH, 'utf-8'));
}

function printResults(results, query, asJson) {
  if (asJson) {
    console.log(JSON.stringify({ query, total: results.length, results }, null, 2));
    return;
  }

  if (results.length === 0) {
    console.log(`\n  🔍 No matching Skills found for "${query}"\n`);
    return;
  }

  console.log(`\n  📦 Found ${results.length} matching Skills (query: "${query}")\n`);
  console.log('  ' + '─'.repeat(64));

  results.forEach((m, i) => {
    const capCount = m.capabilities?.length || 0;
    const repo = m._repo || m.id?.replace(/\./g, '/') || 'unknown';
    const score = m.score ? (m.score * 100).toFixed(1) + '% match' : '';
    console.log(`  ${(i + 1).toString().padStart(2)}. ${m.name}  v${m.version || '0.1'}  ${score}`);
    console.log(`     Description: ${(m.description || 'No description').slice(0, 80)}`);
    console.log(`     Capabilities: ${capCount} | Engine: ${m.runtime?.engine || 'Not specified'}`);
    console.log(`     Install: agent install ${repo}`);
    console.log('');
  });
}
