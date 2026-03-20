const { z } = require('zod');

const registerSchema = z.object({
  body: z.object({
    firstName: z.string().min(2, "Le prénom doit contenir au moins 2 caractères").max(50),
    lastName: z.string().min(2, "Le nom doit contenir au moins 2 caractères").max(50),
    pseudo: z.string().min(3, "Le pseudo doit contenir au moins 3 caractères").max(30),
    phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Format de numéro de téléphone invalide"),
    email: z.string().email("Format d'email invalide"),
    university: z.string().min(2, "Le nom de l'université est requis"),
    password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
  }).strict(),
});

const loginSchema = z.object({
  body: z.object({
    identifier: z.string().min(3, "L'identifiant est requis (email, pseudo ou numero)"),
    password: z.string().min(1, "Le mot de passe est requis"),
  }).strict(),
});

// Middleware de validation générique Zod optimisé
const validate = (schema) => (req, res, next) => {
  try {
    // La bonne pratique : on parse ET on réassigne pour nettoyer les champs toxiques
    const parsed = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    
    req.body = parsed.body;
    req.query = parsed.query;
    req.params = parsed.params;
    
    next();
  } catch (error) {
    const errors = error.errors.map((err) => ({
      path: err.path.join('.'),
      message: err.message,
    }));
    
    return res.status(400).json({
      status: 'fail',
      message: 'Erreur de validation des données',
      errors,
    });
  }
};

module.exports = {
  registerSchema,
  loginSchema,
  validate,
};