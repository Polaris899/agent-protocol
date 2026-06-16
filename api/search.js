/**
 * AMP Search API — Vercel Serverless Function
 * 
 * GET /api/search?q=weather
 * GET /api/health
 * GET /api/stats
 * GET /api/manifest?id=com.openclaw.weather
 */

import { readFileSync } from 'fs';
import { join } from 'path';

// Load index at cold start
const INDEX_PATH = join(process.cwd(), 'api', 'index.json');
let index = [];

try {
  index = JSON.parse(readFileSync(INDEX_PATH, 'utf-8'));
  console.log(`📚 Loaded ${index.length} manifests`);
} catch (err) {
  console.error('Failed to load index:', err.message);
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

export default function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  const { pathname } = new URL(req.url, 'https://localhost');
  const query = req.query?.q || req.query?.query || '';
  const limit = Math.min(parseInt(req.query?.limit || '20'), 50);

  // Health check
  if (pathname === '/api/health' || pathname === '/api') {
    res.json({ status: 'ok', service: 'agent-protocol-search', version: '0.2.0', indexed: index.length });
    return;
  }

  // Stats
  if (pathname === '/api/stats') {
    const capCount = index.reduce((sum, m) => sum + (m.capabilities?.length || 0), 0);
    const tags = new Set();
    index.forEach(m => (m.tags || []).forEach(t => tags.add(t)));
    const engines = new Set();
    index.forEach(m => { if (m.runtime?.engine) engines.add(m.runtime.engine); });
    res.json({
      total_manifests: index.length,
      total_capabilities: capCount,
      unique_tags: tags.size,
      unique_engines: [...engines],
      last_updated: index[0]?._indexed_at || null,
    });
    return;
  }

  // Search
  if (pathname === '/api/search') {
    if (!query) {
      res.status(400).json({ error: 'Missing query parameter q' });
      return;
    }
    const results = search(query, limit);
    res.json({ query, total: results.length, results });
    return;
  }

  // Single manifest
  if (pathname === '/api/manifest') {
    const id = req.query?.id;
    if (!id) {
      res.status(400).json({ error: 'Missing id parameter' });
      return;
    }
    const manifest = index.find(m => m.id === id);
    if (!manifest) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    res.json(manifest);
    return;
  }

  // 404
  res.status(404).json({ error: 'Not found' });
}
