jest.mock('../config/supabase', () => ({ from: jest.fn() }));
jest.mock('../utils/logger', () => ({ error: jest.fn() }));
const db = require('../config/supabase');
const repo = require('../repositories/agentRepository');
const { publicErrorDetails } = require('../utils/publicError');
const express = require('express');
const request = require('supertest');
const { bookViewingSchema } = require('../validators/agentValidator');
const { bookViewing } = require('../controllers/agent/agentBookingController');
const routeApp = (buyer = 'buyer-a') => {
    const app = express(); app.use(express.json());
    app.post('/:id/book', (req, _res, next) => { if (buyer) req.user = { id: buyer }; next(); },
        require('../middleware/validate')(bookViewingSchema), bookViewing);
    app.use(require('../middleware/errorHandler'));
    return app;
};
const routePath = '/22222222-2222-4222-8222-222222222222/book';
const propertyId = '33333333-3333-4333-8333-333333333333';
const morning = 'Morning (9:00 AM - 12:00 PM)';
const afternoon = 'Afternoon (12:00 PM - 4:00 PM)';
const booking = (changes = {}) => ({ client_name: 'Fixture Buyer', client_email: 'fixture@example.invalid',
    client_phone: '0000000000', property_id: 'property-a', viewing_type: 'In-Person Property Tour',
    preferred_date: '2026-11-14', preferred_time: morning, notes: 'First note', ...changes });
