const AppError = require('../utils/AppError');
const tokenService = require('../services/tokenService');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw new AppError('Vous n\'etes pas connecte. Veuillez vous connecter pour acceder a cette ressource.', 401);
    }

    const decoded = tokenService.verifyAccessToken(token);

    // On inclut explicitement isDeleted car il est en select: false par defaut
    const currentUser = await User.findById(decoded.id).select('+isDeleted').lean();
    
    if (!currentUser) {
      throw new AppError('L\'utilisateur appartenant a ce token n\'existe plus.', 401);
    }

    if (currentUser.isDeleted) {
      throw new AppError('Ce compte a ete supprime.', 401);
    }

    req.user = currentUser;
    next();
  } catch (error) {
    next(error);
  }
};

const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('Vous n\'avez pas la permission d\'effectuer cette action.', 403));
    }
    next();
  };
};

module.exports = {
  protect,
  restrictTo
};