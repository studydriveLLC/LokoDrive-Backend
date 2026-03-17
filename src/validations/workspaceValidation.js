const { z } = require('zod');

const autoSaveSchema = z.object({
  body: z.object({
    title: z.string().max(100).optional(),
    content: z.string().optional(),
    status: z.enum(['draft', 'ready']).optional(),
  }).strict(),
  params: z.object({
    documentId: z.string().regex(/^[0-9a-fA-F]{24}$/, "ID de document invalide"),
  })
});

const createResourceSchema = z.object({
  body: z.object({
    title: z.string().min(3).max(150),
    description: z.string().max(500).optional(),
    major: z.string().min(2),
  })
});

module.exports = {
  autoSaveSchema,
  createResourceSchema,
};