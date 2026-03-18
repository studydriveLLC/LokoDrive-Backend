const userService = require('../services/userService');
const env = require('../config/env');

const cookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 10 * 1000, 
};

const deleteMe = async (req, res, next) => {
  try {
    await userService.deleteAccount(req.user._id);

    res.cookie('refreshToken', 'loggedout', cookieOptions);

    res.status(200).json({
      status: 'success',
      message: 'Compte supprime avec succes.'
    });
  } catch (error) {
    next(error);
  }
};

const requestCertification = async (req, res, next) => {
  try {
    const request = await userService.submitCertificationRequest(req.user._id);

    res.status(201).json({
      status: 'success',
      data: { request }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  deleteMe,
  requestCertification
};