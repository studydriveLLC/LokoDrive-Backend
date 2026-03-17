const Document = require('../models/Document');
const Resource = require('../models/Resource');
const AppError = require('../utils/AppError');

const createDocument = async (authorId) => {
  return await Document.create({ author: authorId });
};

const autoSaveDocument = async (documentId, authorId, updateData) => {
  // Utilisation de findOneAndUpdate pour une exécution en une seule requête DB
  const document = await Document.findOneAndUpdate(
    { _id: documentId, author: authorId },
    { 
      $set: { 
        ...updateData, 
        lastSavedAt: Date.now() 
      } 
    },
    { new: true, runValidators: true }
  ).lean();

  if (!document) {
    throw new AppError('Document introuvable ou vous n\'en êtes pas l\'auteur.', 404);
  }

  return document;
};

const getUserDocuments = async (authorId) => {
  // lean() est crucial ici pour des performances maximales en lecture seule
  return await Document.find({ author: authorId })
    .sort({ updatedAt: -1 })
    .select('title status lastSavedAt updatedAt')
    .lean();
};

const createResource = async (authorId, resourceData, fileData) => {
  if (!fileData) {
    throw new AppError('Le fichier est obligatoire.', 400);
  }

  const resource = await Resource.create({
    title: resourceData.title,
    description: resourceData.description,
    major: resourceData.major,
    fileUrl: fileData.path, // URL fournie par Cloudinary
    fileType: fileData.mimetype,
    author: authorId,
  });

  return resource;
};

const getResourcesByMajor = async (major, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  const resources = await Resource.find(major ? { major } : {})
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('author', 'firstName lastName pseudo')
    .lean();

  return resources;
};

// Incrémente le compteur sans verrouiller le document pour les autres lectures
const incrementDownload = async (resourceId) => {
  await Resource.findByIdAndUpdate(resourceId, { $inc: { 'stats.downloads': 1 } });
};

module.exports = {
  createDocument,
  autoSaveDocument,
  getUserDocuments,
  createResource,
  getResourcesByMajor,
  incrementDownload,
};