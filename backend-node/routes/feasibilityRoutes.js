const express = require('express');
const router = express.Router();

/**
 * @desc Calculate maximum buying power based on financial inputs
 * @route POST /api/feasibility/calculate
 * @access Public
 */
router.post('/calculate', (req, res) => {
    try {
        const { salary, savings, loanDeductions, tenureYears } = req.body;

        // Input validation
        if (salary < 0 || savings < 0 || loanDeductions < 0 || tenureYears <= 0) {
            return res.status(400).json({ message: "Invalid positive numeric inputs required." });
        }

        // 1. Net Disposable Income Calculation
        // Assuming 40% of salary goes to living expenses as a safety buffer
        const livingExpenses = salary * 0.40;
        const netDisposableIncome = salary - loanDeductions - livingExpenses;

        if (netDisposableIncome <= 0) {
            return res.status(200).json({ 
                maxBuyingPower: savings, 
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
        res.status(500).json({ message: "Server error during calculation", error: error.message });
    }
});

module.exports = router;
