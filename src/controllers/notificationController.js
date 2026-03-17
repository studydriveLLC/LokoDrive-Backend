const notificationService = require('../services/notificationService');

const registerToken = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ status: 'fail', message: 'Token requis' });
    }

    await notificationService.registerDeviceToken(req.user._id, token);
    
    res.status(200).json({ status: 'success', message: 'Token enregistré avec succès' });
  } catch (error) {
    next(error);
  }
};

const unregisterToken = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ status: 'fail', message: 'Token requis' });
    }

    await notificationService.unregisterDeviceToken(req.user._id, token);
    
    res.status(200).json({ status: 'success', message: 'Token supprimé avec succès' });
  } catch (error) {
    next(error);
  }
};

const getMyNotifications = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;

    const notifications = await notificationService.getUserNotifications(req.user._id, page, limit);

    res.status(200).json({
      status: 'success',
      results: notifications.length,
      data: { notifications }
    });
  } catch (error) {
    next(error);
  }
};

const markNotificationRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    await notificationService.markAsRead(id, req.user._id);

    res.status(200).json({ status: 'success' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerToken,
  unregisterToken,
  getMyNotifications,
  markNotificationRead
};