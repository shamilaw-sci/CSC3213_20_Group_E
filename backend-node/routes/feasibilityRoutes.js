const express = require('express');
const router = express.Router();
const validate = require('../middleware/validate');
const { calculateFeasibilitySchema } = require('../validators/feasibilityValidator');

/**
 * @desc Calculate maximum buying power based on financial inputs
 * @route POST /api/feasibility/calculate
 * @access Public
 */
router.post('/calculate', validate(calculateFeasibilitySchema), (req, res, next) => {
    try {
        const { salary, savings = 0, loanDeductions = 0, tenureYears = 20 } = req.body;

        // 1. Net Disposable Income Calculation
        // Assuming 40% of salary goes to living expenses as a safety buffer
        const livingExpenses = salary * 0.40;
        const netDisposableIncome = salary - loanDeductions - livingExpenses;

        if (netDisposableIncome <= 0) {
            return res.status(200).json({ 
                maxBuyingPower: Math.floor(savings), 
                loanCapacity: 0,
                monthlyInstallment: 0,
                message: "Based on your deductions and living expenses, you do not qualify for a loan. You can only purchase properties using your existing savings." 
            });
        }

        // 2. Max Monthly Mortgage Installment
        // Assuming banks allow a maximum of 60% of net disposable income for the mortgage
        const maxMonthlyPayment = netDisposableIncome * 0.60;

        // 3. Total Loan Capacity (Amortization Formula)
        // PV = PMT * [1 - (1 + r)^-n] / r
        // Assuming a standard prevailing interest rate in Sri Lanka, e.g., 12% annually -> 1% monthly
        const annualInterestRate = 0.12; 
        const monthlyInterestRate = annualInterestRate / 12;
        const numberOfPayments = tenureYears * 12;

        const maxLoanCapacity = maxMonthlyPayment * ((1 - Math.pow(1 + monthlyInterestRate, -numberOfPayments)) / monthlyInterestRate);

        // 4. Maximum Buying Power
        const maxBuyingPower = maxLoanCapacity + savings;

        res.status(200).json({
            maxBuyingPower: Math.floor(maxBuyingPower), // Round down to nearest LKR
            loanCapacity: Math.floor(maxLoanCapacity),
            monthlyInstallment: Math.floor(maxMonthlyPayment)
        });

    } catch (error) {
        next(error);
    }
});

module.exports = router;
