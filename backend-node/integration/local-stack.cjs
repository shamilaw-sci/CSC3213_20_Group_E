// Test tooling only. Never reads application .env or accepts caller URLs.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '../..');
const project = 'thirasara-phase4-c';
const network = 'thirasara-phase4-local';
const versions = ['20261030045356', '20261030045416'];
const refuse = condition => assert.ok(condition, 'Isolated test environment refused; check local prerequisites.');
const environment = item => Object.fromEntries(item.Config.Env.map(entry => {
    const index = entry.indexOf('=');
    return [entry.slice(0, index), entry.slice(index + 1)];
}));

function acceptsLocalSigningSecret(configured, secret) {
    if (configured === secret) return true;
    try {
        const jwks = JSON.parse(configured);
        return jwks.keys?.some(key => key.kty === 'oct' && typeof key.k === 'string'
            && Buffer.from(key.k, 'base64url').equals(Buffer.from(secret))) === true;
    } catch { return false; }
}

function validateWorkdir(config, linked) {
    refuse(!linked && /^project_id = "thirasara-phase4-c"\r?$/m.test(config));
}

function validateContainers(items) {
    refuse(Array.isArray(items) && items.length === 2);
    for (const [index, kind, target, published, image] of [
        [0, 'db', '5432/tcp', '58322', /^public\.ecr\.aws\/supabase\/postgres:17\.11\.0\.006$/],
        [1, 'rest', '3000/tcp', '58321', /^public\.ecr\.aws\/supabase\/postgrest:v16\.5$/],
    ]) {
        const item = items[index];
        refuse(item?.Name === `/supabase_${kind}_${project}` && item.State?.Running === true);
        refuse(image.test(item.Config?.Image) && item.Config.Labels?.['com.supabase.cli.project'] === project);
        const networks = item.NetworkSettings?.Networks || {};
        refuse(Object.keys(networks).length === 1 && !!networks[network]?.NetworkID);
        for (const bindings of [item.HostConfig?.PortBindings, item.NetworkSettings?.Ports]) {
            refuse(bindings && bindings[target]?.length === 1);
            refuse(bindings[target][0].HostIp === '127.0.0.1' && bindings[target][0].HostPort === published);
            for (const entries of Object.values(bindings)) {
                for (const binding of entries || []) refuse(binding.HostIp === '127.0.0.1');
            }
        }
    }
    refuse(items[0].NetworkSettings.Networks[network].NetworkID === items[1].NetworkSettings.Networks[network].NetworkID);
    const db = environment(items[0]);
    const rest = environment(items[1]);
    refuse(!!db.POSTGRES_PASSWORD && !!db.JWT_SECRET && acceptsLocalSigningSecret(rest.PGRST_JWT_SECRET, db.JWT_SECRET));
    let uri;
    try { uri = new URL(rest.PGRST_DB_URI); } catch { refuse(false); }
    refuse(['postgres:', 'postgresql:'].includes(uri.protocol) && uri.hostname === `supabase_db_${project}`
        && uri.port === '5432' && uri.pathname === '/postgres' && uri.username === 'authenticator'
        && decodeURIComponent(uri.password) === db.POSTGRES_PASSWORD && !uri.search && !uri.hash);
    return {
        apiUrl: 'http://127.0.0.1:58321', jwtSecret: db.JWT_SECRET,
        database: { host: '127.0.0.1', port: 58322, database: 'postgres', user: 'postgres',
            password: db.POSTGRES_PASSWORD, ssl: false, connectionTimeoutMillis: 5000 },
    };
}

function validateDatabase(identity) {
    refuse(identity.database === 'postgres' && identity.user === 'postgres' && identity.major === 17 && identity.marker === true);
    refuse(JSON.stringify(identity.versions) === JSON.stringify(versions));
}

const identitySql = `SELECT current_database() AS database, current_user AS user,
    current_setting('server_version_num')::integer / 10000 AS major,
    EXISTS (SELECT 1 FROM pg_namespace WHERE nspname='phase4_isolated_test_guard'
        AND pg_get_userbyid(nspowner)='postgres') AS marker,
    (SELECT json_agg(version ORDER BY version) FROM supabase_migrations.schema_migrations) AS versions`;

function inspectLocalStack() {
    const workdir = path.join(root, 'docs/evidence/phase4-local/stack-c/supabase');
    validateWorkdir(fs.readFileSync(path.join(workdir, 'config.toml'), 'utf8'), fs.existsSync(path.join(workdir, '.temp/project-ref')));
    execFileSync(process.execPath, [path.join(root, 'tools/database/verify-migrations.cjs')], { stdio: 'pipe' });
    const items = JSON.parse(execFileSync('docker', ['inspect', `supabase_db_${project}`, `supabase_rest_${project}`],
        { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 10000 }));
    return validateContainers(items);
}

module.exports = { validateContainers, validateDatabase, validateWorkdir, inspectLocalStack, identitySql };
