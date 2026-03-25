// src/routes/resourceRoutes.js
const express = require('express');
const resourceController = require('../controllers/resourceController');
const authMiddleware = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');
const resourceValidation = require('../validations/resourceValidation');

const router = express.Router();

router.use(authMiddleware.protect);

router.get('/', resourceController.getResources);
router.get('/me', resourceController.getMyResources);
router.get('/:id', resourceController.getResource);

router.patch('/:id/view', resourceController.logView);
router.patch('/:id/download', resourceController.logDownload);
// NOUVEAU : Route pour logger les partages (alignee sur le standard PATCH de ton API)
router.patch('/:id/share', resourceController.logShare);

router.post(
  '/',
  upload.single('file'),
  resourceValidation.validate(resourceValidation.createResourceSchema),
  resourceController.uploadResource
);

router.put('/:id', resourceController.updateResource);
router.delete('/:id', resourceController.deleteResource);
router.post('/:id/favorite', resourceController.toggleFavorite);

router.post('/:id/signal', resourceController.reportResource);

module.exports = router;