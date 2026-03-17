const express = require('express');
const socialController = require('../controllers/socialController');
const socialValidation = require('../validations/socialValidation');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// Toutes les routes sociales exigent d'être connecté
router.use(authMiddleware.protect);

// Actions d'abonnement
router.post(
  '/follow/:targetId',
  socialValidation.validate(socialValidation.targetUserSchema),
  socialController.follow
);

router.post(
  '/unfollow/:targetId',
  socialValidation.validate(socialValidation.targetUserSchema),
  socialController.unfollow
);

// Actions de publication
router.post(
  '/posts',
  socialValidation.validate(socialValidation.createPostSchema),
  socialController.createPost
);

// Fil d'actualité
router.get(
  '/feed',
  socialController.getFeed
);

module.exports = router;