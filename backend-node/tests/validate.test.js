const express = require('express');
const request = require('supertest');
const { z } = require('zod');
const validate = require('../middleware/validate');

const app = express();
app.use(express.json());
app.post('/', validate(z.object({
    body: z.object({ amount: z.coerce.number() }),
    query: z.object({ page: z.coerce.number().default(1) }),
})), (req, res) => res.json({ body: req.body, query: req.query }));

test('passes parsed numbers to handlers while preserving fields outside the schema', async () => {
    const res = await request(app).post('/?page=2&district=Kandy')
        .send({ amount: '1000', listingType: 'Sale' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ body: { amount: 1000, listingType: 'Sale' }, query: { page: 2, district: 'Kandy' } });
});

test('returns field issues for invalid input', async () => {
    const res = await request(app).post('/').send({ amount: 'invalid' });
    expect(res.status).toBe(400);
    expect(res.body.errors).toEqual(expect.arrayContaining([expect.objectContaining({ path: 'body.amount' })]));
});
