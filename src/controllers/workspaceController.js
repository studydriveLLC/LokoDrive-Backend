const workspaceService = require('../services/workspaceService');

// --- Section MyWord ---

const initDocument = async (req, res, next) => {
  try {
    const document = await workspaceService.createDocument(req.user._id);
    
    res.status(201).json({
      status: 'success',
      data: { document }
    });
  } catch (error) {
    next(error);
  }
};

const saveDocument = async (req, res, next) => {
  try {
    const { documentId } = req.params;
    const document = await workspaceService.autoSaveDocument(documentId, req.user._id, req.body);
    
    res.status(200).json({
      status: 'success',
      data: { document }
    });
  } catch (error) {
    next(error);
  }
};

const getMyDocuments = async (req, res, next) => {
  try {
    const documents = await workspaceService.getUserDocuments(req.user._id);
    
    res.status(200).json({
      status: 'success',
      results: documents.length,
      data: { documents }
    });
  } catch (error) {
    next(error);
  }
};

// --- Section Ressources ---

const uploadResource = async (req, res, next) => {
  try {
    const resource = await workspaceService.createResource(req.user._id, req.body, req.file);
    
    res.status(201).json({
      status: 'success',
      data: { resource }
    });
  } catch (error) {
    next(error);
  }
};

const getResources = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const major = req.query.major; // Filtrage optionnel par filière

    const resources = await workspaceService.getResourcesByMajor(major, page, limit);

    res.status(200).json({
      status: 'success',
      results: resources.length,
      data: { resources }
    });
  } catch (error) {
    next(error);
  }
};

const trackDownload = async (req, res, next) => {
  try {
    const { resourceId } = req.params;
    await workspaceService.incrementDownload(resourceId);
    
    res.status(200).json({
      status: 'success'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  initDocument,
  saveDocument,
  getMyDocuments,
  uploadResource,
  getResources,
  trackDownload,
};