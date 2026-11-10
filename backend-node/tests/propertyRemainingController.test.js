jest.mock('../repositories/propertyRepository', () => ({ addProperty: jest.fn(), uploadImage: jest.fn(), removeImages: jest.fn(), getPropertyById: jest.fn(), updateMyProperty: jest.fn(), deleteMyProperty: jest.fn(), incrementViews: jest.fn() }));
jest.mock('../config/supabase', () => ({ from: jest.fn() }));
jest.mock('../middleware/uploadMiddleware', () => ({}));
jest.mock('../utils/similarityEngine', () => ({ findSimilarProperties: jest.fn() }));
jest.mock('../utils/priceInsightEngine', () => ({ calculatePriceInsight: jest.fn() }));
jest.mock('../utils/searchRelevance', () => ({ rankPropertiesByRelevance: jest.fn() }));
const repo = require('../repositories/propertyRepository');
const db = require('../config/supabase');
const { findSimilarProperties } = require('../utils/similarityEngine');
const { calculatePriceInsight } = require('../utils/priceInsightEngine');
const { rankPropertiesByRelevance } = require('../utils/searchRelevance');
const controller = require('../controllers/propertyController');
const response = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn() });
const request = () => ({ params: { id: 'p' }, query: {}, body: {}, user: { id: 'owner', role: 'SELLER' } });
function query(result) {
    const chain = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), neq: jest.fn().mockReturnThis(), single: jest.fn().mockResolvedValue(result), limit: jest.fn().mockResolvedValue(result) };
    db.from.mockReturnValueOnce(chain); return chain;
}
beforeEach(() => jest.resetAllMocks());

