const query = { update: jest.fn(), is: jest.fn(), eq: jest.fn(), in: jest.fn(), select: jest.fn(), maybeSingle: jest.fn() };
jest.mock('../config/supabase', () => ({ from: jest.fn() }));
jest.mock('../utils/propertyImageCleanup', () => ({ cleanupPropertyImages: jest.fn() }));
const db = require('../config/supabase');
const repo = require('../repositories/propertyRepository');
beforeEach(() => {
 jest.clearAllMocks();
 db.from.mockReturnValue(query);
 for (const method of ['update', 'is', 'eq', 'in', 'select']) query[method].mockReturnValue(query);
 query.maybeSingle.mockResolvedValue({ data: null, error: null });
});
test('owner correction filters writable moderation states at write time', async () => {
 const updates = { description: 'Corrected description', status: 'pending' };
 const result = await repo.updateMyProperty('listing', 'seller', updates);
 expect(db.from).toHaveBeenCalledWith('properties');
 expect(query.update).toHaveBeenCalledWith(updates);
 expect(query.eq.mock.calls).toEqual([['id', 'listing'], ['seller_id', 'seller']]);
 expect(query.in).toHaveBeenCalledWith('status', ['pending', 'rejected']);
 expect(query.is).toHaveBeenCalledWith('deleted_at', null);
 expect(query.maybeSingle).toHaveBeenCalledTimes(1);
 expect(result).toEqual({ data: null, error: null });
});
