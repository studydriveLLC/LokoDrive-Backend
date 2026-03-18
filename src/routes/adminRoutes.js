const express = require('express');
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authMiddleware.protect);
router.use(authMiddleware.restrictTo('admin', 'moderator'));

router.get('/certifications', adminController.getPendingCertifications);
router.patch('/certifications/:id', adminController.handleCertification);

module.exports = router;