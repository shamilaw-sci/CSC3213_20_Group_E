const { z } = require('zod');

const saveSearchSchema = z.object({
    body: z.object({
        title: z.string().trim().min(1).max(255).optional(),
        name: z.string().trim().max(100).optional(),
        polygon: z.string().max(20000, "Polygon data is too large").optional().nullable(),
        beds: z.coerce.number().int().nonnegative().max(20).optional().nullable(),
        baths: z.coerce.number().int().nonnegative().max(20).optional().nullable(),
        property_type: z.string().max(50).optional().nullable(),
        listing_type: z.enum(['Sale', 'Rent', 'sale', 'rent']).optional(),
        min_price: z.number().min(0).optional(),
        max_price: z.number().min(0).optional(),
    }),
});

const savedSearchIdParamSchema = z.object({
    params: z.object({
        id: z.string().uuid("Invalid saved search id"),
    }),
});

const toggleAlertsSchema = z.object({
    params: z.object({
        id: z.string().uuid("Invalid saved search id"),
    }),
    body: z.object({
        emailAlertsEnabled: z.boolean({
            required_error: "emailAlertsEnabled (true/false) is required",
        }),
    }),
});

module.exports = { saveSearchSchema, savedSearchIdParamSchema, toggleAlertsSchema };