const { z } = require('zod');

// Shared numeric rules for the core financial inputs
const calculateSchema = z.object({
    body: z.object({
        salary: z.coerce.number()
            .nonnegative("Salary must be zero or a positive number")
            .max(100000000, "Salary value is unrealistically high"),
        savings: z.coerce.number()
            .nonnegative("Savings must be zero or a positive number")
            .max(1000000000, "Savings value is unrealistically high"),
        loanDeductions: z.coerce.number()
            .nonnegative("Loan deductions must be zero or a positive number"),
        tenureYears: z.coerce.number()
            .int("Tenure must be a whole number of years")
            .positive("Tenure must be greater than zero")
            .max(30, "Tenure cannot exceed 30 years"),
    }).refine(data => data.loanDeductions <= data.salary, {
        message: "Loan deductions cannot exceed salary",
        path: ["loanDeductions"],
    }),
});

// Saving a calculation reuses the same core fields, plus the computed results
// returned by the /calculate endpoint (so we don't recompute on the server twice
// with potentially different rounding).
const saveHistorySchema = z.object({
    body: z.object({
        salary: z.coerce.number().nonnegative(),
        savings: z.coerce.number().nonnegative(),
        loanDeductions: z.coerce.number().nonnegative(),
        tenureYears: z.coerce.number().int().positive().max(30),
        maxBuyingPower: z.coerce.number().nonnegative("maxBuyingPower is required"),
        loanCapacity: z.coerce.number().nonnegative().default(0),
        monthlyInstallment: z.coerce.number().nonnegative().default(0),
    }),
});

const historyIdParamSchema = z.object({
    params: z.object({
        id: z.string().uuid("Invalid history entry id"),
    }),
});

module.exports = { calculateSchema, saveHistorySchema, historyIdParamSchema };
