const express = require('express');
const request = require('supertest');
jest.mock('../repositories/propertyRepository', () => ({ addProperty: jest.fn(), getPropertyById: jest.fn(), updateMyProperty: jest.fn() }));
const repo = require('../repositories/propertyRepository');
const validate = require('../middleware/validate');
const { addPropertySchema, updatePropertySchema } = require('../validators/propertyValidator');
const { addProperty, updateMyProperty } = require('../controllers/propertyController');
const app = express();
app.use(express.json(), (req, res, next) => { req.user = { id: 'seller-1', role: 'SELLER' }; next(); });
app.post('/', validate(addPropertySchema), addProperty);
app.put('/:id', validate(updatePropertySchema), updateMyProperty);
const body = { type: 'House', title: 'Test listing', description: 'A listing with valid description.', price: '1000000', latitude: '7', longitude: '80' };
beforeEach(() => {
    repo.addProperty.mockImplementation(async data => data);
    repo.getPropertyById.mockResolvedValue({ id: 'p1', seller_id: 'seller-1', status: 'pending' });
    repo.updateMyProperty.mockImplementation(async (id, userId, data) => ({ data, error: null }));
});
test.each(['0', 0])('create and update preserve valid zero values (%s)', async zero => {
    const fields = { bedrooms: zero, bathrooms: zero, landSize: zero };
    const created = await request(app).post('/').send({ ...body, ...fields });
    expect(created.status).toBe(201);
    expect(created.body.property).toMatchObject({ bedrooms: 0, bathrooms: 0, land_size: 0 });
    const updated = await request(app).put('/p1').send(fields);
    expect(updated.status).toBe(200);
    expect(updated.body.property).toMatchObject({ bedrooms: 0, bathrooms: 0, land_size: 0 });
});
test('optional empty numeric fields remain unset rather than becoming zero', async () => {
    const created = await request(app).post('/').send({ ...body, bedrooms: '', bathrooms: '', landSize: '' });
    expect(created.body.property).toMatchObject({ bedrooms: null, bathrooms: null, land_size: null });
});
