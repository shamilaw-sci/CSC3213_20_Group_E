const express = require('express');
const request = require('supertest');
const { trackCheckoutResponse } = require('../integration/checkout-response.cjs');
const { allowPublic } = require('../integration/checkout-browser-guard.cjs');
const property = '11111111-1111-4111-8111-111111111111';
const order = '22222222-2222-4222-8222-222222222222';

test('actual mounted router response registers known order before a provider callback', async () => {
    const scope = { properties: new Set([property]), orders: new Set(), merchant: 'sandbox', callback: '/phase5/test/api/payment/notify' };
    const app = express();
    app.use((req, res, next) => { trackCheckoutResponse(req, res, scope); next(); });
    const router = express.Router();
    router.post('/generate-hash', (req, res) => res.json({ property_id: property, order_id: order, sandbox: true }));
    app.use('/api/payment', router);
    await request(app).post('/api/payment/generate-hash').expect(200);
    expect(scope.orders.has(order)).toBe(true);
    expect(allowPublic('POST', scope.callback, { merchant_id: 'sandbox', order_id: order }, scope)).toBe(true);
    expect(allowPublic('POST', scope.callback, { merchant_id: 'sandbox', order_id: property }, scope)).toBe(false);
});
test('only successful sandbox responses for registered properties create known orders', () => {
    for (const changed of [{ status: 400 }, { sandbox: false }, { property_id: order }, { order_id: null }, { method: 'GET' }, { path: '/api/other' }]) {
        const scope = { properties: new Set([property]), orders: new Set() };
        const req = { method: changed.method || 'POST', path: changed.path || '/api/payment/generate-hash', originalUrl: changed.path || '/api/payment/generate-hash' };
        const res = { statusCode: changed.status || 200, json: value => value };
        trackCheckoutResponse(req, res, scope);
        res.json({ property_id: property, order_id: order, sandbox: true, ...changed });
        expect(scope.orders.size).toBe(0);
    }
});
test('mounted property creation tracks its response using its original route', async () => {
    const scope = { properties: new Set(), orders: new Set() }, created = jest.fn();
    const app = express();
    app.use((req, res, next) => { trackCheckoutResponse(req, res, scope, created); next(); });
    const router = express.Router(); router.post('/', (req, res) => res.status(201).json({ property: { id: property } }));
    app.use('/api/properties', router);
    await request(app).post('/api/properties').expect(201);
    expect(created).toHaveBeenCalledWith({ property: { id: property } });
});
