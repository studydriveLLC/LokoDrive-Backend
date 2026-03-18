const express = require('express');
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authMiddleware.protect);

router.delete('/delete-me', userController.deleteMe);
router.post('/request-certification', userController.requestCertification);

module.exports = router;