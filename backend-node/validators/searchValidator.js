const { z } = require('zod');

const searchPropertiesSchema = z.object({
    query: z.object({
        q: z.string().trim().min(1, "Search query 'q' is required").max(200, "Search query is too long"),
        limit: z.coerce.number().int().positive().max(50).optional(),
    }),
});

module.exports = { searchPropertiesSchema };
