const User = require('../models/User');
const AppError = require('../utils/AppError');

const registerUser = async (userData) => {
  // Verification de l'existence prealable (email, pseudo ou telephone)
  const existingUser = await User.findOne({
    $or: [
      { email: userData.email },
      { pseudo: userData.pseudo },
      { phone: userData.phone },
    ],
  }).lean();

  if (existingUser) {
    throw new AppError('Un utilisateur avec cet email, pseudo ou numero existe deja.', 409);
  }

  // Creation de l'utilisateur (le mot de passe sera hache par le hook Mongoose)
  const newUser = await User.create(userData);

  // On retire le mot de passe de l'objet renvoye
  const userResponse = newUser.toObject();
  delete userResponse.password;

  return userResponse;
};

const loginUser = async (identifier, password) => {
  // Recherche par email, pseudo ou telephone
  // On doit explicitement demander le mot de passe car il est en select: false
  const user = await User.findOne({
    $or: [
      { email: identifier.toLowerCase() },
      { pseudo: identifier },
      { phone: identifier },
    ],
  }).select('+password');

  if (!user) {
    throw new AppError('Identifiants incorrects.', 401);
  }

  // Verification du mot de passe
  const isPasswordCorrect = await user.comparePassword(password, user.password);

  if (!isPasswordCorrect) {
    throw new AppError('Identifiants incorrects.', 401);
  }

  const userResponse = user.toObject();
  delete userResponse.password;

  return userResponse;
};

module.exports = {
  registerUser,
  loginUser,
};