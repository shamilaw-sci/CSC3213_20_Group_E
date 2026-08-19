const { z } = require('zod');

const generateHashSchema = z.object({
  body: z.object({
    order_id: z.string().or(z.number()),
    amount: z.string().or(z.number())
  }).passthrough()
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
