const Redis = require('ioredis');
const logger = require('./logger');

// Vérification stricte de la variable d'environnement
if (!process.env.REDIS_URI) {
  logger.fatal('REDIS_URI est manquant dans les variables d\'environnement.');
  process.exit(1);
}

// Configuration du client Redis optimisée pour la production
const redisClient = new Redis(process.env.REDIS_URI, {
  maxRetriesPerRequest: null, // Obligatoire pour BullMQ
  enableReadyCheck: false,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
});

redisClient.on('connect', () => {
  logger.info('Connexion à Redis établie.');
});

redisClient.on('error', (err) => {
  logger.error('Erreur de connexion Redis:', err);
});

module.exports = redisClient;