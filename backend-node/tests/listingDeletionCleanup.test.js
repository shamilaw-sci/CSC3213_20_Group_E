jest.mock('../config/supabase', () => ({ from: jest.fn() }));
jest.mock('../utils/propertyImageCleanup', () => ({ cleanupPropertyImages: jest.fn() }), { virtual: true });
const supabase = require('../config/supabase');
const { cleanupPropertyImages } = require('../utils/propertyImageCleanup');
const seller = require('../repositories/propertyRepository');
const admin = require('../repositories/adminRepository');
const row = { id: 'listing', seller_id: 'owner', images: ['managed-photo'], virtual_tours: [{ url: 'managed-tour' }] };
let query;
beforeEach(() => {
    jest.clearAllMocks();
    query = { delete: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({ data: [row], error: null }) };
    supabase.from.mockReturnValue(query);
    cleanupPropertyImages.mockResolvedValue(undefined);
});
const cases = [
    ['seller', () => seller.deleteMyProperty('listing', 'owner'), true],
    ['admin', () => admin.deleteListing('listing'), undefined],
];
test.each(cases)('%s atomically deletes then awaits cleanup with deleted metadata', async (kind, remove, result) => {
    let finish;
    cleanupPropertyImages.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
    let completed = false;
    const pending = remove().then(value => { completed = true; return value; });
    await new Promise(resolve => setImmediate(resolve));
    expect(query.delete).toHaveBeenCalledTimes(1);
    expect(query.select).toHaveBeenCalledWith('id,seller_id,images,virtual_tours');
    expect(query.eq.mock.calls).toEqual(kind === 'seller' ? [['id', 'listing'], ['seller_id', 'owner']] : [['id', 'listing']]);
    expect(cleanupPropertyImages).toHaveBeenCalledWith(supabase, row);
    expect(query.select.mock.invocationCallOrder[0]).toBeLessThan(cleanupPropertyImages.mock.invocationCallOrder[0]);
    expect(completed).toBe(false);
    finish(); expect(await pending).toBe(result);
});
test.each(cases)('%s missing row retains its existing result and never cleans files', async (kind, remove) => {
    query.select.mockResolvedValue({ data: [], error: null });
    expect(await remove()).toBe(kind === 'seller' ? false : undefined);
    expect(cleanupPropertyImages).not.toHaveBeenCalled();
});
test.each(cases)('%s DB failure never removes files', async (_kind, remove) => {
    const failure = new Error('foreign key failure');
    query.select.mockResolvedValue({ data: null, error: failure });
    await expect(remove()).rejects.toBe(failure);
    expect(cleanupPropertyImages).not.toHaveBeenCalled();
});
test.each(cases)('%s cleanup failure cannot return success', async (_kind, remove) => {
    const failure = new Error('Storage unavailable after DB deletion');
    cleanupPropertyImages.mockRejectedValue(failure);
    await expect(remove()).rejects.toBe(failure);
});
