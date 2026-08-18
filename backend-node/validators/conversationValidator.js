const { z } = require('zod');

const sendMessageSchema = z.object({
  body: z.object({
    content: z.string().optional()
  }).passthrough(),
  params: z.object({
    id: z.string().uuid()
  })
});

const startConversationSchema = z.object({
  params: z.object({
    propertyId: z.string().uuid().optional(),
    agentId: z.string().uuid().optional()
  }).passthrough()
});

module.exports = {
  sendMessageSchema,
  startConversationSchema
};
