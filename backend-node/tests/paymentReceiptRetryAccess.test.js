jest.mock('../utils/paymentReceiptQueue', () => ({ drain: jest.fn() }));
jest.mock('../repositories/settingsRepository', () => ({}));
jest.mock('../repositories/propertyRepository', () => ({}));
jest.mock('../repositories/paymentOrderRepository', () => ({}));
const queue = require('../utils/paymentReceiptQueue');
const { retryReceipts } = require('../controllers/paymentController');
const original = process.env.CRON_SECRET;
let res, next;
beforeEach(() => {
    jest.resetAllMocks(); process.env.CRON_SECRET = 'dummy-retry-only';
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() }; next = jest.fn();
});
afterEach(() => { if (original === undefined) delete process.env.CRON_SECRET; else process.env.CRON_SECRET = original; });
test('missing configuration refuses before queue', async () => {
    delete process.env.CRON_SECRET; await retryReceipts({ headers: {} }, res, next);
    expect(res.status).toHaveBeenCalledWith(503); expect(queue.drain).not.toHaveBeenCalled();
});
test.each([undefined, '', 'Bearer wrong', 'dummy-retry-only', 'Bearer session-jwt'])('invalid authorization %s refuses before queue', async authorization => {
    await retryReceipts({ headers: { authorization }, user: { id: 'session-user', role: 'ADMIN' } }, res, next);
    expect(res.status).toHaveBeenCalledWith(401); expect(queue.drain).not.toHaveBeenCalled();
});
test('exact dummy bearer invokes one unscoped MOCK call', async () => {
    await retryReceipts({ headers: { authorization: 'Bearer dummy-retry-only' } }, res, next);
    expect(queue.drain).toHaveBeenCalledTimes(1); expect(queue.drain).toHaveBeenCalledWith();
    expect(res.json).toHaveBeenCalledWith({ ok: true }); expect(next).not.toHaveBeenCalled();
});
test('downstream mock failure reaches next', async () => {
    const error = new Error('mock queue failure'); queue.drain.mockRejectedValue(error);
    await retryReceipts({ headers: { authorization: 'Bearer dummy-retry-only' } }, res, next);
    expect(next).toHaveBeenCalledWith(error); expect(res.json).not.toHaveBeenCalled();
});
