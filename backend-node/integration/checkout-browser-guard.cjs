const ORIGIN = 'https://strep-reenact-rocket.ngrok-free.dev';
function verifyTunnel(data) {
    if (!Array.isArray(data?.tunnels) || data.tunnels.length !== 1) throw new Error('Expected existing sandbox tunnel.');
    const t = data.tunnels[0];
    if (t.public_url !== ORIGIN || t.proto !== 'https' || t.config?.addr !== 'http://localhost:5000') throw new Error('Sandbox tunnel target refused.');
    return ORIGIN;
}
function allowPrivate(method, path, body, scope) {
    const read = /^\/api\/properties\/([0-9a-f-]+)$/i.exec(path);
    const knownPath = path === '/api/payment/config' || path === '/api/payment/generate-hash' || path === '/api/payment/confirm-client-success' || (read && scope.properties.has(read[1]));
    if (method === 'OPTIONS') return !!knownPath;
    if (method === 'GET') return path === '/api/payment/config' || !!(read && scope.properties.has(read[1]));
    if (method !== 'POST' || !scope.properties.has(body?.property_id)) return false;
    if (path === '/api/payment/generate-hash') return true;
    return path === '/api/payment/confirm-client-success' && scope.orders.has(body?.order_id);
}
function allowPublic(method, path, body, scope) {
    if (method === 'GET' && path === scope.health) return true;
    return method === 'POST' && path === scope.callback && typeof body?.order_id === 'string'
        && scope.orders.has(body.order_id) && body.merchant_id === scope.merchant;
}
module.exports = { verifyTunnel, allowPrivate, allowPublic };
