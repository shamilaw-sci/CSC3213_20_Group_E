const express = require('express');
const cookieParser = require('cookie-parser');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const { issueSessionToken } = require('../utils/sessionToken');

jest.mock('../config/supabase', () => ({
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
}));

const supabase = require('../config/supabase');
const { protect, optionalAuth } = require('../middleware/authMiddleware');

const app = express();
app.use(cookieParser());
app.get('/protected', protect, (req, res) => res.json({ user: req.user }));
app.get('/optional', optionalAuth, (req, res) => res.json({ user: req.user || null }));

const signToken = (claims, options = {}) => claims.type !== undefined
    ? jwt.sign(claims, process.env.JWT_SECRET, { expiresIn: '15m', ...options })
    : issueSessionToken({ ...claims, password_hash: null }, { expiresIn: '15m', ...options });

describe('Authentication token purpose', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        supabase.single.mockResolvedValue({
            data: { id: 'user-1', role: 'ADMIN', name: 'Test Admin', email: 'admin@example.test', password_hash: null },
            error: null,
        });
    });

    test.each(['/protected', '/optional'])('explicit bearer identity takes precedence over a different browser cookie on %s', async (route) => {
        const cookie = signToken({ id: 'buyer-1' });
        const bearer = signToken({ id: 'admin-1' });
        supabase.single.mockResolvedValue({ data: { id: 'admin-1', role: 'ADMIN', password_hash: null }, error: null });
        const response = await request(app).get(route).set('Cookie', `token=${cookie}`).set('Authorization', `Bearer ${bearer}`);
        expect(response.status).toBe(200);
        expect(supabase.eq).toHaveBeenCalledWith('id', 'admin-1');
    });

    test.each(['cookie', 'bearer'])('rejects a password-reset token supplied as %s', async (transport) => {
        const token = signToken({ id: 'user-1', type: 'password_reset' });
        const response = await request(app).get('/protected').set(
            transport === 'cookie' ? 'Cookie' : 'Authorization',
            transport === 'cookie' ? `token=${token}` : `Bearer ${token}`
        );

        expect(response.status).toBe(401);
        expect(supabase.from).not.toHaveBeenCalled();
    });

    test('does not attach an authenticated identity for a reset token on optional routes', async () => {
        const token = signToken({ id: 'user-1', type: 'password_reset' });
        const response = await request(app).get('/optional').set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.user).toBeNull();
        expect(supabase.from).not.toHaveBeenCalled();
    });

    test.each(['BUYER', 'SELLER', 'AGENT', 'ADMIN'])('accepts credential-bound %s session tokens', async (role) => {
        supabase.single.mockResolvedValue({ data: { id: 'user-1', role, password_hash: null }, error: null });
        const token = signToken({ id: 'user-1', role });
        const response = await request(app).get('/protected').set('Cookie', `token=${token}`);

        expect(response.status).toBe(200);
        expect(response.body.user.role).toBe(role);
    });

    test('preserves bearer sessions and uses the current database role', async () => {
        const token = signToken({ id: 'user-1', role: 'BUYER' });
        const response = await request(app).get('/protected').set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.user.role).toBe('ADMIN');
    });

    test('preserves optional authentication for ordinary sessions', async () => {
        const token = signToken({ id: 'user-1', role: 'ADMIN' });
        const response = await request(app).get('/optional').set('Cookie', `token=${token}`);

        expect(response.status).toBe(200);
        expect(response.body.user.id).toBe('user-1');
    });

    test('allows anonymous optional requests', async () => {
        const response = await request(app).get('/optional');
        expect(response.status).toBe(200);
        expect(response.body.user).toBeNull();
    });

    test('continues rejecting expired sessions', async () => {
        const token = signToken({ id: 'user-1' }, { expiresIn: -1 });
        const response = await request(app).get('/protected').set('Authorization', `Bearer ${token}`);
        expect(response.status).toBe(401);
    });

    test.each(['cookie', 'bearer'])('blocks an existing banned account session supplied as %s', async (transport) => {
        supabase.single.mockResolvedValue({ data: { id: 'user-1', role: 'BANNED', password_hash: null }, error: null });
        const token = signToken({ id: 'user-1', role: 'BUYER' });
        const response = await request(app).get('/protected').set(
            transport === 'cookie' ? 'Cookie' : 'Authorization',
            transport === 'cookie' ? `token=${token}` : `Bearer ${token}`
        );

        expect(response.status).toBe(403);
        expect(response.body.user).toBeUndefined();
    });

    test('does not attach banned users on optional routes', async () => {
        supabase.single.mockResolvedValue({ data: { id: 'user-1', role: 'BANNED', password_hash: null }, error: null });
        const token = signToken({ id: 'user-1', role: 'BUYER' });
        const response = await request(app).get('/optional').set('Cookie', `token=${token}`);

        expect(response.status).toBe(200);
        expect(response.body.user).toBeNull();
    });
});
