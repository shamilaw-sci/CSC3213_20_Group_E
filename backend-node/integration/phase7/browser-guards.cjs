const assert = require('node:assert/strict');
const dotenv = require('dotenv');
const origin = 'https://strep-reenact-rocket.ngrok-free.dev';
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function verifyTunnel(data) {
    assert.equal(data?.tunnels?.length, 1);
    const t = data.tunnels[0]; assert.equal(t.public_url, origin); assert.equal(t.proto, 'https'); assert.equal(t.config?.addr, 'http://localhost:5000');
    return origin;
}
function allowPrivate(method, path, body, scope) {
    if (method === 'GET') return path === '/api/payment/config' || [...scope.properties].some(id => path === `/api/properties/${id}`);
    if (method !== 'POST' || !body || Array.isArray(body) || !scope.properties.has(body.property_id)) return false;
    if (path === '/api/payment/generate-hash') return true;
    return path === '/api/payment/confirm-client-success' && scope.orders.has(body.order_id);
}
function allowPublic(method, path, body, scope) {
    return (method === 'GET' && path === scope.health)
        || (method === 'POST' && path === scope.callback && typeof body?.order_id === 'string'
            && scope.orders.has(body.order_id) && body.merchant_id === scope.merchant);
}
function allowSocket(args, ports = new Set()) {
    const values = Array.isArray(args[0]) ? args[0] : args;
    const o = typeof values[0] === 'object' && values[0] !== null ? values[0]
        : { port: values[0], host: typeof values[1] === 'string' ? values[1] : 'localhost' };
    const port = Number(o.port);
    return o.host === '127.0.0.1' && Number.isInteger(port) && port !== 5000
        && (port === 59321 || port === 59322 || ports.has(port));
}
function credentialSelection(text) {
    const selected = text.split(/\r?\n/).filter(line => /^\s*(?:export\s+)?PAYHERE_MERCHANT_(?:ID|SECRET)\s*=/.test(line));
    assert.equal(selected.length, 2);
    const source = dotenv.parse(selected.join('\n'));
    assert.equal(source.PAYHERE_MERCHANT_ID, '1236024');
    assert.ok(typeof source.PAYHERE_MERCHANT_SECRET === 'string' && source.PAYHERE_MERCHANT_SECRET.length >= 16
        && source.PAYHERE_MERCHANT_SECRET.length <= 1024 && !/[\r\n]/.test(source.PAYHERE_MERCHANT_SECRET));
    return { merchant: source.PAYHERE_MERCHANT_ID, secret: source.PAYHERE_MERCHANT_SECRET };
}
function fixtureRows(m) {
    assert.ok(uuid.test(m?.run)); assert.ok(Array.isArray(m.users) && m.users.length && Array.isArray(m.fixtures) && m.fixtures.length);
    const ids = new Set();
    for (const u of m.users) {
        assert.ok(typeof u.id === 'string' && uuid.test(u.id) && !ids.has(u.id)); ids.add(u.id);
        assert.ok(['SELLER', 'AGENT'].includes(u.role));
        assert.ok(typeof u.email === 'string' && u.email.startsWith(`${m.run}-`) && /^[0-9a-z-]+@example\.test$/.test(u.email));
    }
    for (const f of m.fixtures) {
        assert.ok(typeof f.id === 'string' && uuid.test(f.id) && !ids.has(f.id)); ids.add(f.id);
        assert.ok(m.users.some(u => u.id === f.userId)); assert.ok(['Visa', 'Mastercard', 'Cancel', 'Decline'].includes(f.label));
        assert.equal(f.title, `${m.run} ${f.label}`);
    }
    return m;
}
module.exports = { origin, uuid, verifyTunnel, allowPrivate, allowPublic, allowSocket, credentialSelection, fixtureRows };
