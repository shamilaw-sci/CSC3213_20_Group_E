const { constants: c } = require('./environment.cjs');
const allowedAppPorts = new Set();
function allowSocket(args, appPorts = allowedAppPorts) {
    const values = Array.isArray(args[0]) ? args[0] : args;
    const options = typeof values[0] === 'object' && values[0] !== null ? values[0]
        : { port: values[0], host: typeof values[1] === 'string' ? values[1] : 'localhost' };
    const port = Number(options.port);
    return Number.isInteger(port) && port > 0 && port <= 65535 && port !== 5000
        && options.host === '127.0.0.1' && (port === c.dbPort || port === c.restPort || appPorts.has(port));
}
function directRestUrl(input) {
    const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url);
    if (url.origin !== 'http://127.0.0.1:59321' || url.username || url.password || !url.pathname.startsWith('/rest/v1/')) {
        throw new Error('Phase7 outbound fetch refused.');
    }
    url.pathname = url.pathname.slice('/rest/v1'.length); return url;
}
module.exports = { allowedAppPorts, allowSocket, directRestUrl };
