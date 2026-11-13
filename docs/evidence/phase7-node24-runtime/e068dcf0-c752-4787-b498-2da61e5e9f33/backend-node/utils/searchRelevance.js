/**
 * Pure, dependency-free "information retrieval" helpers for the
 * "Smart Property Search" feature: tokenizes text and ranks a set of
 * documents (properties) against a query using TF-IDF + cosine-style
 * scoring - the same core idea search engines use for keyword relevance.
 *
 * No supabase/express here on purpose, so this is trivially unit-testable.
 */

// Common English stop-words carry little search signal, so we drop them
// before scoring (a standard IR preprocessing step).
const STOP_WORDS = new Set([
    'a', 'an', 'the', 'in', 'on', 'at', 'for', 'of', 'with', 'and', 'or',
    'is', 'are', 'to', 'this', 'that', 'it', 'be', 'as', 'by', 'from',
]);

/** Lowercases, strips punctuation, and splits into stop-word-free tokens. */
function tokenize(text) {
    if (!text || typeof text !== 'string') return [];

    return text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

/** Combines a property's searchable fields into one bag of tokens. */
function tokenizeProperty(property) {
    const text = [property?.title, property?.description, property?.city, property?.district, property?.type]
        .filter(Boolean)
        .join(' ');
    return tokenize(text);
}

/** Term frequency: how often each token appears, normalized by document length. */
function termFrequencies(tokens) {
    const counts = {};
    for (const token of tokens) {
        counts[token] = (counts[token] || 0) + 1;
    }
    const total = tokens.length || 1;
    const freqs = {};
    for (const token in counts) {
        freqs[token] = counts[token] / total;
    }
    return freqs;
}

/**
 * Inverse document frequency across a corpus: rare terms (appear in few
 * documents) score higher than common terms (appear in most documents).
 */
function inverseDocumentFrequencies(documentsTokens) {
    const docCount = documentsTokens.length;
    const containingDocCount = {};

    for (const tokens of documentsTokens) {
        const seen = new Set(tokens);
        for (const token of seen) {
            containingDocCount[token] = (containingDocCount[token] || 0) + 1;
        }
    }

    const idf = {};
    for (const token in containingDocCount) {
        // +1 smoothing avoids divide-by-zero and prevents terms in every
        // document from scoring exactly zero.
        idf[token] = Math.log((docCount + 1) / (containingDocCount[token] + 1)) + 1;
    }
    return idf;
}

/**
 * Scores one document's relevance to a query: sum of (term frequency in
 * doc * inverse document frequency across corpus) for every query term
 * that appears in the document. Higher = more relevant.
 */
function scoreDocument(queryTokens, docTermFreqs, idf) {
    let score = 0;
    for (const token of queryTokens) {
        if (docTermFreqs[token]) {
            score += docTermFreqs[token] * (idf[token] || 0);
        }
    }
    return score;
}

/**
 * Ranks a list of properties by relevance to a free-text query.
 * Returns only properties with a positive score (i.e. at least one query
 * term actually matched), sorted most-relevant first, each annotated with
 * a `relevanceScore`.
 */
function rankPropertiesByRelevance(query, properties = []) {
    const queryTokens = tokenize(query);
    if (queryTokens.length === 0 || properties.length === 0) return [];

    const documentsTokens = properties.map(tokenizeProperty);
    const idf = inverseDocumentFrequencies(documentsTokens);

    const scored = properties.map((property, i) => {
        const docTermFreqs = termFrequencies(documentsTokens[i]);
        const relevanceScore = scoreDocument(queryTokens, docTermFreqs, idf);
        return { ...property, relevanceScore: Math.round(relevanceScore * 1000) / 1000 };
    });

    return scored
        .filter((p) => p.relevanceScore > 0)
        .sort((a, b) => b.relevanceScore - a.relevanceScore);
}

module.exports = {
    tokenize,
    tokenizeProperty,
    termFrequencies,
    inverseDocumentFrequencies,
    scoreDocument,
    rankPropertiesByRelevance,
};
