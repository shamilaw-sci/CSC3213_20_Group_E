const {
    parseWktPolygon,
    isPointInPolygon,
    matchesSavedSearch,
    findMatchingSearches,
} = require('../utils/searchMatcher');

describe('parseWktPolygon', () => {
    it('parses a valid WKT polygon into coordinate pairs', () => {
        const wkt = 'POLYGON((79.8 6.9, 79.9 6.9, 79.9 7.0, 79.8 7.0, 79.8 6.9))';
        const result = parseWktPolygon(wkt);

        expect(result).toHaveLength(5);
        expect(result[0]).toEqual([79.8, 6.9]);
    });

    it('returns null for garbage input', () => {
        expect(parseWktPolygon('not a polygon')).toBeNull();
        expect(parseWktPolygon(null)).toBeNull();
        expect(parseWktPolygon(undefined)).toBeNull();
    });

    it('returns null when fewer than 3 points are present', () => {
        expect(parseWktPolygon('POLYGON((79.8 6.9, 79.9 6.9))')).toBeNull();
    });
});

describe('isPointInPolygon', () => {
    // A simple square from (0,0) to (10,10)
    const square = [[0, 0], [10, 0], [10, 10], [0, 10]];

    it('returns true for a point clearly inside the polygon', () => {
        expect(isPointInPolygon([5, 5], square)).toBe(true);
    });

    it('returns false for a point clearly outside the polygon', () => {
        expect(isPointInPolygon([50, 50], square)).toBe(false);
    });

    it('returns false for a point outside on the same axis', () => {
        expect(isPointInPolygon([-5, 5], square)).toBe(false);
    });
});

describe('matchesSavedSearch', () => {
    const fullSearch = { filters: { version: 1, searchTerm: 'Kandy', listingType: 'Rent', minPrice: 10000, maxPrice: 50000, beds: 0, baths: 1, exactMatch: true, has360Tour: true, propTypes: { House: true, Villa: true, Apartment: false, Land: false } } };
    const match = { title: 'Kandy studio', city: 'Kandy', type: 'House', listing_type: 'Rent', price: 25000, bedrooms: 0, bathrooms: 1, virtual_tours: [{ url: 'test' }] };
    it('matches all persisted criteria together', () => expect(matchesSavedSearch(match, fullSearch)).toBe(true));
    it('preserves the active map search text rather than broadening whitespace criteria', () => {
        expect(matchesSavedSearch(match, { filters: { ...fullSearch.filters, searchTerm: ' Kandy ' } })).toBe(false);
    });
    it.each([
        { listing_type: 'Sale' }, { price: 60000 }, { price: 5000 }, { bedrooms: 1 }, { bedrooms: null },
        { bathrooms: 2 }, { virtual_tours: [] }, { type: 'Land' }, { title: 'Galle studio', city: 'Galle' },
    ])('does not alert when a saved criterion differs: %j', changes => {
        expect(matchesSavedSearch({ ...match, ...changes }, fullSearch)).toBe(false);
    });
    it('supports minimum room counts when exact match is off', () => {
        expect(matchesSavedSearch({ ...match, bedrooms: 3, bathrooms: 2 }, { filters: { ...fullSearch.filters, exactMatch: false } })).toBe(true);
    });
    it('fails closed for malformed or unsupported persisted filter data', () => {
        expect(matchesSavedSearch(match, { filters: { version: 999 } })).toBe(false);
    });
    const searchWithArea = {
        property_type: 'House',
        beds: 3,
        baths: 2,
        polygon: 'POLYGON((79.8 6.9, 79.9 6.9, 79.9 7.0, 79.8 7.0, 79.8 6.9))',
    };

    it('matches a property that satisfies type, beds, baths, and location', () => {
        const property = { type: 'House', bedrooms: 3, bathrooms: 2, latitude: 6.95, longitude: 79.85 };
        expect(matchesSavedSearch(property, searchWithArea)).toBe(true);
    });

    it('matches when the property exceeds the minimum beds/baths', () => {
        const property = { type: 'House', bedrooms: 5, bathrooms: 4, latitude: 6.95, longitude: 79.85 };
        expect(matchesSavedSearch(property, searchWithArea)).toBe(true);
    });

    it('rejects a property of the wrong type', () => {
        const property = { type: 'Land', bedrooms: 3, bathrooms: 2, latitude: 6.95, longitude: 79.85 };
        expect(matchesSavedSearch(property, searchWithArea)).toBe(false);
    });

    it('rejects a property with too few bedrooms', () => {
        const property = { type: 'House', bedrooms: 2, bathrooms: 2, latitude: 6.95, longitude: 79.85 };
        expect(matchesSavedSearch(property, searchWithArea)).toBe(false);
    });

    it('rejects a property outside the saved search polygon', () => {
        const property = { type: 'House', bedrooms: 3, bathrooms: 2, latitude: 8.5, longitude: 81.0 };
        expect(matchesSavedSearch(property, searchWithArea)).toBe(false);
    });

    it('matches on beds/baths alone when the saved search has no polygon', () => {
        const noAreaSearch = { property_type: null, beds: 2, baths: 1, polygon: null };
        const property = { type: 'Apartment', bedrooms: 2, bathrooms: 1, latitude: null, longitude: null };
        expect(matchesSavedSearch(property, noAreaSearch)).toBe(true);
    });

    it('returns false when either argument is missing', () => {
        expect(matchesSavedSearch(null, searchWithArea)).toBe(false);
        expect(matchesSavedSearch({ type: 'House' }, null)).toBe(false);
    });
});

describe('findMatchingSearches', () => {
    it('returns only the saved searches that match the property', () => {
        const property = { type: 'House', bedrooms: 3, bathrooms: 2, latitude: 6.95, longitude: 79.85 };
        const searches = [
            { id: 1, property_type: 'House', beds: 3, baths: 2, polygon: null },
            { id: 2, property_type: 'Land', beds: null, baths: null, polygon: null },
            { id: 3, property_type: null, beds: 10, baths: null, polygon: null },
        ];

        const matches = findMatchingSearches(property, searches);

        expect(matches).toHaveLength(1);
        expect(matches[0].id).toBe(1);
    });

    it('returns an empty array when nothing matches', () => {
        const property = { type: 'Land', bedrooms: 0, bathrooms: 0 };
        const searches = [{ id: 1, property_type: 'House', beds: 3, baths: 2, polygon: null }];

        expect(findMatchingSearches(property, searches)).toEqual([]);
    });
});
