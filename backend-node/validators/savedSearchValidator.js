const { z } = require('zod');

const saveSearchSchema = z.object({
  body: z.object({
    title: z.string().trim().max(100).optional(),
    name: z.string().trim().max(100).optional(),
    polygon: z.string().max(4096).optional(),
    beds: z.union([z.number().int().min(0).max(50), z.string()]).optional(),
    baths: z.union([z.number().int().min(0).max(50), z.string()]).optional(),
    property_type: z.string().max(50).optional(),
    listing_type: z.enum(['Sale', 'Rent', 'sale', 'rent']).optional(),
    min_price: z.number().min(0).optional(),
    max_price: z.number().min(0).optional(),
  }),
});

const deleteSavedSearchSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid saved search ID format"),
  }),
});

module.exports = { saveSearchSchema, deleteSavedSearchSchema };
