const { directStorageUrl, storageFetch, injectSecondUploadFailure, clearStorageFault } = require('../integration/storage-network.cjs');
test('maps only checked Storage route to its direct loopback port', () => {
    expect(directStorageUrl('http://127.0.0.1:58321/storage/v1/object/public/properties/fixture.png').href)
        .toBe('http://127.0.0.1:58323/object/public/properties/fixture.png');
});
test.each(['https://hosted.example/storage/v1/object', 'http://127.0.0.1:5000/storage/v1/object',
    'http://127.0.0.1:58321/rest/v1/users', 'http://user@127.0.0.1:58321/storage/v1/object',
    'http://127.0.0.1:58321/storage/v1/../../auth'])('rejects %s', url => {
    expect(() => directStorageUrl(url)).toThrow(/refused/);
});
test('keeps ordinary REST at the prior restricted transport', async () => {
    const real = jest.fn(), fallback = jest.fn().mockResolvedValue('rest');
    expect(await storageFetch(real, fallback)('http://127.0.0.1:58321/rest/v1/users')).toBe('rest');
    expect(real).not.toHaveBeenCalled();
});
test('fault injection refuses arbitrary prefixes', () => {
    expect(() => injectSecondUploadFailure('other/path')).toThrow(/synthetic owner/);
    clearStorageFault();
});

const { observeSuccessfulUploads, clearUploadObserver, storageFaultEvidence } = require('../integration/storage-network.cjs');
const owner = '11111111-1111-4111-8111-111111111111';
const target = name => `http://127.0.0.1:58321/storage/v1/object/properties/${owner}/${name}.png`;
afterEach(() => { clearStorageFault(); clearUploadObserver(); });

test('observer completes after actual success and before response or second injected failure', async () => {
    let release;
    const proof = new Promise(resolve => { release = resolve; });
    const observed = [];
    observeSuccessfulUploads(owner, async transfer => { await proof; observed.push(transfer.path); });
    injectSecondUploadFailure(owner);
    const real = jest.fn().mockResolvedValue(new Response('{}', { status: 200 }));
    const transport = storageFetch(real, jest.fn());
    let firstReturned = false, secondReturned = false;
    const first = transport(target('first'), { method: 'POST' }).then(response => { firstReturned = true; return response; });
    const second = transport(target('second'), { method: 'POST' }).then(response => { secondReturned = true; return response; });
    await Promise.resolve();
    expect(firstReturned).toBe(false); expect(secondReturned).toBe(false);
    expect(storageFaultEvidence().injectedPaths).toEqual([]);
    release();
    expect((await first).status).toBe(200);
    expect((await second).status).toBe(500);
    expect(real).toHaveBeenCalledTimes(1);
    expect(observed).toEqual([`${owner}/first.png`]);
    expect(storageFaultEvidence()).toEqual({ owner, attempts: 2, firstPath: `${owner}/first.png`,
        firstSucceeded: true, injectedPaths: [`${owner}/second.png`] });
});

test.each(['non2xx', 'throw', 'observer failure'])('first %s never qualifies as the partial-transfer fault', async kind => {
    const observed = jest.fn(async () => { if (kind === 'observer failure') throw new Error('proof failed'); });
    observeSuccessfulUploads(owner, observed);
    injectSecondUploadFailure(owner);
    const real = kind === 'throw' ? jest.fn().mockRejectedValue(new Error('real transfer failed'))
        : jest.fn().mockResolvedValue(new Response('{}', { status: kind === 'non2xx' ? 500 : 200 }));
    const transport = storageFetch(real, jest.fn());
    const first = transport(target('first'), { method: 'POST' });
    const firstCheck = kind === 'non2xx' ? expect(first).resolves.toHaveProperty('status', 500) : expect(first).rejects.toThrow();
    const secondCheck = expect(transport(target('second'), { method: 'POST' })).rejects.toThrow(/not injected/);
    await Promise.all([firstCheck, secondCheck]);
    expect(storageFaultEvidence().firstSucceeded).toBe(false);
    expect(storageFaultEvidence().injectedPaths).toEqual([]);
    if (kind !== 'observer failure') expect(observed).not.toHaveBeenCalled();
});

test('observer is limited to its exact owner and successful POST uploads', async () => {
    const observed = jest.fn();
    observeSuccessfulUploads(owner, observed);
    const real = jest.fn().mockResolvedValue(new Response('{}', { status: 200 }));
    const transport = storageFetch(real, jest.fn());
    await transport(target('first'), { method: 'GET' });
    await transport(target('first').replace(owner, '22222222-2222-4222-8222-222222222222'), { method: 'POST' });
    expect(observed).not.toHaveBeenCalled();
});
