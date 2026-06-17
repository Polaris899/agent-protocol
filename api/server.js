/**
 * AMP GPT Interconnector API — Vercel Serverless
 *
 * Routes:                                    GPT Action:
 *   POST /api/route     → intent routing       ↓
 *   POST /api/register  → register GPT         openapi: 3.0.0
 *   GET  /api/search    → semantic search       servers:
 *   GET  /api/manifest  → get manifest            - url: https://agent-protocol.dev/api
 *   GET  /api/health    → health               paths:
 *   GET  /api/stats     → registry stats          /route:
 *                                                  post:
 *                                                    operationId: routeIntent
 *                                                    summary: "Find AI Skill for user intent"
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// ─── TF-IDF Vectorizer (zero-dep, embedded) ────────────────────────────

const CJK = /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/;

function* tok(text) {
  const s = text.toLowerCase();
  let buf = '';
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (CJK.test(c)) { if (buf) { yield buf; buf = ''; } yield c; }
    else if (/[a-z0-9]/.test(c)) buf += c;
    else { if (buf) { yield buf; buf = ''; } }
  }
  if (buf) yield buf;
}

function cosim(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (const k of Object.keys(a)) {
    const va = a[k], vb = b[k];
    dot += va * (vb || 0); na += va * va;
  }
  for (const k of Object.keys(b)) if (!(k in a)) nb += b[k] * b[k];
  if (na === 0 || (nb === 0 && dot === 0)) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

// ─── Load & Index at cold start ────────────────────────────────────────

const INDEX_PATH = join(process.cwd(), 'api', 'index.json');
let raw = [];
try { raw = JSON.parse(readFileSync(INDEX_PATH, 'utf-8')); } catch {}
const N = raw.length;

// Pre-build search bundle
const df = {};
const vectors = [];
const vecCache = new Map(); // id -> vectors (for registered on-the-fly)

for (const m of raw) {
  const text = [m.name, m.description || '', m.id || '', ...(m.tags || []),
    ...(m.capabilities || []).flatMap(c => [c.name, c.description || '', ...(c.intents || [])])
  ].join(' ').toLowerCase();
  const tokens = [...tok(text)];
  const ut = new Set(tokens);
  for (const t of ut) df[t] = (df[t] || 0) + 1;

  const tf = {}; for (const t of tokens) tf[t] = (tf[t] || 0) + 1;
  const mf = Math.max(1, ...Object.values(tf));
  const vec = {};
  for (const t of Object.keys(tf)) vec[t] = (tf[t] / mf) * Math.log((N + 1) / ((df[t] || 1) + 1) + 1);
  vectors.push(vec);
  vecCache.set(m.id, vec);
}

const CORPUS = { N, df };

function searchVec(query) {
  const tokens = [...tok(query)];
  if (!tokens.length) return raw.slice(0, 20);
  const qtf = {}; tokens.forEach(t => { qtf[t] = (qtf[t] || 0) + 1; });
  const qmf = Math.max(1, ...Object.values(qtf));
  const qv = {};
  tokens.forEach(t => { qv[t] = (qtf[t] / qmf) * Math.log((N + 1) / ((df[t] || 1) + 1) + 1); });

  // Reject queries where ALL tokens are too common (short common words like "make", "up")
  const commonTokenThreshold = N * 0.5;
  const allCommon = tokens.every(t => (df[t] || 0) > commonTokenThreshold);
  if (allCommon && tokens.length <= 3) return [];

  const scored = vectors.map((v, i) => ({ score: cosim(qv, v), idx: i }));
  return scored.filter(s => s.score > 0.1)
    .sort((a, b) => b.score - a.score)
    .slice(0, 20)
    .map(s => ({ ...raw[s.idx], score: Math.round(s.score * 10000) / 10000 }));
}

// In-memory registry for runtime registrations
const ephemeralRegistry = [];

// ─── GPT Action converter ──────────────────────────────────────────────

function gptConfigToManifest(body) {
  const gptId = body.gpt_id || body.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || `gpt-${Date.now()}`;
  const openapi = body.openapi || body.api || {};
  const isVerified = !!body.is_verified;
  const desc = body.description || body.instructions || openapi.info?.description || 'GPT Store Skill';

  const capabilities = [];
  // Extract from openapi paths
  if (openapi.paths) {
    for (const [path, methods] of Object.entries(openapi.paths)) {
      for (const [method, detail] of Object.entries(methods)) {
        if (typeof detail !== 'object') continue;
        const n = path.replace(/[^a-z0-9]/g, '_').replace(/^_+|_+$/g, '');
        capabilities.push({
          id: `gpt_${n}`,
          name: detail.summary || `${method.toUpperCase()} ${path}`,
          description: detail.summary || `GPT Action: ${method} ${path}`,
          intents: [detail.summary || '', desc].filter(Boolean),
          input: extractSchema(detail),
          latency: 'low',
          security_level: 'low',
        });
      }
    }
  }
  // Fallback: pure chat GPT
  if (!capabilities.length) {
    capabilities.push({
      id: 'chat',
      name: body.name || 'GPT Assistant',
      description: desc,
      intents: [desc],
      latency: 'low',
      security_level: 'low',
    });
  }

  const tags = ['gpt-store'];
  if (body.name) tags.push(...body.name.toLowerCase().split(/[\s/]+/).filter(w => w.length > 2));

  return {
    $schema: 'https://agent-protocol.dev/v1.0/manifest.schema.json',
    id: `com.openai.gpt-${gptId}`,
    name: body.name || openapi.info?.title || 'Unknown GPT',
    description: desc,
    version: body.version || '1.0.0',
    tags: [...new Set(tags)].slice(0, 10),
    license: 'custom',
    capabilities,
    runtime: { engine: 'openai-gpts', type: 'skill', config_url: body.url || '' },
    trust: {
      permissions: inferPerms(openapi, desc),
      sandbox_level: isVerified ? 'basic' : 'isolated',
      verified_by: isVerified ? ['openai_gpt_store'] : [],
    },
  };
}

function extractSchema(detail) {
  if (!detail?.parameters?.length && !detail?.requestBody) return null;
  const schema = { type: 'object', properties: {}, required: [] };
  if (detail.parameters) for (const p of detail.parameters) {
    schema.properties[p.name || 'p'] = { type: p.schema?.type || p.type || 'string', description: p.description || p.name };
    if (p.required) schema.required.push(p.name);
  }
  if (detail.requestBody?.content?.['application/json']?.schema) {
    const js = detail.requestBody.content['application/json'].schema;
    if (js.properties) Object.assign(schema.properties, js.properties);
    if (js.required) schema.required.push(...js.required);
  }
  return Object.keys(schema.properties).length ? schema : null;
}

function inferPerms(openapi, desc) {
  const p = new Set();
  if (openapi.paths && Object.keys(openapi.paths).length) p.add('network');
  if (/file|upload|pdf/i.test(desc)) p.add('read_file');
  if (/browse|search|web/i.test(desc)) p.add('web_browsing');
  return [...p];
}

// ─── Handler ───────────────────────────────────────────────────────────

export default function handler(req, res) {
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }

  const url = new URL(req.url, 'https://localhost');
  const path = url.pathname.replace(/\/+$/, '');
  const q = req.query?.q || req.query?.query || '';

  try {
    switch (path) {

      // ── GET /api/health ────────────────────────────────────────────
      case '/api':
      case '/api/health':
        return res.json({ status: 'ok', version: '0.3.0', indexed: N, registered_ephemeral: ephemeralRegistry.length });

      // ── GET /api/stats ─────────────────────────────────────────────
      case '/api/stats': {
        const capCount = raw.reduce((s, m) => s + (m.capabilities?.length || 0), 0);
        const engines = [...new Set(raw.map(m => m.runtime?.engine).filter(Boolean))];
        return res.json({
          total_manifests: N,
          total_capabilities: capCount,
          unique_engines: engines,
          ephemeral_registrations: ephemeralRegistry.length,
        });
      }

      // ── GET /api/search?q=xxx ──────────────────────────────────────
      case '/api/search': {
        if (!q) return res.status(400).json({ error: 'Missing query parameter q' });
        const results = searchVec(q);
        return res.json({ query: q, total: results.length, results });
      }

      // ── GET /api/manifest?id=xxx ───────────────────────────────────
      case '/api/manifest': {
        const id = req.query?.id;
        if (!id) return res.status(400).json({ error: 'Missing id parameter' });
        const m = raw.find(m => m.id === id) || ephemeralRegistry.find(m => m.id === id);
        if (!m) return res.status(404).json({ error: 'Not found' });
        return res.json(m);
      }

      // ── POST /api/route ────────────────────────────────────────────
      case '/api/route': {
        if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

        const intent = req.body?.intent || req.body?.query || '';
        const fromGpt = req.body?.from_gpt || req.body?.from || '';

        if (!intent) return res.status(400).json({ error: 'Missing intent' });

        const results = searchVec(intent);
        const maxScore = results[0]?.score || 0;

        // Log the route query
        console.log(`[ROUTE] from=${fromGpt} intent="${intent}" matches=${results.length} top_score=${maxScore}`);

        return res.json({
          matched: results.length > 0,
          intent,
          from_gpt: fromGpt,
          top_match: results[0] || null,
          alternatives: results.slice(1, 4),
          total_matches: results.length,
          timestamp: new Date().toISOString(),
        });
      }

      // ── POST /api/register ─────────────────────────────────────────
      case '/api/register': {
        if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

        const manifest = gptConfigToManifest(req.body || {});
        manifest._registered_at = new Date().toISOString();

        ephemeralRegistry.push(manifest);

        console.log(`[REGISTER] id=${manifest.id} name="${manifest.name}"`);

        return res.status(201).json({
          id: manifest.id,
          name: manifest.name,
          registered: true,
          manifest,
          note: 'Registered in ephemeral memory. Persist to index for permanent registration.',
        });
      }

      // ── Default: 404 ───────────────────────────────────────────────
      default:
        return res.status(404).json({ error: `Not found: ${path}`, paths: ['/api/health', '/api/stats', '/api/search', '/api/manifest', '/api/route', '/api/register'] });
    }
  } catch (err) {
    console.error(`[ERROR] ${req.method} ${path}:`, err.message);
    return res.status(500).json({ error: err.message });
  }
}
