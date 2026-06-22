const request = require('supertest');
const express = require('express');
const authRoutes = require('../routes/authRoutes');

// Mock express app
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

// Mock the entire authController to avoid hitting the actual database
jest.mock('../controllers/authController', () => ({
    registerUser: (req, res) => res.status(201).json({ message: 'User registered successfully.', user: { id: 1, email: req.body.email } }),
    loginUser: (req, res) => {
        res.cookie('token', 'mock_token', { httpOnly: true });
        res.status(200).json({ message: 'Login successful.', user: { id: 1, email: req.body.email } });
    },
    getMe: (req, res) => res.status(200).json({ user: { id: 1, name: "Test User" } }),
    logoutUser: (req, res) => {
        res.cookie('token', '', { httpOnly: true, expires: new Date(0) });
        res.status(200).json({ message: 'Logged out successfully' });
    },
    checkEmail: (req, res) => res.status(200).json({ exists: true }),
    forgotPassword: (req, res) => res.status(200).json({ message: 'Password reset link sent to your email!' })
}));

describe('Auth API Endpoints', () => {
    
    test('POST /api/auth/register - should register a new user', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({
                name: 'Test User',
                email: 'test@example.com',
                password: 'password123',
                role: 'BUYER'
            });

        expect(res.statusCode).toEqual(201);
        expect(res.body.message).toEqual('User registered successfully.');
        expect(res.body.user.email).toEqual('test@example.com');
    });

    test('POST /api/auth/login - should login and return HttpOnly cookie', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'test@example.com',
                password: 'password123'
            });

        expect(res.statusCode).toEqual(200);
        expect(res.body.message).toEqual('Login successful.');
        // Verify that the Set-Cookie header contains 'HttpOnly'
        const cookies = res.headers['set-cookie'];
        expect(cookies[0]).toMatch(/HttpOnly/);
    });

    test('POST /api/auth/register - should fail validation without email', async () => {
        // We restore the original validate middleware, but it's loaded in authRoutes
        // so it actually tests the zod validation!
        const res = await request(app)
            .post('/api/auth/register')
            .send({
                name: 'Test User',
                password: 'password123'
            });

        expect(res.statusCode).toEqual(400); // Bad Request from Zod Validation
        expect(res.body.errors).toBeDefined();
    });

});
