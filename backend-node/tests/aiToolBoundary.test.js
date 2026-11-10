jest.mock('@google/generative-ai', () => ({ GoogleGenerativeAI: jest.fn() }));
jest.mock('../config/supabase', () => ({ from: jest.fn() }));
const { GoogleGenerativeAI } = require('@google/generative-ai');
const db = require('../config/supabase');
const { chatWithAI } = require('../controllers/aiController');
const priorKey = process.env.GEMINI_API_KEY;
let generate, query, res, next;
const reply = (calls = undefined) => ({ response: { text: () => 'Normal reply [ID: fixture-id]',
    functionCalls: () => calls, candidates: [{ content: { role: 'model', parts: [] } }] } });
beforeEach(() => {
    jest.clearAllMocks();
    process.env.GEMINI_API_KEY = 'synthetic-only';
    query = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(), limit: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(), lte: jest.fn().mockReturnThis(), ilike: jest.fn().mockReturnThis(),
        then: resolve => Promise.resolve({ data: [], error: null }).then(resolve) };
    db.from.mockReturnValue(query);
    generate = jest.fn().mockResolvedValue(reply());
    GoogleGenerativeAI.mockImplementation(() => ({ getGenerativeModel: jest.fn(() => ({ generateContent: generate })) }));
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
    jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
    jest.restoreAllMocks();
    if (priorKey === undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = priorKey;
});
async function call(name, args) {
    generate.mockResolvedValueOnce(reply([{ name, args }]));
    await chatWithAI({ body: { message: 'Find a home', history: [] } }, res, next);
}
const toolResult = () => generate.mock.calls[1][0].contents.at(-1).parts[0].functionResponse.response.result;

test('ordinary reply preserves model and property-card text without querying DB', async () => {
    await chatWithAI({ body: { message: 'Hello' } }, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ response: 'Normal reply [ID: fixture-id]' });
    expect(db.from).not.toHaveBeenCalled(); expect(generate).toHaveBeenCalledTimes(1);
});
test('valid property search preserves explicit projection, approved guard and limit', async () => {
    await call('search_properties', { location: '  Kandy  ', type: ' House ', maxPrice: 100 });
    expect(db.from).toHaveBeenCalledWith('properties');
    expect(query.select).toHaveBeenCalledWith('id, title, price, type, city, district, bedrooms, bathrooms, land_size');
    expect(query.eq).toHaveBeenCalledWith('status', 'approved');
    expect(query.limit).toHaveBeenCalledWith(5);
    expect(query.or).toHaveBeenCalledWith('city.ilike.%Kandy%,district.ilike.%Kandy%');
    expect(query.ilike).toHaveBeenCalledWith('type', '%House%');
    expect(query.lte).toHaveBeenCalledWith('price', 100);
    expect(toolResult()).toEqual([]); expect(next).not.toHaveBeenCalled();
});
test('explicit empty property args preserves unfiltered approved search', async () => {
    await call('search_properties', {});
    expect(query.eq).toHaveBeenCalledWith('status', 'approved');
    expect(query.or).not.toHaveBeenCalled(); expect(query.lte).not.toHaveBeenCalled();
});
test('zero is an applied numeric price bound', async () => {
    await call('search_properties', { maxPrice: 0 });
    expect(query.lte).toHaveBeenCalledWith('price', 0);
});
test.each(['ශ්‍රී ජයවර්ධනපුර', 'கண்டி', "St. John's", 'Nuwara-Eliya', 'A'.repeat(120)])('accepts literal location %s', async location => {
    await call('search_properties', { location });
    expect(query.or).toHaveBeenCalledWith(`city.ilike.%${location}%,district.ilike.%${location}%`);
    expect(next).not.toHaveBeenCalled();
});
test('valid agent tool retains role filter/projection/result shape', async () => {
    query.then = resolve => Promise.resolve({ data: [{ name: 'Synthetic agent', role: 'AGENT',
        agent_profiles: [{ agency_name: 'Agency', service_areas: 'Kandy' }] }], error: null }).then(resolve);
    await call('search_agents', { location: ' Kandy ' });
    expect(db.from).toHaveBeenCalledWith('users');
    expect(query.select).toHaveBeenCalledWith('id, name, role, agent_profiles!inner(service_areas, agency_name)');
    expect(query.in).toHaveBeenCalledWith('role', ['AGENT', 'SELLER']);
    expect(query.ilike).toHaveBeenCalledWith('agent_profiles.service_areas', '%Kandy%');
    expect(query.limit).toHaveBeenCalledWith(5);
    expect(toolResult()).toEqual([{ name: 'Synthetic agent', role: 'AGENT', agency_name: 'Agency', service_areas: 'Kandy' }]);
});

