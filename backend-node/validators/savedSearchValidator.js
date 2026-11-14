const { z } = require('zod');

const savedSearchFiltersSchema = z.object({
    version: z.literal(1),
    searchTerm: z.string().max(200).default(''),
    listingType: z.enum(['Sale', 'Rent', 'Sold']).default('Sale'),
    minPrice: z.number().min(0).max(1000000000000).nullable().default(null),
    maxPrice: z.number().min(0).max(1000000000000).nullable().default(null),
    beds: z.number().int().min(0).max(50).nullable().default(null),
    baths: z.number().int().min(0).max(50).nullable().default(null),
    exactMatch: z.boolean().default(false),
    has360Tour: z.boolean().default(false),
    propTypes: z.object({
        House: z.boolean(), Land: z.boolean(), Apartment: z.boolean(), Villa: z.boolean(),
    }).strict(),
}).strict().refine(filters => filters.minPrice === null || filters.maxPrice === null || filters.minPrice <= filters.maxPrice, {
    message: 'Minimum price cannot exceed maximum price', path: ['minPrice'],
});

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
        filters: savedSearchFiltersSchema.optional(),
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

module.exports = { saveSearchSchema, savedSearchIdParamSchema, toggleAlertsSchema, savedSearchFiltersSchema };
