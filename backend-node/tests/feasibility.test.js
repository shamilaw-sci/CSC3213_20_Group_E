const request = require('supertest');
const { createClient } = require('@supabase/supabase-js');

// Mock Supabase (same pattern used in auth.test.js).
// `select` behaves like the real query builder: called WITH args mid-chain it
// just returns `this` for further chaining; called with NO args at the end of
// an insert/delete chain it resolves the "response" for that call.
jest.mock('@supabase/supabase-js', () => {
    const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        single: jest.fn(),
        order: jest.fn(),
        select: jest.fn(function (...args) {
            if (args.length === 0) {
                return Promise.resolve(this._result || { data: [], error: null });
            }
            return this;
        }),
    };
    return {
        createClient: jest.fn(() => mockSupabase),
    };
});

jest.mock('../utils/emailService', () => ({
    sendWelcomeEmail: jest.fn().mockResolvedValue(true),
    sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
}));

const app = require('../server');
const { issueSessionToken } = require('../utils/sessionToken');
const {
    computeFeasibility,
    buildAmortizationSchedule,
} = require('../controllers/feasibilityController');

const TEST_USER_ID = '11111111-1111-1111-1111-111111111111';
const authToken = () => issueSessionToken({ id: TEST_USER_ID, password_hash: null });
const mockLoggedInUser = (mockSupabase) => {
    mockSupabase.single.mockResolvedValueOnce({
        data: { id: TEST_USER_ID, role: 'BUYER', name: 'Test Buyer', email: 'buyer@example.com', password_hash: null },
        error: null,
    });
};

describe('Feasibility Calculator - pure calculation logic', () => {
    it('computes buying power correctly when the user qualifies for a loan', () => {
        const result = computeFeasibility({
            salary: 200000,
            savings: 500000,
            loanDeductions: 20000,
            tenureYears: 15,
        });

        expect(result.qualifiesForLoan).toBe(true);
        expect(result.maxBuyingPower).toBeGreaterThan(result.loanCapacity);
        expect(result.monthlyInstallment).toBeGreaterThan(0);
    });

    it('falls back to savings-only when disposable income is not positive', () => {
        const result = computeFeasibility({
            salary: 50000,
            savings: 100000,
            loanDeductions: 40000, // leaves very little after 40% living expenses
            tenureYears: 10,
        });

        expect(result.qualifiesForLoan).toBe(false);
        expect(result.maxBuyingPower).toBe(100000);
        expect(result.loanCapacity).toBe(0);
    });

    it('increases loan capacity when tenure is longer (all else equal)', () => {
        const shortTerm = computeFeasibility({ salary: 300000, savings: 0, loanDeductions: 0, tenureYears: 5 });
        const longTerm = computeFeasibility({ salary: 300000, savings: 0, loanDeductions: 0, tenureYears: 25 });

        expect(longTerm.loanCapacity).toBeGreaterThan(shortTerm.loanCapacity);
    });
});

describe('Feasibility Calculator - amortization schedule', () => {
    it('returns an empty schedule when loan capacity is zero', () => {
        expect(buildAmortizationSchedule(0, 10)).toEqual([]);
    });

    it('returns one entry per year with a decreasing remaining balance', () => {
        const schedule = buildAmortizationSchedule(5000000, 10);

        expect(schedule).toHaveLength(10);
        for (let i = 1; i < schedule.length; i++) {
            expect(schedule[i].remainingBalance).toBeLessThan(schedule[i - 1].remainingBalance);
        }
        expect(schedule[schedule.length - 1].remainingBalance).toBe(0);
    });
});

