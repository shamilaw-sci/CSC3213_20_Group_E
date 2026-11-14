// One-shot fresh local resources only. No reuse, reset, deletion or caller URLs.
const fs = require('node:fs');
const net = require('node:net');
const { randomBytes, randomUUID } = require('node:crypto');
const { Client } = require('pg');
const e = require('./environment.cjs');
const c = e.constants;
const lines = value => value.trim().split(/\r?\n/).filter(Boolean);
async function freePort(port) {
    await new Promise((resolve, reject) => {
        const server = net.createServer(); server.once('error', reject);
        server.listen(port, '127.0.0.1', () => server.close(error => error ? reject(error) : resolve()));
    });
}
async function main() {
    let stage = 'fresh resource collision checks';
    const created = [];
    try {
        if (process.argv.length !== 2 || fs.existsSync(e.statePath)) throw new Error('Fresh invocation required');
        const containers = lines(e.docker(['container', 'ls', '-a', '--format', '{{.Names}}|{{.State}}|{{.ID}}']));
        const networks = lines(e.docker(['network', 'ls', '--format', '{{.Name}}']));
        const volumes = lines(e.docker(['volume', 'ls', '--format', '{{.Name}}']));
        if (containers.some(line => [c.dbName, c.restName].includes(line.split('|')[0])) || networks.includes(c.network)) throw new Error('Name collision');
        await freePort(c.dbPort); await freePort(c.restPort);
        const nonce = randomUUID();
        const state = { project: c.project, nonce, volume: `${c.project}-${nonce}`,
            password: randomBytes(32).toString('hex'), jwtSecret: randomBytes(32).toString('hex'),
            dbImageId: e.docker(['image', 'inspect', c.dbImage, '--format', '{{.Id}}']).trim(),
            restImageId: e.docker(['image', 'inspect', c.restImage, '--format', '{{.Id}}']).trim(),
            retained: { containers, networks, volumes } };
        e.validateState(state);
        if (volumes.includes(state.volume)) throw new Error('Volume collision');
        fs.mkdirSync(e.evidence, { recursive: true });
        fs.writeFileSync(e.statePath, JSON.stringify(state, null, 2), { flag: 'wx' });
        const labels = ['--label', `com.supabase.cli.project=${c.project}`, '--label', `thirasara.phase7.nonce=${nonce}`];
        stage = 'new isolated network and volume';
        e.docker(['network', 'create', '--driver', 'bridge', '--opt', 'com.docker.network.bridge.host_binding_ipv4=127.0.0.1', ...labels, c.network]);
        e.validateNetwork(JSON.parse(e.docker(['network', 'inspect', c.network]))[0], state);
        e.docker(['volume', 'create', ...labels, state.volume]);
        stage = 'fresh database creation';
        e.docker(['create', '--pull=never', '--name', c.dbName, '--network', c.network, ...labels,
            '--publish', `127.0.0.1:${c.dbPort}:5432`, '--mount', `type=volume,source=${state.volume},target=/var/lib/postgresql/data`,
            '--env', 'POSTGRES_USER=supabase_admin', '--env', 'POSTGRES_DB=postgres',
            '--env', `POSTGRES_PASSWORD=${state.password}`, '--env', `JWT_SECRET=${state.jwtSecret}`, c.dbImage]);
        created.push(c.dbName); e.docker(['start', c.dbName]);
        e.validateItem(JSON.parse(e.docker(['inspect', c.dbName]))[0], state, 'db');
        console.log('Created new labelled DB/network/volume; waiting for cached image initialization.');
        stage = 'database bootstrap readiness';
        let ready = false;
        for (let attempt = 0; attempt < 60; attempt++) {
            const client = new Client(e.database(state, 'supabase_admin'));
            try {
                await client.connect();
                const row = (await client.query(`SELECT current_user AS role,
                    current_setting('server_version_num')::int/10000 AS major,
                    to_regprocedure('auth.uid()') IS NOT NULL AS auth_ready`)).rows[0];
                if (row.role === 'supabase_admin' && row.major === 17 && row.auth_ready) {
                    await client.query(`ALTER ROLE authenticator PASSWORD '${state.password}'`);
                    ready = true;
                }
            } catch { /* No raw startup errors/credentials in output. */ }
            finally { await client.end().catch(() => {}); }
            if (ready) break;
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        if (!ready) throw new Error('Bootstrap not ready');
        stage = 'fresh REST creation';
        e.docker(['create', '--pull=never', '--name', c.restName, '--network', c.network, ...labels,
            '--publish', `127.0.0.1:${c.restPort}:3000`, '--env', 'PGRST_DB_SCHEMAS=public',
            '--env', 'PGRST_DB_EXTRA_SEARCH_PATH=public,extensions', '--env', 'PGRST_DB_ANON_ROLE=anon',
            '--env', `PGRST_JWT_SECRET=${state.jwtSecret}`,
            '--env', `PGRST_DB_URI=postgresql://authenticator:${state.password}@${c.dbName}:5432/postgres`, c.restImage]);
        created.push(c.restName); e.docker(['start', c.restName]); e.inspect(state);
        console.log('PASS: fresh Phase7 DB/REST identities/images/nonce/network/volume and loopback bindings; no application schema yet.');
    } catch {
        console.error(`FAIL: Phase7 provisioning at ${stage}; sensitive details suppressed.`);
        // Only exact newly created names in this invocation, never retained resources.
        for (const name of created.reverse()) {
            try { e.docker(['stop', name]); } catch { console.error('Could not stop a newly created Phase7 container; inspect exact identity.'); }
        }
        process.exitCode = 1;
    }
}
void main();
