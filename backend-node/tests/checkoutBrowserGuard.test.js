const { verifyTunnel, allowPrivate, allowPublic } = require('../integration/checkout-browser-guard.cjs');
const property = '11111111-1111-4111-8111-111111111111';
const order = '22222222-2222-4222-8222-222222222222';
const scope = { properties: new Set([property]), orders: new Set([order]), callback: '/phase5/test-token/api/payment/notify', health: '/phase5/test-token/health', merchant: 'sandbox-merchant' };
test('only the existing HTTPS ngrok forwarding target is accepted', () => {
    const tunnel = { public_url: 'https://strep-reenact-rocket.ngrok-free.dev', proto: 'https', config: { addr: 'http://localhost:5000' } };
    expect(verifyTunnel({ tunnels: [tunnel] })).toBe(tunnel.public_url);
    for (const changed of [{ ...tunnel, public_url: 'https://other.example' }, { ...tunnel, config: { addr: 'http://localhost:5001' } }, { ...tunnel, proto: 'http' }]) {
        expect(() => verifyTunnel({ tunnels: [changed] })).toThrow();
    }
    expect(() => verifyTunnel({ tunnels: [] })).toThrow();
});
test('private API exposes only fixture checkout/read operations', () => {
    expect(allowPrivate('GET', `/api/properties/${property}`, {}, scope)).toBe(true);
    expect(allowPrivate('POST', '/api/payment/generate-hash', { property_id: property }, scope)).toBe(true);
    expect(allowPrivate('POST', '/api/payment/confirm-client-success', { property_id: property, order_id: order }, scope)).toBe(true);
    for (const [method, path, body] of [['POST', '/api/auth/register', {}], ['GET', '/api/admin/users', {}], ['POST', '/api/payment/notify', {}],
        ['POST', '/api/payment/generate-hash', { property_id: order }], ['POST', '/api/payment/confirm-client-success', { property_id: property, order_id: property }]]) {
        expect(allowPrivate(method, path, body, scope)).toBe(false);
    }
});
test('public bridge permits only exact health and form callback route/known order/merchant', () => {
    const body = { order_id: order, merchant_id: scope.merchant };
    expect(allowPublic('GET', scope.health, {}, scope)).toBe(true);
    expect(allowPublic('POST', scope.callback, body, scope)).toBe(true);
    for (const [method, path, changed] of [['GET', scope.callback, body], ['POST', '/api/payment/notify', body],
        ['POST', scope.callback, { ...body, order_id: property }], ['POST', scope.callback, { ...body, merchant_id: 'other' }],
        ['POST', scope.callback + '?extra=1', body], ['POST', scope.callback, { ...body, order_id: [order] }]]) {
        expect(allowPublic(method, path, changed, scope)).toBe(false);
    }
});
