const { verifyTunnel, allowPrivate, allowPublic, allowSocket, credentialSelection, fixtureRows } = require('../integration/phase7/browser-guards.cjs');
const origin = 'https://strep-reenact-rocket.ngrok-free.dev';
const property = '10000000-0000-4000-8000-000000000001', order = '20000000-0000-4000-8000-000000000001';
const scope = () => ({ properties: new Set([property]), orders: new Set([order]), merchant: 'synthetic', callback: '/phase7/nonce/api/payment/notify', health: '/phase7/nonce/health' });
test('exact existing HTTPS tunnel and local target only', () => {
  expect(verifyTunnel({ tunnels: [{ public_url: origin, proto: 'https', config: { addr: 'http://localhost:5000' } }] })).toBe(origin);
});
test.each([
  { tunnels: [] },
  { tunnels: [{ public_url: 'https://other.example.test', proto: 'https', config: { addr: 'http://localhost:5000' } }] },
  { tunnels: [{ public_url: origin, proto: 'https', config: { addr: 'http://remote:5000' } }] },
])('rejects tunnel mismatch %p', data => expect(() => verifyTunnel(data)).toThrow());
test('private paths require known property/order and exact route', () => {
  const s = scope(); expect(allowPrivate('GET', '/api/payment/config', {}, s)).toBe(true);
  expect(allowPrivate('POST', '/api/payment/generate-hash', { property_id: property }, s)).toBe(true);
  expect(allowPrivate('POST', '/api/payment/confirm-client-success', { property_id: property, order_id: order }, s)).toBe(true);
  expect(allowPrivate('POST', '/api/payment/generate-hash', { property_id: order }, s)).toBe(false);
  expect(allowPrivate('POST', '/api/payment/confirm-client-success', { property_id: property, order_id: property }, s)).toBe(false);
  expect(allowPrivate('GET', '/api/admin/settings', {}, s)).toBe(false);
});
test('public bridge permits only scoped sentinel or matching callback', () => {
  const s = scope(); expect(allowPublic('GET', s.health, {}, s)).toBe(true);
  expect(allowPublic('POST', s.callback, { order_id: order, merchant_id: 'synthetic' }, s)).toBe(true);
  for (const path of ['/health', '/api/payment/notify', '/api/auth/me', s.callback + '?x=1']) expect(allowPublic('POST', path, { order_id: order, merchant_id: 'synthetic' }, s)).toBe(false);
  expect(allowPublic('POST', s.callback, { order_id: property, merchant_id: 'synthetic' }, s)).toBe(false);
  expect(allowPublic('POST', s.callback, { order_id: order, merchant_id: 'other' }, s)).toBe(false);
});
test('outbound sockets are exact fresh loopback resources or explicit app ports', () => {
  expect(allowSocket([{ host: '127.0.0.1', port: 59322 }], new Set())).toBe(true);
  expect(allowSocket([{ host: '127.0.0.1', port: 59321 }], new Set())).toBe(true);
  expect(allowSocket([{ host: '127.0.0.1', port: 50123 }], new Set([50123]))).toBe(true);
  for (const host of ['localhost', '0.0.0.0', 'db.example.test']) expect(allowSocket([{ host, port: 59322 }], new Set())).toBe(false);
  expect(allowSocket([{ host: '127.0.0.1', port: 5000 }], new Set([5000]))).toBe(false);
});
test('selects only approved Sandbox keys and never returns other environment content', () => {
  const selected = credentialSelection('DATABASE_URL=private-db\nPAYHERE_MERCHANT_ID=1236024\nPAYHERE_MERCHANT_SECRET=synthetic-secret\nSMTP_PASS=private-mail\n');
  expect(selected).toEqual({ merchant: '1236024', secret: 'synthetic-secret' }); expect(JSON.stringify(selected)).not.toContain('private-');
  expect(() => credentialSelection('PAYHERE_MERCHANT_ID=other\nPAYHERE_MERCHANT_SECRET=secret')).toThrow();
  expect(() => credentialSelection('PAYHERE_MERCHANT_ID=1236024')).toThrow();
});
test('fixture identity validation refuses broad or duplicate cleanup selectors', () => {
  const run = '30000000-0000-4000-8000-000000000001';
  const good = { run, users: [{ id: property, email: `${run}-seller@example.test`, role: 'SELLER' }], fixtures: [{ id: order, userId: property, title: `${run} Visa`, label: 'Visa' }] };
  expect(fixtureRows(good)).toBe(good);
  expect(() => fixtureRows({ ...good, fixtures: [{ ...good.fixtures[0], userId: order }] })).toThrow();
  expect(() => fixtureRows({ ...good, users: [{ ...good.users[0], email: 'real@example.com' }] })).toThrow();
});
