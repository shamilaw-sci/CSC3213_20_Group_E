const { z } = require('zod');

const addPropertySchema = z.object({
    body: z.object({
        type: z.string().min(1, "Property type is required"),
        title: z.string().min(3, "Title must be at least 3 characters long"),
        description: z.string().min(10, "Description must be at least 10 characters long"),
        price: z.coerce.number().positive("Price must be a positive number"),
        address: z.string().min(5, "Address is required").optional().or(z.literal('')),
        bedrooms: z.coerce.number().int().nonnegative("Bedrooms must be zero or a positive integer").optional().nullable(),
        bathrooms: z.coerce.number().int().nonnegative("Bathrooms must be zero or a positive integer").optional().nullable(),
        landSize: z.coerce.number().nonnegative("Land size must be a positive number or zero").optional().nullable(),
        latitude: z.coerce.number().min(-90).max(90),
        longitude: z.coerce.number().min(-180).max(180),
        boundary: z.string().optional().nullable(), // WKT Polygon string
    }),
});

const updatePropertySchema = z.object({
    body: z.object({
        type: z.string().optional(),
        title: z.string().min(3).optional(),
        description: z.string().min(10).optional(),
        price: z.coerce.number().positive().optional(),
        address: z.string().min(5).optional().or(z.literal('')),
        bedrooms: z.coerce.number().int().nonnegative().optional().nullable(),
        bathrooms: z.coerce.number().int().nonnegative().optional().nullable(),
        landSize: z.coerce.number().nonnegative().optional().nullable(),
    }),
});

const getPropertiesSchema = z.object({
    query: z.object({
        page: z.coerce.number().int().positive().default(1),
        limit: z.coerce.number().int().positive().default(50),
    }),
});

module.exports = { addPropertySchema, updatePropertySchema, getPropertiesSchema };
