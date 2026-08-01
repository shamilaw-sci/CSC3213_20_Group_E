const {
    haversineDistanceKm,
    computeSimilarityScore,
    findSimilarProperties,
} = require('../utils/similarityEngine');

describe('haversineDistanceKm', () => {
    it('returns ~0 for the same point', () => {
        const point = { latitude: 6.9271, longitude: 79.8612 };
        expect(haversineDistanceKm(point, point)).toBeCloseTo(0, 1);
    });

    it('returns roughly the known distance between Colombo and Kandy (~90-100km)', () => {
        const colombo = { latitude: 6.9271, longitude: 79.8612 };
        const kandy = { latitude: 7.2906, longitude: 80.6337 };
        const distance = haversineDistanceKm(colombo, kandy);

        expect(distance).toBeGreaterThan(80);
        expect(distance).toBeLessThan(110);
    });

    it('returns null when either point is missing coordinates', () => {
        expect(haversineDistanceKm({ latitude: null, longitude: 79.8 }, { latitude: 7, longitude: 80 })).toBeNull();
        expect(haversineDistanceKm(null, { latitude: 7, longitude: 80 })).toBeNull();
    });
});

describe('computeSimilarityScore', () => {
    const target = { id: 'A', type: 'House', price: 20000000, bedrooms: 3, bathrooms: 2, latitude: 6.9271, longitude: 79.8612 };

    it('scores an identical property at (or very near) 100', () => {
        const identical = { id: 'B', type: 'House', price: 20000000, bedrooms: 3, bathrooms: 2, latitude: 6.9271, longitude: 79.8612 };
        const { score } = computeSimilarityScore(target, identical);
        expect(score).toBeGreaterThanOrEqual(95);
    });

    it('scores a same-type, similar-price, nearby property higher than a different-type far property', () => {
        const closeMatch = { id: 'B', type: 'House', price: 21000000, bedrooms: 3, bathrooms: 2, latitude: 6.93, longitude: 79.86 };
        const farMismatch = { id: 'C', type: 'Land', price: 3000000, bedrooms: 0, bathrooms: 0, latitude: 9.66, longitude: 80.02 };

        const closeScore = computeSimilarityScore(target, closeMatch).score;
        const farScore = computeSimilarityScore(target, farMismatch).score;

        expect(closeScore).toBeGreaterThan(farScore);
    });

    it('returns a rounded distanceKm alongside the score', () => {
        const nearby = { id: 'B', type: 'House', price: 20000000, bedrooms: 3, bathrooms: 2, latitude: 6.93, longitude: 79.87 };
        const { distanceKm } = computeSimilarityScore(target, nearby);
        expect(typeof distanceKm).toBe('number');
        expect(distanceKm).toBeGreaterThanOrEqual(0);
    });

    it('handles missing price/bedroom data without throwing', () => {
        const incomplete = { id: 'B', type: 'House' };
        const { score } = computeSimilarityScore(target, incomplete);
        expect(Number.isFinite(score)).toBe(true);
    });
});

describe('findSimilarProperties', () => {
    const target = { id: 'target', type: 'House', price: 20000000, bedrooms: 3, bathrooms: 2, latitude: 6.9271, longitude: 79.8612 };

    const candidates = [
        { id: 'target', type: 'House', price: 20000000, bedrooms: 3, bathrooms: 2, latitude: 6.9271, longitude: 79.8612 }, // should be excluded
        { id: 'close', type: 'House', price: 20500000, bedrooms: 3, bathrooms: 2, latitude: 6.93, longitude: 79.86 },
        { id: 'medium', type: 'House', price: 30000000, bedrooms: 4, bathrooms: 3, latitude: 7.0, longitude: 80.0 },
        { id: 'far', type: 'Land', price: 2000000, bedrooms: 0, bathrooms: 0, latitude: 9.66, longitude: 80.02 },
    ];

    it('excludes the target property itself from the results', () => {
        const results = findSimilarProperties(target, candidates);
        expect(results.find((p) => p.id === 'target')).toBeUndefined();
    });

    it('sorts results by descending similarity score', () => {
        const results = findSimilarProperties(target, candidates);
        for (let i = 1; i < results.length; i++) {
            expect(results[i - 1].similarityScore).toBeGreaterThanOrEqual(results[i].similarityScore);
        }
        expect(results[0].id).toBe('close');
    });

    it('respects the limit parameter', () => {
        const results = findSimilarProperties(target, candidates, 1);
        expect(results).toHaveLength(1);
    });

    it('returns an empty array when target is missing', () => {
        expect(findSimilarProperties(null, candidates)).toEqual([]);
    });

    it('returns an empty array when there are no candidates', () => {
        expect(findSimilarProperties(target, [])).toEqual([]);
    });
});
