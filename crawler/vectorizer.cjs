/**
 * TF-IDF Vectorizer with CJK support
 * Zero-dependency semantic search engine for AMP Registry
 * 
 * - Chinese: character-level tokenization (unigram)
 * - English: word-level tokenization
 * - Mixed: both strategies combined
 */

// ─── Tokenizer ───
const CJK_REGEX = /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/;

function* tokenize(text) {
  const lowered = text.toLowerCase();
  let i = 0;
  let currentWord = '';
  
  while (i < lowered.length) {
    const ch = lowered[i];
    
    if (CJK_REGEX.test(ch)) {
      // Emit any accumulated Latin word
      if (currentWord) {
        yield currentWord;
        currentWord = '';
      }
      // CJK: emit each character as a unigram
      yield ch;
      i++;
    } else if (/[a-z0-9]/.test(ch)) {
      currentWord += ch;
      i++;
    } else {
      // Punctuation/whitespace: emit accumulated word
      if (currentWord) {
        yield currentWord;
        currentWord = '';
      }
      i++;
    }
  }
  if (currentWord) yield currentWord;
}

// ─── IDF corpus ───
function buildCorpus(manifests) {
  const docs = manifests.map(m => {
    const texts = [
      m.name || '',
      m.description || '',
      (m.tags || []).join(' '),
      (m.keywords || []).join(' '),
      (m.capabilities || []).map(c => [
        c.name || '',
        c.description || '',
        (c.intents || []).join(' ')
      ].join(' ')).join(' ')
    ];
    return texts.join(' ').toLowerCase();
  });

  const N = docs.length;
  const tokenized = docs.map(d => [...tokenize(d)]);
  
  // Document frequency
  const df = {};
  tokenized.forEach(tokens => {
    const seen = new Set();
    tokens.forEach(t => {
      if (!seen.has(t)) {
        df[t] = (df[t] || 0) + 1;
        seen.add(t);
      }
    });
  });

  // TF-IDF vectors
  const vectors = tokenized.map(tokens => {
    const tf = {};
    tokens.forEach(t => { tf[t] = (tf[t] || 0) + 1; });
    const maxFreq = Math.max(1, ...Object.values(tf));
    const vec = {};
    tokens.forEach(t => {
      vec[t] = (tf[t] / maxFreq) * Math.log((N + 1) / (df[t] + 1) + 1);
    });
    return vec;
  });

  return { docs, tokenized, vectors, df, N };
}

// ─── Cosine similarity ───
function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0;
  const allKeys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const k of allKeys) {
    const va = a[k] || 0, vb = b[k] || 0;
    dot += va * vb;
    normA += va * va;
    normB += vb * vb;
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// ─── Search ───
function search(query, corpus, manifests, limit = 20) {
  const qTokens = [...tokenize(query)];
  const qTf = {};
  qTokens.forEach(t => { qTf[t] = (qTf[t] || 0) + 1; });
  
  if (qTokens.length === 0) return manifests.slice(0, limit);
  
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
    .map(s => { const m = Object.assign({}, s.manifest); m.score = s.score; return m; });
}

// ─── Export ───
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { buildCorpus, search, tokenize, cosineSimilarity };
}