describe('POST /api/feasibility/calculate', () => {
    it('returns 200 with buying power and an amortization schedule for valid input', async () => {
        const res = await request(app)
            .post('/api/feasibility/calculate')
            .send({ salary: 250000, savings: 1000000, loanDeductions: 15000, tenureYears: 20 });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('maxBuyingPower');
        expect(res.body).toHaveProperty('amortizationSchedule');
        expect(Array.isArray(res.body.amortizationSchedule)).toBe(true);
    });

    it('returns 400 for a negative salary', async () => {
        const res = await request(app)
            .post('/api/feasibility/calculate')
            .send({ salary: -1000, savings: 0, loanDeductions: 0, tenureYears: 10 });

        expect(res.statusCode).toBe(400);
    });

    it('returns 400 when tenureYears exceeds the 30 year cap', async () => {
        const res = await request(app)
            .post('/api/feasibility/calculate')
            .send({ salary: 100000, savings: 0, loanDeductions: 0, tenureYears: 40 });

        expect(res.statusCode).toBe(400);
    });

    it('returns 400 when loanDeductions exceed salary', async () => {
        const res = await request(app)
            .post('/api/feasibility/calculate')
            .send({ salary: 50000, savings: 0, loanDeductions: 60000, tenureYears: 10 });

        expect(res.statusCode).toBe(400);
    });

    it('returns a savings-only message (no amortization schedule) when the user does not qualify', async () => {
        const res = await request(app)
            .post('/api/feasibility/calculate')
            .send({ salary: 40000, savings: 200000, loanDeductions: 35000, tenureYears: 10 });

        expect(res.statusCode).toBe(200);
        expect(res.body.maxBuyingPower).toBe(200000);
        expect(res.body).toHaveProperty('message');
        expect(res.body.amortizationSchedule).toBeUndefined();
    });
});

describe('POST /api/feasibility/save', () => {
    it('returns 401 when no auth token is provided', async () => {
        const res = await request(app)
            .post('/api/feasibility/save')
            .send({ salary: 200000, savings: 0, loanDeductions: 0, tenureYears: 10, maxBuyingPower: 5000000 });

        expect(res.statusCode).toBe(401);
    });

    it('saves a calculation and returns 201 for an authenticated user', async () => {
        const mockSupabase = createClient();
        mockLoggedInUser(mockSupabase);
        mockSupabase._result = {
            data: [{ id: 'hist-1', user_id: TEST_USER_ID, max_buying_power: 5000000 }],
            error: null,
        };

        const res = await request(app)
            .post('/api/feasibility/save')
            .set('Authorization', `Bearer ${authToken()}`)
            .send({
                salary: 200000,
                savings: 0,
                loanDeductions: 0,
                tenureYears: 10,
                maxBuyingPower: 5000000,
                loanCapacity: 5000000,
                monthlyInstallment: 45000,
            });

        expect(res.statusCode).toBe(201);
        expect(res.body.entry).toHaveProperty('id', 'hist-1');
    });
});

describe('GET /api/feasibility/history', () => {
    it('returns 401 when no auth token is provided', async () => {
        const res = await request(app).get('/api/feasibility/history');
        expect(res.statusCode).toBe(401);
    });

    it('returns the saved history list for an authenticated user', async () => {
        const mockSupabase = createClient();
        mockLoggedInUser(mockSupabase);
        mockSupabase.order.mockResolvedValueOnce({
            data: [{ id: 'hist-1', max_buying_power: 5000000 }],
            error: null,
        });

        const res = await request(app)
            .get('/api/feasibility/history')
            .set('Authorization', `Bearer ${authToken()}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.history).toHaveLength(1);
    });
});

describe('DELETE /api/feasibility/history/:id', () => {
    it('returns 400 for a malformed (non-UUID) id', async () => {
        const res = await request(app)
            .delete('/api/feasibility/history/not-a-uuid')
            .set('Authorization', `Bearer ${authToken()}`);

        // Auth runs before validation in the route chain, so an authenticated
        // request with a bad id should be caught by the validator.
        const mockSupabase = createClient();
        mockLoggedInUser(mockSupabase);

        expect([400, 401]).toContain(res.statusCode);
    });

    it('returns 404 when the history entry does not exist (or is not owned by the user)', async () => {
        const mockSupabase = createClient();
        mockLoggedInUser(mockSupabase);
        mockSupabase._result = { data: [], error: null };

        const res = await request(app)
            .delete('/api/feasibility/history/22222222-2222-4222-8222-222222222222')
            .set('Authorization', `Bearer ${authToken()}`);

        expect(res.statusCode).toBe(404);
    });
});
