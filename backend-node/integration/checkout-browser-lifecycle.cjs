const { createHash } = require('node:crypto');
function hashState(state) {
    return Object.fromEntries(Object.entries(state).map(([name, rows]) => [name, createHash('sha256').update(JSON.stringify(rows)).digest('hex')]));
}
function makeLifecycle(cleanup) {
    let startup = Promise.resolve(), shutdown, stopping = false;
    return {
        get stopping() { return stopping; },
        setStartup(promise) { startup = Promise.resolve(promise); },
        assertActive() { if (stopping) throw new Error('Browser fixture is stopping.'); },
        stop() {
            if (!shutdown) {
                stopping = true;
                shutdown = (async () => { await startup.catch(() => {}); return cleanup(); })();
            }
            return shutdown;
        },
    };
}
module.exports = { makeLifecycle, hashState };
