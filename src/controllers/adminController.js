const adminService = require('../services/adminService');

const getPendingCertifications = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;

    const requests = await adminService.getAllPendingRequests(page, limit);

    res.status(200).json({
      status: 'success',
      results: requests.length,
      data: { requests }
    });
  } catch (error) {
    next(error);
  }
};

const handleCertification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { decision, notes } = req.body;

    if (!['approved', 'rejected'].includes(decision)) {
      return res.status(400).json({ status: 'fail', message: 'La decision doit etre approved ou rejected' });
    }

    const request = await adminService.processCertification(id, req.user._id, decision, notes);

    res.status(200).json({
      status: 'success',
      data: { request }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPendingCertifications,
  handleCertification
};