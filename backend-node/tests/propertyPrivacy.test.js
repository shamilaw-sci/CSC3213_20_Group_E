const express = require('express');
const cookieParser = require('cookie-parser');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const { issueSessionToken } = require('../utils/sessionToken');

jest.mock('../config/supabase', () => ({
    from: jest.fn().mockReturnThis(), select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(), is: jest.fn().mockReturnThis(), single: jest.fn(),
}));
jest.mock('../repositories/propertyRepository', () => ({ getPropertyById: jest.fn() }));

const db = require('../config/supabase');
const propertyRepository = require('../repositories/propertyRepository');
const app = express();
app.use(cookieParser());
app.use('/properties', require('../routes/propertyRoutes'));

describe('Property detail visibility', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        propertyRepository.getPropertyById.mockResolvedValue({
            id: 'property-1', status: 'pending', payment_status: 'Unpaid',
            seller_id: 'seller-1', contact_number: 'private-phone',
        });
    });

    test.each(['pending', 'rejected', 'draft'])('hides %s properties from anonymous visitors', async (status) => {
        propertyRepository.getPropertyById.mockResolvedValue({ id: 'property-1', status, seller_id: 'seller-1' });
        const response = await request(app).get('/properties/property-1');
        expect(response.status).toBe(404);
        expect(response.body.property).toBeUndefined();
    });

    test('keeps approved listings public', async () => {
        propertyRepository.getPropertyById.mockResolvedValue({ id: 'property-1', status: 'approved', seller_id: 'seller-1' });
        const response = await request(app).get('/properties/property-1');
        expect(response.status).toBe(200);
        expect(response.body.property.id).toBe('property-1');
    });

    test.each([
        ['seller-1', 'SELLER', 200],
        ['seller-1', 'AGENT', 200],
        ['admin-1', 'ADMIN', 200],
        ['other-1', 'BUYER', 404],
        ['other-1', 'SELLER', 404],
        ['seller-1', 'BANNED', 404],
    ])('applies owner/admin visibility to %s (%s)', async (id, role, expectedStatus) => {
        db.single.mockResolvedValue({ data: { id, role, password_hash: null }, error: null });
        const token = issueSessionToken({ id, role, password_hash: null });
        const response = await request(app).get('/properties/property-1').set('Cookie', `token=${token}`);
        expect(response.status).toBe(expectedStatus);
        if (expectedStatus === 200) expect(response.body.property.contact_number).toBe('private-phone');
        else expect(response.body.property).toBeUndefined();
    });

    test('does not use a reset token to grant owner visibility', async () => {
        const token = jwt.sign({ id: 'seller-1', type: 'password_reset' }, process.env.JWT_SECRET);
        const response = await request(app).get('/properties/property-1').set('Authorization', `Bearer ${token}`);
        expect(response.status).toBe(404);
        expect(response.body.property).toBeUndefined();
    });
});
