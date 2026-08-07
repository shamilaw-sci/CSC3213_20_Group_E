const {
    tokenize,
    termFrequencies,
    inverseDocumentFrequencies,
    scoreDocument,
    rankPropertiesByRelevance,
} = require('../utils/searchRelevance');

describe('tokenize', () => {
    it('lowercases and splits text into words', () => {
        expect(tokenize('Modern House in Colombo')).toEqual(['modern', 'house', 'colombo']);
    });

    it('strips punctuation', () => {
        expect(tokenize('3-bedroom, sea-facing villa!')).toEqual(['bedroom', 'sea', 'facing', 'villa']);
    });

    it('removes stop-words and single-character tokens', () => {
        expect(tokenize('a house in the city')).toEqual(['house', 'city']);
    });

    it('returns an empty array for empty/invalid input', () => {
        expect(tokenize('')).toEqual([]);
        expect(tokenize(null)).toEqual([]);
        expect(tokenize(undefined)).toEqual([]);
    });
});

describe('termFrequencies', () => {
    it('computes normalized frequency of each term', () => {
        const freqs = termFrequencies(['house', 'house', 'garden']);
        expect(freqs.house).toBeCloseTo(2 / 3);
        expect(freqs.garden).toBeCloseTo(1 / 3);
    });
});

describe('inverseDocumentFrequencies', () => {
    it('gives a rare term a higher idf than a term in every document', () => {
        const docs = [
            ['house', 'colombo'],
            ['house', 'kandy'],
            ['house', 'galle'],
        ];
        const idf = inverseDocumentFrequencies(docs);
        // "house" appears in all 3 docs, "colombo" in only 1 - colombo should score higher
        expect(idf.colombo).toBeGreaterThan(idf.house);
    });
});

describe('scoreDocument', () => {
    it('scores higher when more query terms are present with higher frequency', () => {
        const idf = { house: 1, garden: 2 };
        const strongMatch = termFrequencies(['house', 'garden', 'garden']);
        const weakMatch = termFrequencies(['house']);

        const strongScore = scoreDocument(['house', 'garden'], strongMatch, idf);
        const weakScore = scoreDocument(['house', 'garden'], weakMatch, idf);

        expect(strongScore).toBeGreaterThan(weakScore);
    });

    it('scores zero when no query terms are present', () => {
        const idf = { house: 1 };
        const docFreqs = termFrequencies(['garden', 'pool']);
        expect(scoreDocument(['house'], docFreqs, idf)).toBe(0);
    });
});

describe('rankPropertiesByRelevance', () => {
    const properties = [
        { id: 'p1', title: 'Modern sea-facing villa', description: 'Beautiful villa with pool in Galle', city: 'Galle', type: 'House' },
        { id: 'p2', title: 'Cozy apartment in Colombo', description: 'Close to shops and schools', city: 'Colombo', type: 'Apartment' },
        { id: 'p3', title: 'Land for sale', description: 'Large plot near Kandy lake', city: 'Kandy', type: 'Land' },
    ];

    it('ranks the property matching the most query terms first', () => {
        const results = rankPropertiesByRelevance('villa pool galle', properties);
        expect(results[0].id).toBe('p1');
    });

    it('excludes properties that match none of the query terms', () => {
        const results = rankPropertiesByRelevance('kandy lake', properties);
        expect(results).toHaveLength(1);
        expect(results[0].id).toBe('p3');
    });

    it('returns an empty array for an empty query', () => {
        expect(rankPropertiesByRelevance('', properties)).toEqual([]);
        expect(rankPropertiesByRelevance('   ', properties)).toEqual([]);
    });

    it('returns an empty array when there are no candidate properties', () => {
        expect(rankPropertiesByRelevance('villa', [])).toEqual([]);
    });

    it('attaches a relevanceScore to every returned property', () => {
        const results = rankPropertiesByRelevance('apartment colombo', properties);
        expect(results[0]).toHaveProperty('relevanceScore');
        expect(results[0].relevanceScore).toBeGreaterThan(0);
    });

    it('is case-insensitive', () => {
        const results = rankPropertiesByRelevance('VILLA', properties);
        expect(results[0].id).toBe('p1');
    });
});
