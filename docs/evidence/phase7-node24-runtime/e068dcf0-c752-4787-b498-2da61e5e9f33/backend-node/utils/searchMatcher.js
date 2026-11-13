/**
 * Geometry + matching helpers for the "Saved Search Alerts"
 * feature. No supabase/express here on purpose, so this is trivially unit-testable.
 */
const { savedSearchFiltersSchema } = require('../validators/savedSearchValidator');

function matchesFullFilters(property, filters) {
    if (String(property.listing_type || '').toLowerCase() !== filters.listingType.toLowerCase()) return false;
    if (filters.searchTerm && ![property.title, property.city].some(value => String(value || '').toLowerCase().includes(filters.searchTerm.toLowerCase()))) return false;
    if (filters.minPrice !== null || filters.maxPrice !== null) {
        const price = Number(property.price);
        if (property.price == null || !Number.isFinite(price) || (filters.minPrice !== null && price < filters.minPrice) || (filters.maxPrice !== null && price > filters.maxPrice)) return false;
    }
    const types = Object.keys(filters.propTypes).filter(type => filters.propTypes[type]);
    if (types.length && !types.some(type => String(property.type || '').toLowerCase().includes(type.toLowerCase()))) return false;
    for (const [filter, field] of [['beds', 'bedrooms'], ['baths', 'bathrooms']]) {
        if (filters[filter] === null) continue;
        const value = Number(property[field]);
        if (property[field] == null || !Number.isFinite(value) || (filters.exactMatch ? value !== filters[filter] : value < filters[filter])) return false;
    }
    return !filters.has360Tour || (Array.isArray(property.virtual_tours) && property.virtual_tours.length > 0);
}

/**
 * Parses a WKT "POLYGON((lng lat, lng lat, ...))" string (as stored by the
 * MapSearch drawing tool) into an array of [lng, lat] coordinate pairs.
 * Returns null if the string isn't a parseable polygon.
 */
function parseWktPolygon(wkt) {
    if (!wkt || typeof wkt !== 'string') return null;

    const match = wkt.match(/POLYGON\s*\(\s*\(([^)]+)\)\s*\)/i);
    if (!match) return null;

    const points = match[1]
        .split(',')
        .map((pair) => pair.trim().split(/\s+/).map(Number))
        .filter(([lng, lat]) => Number.isFinite(lng) && Number.isFinite(lat));

    return points.length >= 3 ? points : null;
}

/**
 * Ray-casting point-in-polygon test (standard even-odd rule).
 * point: [lng, lat], polygon: [[lng, lat], ...]
 */
function isPointInPolygon([lng, lat], polygon) {
    let inside = false;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const [xi, yi] = polygon[i];
        const [xj, yj] = polygon[j];

        const intersects =
            (yi > lat) !== (yj > lat) &&
            lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;

        if (intersects) inside = !inside;
    }

    return inside;
}

/**
 * Decides whether a (newly approved) property matches a user's saved search.
 * All criteria on the saved search are optional; an unset criterion always passes.
 *
 * @param {object} property - { type, bedrooms, bathrooms, latitude, longitude }
 * @param {object} savedSearch - { property_type, beds, baths, polygon }
 * @returns {boolean}
 */
function matchesSavedSearch(property, savedSearch) {
    if (!property || !savedSearch) return false;
    if (savedSearch.filters != null) {
        const parsed = savedSearchFiltersSchema.safeParse(savedSearch.filters);
        if (!parsed.success || !matchesFullFilters(property, parsed.data)) return false;
    } else {
        if (
            savedSearch.property_type && property.type &&
            String(savedSearch.property_type).toLowerCase() !== String(property.type).toLowerCase()
        ) return false;
        if (savedSearch.beds != null && Number(property.bedrooms ?? 0) < Number(savedSearch.beds)) return false;
        if (savedSearch.baths != null && Number(property.bathrooms ?? 0) < Number(savedSearch.baths)) return false;
    }
    if (savedSearch.polygon) {
        const polygon = parseWktPolygon(savedSearch.polygon);
        // If the saved search has a polygon we can't parse, don't silently
        // match everything - treat it as "location unknown" and skip the alert.
        if (!polygon) return false;
        if (property.longitude === null || property.longitude === undefined ||
            property.latitude === null || property.latitude === undefined) {
            return false;
        }
        if (!isPointInPolygon([Number(property.longitude), Number(property.latitude)], polygon)) {
            return false;
        }
    }

    return true;
}

/**
 * Filters a list of saved searches down to the ones a given property matches.
 */
function findMatchingSearches(property, savedSearches = []) {
    return savedSearches.filter((search) => matchesSavedSearch(property, search));
}

module.exports = {
    parseWktPolygon,
    isPointInPolygon,
    matchesSavedSearch,
    findMatchingSearches,
};
