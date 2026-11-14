jest.mock('../repositories/propertyRepository', () => ({
    getProperties: jest.fn(), getMyProperties: jest.fn(), getPropertyById: jest.fn(),
}));
jest.mock('../config/supabase', () => ({}));
jest.mock('../middleware/uploadMiddleware', () => ({}));
const repository = require('../repositories/propertyRepository');
const controller = require('../controllers/propertyController');
const response = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn() });
beforeEach(() => jest.resetAllMocks());

describe.each([
    ['getProperties', 'Properties fetched successfully'],
    ['getMyProperties', 'Seller properties fetched successfully'],
])('%s read contract', (name, message) => {
    test.each([
        [{}, 1, 50, 0, 49],
        [{ page: '0', limit: '0' }, 1, 50, 0, 49],
        [{ page: 'invalid', limit: 'invalid' }, 1, 50, 0, 49],
        [{ page: '3tail', limit: '2.9' }, 3, 2, 4, 5],
        [{ page: '-2', limit: '-3' }, -2, -3, 9, 5],
        [{ page: '0x2', limit: '0x10' }, 2, 16, 16, 31],
    ])('preserves parsing/range and full envelope for %j', async (query, page, limit, from, to) => {
        const data = [{ id: 'p' }];
        repository[name].mockResolvedValue({ data, count: 101 });
        const res = response(); const next = jest.fn();
        await controller[name]({ query, user: { id: 'owner', role: 'SELLER' } }, res, next);
        expect(repository[name]).toHaveBeenCalledWith(...(name === 'getMyProperties' ? ['owner', from, to] : [from, to]));
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ message, count: 1, totalCount: 101, page, totalPages: Math.ceil(101 / limit), properties: data });
        expect(next).not.toHaveBeenCalled();
    });
    test.each([0, null, undefined])('preserves empty count %s', async count => {
        repository[name].mockResolvedValue({ data: [], count });
        const res = response();
        await controller[name]({ query: {}, user: { id: 'owner', role: 'AGENT' } }, res, jest.fn());
        expect(res.json).toHaveBeenCalledWith({ message, count: 0, totalCount: count, page: 1, totalPages: 0, properties: [] });
    });
    test('forwards repository rejection unchanged without response', async () => {
        const error = new Error('read failed'); repository[name].mockRejectedValue(error);
        const res = response(); const next = jest.fn();
        await controller[name]({ query: {}, user: { id: 'owner', role: 'SELLER' } }, res, next);
        expect(next).toHaveBeenCalledWith(error); expect(res.status).not.toHaveBeenCalled();
    });
});

test.each(['BUYER', 'ADMIN', 'BANNED', undefined])('my listings rejects role %s before repository access', async role => {
    const res = response(); const next = jest.fn();
    await controller.getMyProperties({ user: { role }, query: {} }, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'Only sellers and agents can view submitted properties.' });
    expect(repository.getMyProperties).not.toHaveBeenCalled(); expect(next).not.toHaveBeenCalled();
});

test.each([
    ['approved', undefined], ['pending', { id: 'owner', role: 'SELLER' }],
    ['rejected', { id: 'admin', role: 'ADMIN' }],
])('detail returns complete %s payload for authorized caller %j', async (status, user) => {
    const data = { id: 'p', status, seller_id: 'owner', contact_number: 'private', extra: { retained: true } };
    repository.getPropertyById.mockResolvedValue(data);
    const res = response(); const next = jest.fn();
    await controller.getPropertyById({ params: { id: 'p' }, user }, res, next);
    expect(repository.getPropertyById).toHaveBeenCalledWith('p');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'Property fetched successfully', property: data });
    expect(res.json.mock.calls[0][0].property).toBe(data); expect(next).not.toHaveBeenCalled();
});

test.each([null, { id: 'p', status: 'pending', seller_id: 'other' }])('detail preserves exact hidden/missing envelope for %j', async data => {
    repository.getPropertyById.mockResolvedValue(data);
    const res = response(); const next = jest.fn();
    await controller.getPropertyById({ params: { id: 'p' }, user: { id: 'owner', role: 'SELLER' } }, res, next);
    expect(res.status).toHaveBeenCalledWith(404); expect(res.json).toHaveBeenCalledWith({ message: 'Property not found.' });
    expect(next).not.toHaveBeenCalled();
});

test('detail forwards repository error unchanged', async () => {
    const error = new Error('detail failed'); repository.getPropertyById.mockRejectedValue(error);
    const res = response(); const next = jest.fn();
    await controller.getPropertyById({ params: { id: 'p' } }, res, next);
    expect(next).toHaveBeenCalledWith(error); expect(res.status).not.toHaveBeenCalled();
});
