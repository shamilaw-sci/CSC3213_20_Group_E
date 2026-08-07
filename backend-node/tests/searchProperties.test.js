const request = require('supertest');
const { createClient } = require('@supabase/supabase-js');

// Same thenable query-builder mock pattern used in tests/savedSearch.test.js.
jest.mock('@supabase/supabase-js', () => {
    const queue = [];
    const builder = {
        from: jest.fn(() => builder),
        select: jest.fn(() => builder),
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

describe('GET /api/properties/search', () => {
    it('returns 400 when the q parameter is missing', async () => {
        const res = await request(app).get('/api/properties/search');
        expect(res.statusCode).toBe(400);
    });

    it('returns ranked results for a matching query', async () => {
        const mockSupabase = createClient();
        mockSupabase.__queue.push({
            data: [
                { id: 'p1', title: 'Modern sea-facing villa', description: 'Beautiful villa in Galle', city: 'Galle', type: 'House' },
                { id: 'p2', title: 'Land plot', description: 'Quiet countryside land', city: 'Kandy', type: 'Land' },
            ],
            error: null,
        });

        const res = await request(app).get('/api/properties/search?q=villa%20galle');

        expect(res.statusCode).toBe(200);
        expect(res.body.properties).toHaveLength(1);
        expect(res.body.properties[0].id).toBe('p1');
        expect(res.body.properties[0]).toHaveProperty('relevanceScore');
    });

    it('returns an empty result set when nothing matches', async () => {
        const mockSupabase = createClient();
        mockSupabase.__queue.push({
            data: [{ id: 'p1', title: 'Modern villa', description: 'In Galle', city: 'Galle', type: 'House' }],
            error: null,
        });

        const res = await request(app).get('/api/properties/search?q=nonexistentterm');

        expect(res.statusCode).toBe(200);
        expect(res.body.properties).toHaveLength(0);
    });

    it('respects the limit query parameter', async () => {
        const mockSupabase = createClient();
        mockSupabase.__queue.push({
            data: [
                { id: 'p1', title: 'villa galle house', description: '', city: '', type: '' },
                { id: 'p2', title: 'villa galle house too', description: '', city: '', type: '' },
                { id: 'p3', title: 'villa galle house also', description: '', city: '', type: '' },
            ],
            error: null,
        });

        const res = await request(app).get('/api/properties/search?q=villa%20galle&limit=2');

        expect(res.statusCode).toBe(200);
        expect(res.body.properties.length).toBeLessThanOrEqual(2);
    });
});
