const resourceService = require('../services/resourceService');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const { uploadQueue } = require('../workers/uploadQueue');
const path = require('path');

const getFormatFromMime = (mimetype, filename) => {
  if (mimetype === 'application/pdf') return 'pdf';
  if (mimetype === 'application/msword') return 'doc';
  if (mimetype.includes('wordprocessingml.document')) return 'docx';
  if (mimetype.includes('spreadsheetml.sheet')) return 'xlsx';
  if (mimetype === 'image/jpeg') return 'jpg';
  if (mimetype === 'image/png') return 'png';

  const ext = path.extname(filename).replace('.', '').toLowerCase();
  return ext || 'pdf';
};

exports.getResources = catchAsync(async (req, res) => {
  const data = await resourceService.getAllResources(req.query);
  res.status(200).json({ status: 'success', data });
});

exports.getResource = catchAsync(async (req, res) => {
  const resource = await resourceService.getResourceById(req.params.id);
  res.status(200).json({ status: 'success', data: { resource } });
});

exports.logDownload = catchAsync(async (req, res) => {
  const resource = await resourceService.trackDownload(req.params.id);
  res.status(200).json({
    status: 'success',
    data: { id: resource._id, downloads: resource.downloads }
  });
});

exports.uploadResource = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('Aucun fichier n\'a ete recu.', 400));
  }

  const { title, category, level, description } = req.body;

  const format = getFormatFromMime(req.file.mimetype, req.file.originalname);
  const defaultDescription = description || `Document de ${category} pour le niveau ${level}.`;

  const resource = await resourceService.createResource({
    title,
    description: defaultDescription,
    category,
    level,
    format,
    fileSize: req.file.size,
    uploadedBy: req.user._id,
    tempFilePath: req.file.path,
    status: 'processing'
  });

  await uploadQueue.add('upload-to-cloudinary', {
    resourceId: resource._id.toString(),
    tempFilePath: req.file.path,
    originalName: req.file.originalname
  });

  res.status(202).json({
    status: 'success',
    message: 'Votre document est en cours de traitement. Il sera disponible dans quelques instants.',
    data: { resource }
  });
});