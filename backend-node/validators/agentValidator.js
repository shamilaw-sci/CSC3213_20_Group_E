const { z } = require('zod');

const reviewSchema = z.object({
  body: z.object({
    rating: z.number().min(1).max(5),
    comment: z.string().optional()
  }).passthrough(),
  params: z.object({
    id: z.string().uuid()
  })
});

const updateLeadSchema = z.object({
  body: z.object({
    status: z.string().optional(),
    notes: z.string().optional()
  }).passthrough(),
  params: z.object({
    id: z.string().uuid()
  })
});

const updateProfileSchema = z.object({
  body: z.object({
    bio: z.string().optional(),
    youtubeUrl: z.string().optional(),
    facebookUrl: z.string().optional(),
    instagramUrl: z.string().optional()
  }).passthrough()
});

module.exports = {
  reviewSchema,
  updateLeadSchema,
  updateProfileSchema
};
