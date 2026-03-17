const User = require('../models/User');
const Post = require('../models/Post');
const Feed = require('../models/Feed');
const AppError = require('../utils/AppError');
const { feedQueue } = require('../workers/feedQueue');
const notificationService = require('./notificationService');
const mongoose = require('mongoose');

const followUser = async (currentUserId, targetUserId) => {
  if (currentUserId.toString() === targetUserId.toString()) {
    throw new AppError('Vous ne pouvez pas vous suivre vous-même.', 400);
  }

  // 1. Mise à jour atomique des relations
  const targetUser = await User.findByIdAndUpdate(
    targetUserId,
    { $addToSet: { followers: currentUserId } },
    { new: true }
  ).lean();

  if (!targetUser) {
    throw new AppError('Utilisateur cible introuvable.', 404);
  }

  const currentUser = await User.findByIdAndUpdate(
    currentUserId,
    { $addToSet: { following: targetUserId } },
    { new: true }
  ).lean();

  // 2. Notification (Push + In-App + Socket)
  // On informe la cible que l'utilisateur actuel vient de s'abonner
  await notificationService.sendNotification({
    recipientId: targetUserId,
    senderId: currentUserId,
    type: 'system', // ou un type 'follow' si tu souhaites le rajouter à l'enum
    referenceId: currentUserId,
    content: `${currentUser.pseudo} vient de s'abonner à vous.`,
    dataPayload: { screen: 'Profile', userId: currentUserId.toString() }
  });

  return true;
};

const unfollowUser = async (currentUserId, targetUserId) => {
  const targetUser = await User.findByIdAndUpdate(
    targetUserId,
    { $pull: { followers: currentUserId } },
    { new: true }
  );

  if (!targetUser) {
    throw new AppError('Utilisateur cible introuvable.', 404);
  }

  await User.findByIdAndUpdate(
    currentUserId,
    { $pull: { following: targetUserId } }
  );

  return true;
};

const createPost = async (authorId, postData) => {
  // 1. Création de la publication en base
  const post = await Post.create({
    author: authorId,
    content: {
      text: postData.text,
      mediaUrls: postData.mediaUrls || [],
      mediaType: postData.mediaType
    }
  });

  // 2. Distribution asynchrone via Redis (BullMQ)
  // On utilise une file d'attente pour gérer la charge si l'auteur a beaucoup de followers
  await feedQueue.add('fanout', { 
    postId: post._id, 
    authorId 
  }, { 
    attempts: 3, // Réessaie 3 fois en cas d'erreur de la BDD
    backoff: { type: 'exponential', delay: 1000 }, // Attend de plus en plus longtemps entre les essais
    removeOnComplete: true // Nettoie Redis une fois terminé pour économiser la RAM
  });

  // 3. Mise à jour immédiate du propre feed de l'auteur
  await Feed.findOneAndUpdate(
    { user: authorId },
    {
      $push: {
        posts: {
          $each: [{ post: post._id, addedAt: new Date() }],
          $position: 0,
          $slice: 500
        }
      }
    },
    { upsert: true }
  );

  return post;
};

const getUserFeed = async (userId, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  const feed = await Feed.findOne(
    { user: userId },
    { posts: { $slice: [skip, limit] } }
  ).populate({
    path: 'posts.post',
    populate: { path: 'author', select: 'firstName lastName pseudo university' }
  }).lean();

  if (!feed) {
    return [];
  }

  return feed.posts.map(p => p.post);
};

module.exports = {
  followUser,
  unfollowUser,
  createPost,
  getUserFeed
};