const crypto = require('crypto');
jest.mock('../repositories/paymentOrderRepository', () => ({ create: jest.fn(), find: jest.fn(), settle: jest.fn() }));
jest.mock('../repositories/settingsRepository', () => ({ getSettingValue: jest.fn() }));
jest.mock('../repositories/propertyRepository', () => ({ getPropertyById: jest.fn() }));
jest.mock('../utils/paymentReceiptQueue', () => ({ drain: jest.fn().mockResolvedValue() }));
jest.mock('../utils/logger', () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn() }));
const orders = require('../repositories/paymentOrderRepository');
const settings = require('../repositories/settingsRepository');
const properties = require('../repositories/propertyRepository');
const { generateHash, processWebhook, confirmPayment } = require('../controllers/paymentController');
const response = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn(), send: jest.fn() });
const md5 = text => crypto.createHash('md5').update(text).digest('hex').toUpperCase();
const id = '10000000-0000-4000-8000-000000000001';
let order;
const env = { ...process.env };
beforeEach(() => {
    jest.clearAllMocks();
    process.env.PAYHERE_MERCHANT_ID = 'merchant';
    process.env.PAYHERE_MERCHANT_SECRET = 'test-secret';
    process.env.PAYHERE_MODE = 'sandbox';
    order = { id, property_id: 'property1', owner_id: 'seller', amount: '500.00', currency: 'LKR', mode: 'sandbox', merchant_id: 'merchant', status: 'pending' };
    orders.find.mockResolvedValue(order);
    orders.create.mockResolvedValue(order);
    orders.settle.mockResolvedValue({ order, property: { status: 'approved', payment_status: 'Paid' } });
    settings.getSettingValue.mockResolvedValue('750.00');
    properties.getPropertyById.mockResolvedValue({ id: 'property1', seller_id: 'seller', payment_status: 'Unpaid' });
});
afterAll(() => { process.env = env; });
const notification = overrides => {
    const body = { merchant_id: 'merchant', order_id: id, payhere_amount: '500.00', payhere_currency: 'LKR', status_code: '2', payment_id: 'provider1', ...overrides };
    body.md5sig = md5(body.merchant_id + body.order_id + body.payhere_amount + body.payhere_currency + body.status_code + md5('test-secret'));
    return body;
};
test('hash ignores client amount and returns locked order terms even if configured fee changed', async () => {
    const res = response(), next = jest.fn();
    await generateHash({ user: { id: 'seller' }, body: { property_id: 'property1', amount: '1.00' } }, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(orders.create).toHaveBeenCalledWith(expect.objectContaining({ owner_id: 'seller', amount: '750.00' }));
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ order_id: id, amount: '500.00', sandbox: true, hash: md5('merchant' + id + '500.00LKR' + md5('test-secret')) }));
});
test('another owner cannot initialize checkout', async () => {
    const res = response();
    await generateHash({ user: { id: 'other' }, body: { property_id: 'property1' } }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(403);
    expect(orders.create).not.toHaveBeenCalled();
});
test('verified callback uses locked fee A instead of current fee B', async () => {
    const res = response();
    await processWebhook({ body: notification() }, res, jest.fn());
    expect(orders.settle).toHaveBeenCalledWith(expect.objectContaining({ order_id: id, amount: '500.00', payment_id: 'provider1' }));
    expect(res.status).toHaveBeenCalledWith(200);
    expect(settings.getSettingValue).not.toHaveBeenCalled();
});
test.each([{ payhere_amount: '750.00' }, { payhere_currency: 'USD' }, { merchant_id: 'other' }])('rejects signed mismatched callback %j', async override => {
    const res = response();
    await processWebhook({ body: notification(override) }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(400);
    expect(orders.settle).not.toHaveBeenCalled();
});
test('sandbox order cannot settle in live mode', async () => {
    process.env.PAYHERE_MODE = 'live';
    const res = response();
    await processWebhook({ body: notification() }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(400);
    expect(orders.settle).not.toHaveBeenCalled();
});
test('invalid signature cannot settle', async () => {
    const res = response();
    await processWebhook({ body: { ...notification(), md5sig: 'invalid' } }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(400);
    expect(orders.settle).not.toHaveBeenCalled();
});
test('unpaid legacy order requires reconciliation; paid legacy retry is acknowledged', async () => {
    orders.find.mockResolvedValue(null);
    let res = response();
    await processWebhook({ body: notification() }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(409);
    properties.getPropertyById.mockResolvedValue({ payment_status: 'Paid' });
    res = response();
    await processWebhook({ body: notification() }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(200);
    expect(orders.settle).not.toHaveBeenCalled();
});
test('client callback only checks server payment status and cannot mark paid', async () => {
    const res = response();
    await confirmPayment({ user: { id: 'seller', role: 'SELLER' }, body: { property_id: 'property1', order_id: id } }, res, jest.fn());
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ payment_status: 'Unpaid' }));
    expect(orders.settle).not.toHaveBeenCalled();
});
test('paid retry remains valid after fee changes and invokes idempotent settlement', async () => {
    order.status = 'paid';
    order.provider_payment_id = 'provider1';
    const res = response();
    await processWebhook({ body: notification() }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(200);
    expect(settings.getSettingValue).not.toHaveBeenCalled();
    expect(orders.settle).toHaveBeenCalledTimes(1);
});
test('database failure requests retry rather than claiming success', async () => {
    orders.settle.mockRejectedValueOnce(new Error('Database unavailable'));
    const res = response();
    await processWebhook({ body: notification() }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(500);
});
test('conflicting provider ID or order requires reconciliation', async () => {
    orders.settle.mockRejectedValueOnce({ code: '23505', message: 'duplicate provider payment' });
    const res = response();
    await processWebhook({ body: notification() }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(409);
});
test.each(['NaN','1e3','500.001','-500','0','500evil'])('invalid callback amount %s fails closed', async payhere_amount => {
    const res = response();
    await processWebhook({ body: notification({ payhere_amount }) }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(400);
    expect(orders.settle).not.toHaveBeenCalled();
});
test('receipt failure cannot undo completed payment', async () => {
    require('../utils/paymentReceiptQueue').drain.mockRejectedValueOnce(new Error('mail failed'));
    const res = response();
    await processWebhook({ body: notification() }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(200);
});
test('receipt retry endpoint rejects missing or invalid cron authorization', async () => {
    const { retryReceipts } = require('../controllers/paymentController');
    process.env.CRON_SECRET = 'test-only-cron-secret';
    const res = response();
    await retryReceipts({ headers: {} }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(401);
    delete process.env.CRON_SECRET;
});
