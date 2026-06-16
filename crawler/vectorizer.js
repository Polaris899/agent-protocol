/**
 * TF-IDF Vectorizer with CJK support
 * Zero-dependency. Works in Node.js ESM and Browser.
 */

const CJK_REGEX = /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/;

export function* tokenize(text) {
  const lowered = text.toLowerCase();
  let current = '';
  for (let i = 0; i < lowered.length; i++) {
    const ch = lowered[i];
    if (CJK_REGEX.test(ch)) {
      if (current) { yield current; current = ''; }
      yield ch;
    } else if (/[a-z0-9]/.test(ch)) {
      current += ch;
    } else {
      if (current) { yield current; current = ''; }
    }
  }
  if (current) yield current;
}

export function cosineSimilarity(vecA, vecB) {
  let dot = 0, normA = 0, normB = 0;
  for (const key of Object.keys(vecA)) {
    const va = vecA[key], vb = vecB[key];
    dot += va * (vb || 0);
    normA += va * va;
  }
  for (const key of Object.keys(vecB)) {
    if (!(key in vecA)) normB += vecB[key] * vecB[key];
  }
  if (normA === 0 || (normB === 0 && dot === 0)) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function buildCorpus(manifests) {
  const N = manifests.length;
  const docs = [];
  const tokenized = [];
  const df = {};

  for (const m of manifests) {
    const text = [
      m.name,
      m.description || '',
      m.id || '',
      ...(m.tags || []),
      ...(m.capabilities || []).flatMap(c => [c.name, c.description || '', ...(c.intents || [])])
    ].join(' ').toLowerCase();

    docs.push(text);
    const tokens = [...tokenize(text)];
    tokenized.push(tokens);

    const uniqueTokens = new Set(tokens);
    for (const t of uniqueTokens) {
      df[t] = (df[t] || 0) + 1;
    }
  }

  // Pre-compute TF-IDF vectors
  const vectors = [];
  for (let i = 0; i < N; i++) {
    const tokens = tokenized[i];
    const tf = {};
    for (const t of tokens) tf[t] = (tf[t] || 0) + 1;
    const maxFreq = Math.max(1, ...Object.values(tf));
    const vec = {};
    for (const t of Object.keys(tf)) {
      vec[t] = (tf[t] / maxFreq) * Math.log((N + 1) / ((df[t] || 1) + 1) + 1);
    }
    vectors.push(vec);
  }

  return { docs, tokenized, vectors, df, N };
}

export function search(query, corpus, manifests, limit = 20) {
  const qTokens = [...tokenize(query)];
  if (qTokens.length === 0) return manifests.slice(0, limit);

  const qTf = {};
  qTokens.forEach(t => { qTf[t] = (qTf[t] || 0) + 1; });
  const qMax = Math.max(1, ...Object.values(qTf));
  const qVec = {};
  qTokens.forEach(t => {
    const df = corpus.df[t] || 1;
    qVec[t] = (qTf[t] / qMax) * Math.log((corpus.N + 1) / (df + 1) + 1);
  });

  const scored = corpus.vectors.map((vec, i) => ({
    score: cosineSimilarity(qVec, vec),
    manifest: manifests[i],
  }));

  return scored
    .filter(s => s.score > 0.001)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(s => Object.assign({}, s.manifest, { score: s.score }));
}
