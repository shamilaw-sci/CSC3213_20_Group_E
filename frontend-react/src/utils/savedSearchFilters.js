const propertyTypes = ['House', 'Land', 'Apartment', 'Villa'];
const numericValue = value => {
    if (value == null || value === '' || value === 'Any') return null;
    const number = Number(String(value).replace(/\+$/, ''));
    if (!Number.isFinite(number)) throw new Error('Invalid search filter value');
    return number;
};

// Store the effective price cap, without saving private feasibility inputs.
export const serializeSavedSearchFilters = (filters, maxPriceFilter = null) => {
    const caps = [numericValue(filters.maxPrice), numericValue(maxPriceFilter)].filter(value => value !== null);
    return {
        version: 1,
        searchTerm: filters.searchTerm || '',
        listingType: filters.listingType || 'Sale',
        minPrice: numericValue(filters.minPrice),
        maxPrice: caps.length ? Math.min(...caps) : null,
        beds: numericValue(filters.beds),
        baths: numericValue(filters.baths),
        exactMatch: Boolean(filters.exactMatch),
        has360Tour: Boolean(filters.has360Tour),
        propTypes: Object.fromEntries(propertyTypes.map(type => [type, Boolean(filters.propTypes?.[type])])),
    };
};

export const restoreSavedSearchFilters = (savedSearch, pathname = '/map', search = '') => {
    const full = savedSearch?.filters;
    const supported = full?.version === 1 && typeof full.searchTerm === 'string' &&
        ['Sale', 'Rent', 'Sold'].includes(full.listingType) &&
        propertyTypes.every(type => typeof full.propTypes?.[type] === 'boolean');
    if (supported) {
        return {
            searchTerm: full.searchTerm,
            listingType: full.listingType,
            minPrice: full.minPrice == null ? '' : String(full.minPrice),
            maxPrice: full.maxPrice == null ? '' : String(full.maxPrice),
            beds: full.beds == null ? 'Any' : String(full.beds),
            baths: full.baths == null ? 'Any' : String(full.baths),
            exactMatch: full.exactMatch === true,
            has360Tour: full.has360Tour === true,
            propTypes: Object.fromEntries(propertyTypes.map(type => [type, full.propTypes[type]])),
        };
    }
    return {
        searchTerm: new URLSearchParams(search).get('search') || '',
        listingType: pathname === '/rent' ? 'Rent' : 'Sale',
        minPrice: '', maxPrice: '',
        beds: savedSearch?.beds == null ? 'Any' : String(savedSearch.beds),
        baths: savedSearch?.baths == null ? 'Any' : String(savedSearch.baths),
        exactMatch: false, has360Tour: false,
        propTypes: Object.fromEntries(propertyTypes.map(type => [type, !savedSearch?.property_type || savedSearch.property_type === type])),
    };
};
