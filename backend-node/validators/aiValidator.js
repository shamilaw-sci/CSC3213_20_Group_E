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

// Model tool declarations are guidance; validate model output again before any DB query.
const literalSearch = max => z.string().trim().min(1).max(max)
  .regex(/^[\p{L}\p{M}\p{N}\u200c\u200d '.\u2019-]+$/u);
const toolArgumentSchemas = Object.freeze({
  search_properties: z.object({
    location: literalSearch(120).optional(),
    type: literalSearch(80).optional(),
    maxPrice: z.number().finite().nonnegative().optional(),
  }).strict(),
  search_agents: z.object({ location: literalSearch(120) }).strict(),
});

module.exports = { chatSchema, toolArgumentSchemas };
