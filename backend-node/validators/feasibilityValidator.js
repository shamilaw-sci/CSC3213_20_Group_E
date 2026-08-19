const { z } = require('zod');

const calculateFeasibilitySchema = z.object({
  body: z.object({
    salary: z.coerce.number().min(0, "Salary must be a positive number"),
    savings: z.coerce.number().min(0, "Savings must be a positive number").default(0),
    loanDeductions: z.coerce.number().min(0, "Loan deductions must be a positive number").default(0),
    tenureYears: z.coerce.number().min(1, "Tenure must be at least 1 year").max(40, "Tenure cannot exceed 40 years").default(20),
  }),
});

module.exports = { calculateFeasibilitySchema };
