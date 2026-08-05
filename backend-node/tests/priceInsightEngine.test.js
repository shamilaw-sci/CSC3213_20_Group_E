const {
    getPropertySize,
    pricePerSqft,
    mean,
    standardDeviation,
    zScore,
    calculatePriceInsight,
} = require('../utils/priceInsightEngine');

describe('getPropertySize / pricePerSqft', () => {
    it('prefers house_size over land_size', () => {
        expect(getPropertySize({ house_size: 1500, land_size: 5000 })).toBe(1500);
    });

    it('falls back to land_size when house_size is missing', () => {
        expect(getPropertySize({ land_size: 5000 })).toBe(5000);
    });

    it('returns null when neither size field is usable', () => {
        expect(getPropertySize({})).toBeNull();
        expect(getPropertySize({ house_size: 0 })).toBeNull();
    });

    it('computes price per square foot correctly', () => {
        expect(pricePerSqft({ price: 15000000, house_size: 1500 })).toBe(10000);
    });

    it('returns null when price or size is missing/invalid', () => {
        expect(pricePerSqft({ price: 0, house_size: 1500 })).toBeNull();
        expect(pricePerSqft({ price: 15000000 })).toBeNull();
    });
});

describe('mean / standardDeviation / zScore', () => {
    it('computes the mean of a list of numbers', () => {
        expect(mean([10, 20, 30])).toBe(20);
    });

    it('returns null mean for an empty list', () => {
        expect(mean([])).toBeNull();
    });

    it('computes standard deviation correctly for a simple set', () => {
        // [2, 4, 4, 4, 5, 5, 7, 9] has a population std dev of 2
        const values = [2, 4, 4, 4, 5, 5, 7, 9];
        expect(standardDeviation(values)).toBeCloseTo(2, 5);
    });

    it('returns null std dev for fewer than 2 values', () => {
        expect(standardDeviation([5])).toBeNull();
    });

    it('gives a z-score of 0 for a value equal to the mean', () => {
        expect(zScore(20, [10, 20, 30])).toBeCloseTo(0, 5);
    });

    it('gives a positive z-score for a value above the mean', () => {
        expect(zScore(100, [10, 20, 30])).toBeGreaterThan(0);
    });

    it('does not throw (returns 0) when all values are identical (zero variance)', () => {
        expect(zScore(10, [10, 10, 10])).toBe(0);
    });
});

describe('calculatePriceInsight', () => {
    const comparables = [
        { price: 15000000, house_size: 1500 }, // 10,000/sqft
        { price: 14500000, house_size: 1450 }, // 10,000/sqft
        { price: 15500000, house_size: 1550 }, // 10,000/sqft
        { price: 16000000, house_size: 1600 }, // 10,000/sqft
    ];

    it('classifies a property priced well below the comparable average as a Great Deal', () => {
        const cheapTarget = { price: 6000000, house_size: 1500 }; // 4,000/sqft - far below 10,000
        const insight = calculatePriceInsight(cheapTarget, comparables);

        expect(insight).not.toBeNull();
        expect(insight.level).toBe('great_deal');
        expect(insight.percentVsAverage).toBeLessThan(0);
    });

    it('classifies a property priced near the comparable average as Fair Price', () => {
        const fairTarget = { price: 15200000, house_size: 1520 }; // ~10,000/sqft
        const insight = calculatePriceInsight(fairTarget, comparables);

        expect(insight).not.toBeNull();
        expect(insight.level).toBe('fair_price');
    });

    it('classifies a property priced well above the comparable average as Above Market', () => {
        const expensiveTarget = { price: 30000000, house_size: 1500 }; // 20,000/sqft
        const insight = calculatePriceInsight(expensiveTarget, comparables);

        expect(insight).not.toBeNull();
        expect(insight.level).toBe('above_market');
        expect(insight.percentVsAverage).toBeGreaterThan(0);
    });

    it('returns null when there are fewer than 3 usable comparables', () => {
        const target = { price: 15000000, house_size: 1500 };
        const insight = calculatePriceInsight(target, comparables.slice(0, 2));
        expect(insight).toBeNull();
    });

    it('returns null when the target itself has no usable price/size data', () => {
        const target = { price: 15000000 }; // no size
        const insight = calculatePriceInsight(target, comparables);
        expect(insight).toBeNull();
    });

    it('includes the sample size used for the comparison', () => {
        const target = { price: 15200000, house_size: 1520 };
        const insight = calculatePriceInsight(target, comparables);
        expect(insight.sampleSize).toBe(4);
    });
});
