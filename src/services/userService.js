const User = require('../models/User');
const CertificationRequest = require('../models/CertificationRequest');
const AppError = require('../utils/AppError');

const deleteAccount = async (userId) => {
  const user = await User.findByIdAndUpdate(userId, {
    isDeleted: true,
    deletedAt: Date.now(),
    fcmTokens: [],
  });

  if (!user) {
    throw new AppError('Utilisateur introuvable.', 404);
  }
  return true;
};

const submitCertificationRequest = async (userId) => {
  const existingRequest = await CertificationRequest.findOne({ user: userId });

  if (existingRequest && existingRequest.status === 'pending') {
    throw new AppError('Vous avez deja une demande en cours de traitement.', 400);
  }

  if (existingRequest && existingRequest.status === 'approved') {
    throw new AppError('Vous etes deja certifie.', 400);
  }

  if (existingRequest && existingRequest.status === 'rejected') {
    existingRequest.status = 'pending';
    existingRequest.adminNotes = '';
    existingRequest.processedBy = undefined;
    existingRequest.processedAt = undefined;
    await existingRequest.save();
    return existingRequest;
  }

  const newRequest = await CertificationRequest.create({ user: userId });
  return newRequest;
};

module.exports = {
  deleteAccount,
  submitCertificationRequest
};