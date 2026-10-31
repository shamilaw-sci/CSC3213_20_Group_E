const { validateContainers, validateDatabase, validateWorkdir } = require('../integration/local-stack.cjs');

const container = (kind, port) => ({
    Name: `/supabase_${kind}_thirasara-phase4-c`,
    State: { Running: true },
    Config: {
        Image: `public.ecr.aws/supabase/${kind === 'db' ? 'postgres:17.11.0.006' : 'postgrest:v16.5'}`,
        Labels: { 'com.supabase.cli.project': 'thirasara-phase4-c' },
        Env: kind === 'db' ? ['POSTGRES_PASSWORD=local-only', 'JWT_SECRET=local-test-secret'] : [
            'PGRST_DB_URI=postgres://authenticator:local-only@supabase_db_thirasara-phase4-c:5432/postgres',
            'PGRST_JWT_SECRET=local-test-secret',
        ],
    },
    HostConfig: { PortBindings: { [`${kind === 'db' ? 5432 : 3000}/tcp`]: [{ HostIp: '127.0.0.1', HostPort: port }] } },
    NetworkSettings: {
        Networks: { 'thirasara-phase4-local': { NetworkID: 'isolated-network' } },
        Ports: { [`${kind === 'db' ? 5432 : 3000}/tcp`]: [{ HostIp: '127.0.0.1', HostPort: port }] },
    },
});
const pair = () => [container('db', '58322'), container('rest', '58321')];
const identity = () => ({ database: 'postgres', user: 'postgres', major: 17, marker: true,
    versions: ['20261030045356', '20261030045416'] });

describe('Phase 5 isolated stack guards (no Docker or database access)', () => {
    test('accepts only the recorded isolated stack-c endpoints', () => {
        const result = validateContainers(pair());
        expect(result.apiUrl).toBe('http://127.0.0.1:58321');
        expect(result.database.port).toBe(58322);
    });
    test('accepts the local signing secret represented by the retained PostgREST JWKS', () => {
        const snapshots = pair();
        snapshots[1].Config.Env[1] = 'PGRST_JWT_SECRET=' + JSON.stringify({ keys: [
            { kty: 'EC', alg: 'ES256', kid: 'public-key' },
            { kty: 'oct', k: Buffer.from('local-test-secret').toString('base64url') },
        ] });
        expect(() => validateContainers(snapshots)).not.toThrow();
    });

    test.each([
        ['unexpected name', p => { p[0].Name = '/production'; }],
        ['unexpected project', p => { p[1].Config.Labels['com.supabase.cli.project'] = 'other'; }],
        ['unexpected image', p => { p[0].Config.Image = 'unknown/postgres:latest'; }],
        ['stopped container', p => { p[0].State.Running = false; }],
        ['public port binding', p => { p[1].HostConfig.PortBindings['3000/tcp'][0].HostIp = '0.0.0.0'; }],
        ['runtime public binding', p => { p[0].NetworkSettings.Ports['5432/tcp'][0].HostIp = '::'; }],
        ['wrong port', p => { p[1].HostConfig.PortBindings['3000/tcp'][0].HostPort = '5000'; }],
        ['missing REST port', p => { p[1].NetworkSettings.Ports = {}; }],
        ['extra public binding', p => { p[0].HostConfig.PortBindings['9999/tcp'] = [{ HostIp: '0.0.0.0', HostPort: '9999' }]; }],
        ['different network', p => { p[1].NetworkSettings.Networks['thirasara-phase4-local'].NetworkID = 'other'; }],
        ['extra network', p => { p[1].NetworkSettings.Networks.bridge = {}; }],
        ['hosted database routing', p => { p[1].Config.Env[0] = 'PGRST_DB_URI=postgres://authenticator:p@hosted.example/postgres'; }],
        ['wrong database name', p => { p[1].Config.Env[0] = p[1].Config.Env[0].replace('/postgres', '/other'); }],
        ['mismatched JWT secret', p => { p[1].Config.Env[1] = 'PGRST_JWT_SECRET=other'; }],
        ['mismatched JWKS', p => { p[1].Config.Env[1] = 'PGRST_JWT_SECRET={"keys":[{"kty":"oct","k":"b3RoZXI"}]}'; }],
        ['invalid JWKS', p => { p[1].Config.Env[1] = 'PGRST_JWT_SECRET={"keys":null}'; }],
        ['missing credential', p => { p[0].Config.Env = ['JWT_SECRET=local-test-secret']; }],
    ])('rejects %s before connections or fixture writes', (_label, mutate) => {
        const snapshots = pair();
        mutate(snapshots);
        expect(() => validateContainers(snapshots)).toThrow(/isolated/i);
    });

    test('accepts exact unlinked CLI project configuration', () => {
        expect(() => validateWorkdir('project_id = "thirasara-phase4-c"\n', false)).not.toThrow();
    });
    test.each([
        ['project_id = "live"', false],
        ['project_id = "thirasara-phase4-c"', true],
    ])('rejects wrong or remote-linked workdir', (config, linked) => {
        expect(() => validateWorkdir(config, linked)).toThrow(/isolated/i);
    });
    test('accepts exact marker and two-version ledger', () => {
        expect(() => validateDatabase(identity())).not.toThrow();
    });
    test.each([
        { marker: false }, { database: 'live' }, { user: 'authenticator' }, { major: 16 },
        { versions: [] }, { versions: ['20261030045356', '20261030045416', 'extra'] },
    ])('rejects unexpected database identity %j', change => {
        expect(() => validateDatabase({ ...identity(), ...change })).toThrow(/isolated/i);
    });
});
