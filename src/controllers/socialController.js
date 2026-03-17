const socialService = require('../services/socialService');

const follow = async (req, res, next) => {
  try {
    const { targetId } = req.params;
    await socialService.followUser(req.user._id, targetId);
    
    res.status(200).json({
      status: 'success',
      message: 'Utilisateur suivi avec succès.'
    });
  } catch (error) {
    next(error);
  }
};

const unfollow = async (req, res, next) => {
  try {
    const { targetId } = req.params;
    await socialService.unfollowUser(req.user._id, targetId);
    
    res.status(200).json({
      status: 'success',
      message: 'Utilisateur désabonné avec succès.'
    });
  } catch (error) {
    next(error);
  }
};

const createPost = async (req, res, next) => {
  try {
    const post = await socialService.createPost(req.user._id, req.body);
    
    res.status(201).json({
      status: 'success',
      data: { post }
    });
  } catch (error) {
    next(error);
  }
};

const getFeed = async (req, res, next) => {
  try {
    // Conversion sécurisée des paramètres de requête (Query params)
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;

    const posts = await socialService.getUserFeed(req.user._id, page, limit);

    res.status(200).json({
      status: 'success',
      results: posts.length,
      data: { posts }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  follow,
  unfollow,
  createPost,
  getFeed
};