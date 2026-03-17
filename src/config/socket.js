const socketIo = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const jwt = require('jsonwebtoken');
const env = require('./env'); // src/config/env.js
const logger = require('./logger'); // src/config/logger.js
const User = require('../models/User'); // Remonte d'un cran vers src/models/
const redisClient = require('./redis'); // src/config/redis.js

let io;
const connectedUsers = new Map();

const initSocket = (server) => {
  io = socketIo(server, {
    cors: {
      origin: env.NODE_ENV === 'production' ? env.CLIENT_URL : '*',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  const pubClient = redisClient.duplicate();
  const subClient = redisClient.duplicate();
  io.adapter(createAdapter(pubClient, subClient));

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Authentification requise'));

      const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';
      const decoded = jwt.verify(token, JWT_SECRET);

      const user = await User.findById(decoded.id).select('_id').lean();
      if (!user) return next(new Error('Utilisateur non trouve'));

      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Token invalide ou expire'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();
    connectedUsers.set(userId, socket.id);
    logger.info(`Utilisateur connecte au Socket: ${userId}`);

    socket.join(`user_${userId}`);

    socket.on('join_conversation', (conversationId) => {
      socket.join(conversationId);
    });

    socket.on('typing', ({ conversationId, isTyping }) => {
      socket.to(conversationId).emit('user_typing', { userId, isTyping });
    });

    socket.on('disconnect', () => {
      connectedUsers.delete(userId);
      logger.info(`Utilisateur deconnecte du Socket: ${userId}`);
    });
  });

  return io;
};

const emitToUser = (userId, event, data) => {
  if (io) {
    io.to(`user_${userId.toString()}`).emit(event, data);
  }
};

const getIo = () => {
  if (!io) throw new Error('Socket.io n\'a pas ete initialise.');
  return io;
};

module.exports = { initSocket, getIo, emitToUser };