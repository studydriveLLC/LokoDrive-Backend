const express = require('express');
const notificationController = require('../controllers/notificationController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authMiddleware.protect);

router.post('/register-token', notificationController.registerToken);
router.post('/unregister-token', notificationController.unregisterToken);
router.get('/', notificationController.getMyNotifications);
router.patch('/:id/read', notificationController.markNotificationRead);

module.exports = router;