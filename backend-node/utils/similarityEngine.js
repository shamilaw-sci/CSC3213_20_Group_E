/**
 * Pure, dependency-free "recommendation engine" helpers for the
 * "Similar Properties" feature. No supabase/express here on purpose, so
 * this is trivially unit-testable.
 */

const EARTH_RADIUS_KM = 6371;

/**
 * Great-circle distance between two lat/lng points, in kilometres.
 * Standard Haversine formula.
 */
function haversineDistanceKm(pointA, pointB) {
    if (
        pointA?.latitude == null || pointA?.longitude == null ||
        pointB?.latitude == null || pointB?.longitude == null
    ) {
        return null; // Unknown distance - caller decides how to treat this
    }

    const toRad = (deg) => (deg * Math.PI) / 180;

    const lat1 = Number(pointA.latitude);
    const lon1 = Number(pointA.longitude);
    const lat2 = Number(pointB.latitude);
    const lon2 = Number(pointB.longitude);

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return EARTH_RADIUS_KM * c;
}

// Relative weight each factor contributes to the final 0-100 similarity score.
// Together they must sum to 1 - kept as named constants so the "recipe" is
// easy to see and tune in one place.
const WEIGHTS = {
    type: 0.30,
    price: 0.25,
    bedrooms: 0.15,
    bathrooms: 0.10,
    distance: 0.20,
};

/** Scores how close two prices are, as a 0-1 value (1 = identical). */
function priceSimilarity(priceA, priceB) {
    const a = Number(priceA);
    const b = Number(priceB);
    if (!Number.isFinite(a) || !Number.isFinite(b) || a <= 0 || b <= 0) return 0;

    const percentDiff = Math.abs(a - b) / Math.max(a, b);
    // A 0% difference scores 1.0; a 50%+ difference scores 0.
    return Math.max(0, 1 - percentDiff / 0.5);
}

/** Scores how close two counts (bedrooms/bathrooms) are, as a 0-1 value. */
function countSimilarity(countA, countB, maxRelevantDiff = 3) {
    const a = Number(countA);
    const b = Number(countB);
    if (!Number.isFinite(a) || !Number.isFinite(b)) return 0.5; // Unknown - neutral score

    const diff = Math.abs(a - b);
    return Math.max(0, 1 - diff / maxRelevantDiff);
}

/** Scores how close two properties are, as a 0-1 value. Closer = higher. */
function distanceSimilarity(distanceKm, maxRelevantDistanceKm = 25) {
    if (distanceKm == null) return 0.5; // Unknown location - neutral score
    return Math.max(0, 1 - distanceKm / maxRelevantDistanceKm);
}

/**
 * Computes a 0-100 similarity score between a target property and a
 * candidate property, using a weighted blend of type, price, bedrooms,
 * bathrooms, and geographic distance.
 */
function computeSimilarityScore(target, candidate) {
    const typeScore =
        target.type && candidate.type &&
        String(target.type).toLowerCase() === String(candidate.type).toLowerCase()
            ? 1
            : 0;

    const priceScore = priceSimilarity(target.price, candidate.price);
    const bedroomScore = countSimilarity(target.bedrooms, candidate.bedrooms);
    const bathroomScore = countSimilarity(target.bathrooms, candidate.bathrooms);

    const distanceKm = haversineDistanceKm(target, candidate);
    const distanceScore = distanceSimilarity(distanceKm);

    const weightedScore =
        typeScore * WEIGHTS.type +
        priceScore * WEIGHTS.price +
        bedroomScore * WEIGHTS.bedrooms +
        bathroomScore * WEIGHTS.bathrooms +
        distanceScore * WEIGHTS.distance;

    return {
        score: Math.round(weightedScore * 100),
        distanceKm: distanceKm == null ? null : Math.round(distanceKm * 10) / 10,
    };
}

/**
 * Ranks a list of candidate properties by similarity to the target property
 * and returns the top N (default 6), each annotated with its similarityScore
 * and distanceKm. The target property itself (matched by id) is excluded.
 */
function findSimilarProperties(target, candidates = [], limit = 6) {
    if (!target) return [];

    return candidates
        .filter((candidate) => candidate && candidate.id !== target.id)
        .map((candidate) => {
            const { score, distanceKm } = computeSimilarityScore(target, candidate);
            return { ...candidate, similarityScore: score, distanceKm };
        })
        .sort((a, b) => b.similarityScore - a.similarityScore)
        .slice(0, limit);
}

module.exports = {
    haversineDistanceKm,
    computeSimilarityScore,
    findSimilarProperties,
};
