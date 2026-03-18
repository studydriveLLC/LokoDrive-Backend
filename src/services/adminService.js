const CertificationRequest = require('../models/CertificationRequest');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const notificationService = require('./notificationService');

const getAllPendingRequests = async (page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  return await CertificationRequest.find({ status: 'pending' })
    .populate('user', 'firstName lastName pseudo university email')
    .sort({ createdAt: 1 })
    .skip(skip)
    .limit(limit)
    .lean();
};

const processCertification = async (requestId, adminId, decision, notes) => {
  const request = await CertificationRequest.findById(requestId);

  if (!request) {
    throw new AppError('Demande de certification introuvable.', 404);
  }

  if (request.status !== 'pending') {
    throw new AppError('Cette demande a deja ete traitee par un autre administrateur.', 400);
  }

  request.status = decision;
  request.adminNotes = notes || '';
  request.processedBy = adminId;
  request.processedAt = Date.now();
  await request.save();

  if (decision === 'approved') {
    await User.findByIdAndUpdate(request.user, { isVerified: true });
  }

  const type = decision === 'approved' ? 'badge_approved' : 'badge_rejected';
  const content = decision === 'approved' 
    ? "Felicitation ! Votre demande de certification a ete acceptee." 
    : "Votre demande de certification a ete refusee.";

  await notificationService.sendNotification({
    recipientId: request.user,
    senderId: adminId,
    type,
    referenceId: request._id,
    content,
    dataPayload: { status: decision }
  });

  return request;
};

module.exports = {
  getAllPendingRequests,
  processCertification
};