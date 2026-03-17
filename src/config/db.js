const mongoose = require('mongoose');
const env = require('./env');
const logger = require('./logger');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.MONGO_URI, {
      maxPoolSize: 10, // Maintient jusqu'à 10 connexions ouvertes (idéal pour la charge)
      serverSelectionTimeoutMS: 5000, // Abandonne si le serveur ne répond pas après 5s
      socketTimeoutMS: 45000, // Ferme les sockets inactifs après 45s
    });

    logger.info(`MongoDB Connecté: ${conn.connection.host}`);

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB déconnecté! Tentative de reconnexion...');
    });

    mongoose.connection.on('error', (err) => {
      logger.error('Erreur de connexion MongoDB:', err);
    });

  } catch (error) {
    logger.error('Impossible de se connecter à MongoDB:', error.message);
    process.exit(1); // On tue l'appli si pas de DB
  }
};

module.exports = connectDB;