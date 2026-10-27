const { z } = require('zod');
exports.submitInquirySchema = z.object({
    body: z.object({
        firstName: z.string().trim().min(1).max(100),
        lastName: z.string().trim().min(1).max(100),
        email: z.string().trim().toLowerCase().email().max(254),
        message: z.string().trim().min(10).max(5000),
    }),
});
exports.listInquiriesSchema = z.object({
    query: z.object({ page: z.coerce.number().int().min(1).max(100000).default(1) }),
});