describe.each(['search_properties', 'search_agents'])('%s malformed arguments', name => {
    test.each([undefined, null, [], 'Kandy', 4, new Date(), Object.assign(Object.create({ injected: true }), { location: 'Kandy' }),
        { location: {} }, { location: [] }, { location: '' }, { location: ' ' }, { location: 'A'.repeat(121) },
        { location: 'Kandy', unexpected: true }])('rejects malformed shape %# before DB', async args => {
        await call(name, args);
        expect(db.from).not.toHaveBeenCalled();
        expect(toolResult()).toEqual({ error: 'Invalid search parameters.' });
        expect(res.status).toHaveBeenCalledWith(200); expect(next).not.toHaveBeenCalled();
    });
    test.each(['Kandy,city.ilike.X', 'Kandy)', '(Kandy', 'Kandy%', 'Kandy_', 'Kandy"', 'Kandy\\', 'Kandy:foo', 'Kandy\nColombo'])('rejects filter/control syntax %#', async location => {
        await call(name, { location });
        expect(db.from).not.toHaveBeenCalled();
        expect(toolResult()).toEqual({ error: 'Invalid search parameters.' });
    });
});
test('agent location is required', async () => {
    await call('search_agents', {}); expect(db.from).not.toHaveBeenCalled();
    expect(toolResult()).toEqual({ error: 'Invalid search parameters.' });
});
test.each(['100', {}, [], null, NaN, Infinity, -Infinity, -1])('rejects invalid maxPrice %# before DB', async maxPrice => {
    await call('search_properties', { maxPrice });
    expect(db.from).not.toHaveBeenCalled(); expect(toolResult()).toEqual({ error: 'Invalid search parameters.' });
});
test.each(['', ' ', 'A'.repeat(81), 'House%', 'House_', 'House,Land', 4, null])('rejects invalid property type %# before DB', async type => {
    await call('search_properties', { type });
    expect(db.from).not.toHaveBeenCalled(); expect(toolResult()).toEqual({ error: 'Invalid search parameters.' });
});
test('accepts type at its exact limit', async () => {
    await call('search_properties', { type: 'A'.repeat(80) });
    expect(query.ilike).toHaveBeenCalledWith('type', `%${'A'.repeat(80)}%`);
});
test('unknown tool cannot query database', async () => {
    await call('delete_users', { private: 'synthetic-private-marker' });
    expect(db.from).not.toHaveBeenCalled(); expect(toolResult()).toEqual({ error: 'Unsupported search tool.' });
});
test.each(['provider-first', 'provider-followup', 'query-returned', 'query-thrown'])('sanitizes %s failures', async stage => {
    const raw = new Error('synthetic-private-marker');
    raw.statusCode = 418; raw.details = 'synthetic-private-marker';
    if (stage === 'provider-first') generate.mockRejectedValueOnce(raw);
    else {
        generate.mockResolvedValueOnce(reply([{ name: 'search_properties', args: {} }]));
        if (stage === 'provider-followup') generate.mockRejectedValueOnce(raw);
        if (stage === 'query-returned') query.then = resolve => Promise.resolve({ data: null, error: raw }).then(resolve);
        if (stage === 'query-thrown') db.from.mockImplementation(() => { throw raw; });
    }
    await chatWithAI({ body: { message: 'fixture' } }, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    const safe = next.mock.calls[0][0];
    expect(safe).not.toBe(raw); expect(safe.statusCode).toBe(503);
    expect(safe.message).toBe('AI chat is temporarily unavailable.');
    expect(`${safe.stack}${JSON.stringify(safe)}${JSON.stringify(console.error.mock.calls)}`).not.toContain('synthetic-private-marker');
    expect(res.json).not.toHaveBeenCalled();
});
