const { z } = require('zod');

const reviewSchema = z.object({
  body: z.object({
    rating: z.number().min(1).max(5),
    comment: z.string().max(1000).optional()
  }),
  params: z.object({
    id: z.string().uuid("Invalid agent ID format")
  })
});

const updateLeadSchema = z.object({
  body: z.object({
    lead_status: z.enum(['New', 'Contacted', 'Showing', 'Offer', 'Closed']).optional(),
    timeframe: z.string().max(100).optional(),
    pre_approved: z.boolean().optional(),
    notes: z.string().max(2000).optional()
  }),
  params: z.object({
    id: z.string().uuid("Invalid lead ID format")
  })
});

const updateProfileSchema = z.object({
  body: z.object({
    agency_name: z.string().max(150).optional(),
    license_number: z.string().max(100).optional(),
    bio: z.string().max(3000).optional(),
    languages: z.array(z.string()).or(z.string()).optional(),
    youtube_video_url: z.string().url("Invalid YouTube URL").optional().or(z.literal('')),
    service_areas: z.string().max(500).optional(),
    specialization: z.string().max(200).optional()
  })
});

module.exports = {
  reviewSchema,
  updateLeadSchema,
  updateProfileSchema
};
