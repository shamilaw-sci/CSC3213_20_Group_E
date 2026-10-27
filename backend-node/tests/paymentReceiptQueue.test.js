jest.mock('../config/supabase', () => ({ rpc: jest.fn(), from: jest.fn() }));
jest.mock('../utils/emailService', () => ({ sendPaymentReceipt: jest.fn() }));
jest.mock('../utils/logger', () => ({ error: jest.fn() }));
const db = require('../config/supabase');
const mail = require('../utils/emailService');
const { drain } = require('../utils/paymentReceiptQueue');
beforeEach(() => jest.resetAllMocks());
test('failed SMTP leaves claimed receipt leased for retry', async () => {
    db.rpc.mockResolvedValue({ data: [{ order_id: 'o1', recipient: 'test@example.test', property_title: 'Test', amount: 500, lease_id: 'lease' }] });
    mail.sendPaymentReceipt.mockRejectedValue(new Error('SMTP unavailable'));
    await drain('o1');
    expect(db.from).not.toHaveBeenCalled();
});
test('successful send marks only its claimed lease sent', async () => {
    db.rpc.mockResolvedValue({ data: [{ order_id: 'o1', recipient: 'test@example.test', property_title: 'Test', amount: 500, lease_id: 'lease' }] });
    mail.sendPaymentReceipt.mockResolvedValue();
    const query = { update: jest.fn(() => query), eq: jest.fn(() => query), then: resolve => Promise.resolve({ error: null }).then(resolve) };
    db.from.mockReturnValue(query);
    await drain('o1');
    expect(query.eq.mock.calls).toEqual([['order_id', 'o1'], ['lease_id', 'lease']]);
    expect(query.update).toHaveBeenCalledWith(expect.objectContaining({ status: 'sent' }));
});
