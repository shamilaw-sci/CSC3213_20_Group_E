const request = require('supertest');
// Mock Supabase
jest.mock('@supabase/supabase-js', () => {
    const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn(),
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        // Makes the mock itself "thenable" so that a chain ending in .select()
        // (e.g. insert().select(cols)) resolves correctly when awaited directly,
        // while chains ending in .single() are unaffected (single() returns its
        // own real Promise via mockResolvedValueOnce).
        then: function(resolve) {
            resolve(this._insertResult || { data: [], error: null });
        }
    };
    return {
        createClient: jest.fn(() => mockSupabase)
    };
});

// Mock Email Service
jest.mock('../utils/emailService', () => ({
    sendWelcomeEmail: jest.fn().mockResolvedValue(true),
    sendPasswordResetEmail: jest.fn().mockResolvedValue(true)
}));

const { createClient } = require('@supabase/supabase-js');

// Now require app
const app = require('../server');
const bcrypt = require('bcryptjs');

describe('Authentication & Security API', () => {
    let mockSupabase;

    beforeEach(() => {
        jest.clearAllMocks();
        // Since createClient is mocked, this returns our mockSupabase object
        mockSupabase = createClient();
        // jest.clearAllMocks() does NOT clear queued mockResolvedValueOnce()
        // values or custom properties left over from a previous test, so we
        // reset those explicitly to avoid one test's mock leaking into the next.
        mockSupabase.single.mockReset();
        mockSupabase._insertResult = undefined;
    });

    it('clears the HttpOnly authentication cookie when an admin signs out', async () => {
        const res = await request(app)
            .post('/api/auth/logout')
            .set('Origin', process.env.CLIENT_URL || 'http://localhost:5173')
            .set('Cookie', 'token=existing-admin-session');

        expect(res.statusCode).toBe(200);
        expect(res.headers['set-cookie']).toEqual(expect.arrayContaining([
            expect.stringMatching(/^token=;.*Expires=Thu, 01 Jan 1970.*HttpOnly/i),
        ]));
    });

    describe('POST /api/auth/register', () => {
        it('should block Role Spoofing (ADMIN attempt defaults to BUYER)', async() => {
            mockSupabase.single.mockResolvedValueOnce({ data: null });
            mockSupabase._insertResult = {
                data: [{ id: 1, email: 'hacker@example.com', role: 'BUYER' }],
                error: null
            };

            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'Hacker',
                    email: 'hacker@example.com',
                    password: 'password123',
                    role: 'ADMIN' // Malicious attempt
                });

            expect(res.statusCode).toEqual(201);
            expect(mockSupabase.insert).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({ role: 'BUYER' })
                ])
            );
        });

        it('should return 400 if user already exists', async() => {
            mockSupabase.single.mockResolvedValueOnce({
                data: { id: 1, email: 'test@example.com' }
            });

            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'Test',
                    email: 'test@example.com',
                    password: 'password123'
                });

            expect(res.statusCode).toEqual(400);
            expect(res.body.message).toBe('User with this email already exists.');
        });
    });

    describe('POST /api/auth/login', () => {
        it('should return HttpOnly cookie on successful login', async() => {
            const hashedPassword = await bcrypt.hash('password123', 10);
            mockSupabase.single.mockResolvedValueOnce({
                data: { id: 1, email: 'test@example.com', password_hash: hashedPassword, role: 'BUYER' },
                error: null
            });

            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'password123'
                });

            expect(res.statusCode).toEqual(200);
            const cookies = res.headers['set-cookie'];
            expect(cookies[0]).toMatch(/HttpOnly/);
        });

        it('should return 400 for invalid credentials', async() => {
            const hashedPassword = await bcrypt.hash('password123', 10);
            mockSupabase.single.mockResolvedValueOnce({
                data: { id: 1, email: 'test@example.com', password_hash: hashedPassword, role: 'BUYER' },
                error: null
            });

            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'wrongpassword'
                });

            expect(res.statusCode).toEqual(400);
            expect(res.body.message).toBe('Invalid email or password.');
        });
    });
});
