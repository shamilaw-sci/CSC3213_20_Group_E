const request = require('supertest');
const { createClient } = require('@supabase/supabase-js');

// Same thenable query-builder mock pattern used in tests/savedSearch.test.js.
jest.mock('@supabase/supabase-js', () => {
    const queue = [];
    const builder = {
        from: jest.fn(() => builder),
        select: jest.fn(() => builder),
        insert: jest.fn(() => builder),
        update: jest.fn(() => builder),
        delete: jest.fn(() => builder),
        eq: jest.fn(() => builder),
        neq: jest.fn(() => builder),
        order: jest.fn(() => builder),
        limit: jest.fn(() => builder),
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
}));

const app = require('../server');

beforeEach(() => {
    createClient().__queue.length = 0;
});

describe('GET /api/properties/:id/similar', () => {
    it('returns 404 when the target property does not exist', async () => {
        const mockSupabase = createClient();
        mockSupabase.__queue.push({ data: null, error: { message: 'not found' } });

        const res = await request(app).get('/api/properties/does-not-exist/similar');
        expect(res.statusCode).toBe(404);
    });

    it('returns similar properties, excluding the target, sorted by score', async () => {
        const mockSupabase = createClient();
        mockSupabase.__queue.push({
            data: { id: 'p1', type: 'House', price: 20000000, bedrooms: 3, bathrooms: 2, latitude: 6.9271, longitude: 79.8612 },
            error: null,
        });
        mockSupabase.__queue.push({
            data: [
                { id: 'p2', type: 'House', price: 20500000, bedrooms: 3, bathrooms: 2, latitude: 6.93, longitude: 79.86 },
                { id: 'p3', type: 'Land', price: 2000000, bedrooms: 0, bathrooms: 0, latitude: 9.66, longitude: 80.02 },
            ],
            error: null,
        });

        const res = await request(app).get('/api/properties/p1/similar');

        expect(res.statusCode).toBe(200);
        expect(res.body.properties).toHaveLength(2);
        expect(res.body.properties[0].id).toBe('p2'); // closer/better match ranked first
        expect(res.body.properties[0]).toHaveProperty('similarityScore');
    });

    it('respects a custom ?limit= query parameter', async () => {
        const mockSupabase = createClient();
        mockSupabase.__queue.push({
            data: { id: 'p1', type: 'House', price: 20000000, bedrooms: 3, bathrooms: 2, latitude: 6.9271, longitude: 79.8612 },
            error: null,
        });
        mockSupabase.__queue.push({
            data: [
                { id: 'p2', type: 'House', price: 20500000, bedrooms: 3, bathrooms: 2, latitude: 6.93, longitude: 79.86 },
                { id: 'p3', type: 'House', price: 21000000, bedrooms: 3, bathrooms: 2, latitude: 6.94, longitude: 79.87 },
            ],
            error: null,
        });

        const res = await request(app).get('/api/properties/p1/similar?limit=1');

        expect(res.statusCode).toBe(200);
        expect(res.body.properties).toHaveLength(1);
    });
});