let rows, writeError, readError, writes;
beforeEach(() => {
    rows = []; writeError = null; readError = null; writes = 0;
    db.from.mockImplementation(() => {
        let filters = [], inserted;
        const q = { select: jest.fn(() => q), limit: jest.fn(() => q),
            eq: jest.fn((k, v) => { filters.push([k, v]); return q; }),
            is: jest.fn((k, v) => { filters.push([k, v]); return q; }),
            insert: jest.fn(data => { inserted = data; writes++; return q; }),
            then(resolve, reject) {
                if (!inserted) return Promise.resolve({ data: rows.filter(r => filters.every(([k,v]) => r[k] === v)), error: readError }).then(resolve, reject);
                if (writeError) return Promise.resolve({ data: null, error: writeError }).then(resolve, reject);
                const created = inserted.map(r => ({ lead_id: `lead-${rows.length + 1}`, ...r })); rows.push(...created);
                return Promise.resolve({ data: created, error: null }).then(resolve, reject);
            } };
        return q;
    });
});
const create = (changes, buyer = 'buyer-a', agent = 'agent-a') => repo.createViewingLead(agent, booking(changes), buyer);
test('persists structured slot fields and preserves display/notes', async () => {
    const row = await create({ notes: 'N'.repeat(2000) });
    expect(row).toMatchObject({ buyer_id: 'buyer-a', booking_date: '2026-11-14', booking_time_window: morning });
    expect(row.lead_source).toContain('N'.repeat(2000));
});
test.each([{}, { notes: 'Different note' }, { viewing_type: 'Live Video Walkthrough' },
    { client_email: 'other@example.invalid', client_phone: '1111111111' }])('rejects duplicate regardless of non-slot details %#', async changes => {
    await create();
    try { await create(changes); throw new Error('Duplicate was accepted'); }
    catch (e) { expect(publicErrorDetails(e)).toMatchObject({ status: 409, code: 'BOOKING_DUPLICATE' }); }
    expect(writes).toBe(1); expect(rows).toHaveLength(1);
});
test('same property slot remains duplicate across agents', async () => {
    await create();
    await expect(create({}, 'buyer-a', 'agent-b')).rejects.toMatchObject({ statusCode: 409 });
});
test.each([{ property_id: 'property-b' }, { preferred_date: '2026-11-15' }, { preferred_time: afternoon }])('allows a distinct slot %#', async changes => {
    await create(); await create(changes); expect(rows).toHaveLength(2);
});
test('allows another buyer and cancellation followed by rebooking', async () => {
    await create(); await create({}, 'buyer-b'); expect(rows).toHaveLength(2);
    rows = rows.filter(r => r.buyer_id !== 'buyer-a');
    await create(); expect(rows).toHaveLength(2);
});
test('consultations are scoped to the assigned agent', async () => {
    await create({ property_id: null });
    await expect(create({ property_id: '' })).rejects.toMatchObject({ statusCode: 409 });
    await create({ property_id: null }, 'buyer-a', 'agent-b'); expect(rows).toHaveLength(2);
});
test('guest contact email does not become account identity', async () => {
    await create({}, null); await create({}, null); expect(rows).toHaveLength(2);
    expect(rows.every(r => r.buyer_id === null)).toBe(true);
});
test('guest may omit either slot field without creating incomplete structured data', async () => {
    await create({ preferred_date: undefined, preferred_time: undefined }, null);
    expect(rows[0]).toMatchObject({ buyer_id: null, booking_date: null, booking_time_window: null });
    const dateOnly = await create({ preferred_time: undefined }, null);
    const timeOnly = await create({ preferred_date: undefined }, null);
    expect(dateOnly).toMatchObject({ buyer_id: null, booking_date: null, booking_time_window: null });
    expect(timeOnly).toMatchObject({ buyer_id: null, booking_date: null, booking_time_window: null });
});
test.each([{ preferred_date: undefined }, { preferred_time: null }, { preferred_date: '2026-02-30' },
    { preferred_date: '2026-1-14' }, { preferred_date: '0000-11-14' }, { preferred_time: 'Morning' }])('refuses incomplete or invalid authenticated slot %#', async changes => {
    await expect(create(changes)).rejects.toMatchObject({ statusCode: 400 }); expect(writes).toBe(0);
});
test.each(['leads_buyer_property_slot_uidx', 'leads_buyer_consultation_slot_uidx'])('maps concurrent named unique conflict %s to 409', async name => {
    writeError = { code: '23505', message: `duplicate key value violates unique constraint "${name}"` };
    await expect(create()).rejects.toMatchObject({ statusCode: 409 });
});
test.each([{ code: '23505', message: 'duplicate key value violates unique constraint "unrelated_key"' },
    { code: '23503', message: 'foreign key error' }, { code: '23505', message: 'includes leads_buyer_property_slot_uidx somewhere' }])('preserves unrelated errors %#', async error => {
    writeError = error; await expect(create()).rejects.toBe(error);
});
test('read failures do not proceed to insert', async () => {
    readError = { code: '42501' }; await expect(create()).rejects.toBe(readError); expect(writes).toBe(0);
});
test('real HTTP controller/repository returns 201 then 409 for changed notes on the same slot', async () => {
    const app = routeApp();
    const payload = booking({ property_id: propertyId });
    expect((await request(app).post(routePath).send(payload)).status).toBe(201);
    const duplicate = await request(app).post(routePath).send({ ...payload, notes: 'Changed question' });
    expect(duplicate.status).toBe(409);
    expect(duplicate.body.message).toBe('You already have an appointment for this property and time slot.');
    expect(rows).toHaveLength(1);
});
test.each([{ preferred_date: undefined }, { preferred_time: undefined }])('real HTTP authenticated incomplete slot returns 400 %#', async changes => {
    const response = await request(routeApp()).post(routePath).send(booking({ property_id: propertyId, ...changes }));
    expect(response.status).toBe(400); expect(writes).toBe(0);
});
test.each([{ preferred_date: undefined }, { preferred_time: undefined }])('real HTTP guest partial slot preserves compatibility %#', async changes => {
    const response = await request(routeApp(null)).post(routePath).send(booking({ property_id: propertyId, ...changes }));
    expect(response.status).toBe(201);
    expect(rows[0]).toMatchObject({ buyer_id: null, booking_date: null, booking_time_window: null });
});
test('real HTTP named concurrent conflict becomes 409 without another lead', async () => {
    writeError = { code: '23505', message: 'duplicate key value violates unique constraint "leads_buyer_property_slot_uidx"' };
    const response = await request(routeApp()).post(routePath).send(booking({ property_id: propertyId }));
    expect(response.status).toBe(409); expect(rows).toHaveLength(0);
});