test.each(['getSimilarProperties', 'getPriceInsight'])('%s preserves target lookup without visibility filter and candidate cap', async name => {
    const target = { id: 'p', status: 'pending' }; const candidates = [{ id: 'other' }];
    const first = query({ data: target }); const second = query({ data: candidates });
    const ranked = [{ id: 'ranked' }]; findSimilarProperties.mockReturnValue(ranked);
    const insight = { category: 'Fair Price' }; calculatePriceInsight.mockReturnValue(insight);
    const req = request(); req.query.limit = '99'; const res = response(); const next = jest.fn();
    await controller[name](req, res, next);
    expect(first.eq.mock.calls).toEqual([['id', 'p']]); expect(first.single).toHaveBeenCalledTimes(1);
    expect(first.select).toHaveBeenCalledWith(name === 'getPriceInsight' ? 'id, type, listing_type, price, bedrooms, bathrooms, latitude, longitude, house_size, land_size' : 'id, type, price, bedrooms, bathrooms, latitude, longitude');
    expect(second.select).toHaveBeenCalledWith(name === 'getPriceInsight' ? 'id, type, listing_type, price, bedrooms, bathrooms, latitude, longitude, house_size, land_size' : '*, users(name, role)');
    expect(second.eq).toHaveBeenCalledWith('status', 'approved'); expect(second.neq).toHaveBeenCalledWith('id', 'p'); expect(second.limit).toHaveBeenCalledWith(200);
    expect(findSimilarProperties).toHaveBeenCalledWith(target, candidates, name === 'getPriceInsight' ? 15 : 20);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(name === 'getPriceInsight' ? { message: 'Price insight calculated successfully', insight } : { message: 'Similar properties fetched successfully', properties: ranked });
    if (name === 'getPriceInsight') expect(calculatePriceInsight).toHaveBeenCalledWith(target, ranked);
    expect(next).not.toHaveBeenCalled();
});
test.each(['getSimilarProperties', 'getPriceInsight'])('%s handles target errors as 404 and forwards candidate errors', async name => {
    const error = new Error('database'); query({ error }); const res = response(); const next = jest.fn();
    await controller[name](request(), res, next);
    expect(res.status).toHaveBeenCalledWith(404); expect(res.json).toHaveBeenCalledWith({ message: 'Property not found.' }); expect(next).not.toHaveBeenCalled(); expect(db.from).toHaveBeenCalledTimes(1);
    query({ data: { id: 'p' } }); query({ error }); const failed = response();
    await controller[name](request(), failed, next);
    expect(next).toHaveBeenCalledWith(error); expect(failed.status).not.toHaveBeenCalled();
});
test('price insight uses empty candidates and preserves insufficient-data response', async () => {
    const target = { id: 'p' }; query({ data: target }); query({ data: null }); findSimilarProperties.mockReturnValue([]); calculatePriceInsight.mockReturnValue(null);
    const res = response(); await controller.getPriceInsight(request(), res, jest.fn());
    expect(findSimilarProperties).toHaveBeenCalledWith(target, [], 15); expect(res.status).toHaveBeenCalledWith(200); expect(res.json).toHaveBeenCalledWith({ message: 'Not enough comparable data yet', insight: null });
});
test.each([['0', 20], ['-1', -1], ['2.9', 2.9]])('search keeps Number/slice limit semantics for %s', async (limit, end) => {
    const chain = query({ data: null }); const ranked = Array.from({ length: 25 }, (_, id) => ({ id })); rankPropertiesByRelevance.mockReturnValue(ranked);
    const req = request(); req.query = { q: 'house', limit }; const res = response(); await controller.searchProperties(req, res, jest.fn());
    expect(chain.select).toHaveBeenCalledWith('id, title, description, type, price, city, district, bedrooms, bathrooms'); expect(chain.eq).toHaveBeenCalledWith('status', 'approved'); expect(chain.limit).toHaveBeenCalledWith(300);
    expect(rankPropertiesByRelevance).toHaveBeenCalledWith('house', []); const properties = ranked.slice(0, end); expect(res.json).toHaveBeenCalledWith({ message: 'Search results fetched successfully', query: 'house', count: properties.length, properties });
});
test('search forwards query error before ranking', async () => {
    const error = new Error('search'); query({ error }); const next = jest.fn(); const res = response(); await controller.searchProperties(request(), res, next);
    expect(next).toHaveBeenCalledWith(error); expect(rankPropertiesByRelevance).not.toHaveBeenCalled(); expect(res.status).not.toHaveBeenCalled();
});
test.each([0, null, 7])('views preserves falsy-count behavior for %s', async count => {
    repo.incrementViews.mockResolvedValue(count); const res = response(); await controller.incrementViews(request(), res, jest.fn());
    expect(repo.incrementViews).toHaveBeenCalledWith('p'); expect(res.status).toHaveBeenCalledWith(count ? 200 : 404); expect(res.json).toHaveBeenCalledWith(count ? { message: 'View recorded', views_count: count } : { message: 'Property not found' });
});
test.each(['incrementViews', 'deleteMyProperty'])('%s forwards repository failures', async name => {
    const error = new Error(name); repo[name].mockRejectedValue(error); const next = jest.fn(); const res = response(); await controller[name](request(), res, next); expect(next).toHaveBeenCalledWith(error); expect(res.status).not.toHaveBeenCalled();
});
test.each([true, false])('delete preserves owner arguments and result %s', async success => {
    repo.deleteMyProperty.mockResolvedValue(success); const res = response(); await controller.deleteMyProperty(request(), res, jest.fn()); expect(repo.deleteMyProperty).toHaveBeenCalledWith('p', 'owner'); expect(res.status).toHaveBeenCalledWith(success ? 200 : 404); expect(res.json).toHaveBeenCalledWith({ message: success ? 'Property deleted successfully.' : 'Property not found or unauthorized.' });
});
test.each(['addProperty', 'updateMyProperty', 'deleteMyProperty'])('%s rejects buyer before repository effects', async name => {
    const req = request(); req.user.role = 'BUYER'; const res = response(); await controller[name](req, res, jest.fn()); expect(res.status).toHaveBeenCalledWith(403); Object.values(repo).forEach(mock => expect(mock).not.toHaveBeenCalled());
});
test.each([null, { seller_id: 'other' }, { seller_id: 'owner', status: 'approved' }])('update refuses missing, foreign and approved rows: %j', async row => {
    repo.getPropertyById.mockResolvedValue(row); const res = response(); await controller.updateMyProperty(request(), res, jest.fn()); expect(res.status).toHaveBeenCalledWith(row && row.seller_id === 'owner' ? 400 : 404); expect(repo.updateMyProperty).not.toHaveBeenCalled();
});
test('update retries only rejection_reason failure and preserves default/null/undefined distinctions', async () => {
    repo.getPropertyById.mockResolvedValue({ seller_id: 'owner', status: 'rejected' }); const data = { id: 'p' };
    repo.updateMyProperty.mockResolvedValueOnce({ error: new Error('missing rejection_reason column') }).mockResolvedValueOnce({ data });
    const req = request(); req.body = { city: null, bedrooms: 0 }; const res = response(); await controller.updateMyProperty(req, res, jest.fn());
    const updates = { price_period: null, address: null, city: null, contact_number: null, bedrooms: 0, bathrooms: null, land_size: null, house_size: null, status: 'pending', rejection_reason: null };
    expect(repo.updateMyProperty).toHaveBeenNthCalledWith(1, 'p', 'owner', updates); const { rejection_reason, ...fallback } = updates; expect(repo.updateMyProperty).toHaveBeenNthCalledWith(2, 'p', 'owner', fallback); expect(res.json).toHaveBeenCalledWith({ message: 'Property updated and sent to admin review.', property: data });
});
test('create uploads photos before tours, pairs metadata, then inserts pending defaults', async () => {
    repo.uploadImage.mockResolvedValueOnce('photo-url').mockResolvedValueOnce('tour-url'); repo.addProperty.mockImplementation(async data => data);
    const req = request(); req.files = { images: [{ originalname: 'photo.jpg', buffer: 'photo', mimetype: 'image/jpeg' }], virtualTours: [{ originalname: 'tour.png', buffer: 'tour', mimetype: 'image/png' }] }; req.body.virtualTourMetadata = JSON.stringify([{ room: 'Living' }, { room: 'Missing' }]);
    const res = response(); await controller.addProperty(req, res, jest.fn());
    expect(repo.uploadImage.mock.calls.map(call => call.slice(1))).toEqual([['photo', 'image/jpeg'], ['tour', 'image/png']]); expect(repo.uploadImage.mock.calls[1][0]).toMatch(/^owner\/360-/);
    expect(repo.addProperty).toHaveBeenCalledWith(expect.objectContaining({ images: ['photo-url'], virtual_tours: [{ room: 'Living', url: 'tour-url' }], listing_type: 'Sale', seller_id: 'owner', status: 'pending', payment_status: 'Unpaid', created_at: expect.any(Date) })); expect(res.status).toHaveBeenCalledWith(201);
});
test('create completes rollback before forwarding insert failure', async () => {
    const error = new Error('insert'); repo.uploadImage.mockResolvedValue('url'); repo.addProperty.mockRejectedValue(error); repo.removeImages.mockResolvedValue();
    const req = request(); req.files = { images: [{ originalname: 'photo.jpg' }] }; const next = jest.fn(); await controller.addProperty(req, response(), next);
    expect(repo.removeImages).toHaveBeenCalledWith([repo.uploadImage.mock.calls[0][0]]); expect(next).toHaveBeenCalledWith(error);
});
