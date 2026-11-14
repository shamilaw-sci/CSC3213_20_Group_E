const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Assumptions used by the affordability model. Kept as named constants so the
// business rules are easy to find/tune in one place instead of being buried as
// "magic numbers" inside the calculation.
const LIVING_EXPENSE_RATIO = 0.40;      // 40% of salary reserved for living costs
const MAX_INSTALLMENT_RATIO = 0.60;     // Banks typically allow up to 60% of disposable income
const ANNUAL_INTEREST_RATE = 0.12;      // Prevailing average mortgage rate in Sri Lanka

/**
 * Pure calculation function (no req/res) so it can be unit-tested directly
 * and reused by both the /calculate endpoint and the amortization schedule.
 */
function computeFeasibility({ salary, savings, loanDeductions, tenureYears }) {
    const livingExpenses = salary * LIVING_EXPENSE_RATIO;
    const netDisposableIncome = salary - loanDeductions - livingExpenses;

    if (netDisposableIncome <= 0) {
        return {
            qualifiesForLoan: false,
            maxBuyingPower: savings,
            loanCapacity: 0,
            monthlyInstallment: 0,
            message: "Based on your deductions and living expenses, you do not qualify for a loan. You can only purchase properties using your existing savings.",
        };
    }

    const maxMonthlyPayment = netDisposableIncome * MAX_INSTALLMENT_RATIO;
    const monthlyInterestRate = ANNUAL_INTEREST_RATE / 12;
    const numberOfPayments = tenureYears * 12;

    // Present value of an annuity (standard loan amortization formula)
    const maxLoanCapacity = maxMonthlyPayment *
        ((1 - Math.pow(1 + monthlyInterestRate, -numberOfPayments)) / monthlyInterestRate);

    const maxBuyingPower = maxLoanCapacity + savings;

    return {
        qualifiesForLoan: true,
        maxBuyingPower: Math.floor(maxBuyingPower),
        loanCapacity: Math.floor(maxLoanCapacity),
        monthlyInstallment: Math.floor(maxMonthlyPayment),
    };
}

/**
 * Builds a month-by-month amortization schedule for the max loan capacity,
 * so the frontend can chart how the balance reduces over the loan tenure.
 * Returns one row per year (rather than every month) to keep the payload small.
 */
function buildAmortizationSchedule(loanCapacity, tenureYears) {
    const monthlyInterestRate = ANNUAL_INTEREST_RATE / 12;
    const numberOfPayments = tenureYears * 12;

    if (loanCapacity <= 0 || numberOfPayments <= 0) return [];

    const monthlyPayment = loanCapacity *
        (monthlyInterestRate / (1 - Math.pow(1 + monthlyInterestRate, -numberOfPayments)));

    let balance = loanCapacity;
    const schedule = [];

    for (let month = 1; month <= numberOfPayments; month++) {
        const interestPortion = balance * monthlyInterestRate;
        const principalPortion = monthlyPayment - interestPortion;
        balance = Math.max(0, balance - principalPortion);

        if (month % 12 === 0 || month === numberOfPayments) {
            schedule.push({
                year: Math.ceil(month / 12),
                remainingBalance: Math.floor(balance),
            });
        }
    }

    return schedule;
}

// @desc Calculate maximum buying power based on financial inputs
// @route POST /api/feasibility/calculate
// @access Public
const calculateFeasibility = async (req, res, next) => {
    try {
        const { salary, savings, loanDeductions, tenureYears } = req.body;
        const result = computeFeasibility({ salary, savings, loanDeductions, tenureYears });

        if (!result.qualifiesForLoan) {
            return res.status(200).json({
                maxBuyingPower: result.maxBuyingPower,
                message: result.message,
            });
        }

        const amortizationSchedule = buildAmortizationSchedule(result.loanCapacity, tenureYears);

        res.status(200).json({
            maxBuyingPower: result.maxBuyingPower,
            loanCapacity: result.loanCapacity,
            monthlyInstallment: result.monthlyInstallment,
            amortizationSchedule,
        });
    } catch (error) {
        next(error);
    }
};

// @desc Save a calculation result to the logged-in user's history
// @route POST /api/feasibility/save
// @access Private
const saveCalculation = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { salary, savings, loanDeductions, tenureYears, maxBuyingPower, loanCapacity, monthlyInstallment } = req.body;

        const { data, error } = await supabase
            .from('feasibility_history')
            .insert([{
                user_id: userId,
                salary,
                savings,
                loan_deductions: loanDeductions,
                tenure_years: tenureYears,
                max_buying_power: maxBuyingPower,
                loan_capacity: loanCapacity,
                monthly_installment: monthlyInstallment,
            }])
            .select();

        if (error) {
            if (error.message.includes('relation "public.feasibility_history" does not exist')) {
                return res.status(500).json({ message: "Calculation saving is temporarily unavailable." });
            }
            throw error;
        }

        res.status(201).json({ message: "Calculation saved", entry: data[0] });
    } catch (error) {
        next(error);
    }
};

// @desc Get all saved calculations for the logged-in user, most recent first
// @route GET /api/feasibility/history
// @access Private
const getHistory = async (req, res, next) => {
    try {
        const userId = req.user.id;

        const { data, error } = await supabase
            .from('feasibility_history')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            if (error.message.includes('relation "public.feasibility_history" does not exist')) {
                return res.status(200).json({ history: [], message: "Calculation history is temporarily unavailable." });
            }
            throw error;
        }

        res.status(200).json({ history: data });
    } catch (error) {
        next(error);
    }
};

// @desc Delete one saved calculation belonging to the logged-in user
// @route DELETE /api/feasibility/history/:id
// @access Private
const deleteHistoryEntry = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const { data, error } = await supabase
            .from('feasibility_history')
            .delete()
            .eq('id', id)
            .eq('user_id', userId) // ensure a user can only delete their own entry
            .select();

        if (error) throw error;

        if (!data || data.length === 0) {
            return res.status(404).json({ message: "History entry not found" });
        }

        res.status(200).json({ message: "History entry deleted" });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    computeFeasibility,
    buildAmortizationSchedule,
    calculateFeasibility,
    saveCalculation,
    getHistory,
    deleteHistoryEntry,
};
