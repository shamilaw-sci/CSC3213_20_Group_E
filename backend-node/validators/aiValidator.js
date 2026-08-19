const { z } = require('zod');

const chatSchema = z.object({
  body: z.object({
    message: z.string().trim().min(1, "Message cannot be empty").max(1000, "Message is too long (max 1000 characters)"),
    history: z.array(
      z.object({
        role: z.enum(['user', 'model']),
        text: z.string().max(2000, "Message text too long"),
      })
    ).max(20, "History is limited to 20 messages").optional(),
  }),
});

module.exports = { chatSchema };
