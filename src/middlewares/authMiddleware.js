const AppError = require('../utils/AppError');
const tokenService = require('../services/tokenService');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    let token;

    // 1. Verifier si le token est present dans le header Authorization
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw new AppError('Vous n\'etes pas connecte. Veuillez vous connecter pour acceder a cette ressource.', 401);
    }

    // 2. Verifier la validite du token
    const decoded = tokenService.verifyAccessToken(token);

    // 3. Verifier si l'utilisateur existe toujours
    const currentUser = await User.findById(decoded.id).lean();
    if (!currentUser) {
      throw new AppError('L\'utilisateur appartenant a ce token n\'existe plus.', 401);
    }

    // 4. Placer l'utilisateur dans l'objet de requete pour les prochains middlewares/controleurs
    req.user = currentUser;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  protect,
};