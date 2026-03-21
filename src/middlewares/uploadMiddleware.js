const multer = require('multer');
const AppError = require('../utils/AppError');
const path = require('path');
const fs = require('fs');
const logger = require('../config/logger');

// Création robuste du dossier temporaire calquée sur Yély
const uploadDir = path.join(__dirname, '../../uploads/temp');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    
    // LA SOLUTION TIRÉE DE YÉLY : Nettoyage strict mais souple du nom de fichier
    const originalName = file.originalname || 'document.pdf';
    const safeName = originalName.replace(/[^a-zA-Z0-9.]/g, '');
    
    // On s'assure d'inclure le fieldname comme dans Yély
    cb(null, `${file.fieldname}-${uniqueSuffix}-${safeName}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png'
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    // Dans Yély, si le mimetype est bizarre mais commence par image/, tu laisses passer (dans validateFileSignature).
    // Ici on assouplit pour laisser passer les octet-stream si on ne peut pas faire autrement, 
    // l'extension fera foi plus tard si besoin, ou on le bloque ici. 
    // On reste strict sur les mimetypes autorisés pour LokoDrive.
    cb(new AppError('Format de fichier non supporté. Seuls les PDF, DOCX, XLSX et Images sont autorisés.', 400), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15 MB
  },
});

module.exports = upload;