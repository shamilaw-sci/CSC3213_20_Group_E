const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const fail = message => { const error = new Error(message); error.statusCode = 400; throw error; };
const integer = (value, fallback, max) => {
    if (value === undefined) return fallback;
    if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value) || Number(value) > max) fail('Invalid pagination.');
    return Number(value);
};
exports.list = query => {
    const page = integer(query.page, 1, 100000);
    const limit = integer(query.limit, 20, 100);
    if (query.search !== undefined && (typeof query.search !== 'string' || query.search.length > 120)) fail('Search must be at most 120 characters.');
    if (query.enabled !== undefined && !['true', 'false'].includes(query.enabled)) fail('Enabled filter must be true or false.');
    return { page, limit, search: (query.search || '').trim(), enabled: query.enabled === undefined ? null : query.enabled === 'true' };
};
exports.mutation = req => {
    if (!uuid.test(req.params.id || '')) fail('Invalid property ID.');
    if (typeof req.body?.enabled !== 'boolean') fail('Enabled must be a boolean.');
    return { id: req.params.id.toLowerCase(), enabled: req.body.enabled };
};
exports.featuredLimit = query => integer(query.limit, 3, 12);
