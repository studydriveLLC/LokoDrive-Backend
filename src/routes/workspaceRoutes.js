const express = require('express');
const workspaceController = require('../controllers/workspaceController');
const workspaceValidation = require('../validations/workspaceValidation');
const authMiddleware = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

const router = express.Router();

router.use(authMiddleware.protect);

// Routes MyWord
router.post('/documents', workspaceController.initDocument);
router.get('/documents', workspaceController.getMyDocuments);
router.patch(
  '/documents/:documentId',
  workspaceValidation.validate(workspaceValidation.autoSaveSchema),
  workspaceController.saveDocument
);

// Routes Ressources
router.post(
  '/resources',
  upload.single('file'), // Intercepte le fichier nommé "file" dans le form-data
  workspaceValidation.validate(workspaceValidation.createResourceSchema),
  workspaceController.uploadResource
);

router.get('/resources', workspaceController.getResources);
router.post('/resources/:resourceId/download', workspaceController.trackDownload);

module.exports = router;