jest.mock('../repositories/propertyRepository', () => ({ getPropertyById: jest.fn(), updateMyProperty: jest.fn() }));
const repo = require('../repositories/propertyRepository');
// Test the write controller directly; the compatibility facade loads unrelated
// discovery/read dependencies, including the real Supabase client.
const { updateMyProperty } = require('../controllers/property/propertyWriteController');
const response = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn() });
beforeEach(() => jest.resetAllMocks());
test('paid rejected correction preserves payment and omitted saved fields', async () => {
 repo.getPropertyById.mockResolvedValue({ seller_id: 'seller', status: 'rejected', payment_status: 'Paid' });
 repo.updateMyProperty.mockResolvedValue({ data: { id: 'listing', status: 'pending', payment_status: 'Paid' } });
 const res = response();
 await updateMyProperty({ user: { id: 'seller', role: 'SELLER' }, params: { id: 'listing' }, body: { description: 'Corrected property description', payment_status: 'Unpaid' } }, res, jest.fn());
 expect(repo.updateMyProperty).toHaveBeenCalledWith('listing', 'seller', { description: 'Corrected property description', status: 'pending', rejection_reason: null });
 expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ property: expect.objectContaining({ id: 'listing', payment_status: 'Paid' }) }));
});
test('changed moderation state returns conflict rather than successful empty update', async () => {
 repo.getPropertyById.mockResolvedValue({ seller_id: 'seller', status: 'rejected' });
 repo.updateMyProperty.mockResolvedValue({ data: null, error: null });
 const res = response();
 await updateMyProperty({ user: { id: 'seller', role: 'SELLER' }, params: { id: 'listing' }, body: { description: 'Corrected description' } }, res, jest.fn());
 expect(res.status).toHaveBeenCalledWith(409);
});

test('foreign Seller cannot resubmit the listing', async () => {
 repo.getPropertyById.mockResolvedValue({ seller_id: 'other', status: 'rejected', payment_status: 'Paid' });
 const res = response();
 await updateMyProperty({ user: { id: 'seller', role: 'SELLER' }, params: { id: 'listing' }, body: { description: 'Corrected description' } }, res, jest.fn());
 expect(res.status).toHaveBeenCalledWith(404);
 expect(repo.updateMyProperty).not.toHaveBeenCalled();
});
const { updatePropertySchema } = require('../validators/propertyValidator');
test.each([{ houseSize: -1 }, { contactNumber: '123' }, { bedrooms: -1 }, { bathrooms: 1.5 }, { price: 0 }])('rejects invalid correction %j', body => {
 expect(updatePropertySchema.safeParse({ body }).success).toBe(false);
});
