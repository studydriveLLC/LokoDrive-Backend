const express = require('express');
const resourceController = require('../controllers/resourceController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authMiddleware.protect);

router.get('/', resourceController.getResources);
router.get('/:id', resourceController.getResource);
router.post('/:id/download', resourceController.logDownload);

module.exports = router;