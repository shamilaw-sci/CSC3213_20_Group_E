const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const readline = require('node:readline');
const net = require('node:net');
const { simulation, startFixture, origin } = require('./browser-fixture.cjs');

for (const key of Object.keys(process.env)) if (key.startsWith('VITE_')) delete process.env[key];
const connect = net.Socket.prototype.connect;
net.Socket.prototype.connect = function () { throw new Error('Simulation outbound socket refused.'); };
const dir = path.resolve(__dirname, '../../../docs/evidence/phase7-browser', randomUUID());
fs.mkdirSync(dir, { recursive: true });
const model = simulation();
const input = readline.createInterface({ input: process.stdin });
let stopping, timer;
const startup = startFixture({ dir, mode: 'mock', manifest: { user: model.user }, request: model.request, status: model.status, control: model.control });
function stop() {
    stopping ??= (async () => {
        clearTimeout(timer);
        try { await (await startup).close(); }
        catch { process.exitCode = 1; }
        net.Socket.prototype.connect = connect;
        input.close();
        process.stdin.pause();
    })();
    return stopping;
}
input.on('line', line => {
    if (line.trim() === 'stop') stop();
    if (line.trim() === 'status') console.log(JSON.stringify(model.status()));
});
input.on('close', stop);
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
startup.then(() => {
    if (!stopping) console.log(`READY: ${origin}/ | simulation | commands: status, stop`);
}).catch(error => {
    console.error('Simulation startup failed:', error.code || error.message);
    process.exitCode = 1;
    stop();
});
timer = setTimeout(stop, 15 * 60 * 1000);
