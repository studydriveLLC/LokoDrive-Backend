const cloudinary = require('cloudinary').v2;
const env = require('./env');

// Configuration de Cloudinary avec fallback pour éviter le crash au démarrage si non configuré en dev
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'demo',
  api_key: process.env.CLOUDINARY_API_KEY || '123456789012345',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'secret',
});

module.exports = cloudinary;