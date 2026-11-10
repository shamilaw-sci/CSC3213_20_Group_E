jest.mock('../config/supabase', () => ({ from: jest.fn() }));
jest.mock('../utils/propertyImageCleanup', () => ({}));
const db = require('../config/supabase');
const admin = require('../repositories/adminRepository');
const settings = require('../repositories/settingsRepository');
const h = require('../controllers/admin/adminSettingsController');
const errorHandler = require('../middleware/errorHandler');
let results, calls, log;
beforeEach(() => {
    jest.resetAllMocks(); results = []; calls = [];
    log = jest.spyOn(console, 'error').mockImplementation(() => {});
    db.from.mockImplementation(table => {
        const call = { table, methods: [] }; calls.push(call); const q = {};
        for (const name of ['select', 'eq', 'single', 'maybeSingle', 'upsert']) q[name] = (...args) => { call.methods.push([name, ...args]); return q; };
        q.then = (yes, no) => Promise.resolve().then(() => { const r = results.shift(); if (r instanceof Error) throw r; return r; }).then(yes, no);
        return q;
    });
});
afterEach(() => log.mockRestore());
async function run(name, body) {
    const req = { body, method: name === 'getSettings' ? 'GET' : 'PUT', route: { path: '/settings' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await h[name](req, res, err => errorHandler(err, req, res, () => {})); return res;
}
test.each([undefined, null, [], {}, { listing_fee: 0 }, { listing_fee: -1 }, { listing_fee: {} }, { listing_fee: [] }, { listing_fee: true }, { listing_fee: '' }, { listing_fee: '12.345' }, { listing_fee: '1e2' }, { listing_fee: NaN }, { listing_fee: Infinity }, { listing_fee: '10000000000' }, { listing_fee: '9'.repeat(10000) }])('invalid input stops before DB %p', async body => {
    expect((await run('updateSettings', body)).status).toHaveBeenCalledWith(400); expect(calls).toHaveLength(0);
});
test.each([[500, '500.00'], [' 750.5 ', '750.50'], ['0.01', '0.01'], ['9999999999.99', '9999999999.99']])('canonical save %p confirms returned value', async (value, canonical) => {
    results.push({ data: { setting_key: 'listing_fee', setting_value: canonical }, error: null });
    const res = await run('updateSettings', { listing_fee: value, payhereMode: 'live' });
    expect(res.status).toHaveBeenCalledWith(200); expect(res.json).toHaveBeenCalledWith({ message: 'Listing fee saved.', settings: { listing_fee: canonical } });
    expect(calls[0].methods).toContainEqual(['upsert', { setting_key: 'listing_fee', setting_value: canonical }, { onConflict: 'setting_key' }]);
    expect(calls[0].methods).toContainEqual(['select', 'setting_key, setting_value']);
});
test.each([null, {}, [], { setting_key: 'other', setting_value: '500.00' }, { setting_key: 'listing_fee', setting_value: '501.00' }])('unconfirmed upsert %p cannot succeed', async data => {
    results.push({ data, error: null }); expect((await run('updateSettings', { listing_fee: '500' })).status).toHaveBeenCalledWith(500);
});
test('failed upsert stays private', async () => {
    results.push({ data: null, error: { message: 'private-setting', statusCode: 400 } });
    const res = await run('updateSettings', { listing_fee: '500' }); expect(res.status).toHaveBeenCalledWith(500);
    expect(JSON.stringify([res.json.mock.calls, log.mock.calls])).not.toContain('private-setting');
});
test('GET returns only canonical supported fee', async () => {
    results.push({ data: { setting_key: 'listing_fee', setting_value: '750.5' }, error: null });
    const res = await run('getSettings'); expect(res.json).toHaveBeenCalledWith({ settings: { listing_fee: '750.50' } });
    expect(calls[0].methods).toContainEqual(['eq', 'setting_key', 'listing_fee']);
});
test('confirmed missing fee retains default', async () => {
    results.push({ data: null, error: null }); expect((await run('getSettings')).json).toHaveBeenCalledWith({ settings: { listing_fee: '500.00' } });
});
test.each([{ data: null, error: { message: 'private-db' } }, { data: { setting_key: 'listing_fee', setting_value: 'bad' }, error: null }])('GET does not invent fee for %p', async result => {
    results.push(result); expect((await run('getSettings')).status).toHaveBeenCalledWith(500);
});
test('payment settings DB failure propagates instead of substituting price', async () => {
    results.push({ data: null, error: { message: 'synthetic failure' } });
    await expect(settings.getSettingValue('listing_fee', '500.00')).rejects.toBeDefined();
});
test('payment settings default is only for confirmed missing row', async () => {
    results.push({ data: null, error: null }); await expect(settings.getSettingValue('listing_fee', '500.00')).resolves.toBe('500.00');
});
test('repository confirms written fee itself', async () => {
    results.push({ data: null, error: null }); await expect(admin.updatePlatformSetting('listing_fee', '500.00')).rejects.toBeDefined();
});
test('installed SDK distinguishes a confirmed missing setting and a returned DB error', async () => {
    const { createClient } = require('@supabase/supabase-js');
    const fetch = jest.fn()
        .mockResolvedValueOnce(new Response('[]', { status: 200, headers: { 'content-type': 'application/json' } }))
        .mockResolvedValueOnce(new Response(JSON.stringify({ code: '42501', message: 'synthetic denied' }), { status: 403, headers: { 'content-type': 'application/json' } }));
    const client = createClient('https://synthetic.example.test', 'synthetic-key', {
        global: { fetch }, auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
    });
    db.from.mockImplementation(client.from.bind(client));
    await expect(settings.getSettingValue('listing_fee', '500.00')).resolves.toBe('500.00');
    await expect(settings.getSettingValue('listing_fee', '500.00')).rejects.toMatchObject({ code: '42501' });
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(new URL(fetch.mock.calls[0][0]).searchParams.get('setting_key')).toBe('eq.listing_fee');
});
test.each([{}, [], { setting_key: 'other', setting_value: '500.00' }, { setting_key: 'listing_fee', setting_value: 500 }])('payment settings malformed result %p is not a default', async data => {
    results.push({ data, error: null }); await expect(settings.getSettingValue('listing_fee', '500.00')).rejects.toBeDefined();
});
