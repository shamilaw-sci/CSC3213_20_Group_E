const { z } = require('zod');

const generateHashSchema = z.object({
  body: z.object({
    property_id: z.string().uuid().optional(),
    order_id: z.string().uuid().optional(),
    amount: z.string().or(z.number()).optional()
  }).passthrough().refine(body => body.property_id || body.order_id, 'property_id is required')
});

const notifyWebhookSchema = z.object({
  body: z.object({
    merchant_id: z.string(),
    order_id: z.string(),
    payhere_amount: z.string(),
    payhere_currency: z.string(),
    status_code: z.string().or(z.number()),
    md5sig: z.string()
  }).passthrough()
});

module.exports = {
  generateHashSchema,
  notifyWebhookSchema
};
