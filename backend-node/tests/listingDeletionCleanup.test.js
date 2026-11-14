jest.mock('../config/supabase', () => ({ from: jest.fn() }));
jest.mock('../utils/propertyImageCleanup', () => ({ cleanupPropertyImages: jest.fn() }));
const db = require('../config/supabase');
const { cleanupPropertyImages } = require('../utils/propertyImageCleanup');
const seller = require('../repositories/propertyRepository');
const admin = require('../repositories/adminRepository');
let query;
beforeEach(() => {
 jest.clearAllMocks();
 query = { delete: jest.fn().mockReturnThis(), update: jest.fn().mockReturnThis(), is: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), select: jest.fn().mockResolvedValue({ data: [{ id: 'listing' }], error: null }) };
 db.from.mockReturnValue(query);
});
test.each([['seller', () => seller.deleteMyProperty('listing', 'owner')], ['admin', () => admin.deleteListing('listing')]])('%s archives without deleting records or media', async (_kind, archive) => {
 await archive();
 expect(query.update).toHaveBeenCalledWith({ deleted_at: expect.any(String) });
 expect(query.delete).not.toHaveBeenCalled();
 expect(cleanupPropertyImages).not.toHaveBeenCalled();
 expect(query.is).toHaveBeenCalledWith('deleted_at', null);
});
test('owner archive scopes both listing and owner', async () => {
 await seller.deleteMyProperty('listing', 'owner');
 expect(query.eq.mock.calls).toEqual([['id', 'listing'], ['seller_id', 'owner']]);
});
test('archive database failure is surfaced without file cleanup', async () => {
 const error = new Error('database unavailable'); query.select.mockResolvedValue({ data: null, error });
 await expect(seller.deleteMyProperty('listing', 'owner')).rejects.toBe(error);
 expect(cleanupPropertyImages).not.toHaveBeenCalled();
});
