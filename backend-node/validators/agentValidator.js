const { z } = require('zod');
const { TIME_WINDOWS } = require('../utils/appointmentSlot');

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
    name: z.string().min(2).max(100).optional(),
    avatar_url: z.string().url("Invalid avatar URL").optional().or(z.literal('')).or(z.null()),
    cover_image_url: z.string().url("Invalid cover image URL").optional().or(z.literal('')).or(z.null()),
    agency_name: z.string().max(150).optional(),
    license_number: z.string().max(100).optional(),
    bio: z.string().max(3000).optional(),
    languages: z.array(z.string()).or(z.string()).optional(),
    youtube_video_url: z.string().url("Invalid YouTube URL").optional().or(z.literal('')).or(z.null()),
    service_areas: z.string().max(500).optional(),
    specialization: z.string().max(200).optional(),
    total_sales: z.number().nonnegative().optional(),
    total_rentals: z.number().nonnegative().optional()
  })
});

const bookViewingSchema = z.object({
  body: z.object({
    client_name: z.string().min(2, "Client name is required"),
    client_email: z.string().email("Valid email is required"),
    client_phone: z.string().min(6, "Valid phone number is required"),
    property_id: z.string().uuid().optional().nullable().or(z.literal('')),
    viewing_type: z.string().max(100).default('In-Person Property Tour'),
    preferred_date: z.iso.date().optional().nullable(),
    preferred_time: z.enum(TIME_WINDOWS).optional().nullable(),
    notes: z.string().max(2000).optional().nullable()
  }),
  params: z.object({
    id: z.string().uuid("Invalid agent ID format")
  })
});

module.exports = {
  reviewSchema,
  updateLeadSchema,
  updateProfileSchema,
  bookViewingSchema
};
