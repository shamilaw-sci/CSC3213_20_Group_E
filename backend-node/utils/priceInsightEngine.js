/**
 * Pure statistics helpers for the "Price Insight Badge" feature.
 * No supabase/express here on purpose, so this is trivially unit-testable.
 */

/** Picks the most relevant size field for a property (sqft). */
function getPropertySize(property) {
    const size = property?.house_size ?? property?.land_size;
    return Number.isFinite(Number(size)) && Number(size) > 0 ? Number(size) : null;
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

    const comparablePpsValues = comparableProperties
        .map(pricePerSqft)
        .filter((v) => v !== null);

    if (comparablePpsValues.length < 3) return null; // Not enough data for a fair comparison

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
