// Only the suite's explicitly bound listener may supplement the verified stack ports.
const allowedAppPorts = new Set();
function allowSocket(args, appPorts = allowedAppPorts) {
    // Node HTTP passes the normalized [options, callback] as one array argument.
    const values = Array.isArray(args[0]) ? args[0] : args;
    const options = typeof values[0] === 'object' && values[0] !== null ? values[0] : {
        port: values[0], host: typeof values[1] === 'string' ? values[1] : 'localhost',
    };
    const port = Number(options.port);
    return Number.isInteger(port) && port > 0 && port <= 65535
        && options.host === '127.0.0.1'
        && port !== 5000 && (port === 58321 || port === 58322 || appPorts.has(port));
}

function directRestUrl(input) {
    const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url);
    if (url.origin !== 'http://127.0.0.1:58321' || url.username || url.password
        || !url.pathname.startsWith('/rest/v1/')) {
        throw new Error('Unexpected outbound fetch refused by integration harness.');
    }
    url.pathname = url.pathname.slice('/rest/v1'.length);
    return url;
}
module.exports = { allowSocket, directRestUrl, allowedAppPorts };
