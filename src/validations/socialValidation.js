const { z } = require('zod');

const createPostSchema = z.object({
  body: z.object({
    text: z.string().max(3000, "Le texte ne peut pas dépasser 3000 caractères").optional(),
    mediaUrls: z.array(z.string().url("URL de média invalide")).optional(),
    mediaType: z.enum(['image', 'video', 'none']).default('none'),
  }).refine(data => data.text || (data.mediaUrls && data.mediaUrls.length > 0), {
    message: "Une publication doit contenir au moins du texte ou un média."
  }).strict()
});

const targetUserSchema = z.object({
  params: z.object({
    targetId: z.string().regex(/^[0-9a-fA-F]{24}$/, "ID d'utilisateur invalide")
  })
});

module.exports = {
  createPostSchema,
  targetUserSchema
};