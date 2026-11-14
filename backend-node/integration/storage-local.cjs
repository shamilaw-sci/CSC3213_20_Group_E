// Test tooling only: inspect the retained local Storage identity without loading .env.
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const jwt = require('jsonwebtoken');

const project = 'thirasara-phase4-c';
const network = 'thirasara-phase4-local';
const refuse = condition => assert.ok(condition, 'Isolated Storage environment refused; check local prerequisites.');
function environment(item) {
    refuse(Array.isArray(item?.Config?.Env));
    const values = {};
    for (const entry of item.Config.Env) {
        refuse(typeof entry === 'string' && entry.indexOf('=') > 0);
        const index = entry.indexOf('=');
        const key = entry.slice(0, index);
        refuse(!Object.hasOwn(values, key));
        values[key] = entry.slice(index + 1);
    }
    return values;
}
function localNetwork(item) {
    const networks = item?.NetworkSettings?.Networks;
    refuse(networks && Object.keys(networks).length === 1 && typeof networks[network]?.NetworkID === 'string'
        && networks[network].NetworkID.length > 0);
    return networks[network].NetworkID;
}
function validJwks(configured, secret) {
    try {
        const jwks = JSON.parse(configured);
        return Array.isArray(jwks.keys) && jwks.keys.some(key => key.kty === 'oct') && jwks.keys.every(key => {
            if (key.kty === 'oct') return typeof key.k === 'string' && /^[A-Za-z0-9_-]+$/.test(key.k)
                && Buffer.from(key.k, 'base64url').equals(Buffer.from(secret));
            return key.kty === 'EC' && key.alg === 'ES256' && key.crv === 'P-256'
                && typeof key.x === 'string' && key.x.length > 0 && typeof key.y === 'string' && key.y.length > 0
                && !Object.hasOwn(key, 'd');
        });
    } catch { return false; }
}
function validRoleToken(token, secret, role) {
    try {
        const claims = jwt.verify(token, secret, { algorithms: ['HS256'] });
        return typeof claims === 'object' && claims !== null && claims.role === role;
    } catch { return false; }
}
function validateStorageContainer(storage, db, { requireRunning = true } = {}) {
    refuse(storage?.Name === `/supabase_storage_${project}` && typeof storage.Id === 'string' && storage.Id.length > 0);
    refuse(!requireRunning || storage.State?.Running === true);
    refuse(storage.Config?.Image === 'public.ecr.aws/supabase/storage-api:v1.84.19'
        && storage.Config.Labels?.['com.supabase.cli.project'] === project);
    refuse(localNetwork(storage) === localNetwork(db));
    for (const bindings of [storage.HostConfig?.PortBindings, storage.NetworkSettings?.Ports]) {
        refuse(bindings && Array.isArray(bindings['5000/tcp']) && bindings['5000/tcp'].length === 1);
        const binding = bindings['5000/tcp'][0];
        refuse(binding.HostIp === '127.0.0.1' && binding.HostPort === '58323');
        for (const [port, entries] of Object.entries(bindings)) {
            refuse(port === '5000/tcp' || entries === null || (Array.isArray(entries) && entries.length === 0));
        }
    }
    refuse(Array.isArray(storage.Mounts) && storage.Mounts.length === 1);
    const mount = storage.Mounts[0];
    refuse(mount.Type === 'volume' && mount.Name === `supabase_storage_${project}` && mount.Destination === '/mnt');
    const database = environment(db);
    const config = environment(storage);
    refuse(typeof database.POSTGRES_PASSWORD === 'string' && database.POSTGRES_PASSWORD.length > 0
        && typeof database.JWT_SECRET === 'string' && database.JWT_SECRET.length > 0);
    refuse(config.STORAGE_BACKEND === 'file' && config.FILE_STORAGE_BACKEND_PATH === '/mnt'
        && config.TENANT_ID === 'stub' && config.DB_MIGRATIONS_FREEZE_AT === 'unlock-object-versioning');
    let uri;
    try { uri = new URL(config.DATABASE_URL); } catch { refuse(false); }
    let credential;
    try { credential = decodeURIComponent(uri.password); } catch { refuse(false); }
    refuse(['postgres:', 'postgresql:'].includes(uri.protocol) && uri.username === 'supabase_storage_admin'
        && uri.hostname === `supabase_db_${project}` && uri.port === '5432' && uri.pathname === '/postgres'
        && !uri.search && !uri.hash && credential === database.POSTGRES_PASSWORD);
    refuse(config.AUTH_JWT_SECRET === database.JWT_SECRET && validJwks(config.JWT_JWKS, database.JWT_SECRET));
    refuse(validRoleToken(config.SERVICE_KEY, database.JWT_SECRET, 'service_role')
        && validRoleToken(config.ANON_KEY, database.JWT_SECRET, 'anon'));
    return { apiUrl: 'http://127.0.0.1:58323', containerId: storage.Id };
}
function inspectStorageStack() {
    let items;
    try {
        items = JSON.parse(execFileSync('docker', ['inspect', `supabase_db_${project}`, `supabase_storage_${project}`],
            { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 10000 }));
    } catch { refuse(false); }
    refuse(Array.isArray(items) && items.length === 2);
    return validateStorageContainer(items[1], items[0]);
}
module.exports = { validateStorageContainer, inspectStorageStack };
