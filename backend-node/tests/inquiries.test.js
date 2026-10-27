const request = require('supertest');
const jwt = require('jsonwebtoken');
jest.mock('../repositories/inquiryRepository', () => ({ create: jest.fn(), list: jest.fn() }), { virtual: true });
jest.mock('../config/supabase', () => ({ from: jest.fn().mockReturnThis(), select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), single: jest.fn() }));
// The full app imports saved-search/feasibility controllers, which create their
// own clients. Inquiry requests do not use those clients or their credentials.
jest.mock('@supabase/supabase-js', () => ({ createClient: jest.fn(() => ({})) }));
const repo = require('../repositories/inquiryRepository');
const db = require('../config/supabase');
const app = require('../server');
const payload = { firstName: 'Test', lastName: 'Visitor', email: 'test@example.com', message: 'Please share more details about your service.' };
beforeEach(() => {
    jest.clearAllMocks();
    repo.create.mockResolvedValue({ id: 'inquiry-1' });
    repo.list.mockResolvedValue({ data: [{ id: 'inquiry-1', first_name: 'Test', message: payload.message }], count: 1 });
    db.single.mockResolvedValue({ data: { id: 'admin-1', role: 'ADMIN' }, error: null });
});
test('accepts a validated guest inquiry without associating it with a registered identity', async () => {
    const res = await request(app).post('/api/inquiries').send({ ...payload, user_id: 'someone-else' });
    expect(res.status).toBe(201);
    expect(repo.create).toHaveBeenCalledWith({ first_name: 'Test', last_name: 'Visitor', email: payload.email, message: payload.message });
    expect(res.body).not.toHaveProperty('inquiry');
});
test('rejects malformed submissions before database writes', async () => {
    const res = await request(app).post('/api/inquiries').send({ ...payload, email: 'bad-email' });
    expect(res.status).toBe(400);
    expect(repo.create).not.toHaveBeenCalled();
});
test('does not report success when persistence fails', async () => {
    repo.create.mockRejectedValue({ code: '42P01', message: 'relation unavailable' });
    const res = await request(app).post('/api/inquiries').send(payload);
    expect(res.status).toBe(503);
});
test('requires authentication to read inquiries', async () => {
    expect((await request(app).get('/api/admin/inquiries')).status).toBe(401);
    expect(repo.list).not.toHaveBeenCalled();
});
test('blocks non-admin accounts from reading inquiries', async () => {
    db.single.mockResolvedValue({ data: { id: 'buyer-1', role: 'BUYER' }, error: null });
    const token = jwt.sign({ id: 'buyer-1' }, process.env.JWT_SECRET);
    expect((await request(app).get('/api/admin/inquiries').set('Authorization', `Bearer ${token}`)).status).toBe(403);
    expect(repo.list).not.toHaveBeenCalled();
});
test('lists inquiries for admins with bounded pagination', async () => {
    const token = jwt.sign({ id: 'admin-1' }, process.env.JWT_SECRET);
    const res = await request(app).get('/api/admin/inquiries?page=2').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(repo.list).toHaveBeenCalledWith(20, 39);
    expect(res.body.inquiries).toHaveLength(1);
});
