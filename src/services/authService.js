// src/services/authService.js
const User = require('../models/User');
const AppError = require('../utils/AppError');
const bcrypt = require('bcrypt');
const env = require('../config/env');

const registerUser = async (userData) => {
  const existingUser = await User.findOne({
    $or: [
      { email: userData.email.toLowerCase() },
      { pseudo: userData.pseudo },
      { phone: userData.phone },
    ],
  }).lean();

  if (existingUser) {
    throw new AppError('Un utilisateur avec cet email, pseudo ou numero existe deja.', 409);
  }

  const normalizedEmail = userData.email.toLowerCase();
  const isSuperAdminEmail = env.SUPER_ADMIN_MAIL &&
    normalizedEmail === env.SUPER_ADMIN_MAIL.toLowerCase();

  const userRole = isSuperAdminEmail ? 'superadmin' : (userData.role || 'user');
  const userBadgeType = isSuperAdminEmail ? 'superadmin' : (userData.badgeType || 'none');

  const newUser = await User.create({
    ...userData,
    role: userRole,
    badgeType: userBadgeType,
  });

  const userResponse = newUser.toObject();
  delete userResponse.password;

  return userResponse;
};

const loginUser = async (identifier, password) => {
  const user = await User.findOne({
    $or: [
      { email: identifier.toLowerCase() },
      { pseudo: identifier },
      { phone: identifier },
    ],
    isDeleted: { $ne: true }
  }).select('+password');

  if (!user) {
    throw new AppError('Identifiants incorrects ou compte introuvable.', 401);
  }

  let isPasswordCorrect = false;
  if (user.password) {
    isPasswordCorrect = await bcrypt.compare(password, user.password);
  }

  if (!isPasswordCorrect) {
    throw new AppError('Identifiants incorrects.', 401);
  }

  const userResponse = user.toObject();
  delete userResponse.password;

  return userResponse;
};

const updatePassword = async (userId, currentPassword, newPassword) => {
  // 1. On recupere l'utilisateur (lean() n'est pas utilise ici car on a juste besoin des donnees brutes pour la comparaison)
  const user = await User.findById(userId).select('+password').lean();
  if (!user) {
    throw new AppError('Utilisateur introuvable.', 404);
  }

  // 2. On verifie que l'ancien mot de passe est rigoureusement exact
  const isPasswordCorrect = await bcrypt.compare(currentPassword, user.password);
  if (!isPasswordCorrect) {
    throw new AppError('L\'ancien mot de passe est incorrect.', 401);
  }

  // 3. On securise et hache le nouveau mot de passe manuellement (Bypass du hook pre-save)
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  // 4. Injection directe en base de donnees
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { password: hashedPassword },
    { new: true, runValidators: true }
  ).select('-password').lean();

  return updatedUser;
};

module.exports = {
  registerUser,
  loginUser,
  updatePassword 
};