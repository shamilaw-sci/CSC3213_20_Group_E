const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const constants = Object.freeze({ project: 'thirasara-phase7-acceptance', network: 'thirasara-phase7-acceptance-loopback',
    dbImage: 'public.ecr.aws/supabase/postgres:17.11.0.006', restImage: 'public.ecr.aws/supabase/postgrest:v16.5',
    dbName: 'supabase_db_thirasara-phase7-acceptance', restName: 'supabase_rest_thirasara-phase7-acceptance',
    dbPort: 59322, restPort: 59321 });
const root = path.resolve(__dirname, '../../..');
const evidence = path.join(root, 'docs/evidence/phase7-acceptance');
const statePath = path.join(evidence, 'state.private.json');
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const refuse = condition => assert.ok(condition, 'Phase7 isolated identity refused.');
const env = item => Object.fromEntries(item.Config.Env.map(value => {
    const index = value.indexOf('='); return [value.slice(0, index), value.slice(index + 1)];
}));
function validateState(state) {
    refuse(state?.project === constants.project && uuid.test(state.nonce));
    refuse(state.volume === `${constants.project}-${state.nonce}`);
    for (const key of ['password', 'jwtSecret']) refuse(typeof state[key] === 'string' && /^[a-f0-9]{64}$/.test(state[key]));
    for (const key of ['dbImageId', 'restImageId']) refuse(/^sha256:[a-f0-9]{64}$/.test(state[key]));
}
function validateItem(item, state, kind, stopped = false) {
    validateState(state);
    const db = kind === 'db';
    const name = db ? constants.dbName : constants.restName;
    const target = db ? '5432/tcp' : '3000/tcp';
    const port = String(db ? constants.dbPort : constants.restPort);
    refuse(item?.Name === `/${name}` && item.State?.Running === !stopped);
    refuse(item.Config?.Image === (db ? constants.dbImage : constants.restImage));
    refuse(item.Image === state[db ? 'dbImageId' : 'restImageId'] && item.HostConfig?.Privileged === false);
    refuse(item.Config.Labels?.['com.supabase.cli.project'] === constants.project
        && item.Config.Labels?.['thirasara.phase7.nonce'] === state.nonce);
    for (const ports of stopped ? [item.HostConfig.PortBindings] : [item.HostConfig.PortBindings, item.NetworkSettings?.Ports]) {
        refuse(ports && Object.keys(ports).length === 1 && ports[target]?.length === 1
            && ports[target][0].HostIp === '127.0.0.1' && ports[target][0].HostPort === port);
        for (const bindings of Object.values(ports)) for (const binding of bindings || []) refuse(binding.HostIp === '127.0.0.1');
    }
    const networks = item.NetworkSettings?.Networks;
    refuse(networks && Object.keys(networks).length === 1 && Object.hasOwn(networks,constants.network));
    if (!stopped) refuse(!!networks[constants.network]?.NetworkID);
    refuse(Array.isArray(item.Mounts) && item.Mounts.length === (db ? 1 : 0));
    if (db) refuse(item.Mounts[0].Type === 'volume' && item.Mounts[0].Name === state.volume
        && item.Mounts[0].Destination === '/var/lib/postgresql/data');
    const configured = env(item);
    if (db) refuse(configured.POSTGRES_PASSWORD === state.password && configured.JWT_SECRET === state.jwtSecret);
    else {
        refuse(configured.PGRST_JWT_SECRET === state.jwtSecret);
        const url = new URL(configured.PGRST_DB_URI);
        refuse(url.protocol === 'postgresql:' && url.hostname === constants.dbName && url.port === '5432'
            && url.pathname === '/postgres' && url.username === 'authenticator' && url.password === state.password && !url.search && !url.hash);
    }
}
function validateContainers(items, state) {
    refuse(Array.isArray(items) && items.length === 2);
    validateItem(items[0], state, 'db'); validateItem(items[1], state, 'rest');
    refuse(items[0].NetworkSettings.Networks[constants.network].NetworkID === items[1].NetworkSettings.Networks[constants.network].NetworkID);
}
function validateStoppedItem(item, state, kind) {
    // Docker does not populate runtime Ports/NetworkID for a newly attached stopped endpoint.
    // Check requested config here; the separate running check must prove actual attachment/publication.
    validateItem(item,state,kind,true);
}
function validateNetwork(network, state) {
    validateState(state);
    refuse(network.Name === constants.network && network.Internal === false && network.Driver === 'bridge'
        && network.Options?.['com.docker.network.bridge.host_binding_ipv4'] === '127.0.0.1'
        && network.Labels?.['com.supabase.cli.project'] === constants.project
        && network.Labels?.['thirasara.phase7.nonce'] === state.nonce);
}
function validateIdentity(identity, state) {
    validateState(state);
    refuse(identity?.database === 'postgres' && identity.user === 'postgres' && identity.major === 17
        && identity.nonce === state.nonce && identity.stage === 'ready'
        && JSON.stringify(identity.versions) === JSON.stringify(['20261030045356', '20261030045416']));
}
const identitySql = `SELECT current_database() AS database,current_user AS user,
    current_setting('server_version_num')::int/10000 AS major,
    (SELECT nonce::text FROM phase7_acceptance_guard.environment WHERE id='thirasara-phase7-acceptance') AS nonce,
    (SELECT stage FROM phase7_acceptance_guard.environment WHERE id='thirasara-phase7-acceptance') AS stage,
    (SELECT patch_sha FROM phase7_acceptance_guard.environment WHERE id='thirasara-phase7-acceptance') AS patch_sha,
    (SELECT json_agg(version ORDER BY version) FROM supabase_migrations.schema_migrations) AS versions`;
function docker(args, options = {}) {
    return execFileSync('docker', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 30000, ...options });
}
function loadState() { const state = JSON.parse(fs.readFileSync(statePath, 'utf8')); validateState(state); return state; }
function inspect(state = loadState()) {
    execFileSync(process.execPath, [path.join(root, 'tools/database/verify-migrations.cjs')], { stdio: 'pipe' });
    const items = JSON.parse(docker(['inspect', constants.dbName, constants.restName]));
    validateContainers(items, state);
    const network = JSON.parse(docker(['network', 'inspect', constants.network]))[0];
    validateNetwork(network, state);
    refuse(network.Id === items[0].NetworkSettings.Networks[constants.network].NetworkID
        && JSON.stringify(Object.values(network.Containers || {}).map(item => item.Name).sort())
            === JSON.stringify([constants.dbName, constants.restName].sort()));
    const volume = JSON.parse(docker(['volume', 'inspect', state.volume]))[0];
    refuse(volume.Name === state.volume && volume.Driver === 'local' && !Object.keys(volume.Options || {}).length
        && volume.Labels?.['com.supabase.cli.project'] === constants.project
        && volume.Labels?.['thirasara.phase7.nonce'] === state.nonce);
    return state;
}
const database = (state, user = 'postgres') => ({ host: '127.0.0.1', port: constants.dbPort, database: 'postgres',
    user, password: state.password, ssl: false, connectionTimeoutMillis: 5000 });
async function verifyReady(client, state, patchHash) {
    const identity = (await client.query(identitySql)).rows[0];
    validateIdentity(identity, state); refuse(identity.patch_sha === patchHash);
}
module.exports = { constants, root, evidence, statePath, validateState, validateItem, validateContainers,
    validateStoppedItem, validateNetwork, validateIdentity, identitySql, docker, loadState, inspect, database, verifyReady };
