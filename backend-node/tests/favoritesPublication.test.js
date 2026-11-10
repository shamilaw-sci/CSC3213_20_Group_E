jest.mock('../config/supabase', () => ({ from: jest.fn() }));
jest.mock('../repositories/propertyRepository', () => ({ getPropertyById: jest.fn() }));
const db = require('../config/supabase');
const propertyRepo = require('../repositories/propertyRepository');
const { toggleFavorite, getFavorites } = require('../controllers/favoritesController');
const repo = require('../repositories/favoritesRepository');
const request = () => ({ user: { id: 'buyer' }, params: { propertyId: 'listing' }, body: { user_id: 'foreign' } });
const response = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn() });
let query, lookup, result, next, res;
beforeEach(() => {
    jest.clearAllMocks();
    lookup = { data: null, error: null }; result = { data: [], error: null };
    query = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(),
        single: jest.fn(async () => lookup), maybeSingle: jest.fn(async () => lookup),
        insert: jest.fn().mockReturnThis(), delete: jest.fn().mockReturnThis(),
        then: resolve => Promise.resolve(result).then(resolve) };
    db.from.mockReturnValue(query);
    propertyRepo.getPropertyById.mockResolvedValue({ id: 'listing', seller_id: 'seller', status: 'approved' });
    next = jest.fn(); res = response();
});

test.each(['pending', 'rejected', 'draft', undefined, null])('cannot add %s listing', async status => {
    propertyRepo.getPropertyById.mockResolvedValue({ id: 'listing', seller_id: 'seller', status });
    await toggleFavorite(request(), res, next);
    expect(res.status).toHaveBeenCalledWith(404); expect(query.insert).not.toHaveBeenCalled();
    expect(query.delete).not.toHaveBeenCalled(); expect(next).not.toHaveBeenCalled();
});
test('missing listing shares the same404 and cannot insert', async () => {
    propertyRepo.getPropertyById.mockResolvedValue(null);
    await toggleFavorite(request(), res, next);
    expect(res.status).toHaveBeenCalledWith(404); expect(query.insert).not.toHaveBeenCalled();
});
test('approved unrelated listing remains addable using only authenticated user', async () => {
    await toggleFavorite(request(), res, next);
    expect(res.status).toHaveBeenCalledWith(200); expect(res.json).toHaveBeenCalledWith({ message: 'Added to favorites', isFavorite: true });
    expect(query.insert).toHaveBeenCalledWith([{ user_id: 'buyer', property_id: 'listing' }]);
});
test('own approved listing still400', async () => {
    propertyRepo.getPropertyById.mockResolvedValue({ id: 'listing', seller_id: 'buyer', status: 'approved' });
    await toggleFavorite(request(), res, next);
    expect(res.status).toHaveBeenCalledWith(400); expect(query.insert).not.toHaveBeenCalled();
});
test('existing withdrawn favorite can be removed without private property lookup', async () => {
    lookup.data = { user_id: 'buyer', property_id: 'listing' };
    propertyRepo.getPropertyById.mockResolvedValue({ id: 'listing', status: 'rejected', private: 'fixture-private' });
    await toggleFavorite(request(), res, next);
    expect(propertyRepo.getPropertyById).not.toHaveBeenCalled(); expect(query.delete).toHaveBeenCalledTimes(1);
    expect(query.eq).toHaveBeenCalledWith('user_id', 'buyer'); expect(query.eq).toHaveBeenCalledWith('property_id', 'listing');
    expect(res.json).toHaveBeenCalledWith({ message: 'Removed from favorites', isFavorite: false });
    expect(JSON.stringify(res.json.mock.calls)).not.toContain('fixture-private');
});
test.each(['database-failure', 'PGRST116'])('lookup error %s cannot insert/delete or read private property', async code => {
    const error = Object.assign(new Error('synthetic lookup error'), { code }); lookup.error = error;
    await toggleFavorite(request(), res, next);
    expect(next).toHaveBeenCalledWith(error); expect(query.insert).not.toHaveBeenCalled(); expect(query.delete).not.toHaveBeenCalled();
    expect(propertyRepo.getPropertyById).not.toHaveBeenCalled();
});
test('lookup uses maybeSingle so an absent favorite is not a hidden query failure', async () => {
    await repo.findFavorite('buyer', 'listing');
    expect(query.maybeSingle).toHaveBeenCalledTimes(1); expect(query.single).not.toHaveBeenCalled();
});
test.each(['insert', 'delete'])('%s error is forwarded unchanged', async operation => {
    const error = new Error('synthetic write error'); result.error = error;
    if (operation === 'delete') lookup.data = { user_id: 'buyer', property_id: 'listing' };
    await toggleFavorite(request(), res, next);
    expect(next).toHaveBeenCalledWith(error); expect(res.json).not.toHaveBeenCalled();
});
test('foreign favorite is excluded by tuple lookup and cannot authorize its removal', async () => {
    lookup.data = null;
    await toggleFavorite(request(), res, next);
    expect(query.eq).toHaveBeenCalledWith('user_id', 'buyer'); expect(query.eq).not.toHaveBeenCalledWith('user_id', 'foreign');
    expect(query.delete).not.toHaveBeenCalled();
});
test('collection query filters user and approved nested properties using inner relation', async () => {
    await repo.getUserFavorites('buyer');
    expect(query.select).toHaveBeenCalledWith('property_id, properties!inner(*)');
    expect(query.eq).toHaveBeenCalledWith('user_id', 'buyer'); expect(query.eq).toHaveBeenCalledWith('properties.status', 'approved');
});
test('mixed/malformed repository rows return only approved property content', async () => {
    const approved = { id: 'public', status: 'approved', title: 'Public title', images: ['public.jpg'] };
    result.data = [{ properties: approved }, { properties: { id: 'pending', status: 'pending', private: 'fixture-private' } },
        { properties: { id: 'rejected', status: 'rejected', private: 'fixture-private' } }, { properties: null }, {}, null];
    await getFavorites(request(), res, next);
    expect(res.json).toHaveBeenCalledWith({ favorites: [approved] }); expect(next).not.toHaveBeenCalled();
});
test('empty/null collection remains an empty array', async () => {
    result.data = null; await getFavorites(request(), res, next);
    expect(res.json).toHaveBeenCalledWith({ favorites: [] });
});
test('collection query failure forwards error and no property data', async () => {
    const error = new Error('synthetic read error'); result.error = error;
    await getFavorites(request(), res, next);
    expect(next).toHaveBeenCalledWith(error); expect(res.json).not.toHaveBeenCalled();
});
