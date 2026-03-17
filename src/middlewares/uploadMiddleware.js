const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');
const AppError = require('../utils/AppError');

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'studydrive_resources',
    allowed_formats: ['pdf', 'doc', 'docx', 'jpg', 'png'],
    resource_type: 'auto',
  },
});

const fileFilter = (req, file, cb) => {
  // Sécurité: Vérification stricte du type MIME
  const allowedMimeTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png'
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Format de fichier non supporté. Seuls les PDF, DOCX et Images sont autorisés.', 400), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // Limite stricte à 10 Megaoctets pour éviter le déni de service (DoS)
  },
});

module.exports = upload;