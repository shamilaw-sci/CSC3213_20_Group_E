const express = require('express');
const cookieParser = require('cookie-parser');
const request = require('supertest');
const jwt = require('jsonwebtoken');

jest.mock('../config/supabase', () => {
    const db = {
        from: jest.fn().mockReturnThis(), select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(), insert: jest.fn().mockReturnThis(),
        single: jest.fn(), maybeSingle: jest.fn(),
        then(resolve) { resolve({ data: [], error: null }); },
    };
    return db;
});
jest.mock('../repositories/agentRepository', () => ({ createViewingLead: jest.fn() }));

const db = require('../config/supabase');
const agentRepository = require('../repositories/agentRepository');
const app = express();
app.use(express.json(), cookieParser());
app.use('/agents', require('../routes/agentRoutes'));

const agentId = '22222222-2222-4222-8222-222222222222';
const buyerId = '11111111-1111-4111-8111-111111111111';
const booking = {
    client_name: 'Test Visitor', client_email: 'existing@example.test',
    client_phone: '0000000000', viewing_type: 'In-Person Property Tour',
    preferred_date: '2026-10-26', preferred_time: 'Morning', notes: 'Test booking',
};

describe('Booking identity at the API boundary', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        agentRepository.createViewingLead.mockResolvedValue({ lead_id: 'test-lead' });
        db.single.mockResolvedValue({ data: { id: buyerId, role: 'BUYER', email: 'buyer@example.test' }, error: null });
        db.maybeSingle.mockResolvedValue({ data: { id: 'existing-conversation' }, error: null });
    });

    test('preserves guest bookings without looking up or impersonating registered accounts', async () => {
        const response = await request(app).post(`/agents/${agentId}/book-viewing`).send(booking);

        expect(response.status).toBe(201);
        expect(agentRepository.createViewingLead).toHaveBeenCalledWith(agentId, expect.objectContaining({ client_email: booking.client_email }));
        expect(db.from).not.toHaveBeenCalled();
        expect(db.insert).not.toHaveBeenCalled();
    });

    test('uses the authenticated identity for a registered buyer conversation', async () => {
        const token = jwt.sign({ id: buyerId, role: 'BUYER' }, process.env.JWT_SECRET);
        const response = await request(app).post(`/agents/${agentId}/book-viewing`)
            .set('Cookie', `token=${token}`).send(booking);

        expect(response.status).toBe(201);
        expect(db.insert).toHaveBeenCalledWith([expect.objectContaining({
            conversation_id: 'existing-conversation', sender_id: buyerId,
        })]);
        expect(db.eq).not.toHaveBeenCalledWith('email', booking.client_email);
    });

    test('prevents authenticated self-booking through the actual route', async () => {
        db.single.mockResolvedValue({ data: { id: agentId, role: 'AGENT' }, error: null });
        const token = jwt.sign({ id: agentId, role: 'AGENT' }, process.env.JWT_SECRET);
        const response = await request(app).post(`/agents/${agentId}/book-viewing`)
            .set('Authorization', `Bearer ${token}`).send(booking);

        expect(response.status).toBe(400);
        expect(agentRepository.createViewingLead).not.toHaveBeenCalled();
        expect(db.insert).not.toHaveBeenCalled();
    });

    test('never links a password-reset token to a booking identity', async () => {
        const token = jwt.sign({ id: buyerId, type: 'password_reset' }, process.env.JWT_SECRET);
        const response = await request(app).post(`/agents/${agentId}/book-viewing`)
            .set('Authorization', `Bearer ${token}`).send(booking);

        expect(response.status).toBe(201);
        expect(db.from).not.toHaveBeenCalled();
        expect(db.insert).not.toHaveBeenCalled();
    });
});
