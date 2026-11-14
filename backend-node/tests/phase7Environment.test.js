const { validateContainers, validateNetwork, validateIdentity, constants } = require('../integration/phase7/environment.cjs');
const clone = value => JSON.parse(JSON.stringify(value));
const state = { project: 'thirasara-phase7-acceptance', nonce: '11111111-1111-4111-8111-111111111111',
    volume: 'thirasara-phase7-acceptance-11111111-1111-4111-8111-111111111111',
    password: 'a'.repeat(64), jwtSecret: 'b'.repeat(64), dbImageId: `sha256:${'c'.repeat(64)}`, restImageId: `sha256:${'d'.repeat(64)}` };
const labels = { 'com.supabase.cli.project': state.project, 'thirasara.phase7.nonce': state.nonce };
function item(kind, port, image, imageId) {
    const target = kind === 'db' ? '5432/tcp' : '3000/tcp';
    const ports = { [target]: [{ HostIp: '127.0.0.1', HostPort: port }] };
    return { Name: `/supabase_${kind}_${state.project}`, State: { Running: true }, Image: imageId,
        Config: { Image: image, Labels: labels, Env: kind === 'db' ? [`POSTGRES_PASSWORD=${state.password}`, `JWT_SECRET=${state.jwtSecret}`]
            : [`PGRST_JWT_SECRET=${state.jwtSecret}`, `PGRST_DB_URI=postgresql://authenticator:${state.password}@supabase_db_${state.project}:5432/postgres`] },
        HostConfig: { PortBindings: ports, Privileged: false }, Mounts: kind === 'db'
            ? [{ Type: 'volume', Name: state.volume, Destination: '/var/lib/postgresql/data' }] : [],
        NetworkSettings: { Ports: ports, Networks: { 'thirasara-phase7-acceptance-loopback': { NetworkID: 'same-network' } } } };
}
const fixtures = () => [item('db', '59322', constants.dbImage, state.dbImageId), item('rest', '59321', constants.restImage, state.restImageId)];
test('accepts exact separately identified pair', () => expect(() => validateContainers(fixtures(), state)).not.toThrow());
test.each([
    x => { x[0].Name = '/supabase_db_thirasara-phase4-c'; },
    x => { x[0].State.Running = false; },
    x => { x[1].Config.Image = 'unexpected'; },
    x => { x[0].Image = `sha256:${'e'.repeat(64)}`; },
    x => { x[0].HostConfig.PortBindings['5432/tcp'][0].HostIp = '0.0.0.0'; },
    x => { x[1].NetworkSettings.Ports['3000/tcp'][0].HostPort = '58321'; },
    x => { x[0].Mounts[0].Name = 'supabase_db_thirasara-phase4-c'; },
    x => { x[0].Mounts.push({ Type: 'bind', Source: 'private', Destination: '/etc/config' }); },
    x => { x[1].NetworkSettings.Networks.other = { NetworkID: 'other' }; },
    x => { x[1].NetworkSettings.Networks['thirasara-phase7-acceptance-loopback'].NetworkID = 'wrong'; },
    x => { x[0].Config.Labels = {}; },
    x => { x[0].HostConfig.Privileged = true; },
    x => { x[0].HostConfig.PortBindings['9000/tcp'] = [{ HostIp: '127.0.0.1', HostPort: '9000' }]; },
    x => { x[1].Config.Env[1] = 'PGRST_DB_URI=postgresql://authenticator:secret@hosted.example/postgres'; },
    x => { x[0].Config.Env[0] = 'POSTGRES_PASSWORD=other'; },
])('refuses unsafe identity/config %#', mutate => {
    const data = clone(fixtures()); mutate(data); expect(() => validateContainers(data, state)).toThrow();
});
test.each([{}, { ...state, project: 'other' }, { ...state, nonce: 'invalid' }, { ...state, password: 'short' },
    { ...state, volume: 'existing' }])('refuses private-state drift %#', value => expect(() => validateContainers(fixtures(), value)).toThrow());
test('requires approved labelled loopback bridge network', () => {
    const network = { Name: 'thirasara-phase7-acceptance-loopback', Internal: false, Driver: 'bridge',
        Options: { 'com.docker.network.bridge.host_binding_ipv4': '127.0.0.1' }, Labels: labels };
    expect(() => validateNetwork(network, state)).not.toThrow();
    expect(() => validateNetwork({ ...network, Internal: true }, state)).toThrow();
});
test('requires new database marker and exact canonical ledger, not stack-c', () => {
    const identity = { database: 'postgres', user: 'postgres', major: 17, nonce: state.nonce,
        stage: 'ready', versions: ['20261030045356', '20261030045416'] };
    expect(() => validateIdentity(identity, state)).not.toThrow();
    for (const delta of [{ nonce: null }, { stage: 'initializing' }, { major: 16 }, { versions: [] }, { user: 'supabase_admin' }]) {
        expect(() => validateIdentity({ ...identity, ...delta }, state)).toThrow();
    }
});

test('ready replay rechecks current ledger and patch hash rather than trusting persisted marker', async () => {
    const { verifyReady } = require('../integration/phase7/environment.cjs');
    const identity = { database: 'postgres', user: 'postgres', major: 17, nonce: state.nonce,
        stage: 'ready', versions: ['20261030045356', '20261030045416'], patch_sha: 'expected' };
    const client = { query: jest.fn().mockResolvedValue({ rows: [identity] }) };
    await expect(verifyReady(client, state, 'expected')).resolves.toBeUndefined();
    client.query.mockResolvedValue({ rows: [{ ...identity, versions: [] }] });
    await expect(verifyReady(client, state, 'expected')).rejects.toThrow();
    client.query.mockResolvedValue({ rows: [{ ...identity, patch_sha: 'drift' }] });
    await expect(verifyReady(client, state, 'expected')).rejects.toThrow();
});
test('stopped config is validated before restart, without pretending runtime bindings exist', () => {
    const { validateStoppedItem } = require('../integration/phase7/environment.cjs');
    const item = clone(fixtures()[1]); item.State.Running = false; item.NetworkSettings.Ports = {};
    item.NetworkSettings.Networks[constants.network].NetworkID = '';
    expect(() => validateStoppedItem(item,state,'rest')).not.toThrow();
    item.HostConfig.Privileged = true;
    expect(() => validateStoppedItem(item,state,'rest')).toThrow();
    item.HostConfig.Privileged = false; item.HostConfig.PortBindings['3000/tcp'][0].HostIp = '0.0.0.0';
    expect(() => validateStoppedItem(item,state,'rest')).toThrow();
});
test('dedicated child transport refuses retained/hosted endpoints and permits only registered listener', () => {
    const { allowSocket, directRestUrl } = require('../integration/phase7/network.cjs');
    expect(allowSocket([{host:'127.0.0.1',port:59322}])).toBe(true);
    for(const value of [{host:'127.0.0.1',port:58321},{host:'localhost',port:59321},
        {host:'hosted.example',port:443},{host:'127.0.0.1',port:25},{host:'127.0.0.1',port:5000}])expect(allowSocket([value])).toBe(false);
    expect(allowSocket([{host:'127.0.0.1',port:33333}],new Set([33333]))).toBe(true);
    expect(directRestUrl('http://127.0.0.1:59321/rest/v1/users').pathname).toBe('/users');
    for(const url of ['http://127.0.0.1:58321/rest/v1/users','https://hosted.example/rest/v1/users',
        'http://user:pass@127.0.0.1:59321/rest/v1/users','http://127.0.0.1:59321/users'])expect(()=>directRestUrl(url)).toThrow();
});
