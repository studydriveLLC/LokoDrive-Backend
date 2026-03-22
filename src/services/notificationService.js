const firebaseAdmin = require('../config/firebase');
const Notification = require('../models/Notification');
const User = require('../models/User');
const socketConfig = require('../config/socket');
const logger = require('../config/logger');

/**
 * Fonction centrale pour notifier un utilisateur (In-App + Push FCM + Socket)
 */
const sendNotification = async ({ recipientId, senderId, type, referenceId, content, dataPayload }) => {
  try {
    // 1. Sauvegarde en base de données (In-App Notification)
    const notification = await Notification.create({
      recipient: recipientId,
      sender: senderId,
      type,
      referenceId,
      content
    });

    // 2. Envoi en Temps Réel si l'utilisateur est connecté (Pastille rouge)
    socketConfig.emitToUser(recipientId, 'new_notification', notification);

    // 3. Envoi de la Push Notification (FCM)
    if (firebaseAdmin) {
      const recipient = await User.findById(recipientId).select('fcmTokens').lean();
      
      if (recipient && recipient.fcmTokens && recipient.fcmTokens.length > 0) {
        const message = {
          notification: {
            title: 'LokoNet',
            body: content,
          },
          data: {
            type,
            referenceId: referenceId.toString(),
            ...dataPayload // Données invisibles utilisées par le frontend pour le Deep Linking
          },
          tokens: recipient.fcmTokens, // Envoi à tous les appareils de l'utilisateur
        };

        const response = await firebaseAdmin.messaging().sendMulticast(message);
        
        // Nettoyage des tokens invalides (ex: l'utilisateur a désinstallé l'application)
        if (response.failureCount > 0) {
          const failedTokens = [];
          response.responses.forEach((resp, idx) => {
            if (!resp.success && resp.error.code === 'messaging/registration-token-not-registered') {
              failedTokens.push(recipient.fcmTokens[idx]);
            }
          });

          if (failedTokens.length > 0) {
            await User.findByIdAndUpdate(recipientId, {
              $pull: { fcmTokens: { $in: failedTokens } }
            });
            logger.info(`Nettoyage de ${failedTokens.length} tokens FCM obsolètes pour l'utilisateur ${recipientId}`);
          }
        }
      }
    }

    return notification;
  } catch (error) {
    logger.error('Erreur dans notificationService:', error);
    // On ne jette pas l'erreur pour ne pas bloquer le flux principal (ex: empêcher un like de s'enregistrer si la notif échoue)
  }
};

const getUserNotifications = async (userId, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  return await Notification.find({ recipient: userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('sender', 'firstName lastName pseudo')
    .lean();
};

const markAsRead = async (notificationId, userId) => {
  await Notification.findOneAndUpdate(
    { _id: notificationId, recipient: userId },
    { isRead: true }
  );
  return true;
};

// Fonction appelée par le frontend juste après le login
const registerDeviceToken = async (userId, fcmToken) => {
  await User.findByIdAndUpdate(
    userId,
    { $addToSet: { fcmTokens: fcmToken } }
  );
  return true;
};

const unregisterDeviceToken = async (userId, fcmToken) => {
  await User.findByIdAndUpdate(
    userId,
    { $pull: { fcmTokens: fcmToken } }
  );
  return true;
};

module.exports = {
  sendNotification,
  getUserNotifications,
  markAsRead,
  registerDeviceToken,
  unregisterDeviceToken
};