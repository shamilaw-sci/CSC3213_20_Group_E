const { makeLifecycle, hashState } = require('../integration/checkout-browser-lifecycle.cjs');
test('recovery hashes detect table drift without retaining row contents', () => {
    const hashes = hashState({ users: [{ id: 'private-id' }], platform_settings: [] });
    expect(hashes.users).toMatch(/^[a-f0-9]{64}$/);
    expect(JSON.stringify(hashes)).not.toContain('private-id');
    expect(hashState({ users: [{ id: 'changed' }], platform_settings: [] })).not.toEqual(hashes);
    expect(hashState({ users: [{ id: 'private-id' }], platform_settings: [] })).toEqual(hashes);
});
test('all shutdown callers await one cleanup after startup settles', async () => {
    let finish;
    const pending = new Promise(resolve => { finish = resolve; });
    const cleanup = jest.fn().mockResolvedValue();
    const life = makeLifecycle(cleanup); life.setStartup(pending);
    const first = life.stop(), second = life.stop();
    expect(first).toBe(second); expect(life.stopping).toBe(true);
    expect(() => life.assertActive()).toThrow(/stopping/);
    expect(cleanup).not.toHaveBeenCalled(); finish();
    await Promise.all([first, second]); expect(cleanup).toHaveBeenCalledTimes(1);
    expect(life.stop()).toBe(first);
});
test('startup failure still permits one complete cleanup', async () => {
    const cleanup = jest.fn().mockResolvedValue(); const life = makeLifecycle(cleanup);
    expect(() => life.assertActive()).not.toThrow();
    life.setStartup(Promise.reject(new Error('Fixture startup failure')));
    await life.stop(); expect(cleanup).toHaveBeenCalledTimes(1);
});
