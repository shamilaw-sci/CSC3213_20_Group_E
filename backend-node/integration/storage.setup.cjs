const { inspectStorageStack } = require('./storage-local.cjs');
const { allowedAppPorts } = require('./network-policy.cjs');
const { storageFetch } = require('./storage-network.cjs');
if (process.env.PHASE5_STORAGE_APPROVED !== 'stack-c') throw new Error('Verified Storage profile required.');
const storage = inspectStorageStack();
// Only this explicit profile extends the already installed TCP guard.
allowedAppPorts.add(58323);
globalThis.fetch = storageFetch(globalThis.__phase5NativeFetch, globalThis.fetch);
process.env.PHASE5_STORAGE_CONTAINER = storage.containerId;

// Only known synthetic validation/fault cases are quiet; unexpected errors remain visible.
for (const method of ['log', 'warn', 'error']) {
    const original = console[method].bind(console);
    console[method] = (...args) => {
        if (args.length === 1 && typeof args[0] === 'string'
            && /^\[HTTP\] (POST|DELETE) \/api\/(properties(?:\/[^ ]*)?|admin\/listings(?:\/[^ ]*)?) -> [234]\d\d \(\d+ms\)$/.test(args[0])) return;
        if (method === 'error' && args[0] === '🔥 Global Error Handler:' && typeof args[1] === 'string'
            && /^(Invalid file type \(application\/pdf\)|File too large$|Unexpected file field$|Too many files$|invalid input syntax for type numeric: "invalid-numeric-fixture"$|Injected upload failure$)/.test(args[1])) return;
        original(...args);
    };
}
