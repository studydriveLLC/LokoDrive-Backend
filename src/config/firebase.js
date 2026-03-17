const admin = require('firebase-admin');
const logger = require('./logger');

const initializeFirebase = () => {
  try {
    // Vérification de la présence des variables requises
    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_PRIVATE_KEY || !process.env.FIREBASE_CLIENT_EMAIL) {
      logger.warn('Configuration Firebase manquante. Les notifications push seront désactivées.');
      return null;
    }

    // Traitement de la clé privée pour s'assurer que les retours à la ligne sont respectés (problème fréquent sur les hébergeurs)
    const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
    });

    logger.info('Firebase Admin initialisé avec succès.');
    return admin;
  } catch (error) {
    logger.error('Erreur lors de l\'initialisation de Firebase:', error);
    return null;
  }
};

const firebaseAdmin = initializeFirebase();

module.exports = firebaseAdmin;