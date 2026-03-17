require('dotenv').config();
const { z } = require('zod');

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('5000'),
  MONGO_URI: z.string().url("MONGO_URI doit être une URL valide"),
  CLIENT_URL: z.string().url("CLIENT_URL doit être une URL valide"),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('Erreur critique: Variables d\'environnement invalides');
  console.error(_env.error.format());
  process.exit(1);
}

module.exports = _env.data;