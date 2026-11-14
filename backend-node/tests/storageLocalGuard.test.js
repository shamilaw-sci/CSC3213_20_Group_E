const jwt = require('jsonwebtoken');
const { validateStorageContainer } = require('../integration/storage-local.cjs');

const project = 'thirasara-phase4-c';
const network = 'thirasara-phase4-local';
const secret = 'synthetic-local-only-jwt-secret-for-guard-tests';
const password = 'synthetic-db-password';
const env = values => Object.entries(values).map(([key, value]) => `${key}=${value}`);
function fixture() {
    const db = { Config: { Env: env({ POSTGRES_PASSWORD: password, JWT_SECRET: secret }) },
        NetworkSettings: { Networks: { [network]: { NetworkID: 'local-network-id' } } } };
    const storage = {
        Id: 'synthetic-storage-id', Name: `/supabase_storage_${project}`, State: { Running: true },
        Config: { Image: 'public.ecr.aws/supabase/storage-api:v1.84.19',
            Labels: { 'com.supabase.cli.project': project }, Env: env({
                STORAGE_BACKEND: 'file', FILE_STORAGE_BACKEND_PATH: '/mnt', TENANT_ID: 'stub',
                DB_MIGRATIONS_FREEZE_AT: 'unlock-object-versioning',
                DATABASE_URL: `postgresql://supabase_storage_admin:${password}@supabase_db_${project}:5432/postgres`,
                AUTH_JWT_SECRET: secret,
                JWT_JWKS: JSON.stringify({ keys: [{ kty: 'oct', k: Buffer.from(secret).toString('base64url') }] }),
                SERVICE_KEY: jwt.sign({ role: 'service_role' }, secret, { algorithm: 'HS256' }),
                ANON_KEY: jwt.sign({ role: 'anon' }, secret, { algorithm: 'HS256' }),
            }) },
        HostConfig: { PortBindings: { '5000/tcp': [{ HostIp: '127.0.0.1', HostPort: '58323' }] } },
        NetworkSettings: { Networks: { [network]: { NetworkID: 'local-network-id' } },
            Ports: { '5000/tcp': [{ HostIp: '127.0.0.1', HostPort: '58323' }] } },
        Mounts: [{ Type: 'volume', Name: `supabase_storage_${project}`, Destination: '/mnt' }],
    };
    return { storage, db };
}
function setEnv(storage, key, value) {
    storage.Config.Env = storage.Config.Env.filter(entry => !entry.startsWith(`${key}=`));
    if (value !== undefined) storage.Config.Env.push(`${key}=${value}`);
}

