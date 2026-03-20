const resourceService = require('../services/resourceService');
const catchAsync = require('../utils/catchAsync');

exports.getResources = catchAsync(async (req, res) => {
  const data = await resourceService.getAllResources(req.query);
  res.status(200).json({
    status: 'success',
    data
  });
});

exports.getResource = catchAsync(async (req, res) => {
  const resource = await resourceService.getResourceById(req.params.id);
  res.status(200).json({
    status: 'success',
    data: { resource }
  });
});

exports.logDownload = catchAsync(async (req, res) => {
  const resource = await resourceService.trackDownload(req.params.id);
  res.status(200).json({
    status: 'success',
    data: { 
      id: resource._id,
      downloads: resource.downloads 
    }
  });
});