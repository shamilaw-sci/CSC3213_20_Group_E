const express = require('express');
const request = require('supertest');

jest.mock('../config/supabase', () => ({}));
jest.mock('../repositories/settingsRepository', () => ({ getSettingValue: jest.fn() }));
jest.mock('../utils/emailService', () => ({ sendPaymentReceipt: jest.fn() }));
const settings = require('../repositories/settingsRepository');
const { getPaymentConfig } = require('../controllers/paymentController');
const app = express();
app.get('/config', getPaymentConfig);
const originalMode = process.env.PAYHERE_MODE;
test('fee read error cannot return a successful payment config', async () => {
    settings.getSettingValue.mockRejectedValueOnce(new Error('synthetic fee failure'));
    const res = { json: jest.fn() }, next = jest.fn();
    await getPaymentConfig({}, res, next);
    expect(res.json).not.toHaveBeenCalled(); expect(next).toHaveBeenCalledTimes(1);
});

describe('Server-controlled PayHere mode', () => {
    afterEach(() => {
        if (originalMode === undefined) delete process.env.PAYHERE_MODE;
        else process.env.PAYHERE_MODE = originalMode;
    });

    test.each([[undefined, true], ['sandbox', true], ['live', false], ['invalid', true]])(
        'uses mode %s with sandbox=%s', async (mode, sandbox) => {
            if (mode === undefined) delete process.env.PAYHERE_MODE;
            else process.env.PAYHERE_MODE = mode;
            settings.getSettingValue.mockResolvedValue('500.00');
            const response = await request(app).get('/config');
            expect(response.status).toBe(200);
            expect(response.body).toMatchObject({ listing_fee: '500.00', currency: 'LKR', sandbox });
            expect(response.body).not.toHaveProperty('merchant_secret');
        }
    );
});
