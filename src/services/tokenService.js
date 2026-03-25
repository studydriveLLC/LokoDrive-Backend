// src/services/tokenService.js
const jwt = require('jsonwebtoken');
const env = require('../config/env');

// Utilisation stricte des variables d'environnement de la configuration globale.
// Suppression de crypto.randomBytes pour eviter l'invalidation a chaque redemarrage du serveur.
const JWT_SECRET = env.JWT_SECRET || 'lokonet_default_secret_key_12345';
const JWT_EXPIRES_IN = env.JWT_EXPIRES_IN || '15m';

const JWT_REFRESH_SECRET = env.JWT_REFRESH_SECRET || 'lokonet_default_refresh_secret_key_12345';
const JWT_REFRESH_EXPIRES_IN = env.JWT_REFRESH_EXPIRES_IN || '7d';

const generateAuthTokens = (userId) => {
  const accessToken = jwt.sign({ id: userId }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });

  const refreshToken = jwt.sign({ id: userId }, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
  });

  return {
    accessToken,
    refreshToken,
  };
};

const verifyAccessToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, JWT_REFRESH_SECRET);
};

module.exports = {
  generateAuthTokens,
  verifyAccessToken,
  verifyRefreshToken,
};