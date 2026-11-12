/**
 * Pure statistics helpers for the "Price Insight Badge" feature.
 * No supabase/express here on purpose, so this is trivially unit-testable.
 */

/** Picks the most relevant size field for a property (sqft). */
function getPropertySize(property) {
    // Contract: house_size is floor sqft; land_size is perches. Never use
    // plot area as a proxy for missing building floor area.
    const isLand = String(property?.type || '').toLowerCase() === 'land';
    const raw = isLand || (!property?.type && property?.house_size == null)
        ? property?.land_size : property?.house_size;
    if (!['string', 'number'].includes(typeof raw) || String(raw).trim() === '') return null;
    const size = Number(raw) * (isLand || (!property?.type && property?.house_size == null) ? 272.25 : 1);
    // Below 100 sqft is not a usable whole-building floor area for this metric.
    return Number.isFinite(size) && size > 0 && (isLand || size >= 100) ? size : null;
}

/** Price per square foot, or null if price/size aren't usable. */
function pricePerSqft(property) {
    const size = getPropertySize(property);
    const price = Number(property?.price);
    if (!size || !Number.isFinite(price) || price <= 0) return null;
    return price / size;
}

function mean(values) {
    if (!values.length) return null;
    return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/** Population standard deviation. */
function standardDeviation(values, precomputedMean = null) {
    if (values.length < 2) return null;
    const avg = precomputedMean ?? mean(values);
    const variance = values.reduce((sum, v) => sum + (v - avg) ** 2, 0) / values.length;
    return Math.sqrt(variance);
}

/** How many standard deviations `value` is from the mean of `values`. */
function zScore(value, values) {
    const avg = mean(values);
    if (avg === null) return 0; // No data at all

    const stdDev = standardDeviation(values, avg);
    if (stdDev === null) return 0; // Fewer than 2 comparables - not enough spread info

    if (stdDev === 0) {
        // Every comparable has the identical value: any difference is
        // significant, so treat it as an extreme (but finite) z-score rather
        // than silently reporting "average" (0/0 would otherwise mask it).
        if (value === avg) return 0;
        return value > avg ? 10 : -10;
    }

    return (value - avg) / stdDev;
}

const Z_SCORE_THRESHOLD = 1; // +/- 1 standard deviation is the "fair price" band

/**
 * Classifies a target property's price-per-sqft against a comparable set
 * (typically the output of similarityEngine.findSimilarProperties).
 *
 * @returns {object|null} null when there isn't enough comparable data to say
 *   anything statistically meaningful (fewer than 3 comparables, or the
 *   target itself is missing price/size data).
 */
function calculatePriceInsight(targetProperty, comparableProperties = []) {
    const targetPps = pricePerSqft(targetProperty);
    if (targetPps === null) return null;

    let comparablePpsValues = comparableProperties
        .filter(property => !targetProperty.id || property.id !== targetProperty.id)
        .filter(property => (!targetProperty.type || String(property.type || '').toLowerCase() === String(targetProperty.type).toLowerCase()) &&
            (!targetProperty.listing_type || String(property.listing_type || '').toLowerCase() === String(targetProperty.listing_type).toLowerCase()))
        .map(pricePerSqft)
        .filter((v) => v !== null);

    if (comparablePpsValues.length < 3) return null; // Not enough data for a fair comparison

    // A robust median fence prevents a corrupt price/area ratio dominating
    // the arithmetic mean. Retain at least three actual comparable listings.
    const sorted = [...comparablePpsValues].sort((a, b) => a - b);
    const midpoint = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 ? sorted[midpoint] : (sorted[midpoint - 1] + sorted[midpoint]) / 2;
    comparablePpsValues = comparablePpsValues.filter(value => value >= median / 3 && value <= median * 3);
    if (comparablePpsValues.length < 3) return null;

    const avgPps = mean(comparablePpsValues);
    const z = zScore(targetPps, comparablePpsValues);

    let label;
    let level;
    if (z <= -Z_SCORE_THRESHOLD) {
        label = 'Great Deal';
        level = 'great_deal';
    } else if (z >= Z_SCORE_THRESHOLD) {
        label = 'Above Market';
        level = 'above_market';
    } else {
        label = 'Fair Price';
        level = 'fair_price';
    }

    const percentVsAverage = avgPps ? Math.round(((targetPps - avgPps) / avgPps) * 100) : 0;

    return {
        level,
        label,
        pricePerSqft: Math.round(targetPps),
        averagePricePerSqft: Math.round(avgPps),
        percentVsAverage,
        zScore: Math.round(z * 100) / 100,
        sampleSize: comparablePpsValues.length,
    };
}

module.exports = {
    getPropertySize,
    pricePerSqft,
    mean,
    standardDeviation,
    zScore,
    calculatePriceInsight,
};
