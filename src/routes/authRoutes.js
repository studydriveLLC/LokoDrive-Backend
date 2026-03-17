const express = require('express');
const authController = require('../controllers/authController');
const authValidation = require('../validations/authValidation');

const router = express.Router();

router.post(
  '/register',
  authValidation.validate(authValidation.registerSchema),
  authController.register
);

router.post(
  '/login',
  authValidation.validate(authValidation.loginSchema),
  authController.login
);

router.post('/logout', authController.logout);

module.exports = router;