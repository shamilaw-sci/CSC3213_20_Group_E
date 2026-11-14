const { cleanupPropertyImages, managedPropertyPath } = require('../utils/propertyImageCleanup');
const origin = 'https://local-project.supabase.co';
const owner = '11111111-1111-4111-8111-111111111111';
const other = '22222222-2222-4222-8222-222222222222';
const path = `${owner}/photo.png`;
const url = name => `${origin}/storage/v1/object/public/properties/${owner}/${name}`;
const listing = extra => ({ id: '33333333-3333-4333-8333-333333333333', seller_id: owner, images: [url('photo.png')], virtual_tours: [], ...extra });
function harness(pages = [[]]) {
    const remove = jest.fn().mockResolvedValue({ data: [], error: null });
    const range = jest.fn();
    pages.forEach(data => range.mockResolvedValueOnce({ data, error: null }));
    const order = jest.fn(() => ({ range }));
    const select = jest.fn(() => ({ order }));
    const storageFrom = jest.fn(() => ({ remove }));
    const client = { from: jest.fn(() => ({ select })), storage: { from: storageFrom } };
    const logger = { warn: jest.fn(), error: jest.fn() };
    const clean = row => cleanupPropertyImages(client, row, { supabaseUrl: origin, logger, pageSize: 2 });
    return { client, remove, range, order, select, logger, clean };
}

test('accepts only exact configured public properties owner paths', () => {
    expect(managedPropertyPath(url('photo.png'), owner, origin)).toBe(path);
    expect(managedPropertyPath(url('room%20one.png'), owner, origin)).toBe(`${owner}/room one.png`);
});
test.each([
    'https://foreign.example/storage/v1/object/public/properties/OWNER/photo.png',
    `${origin}/storage/v1/object/public/properties/${other}/photo.png`,
    `${origin}/storage/v1/object/sign/properties/OWNER/photo.png?token=credential`,
    `${origin}/storage/v1/object/public/other/OWNER/photo.png`,
    `https://credential@local-project.supabase.co/storage/v1/object/public/properties/OWNER/photo.png`,
    `${origin}/storage/v1/object/public/properties/OWNER/../photo.png`,
    `${origin}/storage/v1/object/public/properties/OWNER/%2e%2e/photo.png`,
    `${origin}/storage/v1/object/public/properties/OWNER/%252e%252e/photo.png`,
    `${origin}/storage/v1/object/public/properties/OWNER/a%2f..%2fphoto.png`,
    `${origin}/storage/v1/object/public/properties/OWNER/a%5cphoto.png`,
    `${origin}/storage/v1/object/public/properties/OWNER/%zz.png`,
    `${origin}/storage/v1/object/public/properties/OWNER/%00.png`,
    `${origin}/storage/v1/object/public/properties/OWNER/photo.png?token=secret`,
    `${origin}/storage/v1/object/public/properties/OWNER/photo.png#fragment`,
    'not-a-url', null, {},
])('rejects unmanaged or malformed path %j', value => {
    expect(managedPropertyPath(typeof value === 'string' ? value.replaceAll('OWNER', owner) : value, owner, origin)).toBeNull();
});
test('rejects malformed owner and configured credentials', () => {
    expect(managedPropertyPath(url('photo.png'), 'wrong', origin)).toBeNull();
    expect(managedPropertyPath(url('photo.png'), owner, 'https://user@local-project.supabase.co')).toBeNull();
});
test('empty and unmanaged-only records do not query or remove', async () => {
    const h = harness();
    await h.clean(listing({ images: [], virtual_tours: null }));
    await h.clean(listing({ images: ['https://foreign.example/private?secret=x'], virtual_tours: [{ url: 42 }] }));
    expect(h.client.from).not.toHaveBeenCalled(); expect(h.remove).not.toHaveBeenCalled();
    expect(h.logger.warn).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ skippedReferenceCount: 2 }));
    expect(JSON.stringify(h.logger.warn.mock.calls)).not.toContain('secret');
});
test('deduplicates photos and tours and awaits removal', async () => {
    const h = harness();
    let finish;
    h.remove.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
    let completed = false;
    const pending = h.clean(listing({ images: [url('photo.png'), url('photo.png')], virtual_tours: [{ url: url('tour.png') }, { url: url('photo.png') }] })).then(() => { completed = true; });
    await new Promise(resolve => setImmediate(resolve));
    expect(completed).toBe(false);
    expect(h.remove).toHaveBeenCalledWith([path, `${owner}/tour.png`]);
    finish({ error: null }); await pending; expect(completed).toBe(true);
});
test('scans every deterministic page even when a server returns fewer rows than requested', async () => {
    const h = harness([[{ id: 'a', images: [], virtual_tours: [] }],
        [{ id: 'b', images: [], virtual_tours: [{ url: url('photo.png') }] }], []]);
    await h.clean(listing({ images: [url('photo.png'), url('unshared.png')] }));
    expect(h.range.mock.calls).toEqual([[0, 1], [1, 2], [2, 3]]);
    expect(h.order).toHaveBeenCalledWith('id', { ascending: true });
    expect(h.remove).toHaveBeenCalledWith([`${owner}/unshared.png`]);
});
test('preserves all paths when a remaining listing still references them', async () => {
    const h = harness([[{ images: [url('photo.png')] }], []]);
    await h.clean(listing()); expect(h.remove).not.toHaveBeenCalled();
});
test.each(['lookup', 'remove', 'throw'])('fails with safe structured recovery after %s failure', async stage => {
    const h = harness();
    const error = { message: 'upstream credential must not be logged' };
    if (stage === 'lookup') h.range.mockReset().mockResolvedValue({ error });
    else if (stage === 'remove') h.remove.mockResolvedValue({ error });
    else h.remove.mockRejectedValue(error);
    await expect(h.clean(listing())).rejects.toThrow(/image cleanup failed/i);
    if (stage === 'lookup') expect(h.remove).not.toHaveBeenCalled();
    expect(h.logger.error).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
        event: 'property_image_cleanup_recovery_required', listingId: listing().id, sellerId: owner, managedPaths: [path],
    }));
    expect(JSON.stringify(h.logger.error.mock.calls)).not.toContain('credential');
});
test.each([null, {}, 'not rows'])('fails closed on nonarray reference success %j', async data => {
    const h = harness();
    h.range.mockReset().mockResolvedValue({ data, error: null });
    await expect(h.clean(listing())).rejects.toThrow(/image cleanup failed/i);
    expect(h.remove).not.toHaveBeenCalled();
});