describe('Retained local Storage identity guard without network calls', () => {
    test('returns only safe manifest identity for the exact retained instance', () => {
        const { storage, db } = fixture();
        expect(validateStorageContainer(storage, db)).toEqual({
            apiUrl: 'http://127.0.0.1:58323', containerId: 'synthetic-storage-id',
        });
    });
    test('stopped inspection requires explicit opt out of runtime check', () => {
        const { storage, db } = fixture();
        storage.State.Running = false;
        expect(() => validateStorageContainer(storage, db)).toThrow(/refused/);
        expect(validateStorageContainer(storage, db, { requireRunning: false }).containerId).toBe(storage.Id);
    });
    test('also accepts the explicit postgres URL scheme', () => {
        const { storage, db } = fixture();
        setEnv(storage, 'DATABASE_URL', `postgres://supabase_storage_admin:${password}@supabase_db_${project}:5432/postgres`);
        expect(validateStorageContainer(storage, db).containerId).toBe(storage.Id);
    });
    test('accepts retained mixed public EC and locally proven oct JWKS', () => {
        const { storage, db } = fixture();
        setEnv(storage, 'JWT_JWKS', JSON.stringify({ keys: [
            { kty: 'EC', alg: 'ES256', crv: 'P-256', x: 'public-x', y: 'public-y' },
            { kty: 'oct', k: Buffer.from(secret).toString('base64url') },
        ] }));
        expect(validateStorageContainer(storage, db).containerId).toBe(storage.Id);
    });
    test.each(['POSTGRES_PASSWORD', 'JWT_SECRET'])('requires DB credential provenance %s', key => {
        const { storage, db } = fixture();
        db.Config.Env = db.Config.Env.filter(entry => !entry.startsWith(`${key}=`));
        expect(() => validateStorageContainer(storage, db)).toThrow(/refused/);
    });
    test('rejects duplicate environment keys instead of selecting an ambiguous secret', () => {
        const { storage, db } = fixture();
        storage.Config.Env.push(`AUTH_JWT_SECRET=${secret}`);
        expect(() => validateStorageContainer(storage, db)).toThrow(/refused/);
    });
    test.each([
        ['name', s => { s.Name = '/another-storage'; }],
        ['image', s => { s.Config.Image = 'public.ecr.aws/supabase/storage-api:latest'; }],
        ['label', s => { s.Config.Labels['com.supabase.cli.project'] = 'other'; }],
        ['missing ID', s => { delete s.Id; }],
        ['different network', s => { s.NetworkSettings.Networks[network].NetworkID = 'other'; }],
        ['extra network', s => { s.NetworkSettings.Networks.other = { NetworkID: 'other' }; }],
        ['configured public binding', s => { s.HostConfig.PortBindings['5000/tcp'][0].HostIp = '0.0.0.0'; }],
        ['actual public binding', s => { s.NetworkSettings.Ports['5000/tcp'][0].HostIp = '::'; }],
        ['wrong published port', s => { s.NetworkSettings.Ports['5000/tcp'][0].HostPort = '5000'; }],
        ['extra binding', s => { s.HostConfig.PortBindings['5000/tcp'].push({ HostIp: '127.0.0.1', HostPort: '58324' }); }],
        ['extra public port', s => { s.NetworkSettings.Ports['9000/tcp'] = [{ HostIp: '0.0.0.0', HostPort: '9000' }]; }],
        ['wrong volume', s => { s.Mounts[0].Name = 'other'; }],
        ['bind mount', s => { s.Mounts[0].Type = 'bind'; }],
        ['wrong mount path', s => { s.Mounts[0].Destination = '/other'; }],
        ['extra mount', s => { s.Mounts.push({ Type: 'volume', Name: 'other', Destination: '/elsewhere' }); }],
    ])('rejects changed %s', (_label, mutate) => {
        const { storage, db } = fixture();
        mutate(storage);
        expect(() => validateStorageContainer(storage, db)).toThrow(/refused/);
    });
    test.each([
        ['STORAGE_BACKEND', 's3'], ['FILE_STORAGE_BACKEND_PATH', '/tmp'], ['TENANT_ID', 'other'],
        ['DB_MIGRATIONS_FREEZE_AT', 'other'], ['AUTH_JWT_SECRET', 'different'],
        ['JWT_JWKS', '{}'], ['JWT_JWKS', 'not-json'],
        ['JWT_JWKS', JSON.stringify({ keys: [{ kty: 'oct', k: Buffer.from('other').toString('base64url') }] })],
        ['JWT_JWKS', JSON.stringify({ keys: [
            { kty: 'oct', k: Buffer.from(secret).toString('base64url') },
            { kty: 'oct', k: Buffer.from('other').toString('base64url') },
        ] })],
        ...[
            { kty: 'EC', alg: 'ES256', crv: 'P-256', x: 'x', y: 'y', d: 'private' },
            { kty: 'EC', alg: 'ES384', crv: 'P-256', x: 'x', y: 'y' },
            { kty: 'RSA', alg: 'RS256', n: 'n', e: 'AQAB' },
        ].map(key => ['JWT_JWKS', JSON.stringify({ keys: [
            { kty: 'oct', k: Buffer.from(secret).toString('base64url') }, key,
        ] })]),
        ['JWT_JWKS', JSON.stringify({ keys: [{ kty: 'EC', alg: 'ES256', crv: 'P-256', x: 'x', y: 'y' }] })],
        ['SERVICE_KEY', jwt.sign({ role: 'anon' }, secret)],
        ['SERVICE_KEY', jwt.sign({ role: 'service_role' }, 'wrong-secret')],
        ['ANON_KEY', jwt.sign({ role: 'anon' }, secret, { algorithm: 'HS384' })],
        ['ANON_KEY', undefined],
        ['DATABASE_URL', `postgres://supabase_storage_admin:wrong@supabase_db_${project}:5432/postgres`],
        ['DATABASE_URL', `postgres://postgres:${password}@supabase_db_${project}:5432/postgres`],
        ['DATABASE_URL', `postgres://supabase_storage_admin:${password}@hosted.example:5432/postgres`],
        ['DATABASE_URL', `postgres://supabase_storage_admin:${password}@supabase_db_${project}:5432/postgres?sslmode=require`],
    ])('rejects changed %s configuration', (key, value) => {
        const { storage, db } = fixture();
        setEnv(storage, key, value);
        expect(() => validateStorageContainer(storage, db)).toThrow(/refused/);
    });
    test('refusal errors do not expose credentials', () => {
        const { storage, db } = fixture();
        setEnv(storage, 'DATABASE_URL', `postgres://${password}@invalid`);
        try { validateStorageContainer(storage, db); throw new Error('Expected refusal'); }
        catch (error) {
            expect(error.message).toMatch(/refused/);
            expect(error.message).not.toContain(password);
            expect(error.message).not.toContain(secret);
        }
    });
});
