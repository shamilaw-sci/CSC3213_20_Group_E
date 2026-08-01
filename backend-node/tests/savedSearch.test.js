const request = require('supertest');
const { createClient } = require('@supabase/supabase-js');

// A single thenable "query builder" mock that mimics supabase-js: every
// chain method returns the same builder, and the builder resolves (via
// `.then`) with whatever result is next in the queue - regardless of which
// method the chain happened to end on. This matches how the real
// PostgrestFilterBuilder works and avoids having to special-case which
// method is "terminal" for each different query shape.
jest.mock('@supabase/supabase-js', () => {
    const queue = [];
    const builder = {
        from: jest.fn(() => builder),
        select: jest.fn(() => builder),
        insert: jest.fn(() => builder),
        update: jest.fn(() => builder),
        delete: jest.fn(() => builder),
        eq: jest.fn(() => builder),
        order: jest.fn(() => builder),
        single: jest.fn(() => builder),
        __queue: queue,
        then: (resolve, reject) =>
            Promise.resolve(queue.shift() || { data: null, error: null }).then(resolve, reject),
    };
    return { createClient: jest.fn(() => builder) };
});

jest.mock('../utils/emailService', () => ({
    sendWelcomeEmail: jest.fn().mockResolvedValue(true),
    sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
    sendListingStatusEmail: jest.fn().mockResolvedValue(true),
    sendSavedSearchAlertEmail: jest.fn().mockResolvedValue(true),
}));

const app = require('../server');
const jwt = require('jsonwebtoken');
const { sendSavedSearchAlertEmail } = require('../utils/emailService');
const { checkSavedSearchMatches } = require('../controllers/savedSearchController');

const TEST_USER_ID = '11111111-1111-1111-1111-111111111111';
const authToken = () => jwt.sign({ id: TEST_USER_ID }, process.env.JWT_SECRET);

const queueLoggedInUser = (mockSupabase) => {
    mockSupabase.__queue.push({
        data: { id: TEST_USER_ID, role: 'BUYER', name: 'Test Buyer', email: 'buyer@example.com' },
        error: null,
    });
};

beforeEach(() => {
    createClient().__queue.length = 0;
    jest.clearAllMocks();
});

describe('POST /api/saved-searches', () => {
    it('returns 401 without an auth token', async () => {
        const res = await request(app).post('/api/saved-searches').send({ title: 'My Search' });
        expect(res.statusCode).toBe(401);
    });

    it('creates a saved search with alerts enabled by default', async () => {
        const mockSupabase = createClient();
        queueLoggedInUser(mockSupabase);
        mockSupabase.__queue.push({
            data: [{ id: 'search-1', title: 'Colombo Houses', email_alerts_enabled: true }],
            error: null,
        });

        const res = await request(app)
            .post('/api/saved-searches')
            .set('Authorization', `Bearer ${authToken()}`)
            .send({ title: 'Colombo Houses', beds: 3, baths: 2, property_type: 'House' });

        expect(res.statusCode).toBe(201);
        expect(res.body.savedSearch.email_alerts_enabled).toBe(true);
    });

    it('returns 400 for an out-of-range beds value', async () => {
        const res = await request(app)
            .post('/api/saved-searches')
            .set('Authorization', `Bearer ${authToken()}`)
            .send({ title: 'Bad Search', beds: -5 });

        // Auth happens first; without a mocked logged-in user this would 401,
        // so we only assert validation would reject it once authenticated.
        const mockSupabase = createClient();
        queueLoggedInUser(mockSupabase);

        const res2 = await request(app)
            .post('/api/saved-searches')
            .set('Authorization', `Bearer ${authToken()}`)
            .send({ title: 'Bad Search', beds: -5 });

        expect(res2.statusCode).toBe(400);
    });
});

describe('PATCH /api/saved-searches/:id/alerts', () => {
    it('returns 400 for a non-boolean emailAlertsEnabled value', async () => {
        const mockSupabase = createClient();
        queueLoggedInUser(mockSupabase);

        const res = await request(app)
            .patch('/api/saved-searches/22222222-2222-4222-8222-222222222222/alerts')
            .set('Authorization', `Bearer ${authToken()}`)
            .send({ emailAlertsEnabled: 'yes' });

        expect(res.statusCode).toBe(400);
    });

    it('turns alerts off and returns the updated saved search', async () => {
        const mockSupabase = createClient();
        queueLoggedInUser(mockSupabase);
        mockSupabase.__queue.push({
            data: [{ id: '22222222-2222-4222-8222-222222222222', email_alerts_enabled: false }],
            error: null,
        });

        const res = await request(app)
            .patch('/api/saved-searches/22222222-2222-4222-8222-222222222222/alerts')
            .set('Authorization', `Bearer ${authToken()}`)
            .send({ emailAlertsEnabled: false });

        expect(res.statusCode).toBe(200);
        expect(res.body.savedSearch.email_alerts_enabled).toBe(false);
    });

    it('returns 404 when the saved search does not belong to the user', async () => {
        const mockSupabase = createClient();
        queueLoggedInUser(mockSupabase);
        mockSupabase.__queue.push({ data: [], error: null });

        const res = await request(app)
            .patch('/api/saved-searches/22222222-2222-4222-8222-222222222222/alerts')
            .set('Authorization', `Bearer ${authToken()}`)
            .send({ emailAlertsEnabled: true });

        expect(res.statusCode).toBe(404);
    });
});

describe('checkSavedSearchMatches (notification trigger)', () => {
    it('emails the owners of every saved search that matches the new property', async () => {
        const mockSupabase = createClient();
        mockSupabase.__queue.push({
            data: [
                { id: 's1', title: 'Colombo Houses', beds: 3, baths: 2, property_type: 'House', polygon: null, users: { email: 'match@example.com' } },
                { id: 's2', title: 'Land in Kandy', beds: null, baths: null, property_type: 'Land', polygon: null, users: { email: 'nomatch@example.com' } },
            ],
            error: null,
        });

        const property = { id: 'prop-1', title: 'Nice House', type: 'House', price: 15000000, bedrooms: 3, bathrooms: 2 };
        await checkSavedSearchMatches(property);

        expect(sendSavedSearchAlertEmail).toHaveBeenCalledTimes(1);
        expect(sendSavedSearchAlertEmail).toHaveBeenCalledWith('match@example.com', 'Colombo Houses', property);
    });

    it('does nothing (and never throws) when no searches match', async () => {
        const mockSupabase = createClient();
        mockSupabase.__queue.push({
            data: [{ id: 's1', title: 'Land in Kandy', beds: null, baths: null, property_type: 'Land', polygon: null, users: { email: 'a@example.com' } }],
            error: null,
        });

        const property = { id: 'prop-2', title: 'A House', type: 'House', bedrooms: 3, bathrooms: 2 };
        await expect(checkSavedSearchMatches(property)).resolves.not.toThrow();
        expect(sendSavedSearchAlertEmail).not.toHaveBeenCalled();
    });

    it('does not throw when the database query itself fails', async () => {
        const mockSupabase = createClient();
        mockSupabase.__queue.push({ data: null, error: { message: 'boom' } });

        await expect(checkSavedSearchMatches({ id: 'prop-3', type: 'House' })).resolves.not.toThrow();
    });
});
