const authService = require('../services/authService');
const tokenService = require('../services/tokenService');
const env = require('../config/env');

// Configuration du cookie HttpOnly pour le Refresh Token
const cookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
};

const register = async (req, res, next) => {
  try {
    const user = await authService.registerUser(req.body);
    const tokens = tokenService.generateAuthTokens(user._id);

    res.cookie('refreshToken', tokens.refreshToken, cookieOptions);

    res.status(201).json({
      status: 'success',
      data: {
        user,
        accessToken: tokens.accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { identifier, password } = req.body;
    
    const user = await authService.loginUser(identifier, password);
    const tokens = tokenService.generateAuthTokens(user._id);

    res.cookie('refreshToken', tokens.refreshToken, cookieOptions);

    res.status(200).json({
      status: 'success',
      data: {
        user,
        accessToken: tokens.accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

const logout = (req, res) => {
  res.cookie('refreshToken', 'loggedout', {
    ...cookieOptions,
    maxAge: 10 * 1000, // Expire dans 10 secondes
  });

  res.status(200).json({ status: 'success' });
};

module.exports = {
  register,
  login,
  logout,
};