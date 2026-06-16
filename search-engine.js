/**
 * AMP Search Engine — zero-dependency TF-IDF vector search
 * Works in Browser and Node.js, runs locally, no network needed.
 */
(function(root) {
  'use strict';

  const CJK_REGEX = /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/;

  function* tokenize(text) {
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

  function buildQueryVec(query, df, N) {
    const tokens = [...tokenize(query)];
    if (!tokens.length) return null;
    const tf = {};
    tokens.forEach(t => { tf[t] = (tf[t] || 0) + 1; });
    const maxFreq = Math.max(1, ...Object.values(tf));
    const vec = {};
    tokens.forEach(t => {
      vec[t] = (tf[t] / maxFreq) * Math.log((N + 1) / ((df[t] || 1) + 1) + 1);
    });
    return vec;
  }

  function cosineSim(a, b) {
    let dot = 0, normA = 0, normB = 0;
    for (const key of Object.keys(a)) {
      const va = a[key], vb = b[key];
      dot += va * (vb || 0);
      normA += va * va;
    }
    for (const key of Object.keys(b)) {
      if (!(key in a)) normB += b[key] * b[key];
    }
    if (normA === 0 || normB === 0 && dot === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  function search(query, bundle, limit) {
    limit = limit || 20;
    const qVec = buildQueryVec(query, bundle.df, bundle.n);
    if (!qVec) return bundle.m.slice(0, limit);

    const scored = bundle.vec.map((sparseVec, i) => {
      const vecObj = {};
      for (const [k, v] of sparseVec) vecObj[k] = v;
      return { score: cosineSim(qVec, vecObj), idx: i };
    });

    return scored
      .filter(s => s.score > 0.001)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(s => Object.assign({}, bundle.m[s.idx], { score: s.score }));
  }

  root.AMPSearch = { search, tokenize };
})(typeof window !== 'undefined' ? window : global);
