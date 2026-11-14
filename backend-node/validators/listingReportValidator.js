const { z } = require('zod');

const categories = ['misleading', 'fraud', 'duplicate', 'unavailable', 'inappropriate', 'other'];
const submitListingReportSchema = z.object({ body: z.object({
    propertyId: z.string().uuid(), category: z.enum(categories), reason: z.string().trim().min(10).max(2000)
}).strict() });
const resolveListingReportSchema = z.object({ params: z.object({ id: z.string().uuid() }), body: z.object({
    action: z.enum(['dismiss', 'archive_listing']), note: z.string().trim().min(10).max(2000), expectedStatus: z.literal('open')
}).strict() });
const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
    const parsed = new Date(value); return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}, 'Invalid date');
const listingReportQuerySchema = z.object({ query: z.object({
    page: z.coerce.number().int().min(1).max(100000).default(1), limit: z.coerce.number().int().min(1).max(100).default(20),
    status: z.enum(['open', 'dismissed', 'actioned', 'all']).default('open'), search: z.string().trim().max(100).default(''),
    from: day.optional(), to: day.optional()
}).refine(value => !value.from || !value.to || value.from <= value.to, 'Start date must precede end date') });
module.exports = { submitListingReportSchema, resolveListingReportSchema, listingReportQuerySchema };
