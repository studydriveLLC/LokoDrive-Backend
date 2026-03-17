const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const AppError = require('../utils/AppError');
const socketConfig = require('../config/socket');

const getOrCreateConversation = async (currentUserId, targetUserId) => {
  // Cherche une conversation exacte entre ces deux utilisateurs
  let conversation = await Conversation.findOne({
    participants: { $all: [currentUserId, targetUserId], $size: 2 }
  }).populate('participants', 'firstName lastName pseudo');

  if (!conversation) {
    conversation = await Conversation.create({
      participants: [currentUserId, targetUserId],
      unreadCounts: {
        [currentUserId.toString()]: 0,
        [targetUserId.toString()]: 0
      }
    });
    // Populons les données du front-end pour la première création
    conversation = await conversation.populate('participants', 'firstName lastName pseudo');
  }

  return conversation;
};

const getUserConversations = async (userId) => {
  return await Conversation.find({ participants: userId })
    .sort({ updatedAt: -1 })
    .populate('participants', 'firstName lastName pseudo')
    .lean();
};

const getMessages = async (conversationId, userId, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;

  // Sécurité: Vérifier que l'utilisateur fait bien partie de la conversation
  const conversation = await Conversation.findOne({ _id: conversationId, participants: userId }).lean();
  if (!conversation) {
    throw new AppError('Accès refusé à cette conversation.', 403);
  }

  return await Message.find({ conversationId })
    .sort({ createdAt: -1 }) // Les plus récents en premier
    .skip(skip)
    .limit(limit)
    .populate('sender', 'firstName lastName pseudo')
    .lean();
};

const sendMessage = async (senderId, conversationId, content) => {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation || !conversation.participants.includes(senderId)) {
    throw new AppError('Conversation invalide.', 400);
  }

  // 1. Créer le message
  const message = await Message.create({
    conversationId,
    sender: senderId,
    content
  });

  const messagePopulated = await message.populate('sender', 'firstName lastName pseudo');

  // 2. Mettre à jour la conversation (dernier message et compteurs)
  const receiverId = conversation.participants.find(p => p.toString() !== senderId.toString());
  
  const currentUnread = conversation.unreadCounts.get(receiverId.toString()) || 0;
  conversation.unreadCounts.set(receiverId.toString(), currentUnread + 1);
  conversation.lastMessage = {
    text: content,
    sender: senderId,
    createdAt: message.createdAt
  };
  await conversation.save();

  // 3. Temps Réel: Diffuser le message dans le salon (room) Socket.io
  const io = socketConfig.getIo();
  io.to(conversationId.toString()).emit('new_message', messagePopulated);

  // 4. Temps Réel: Notifier le destinataire globalement pour qu'il voit la pastille bleue
  socketConfig.emitToUser(receiverId, 'notification_badge', { 
    type: 'message', 
    conversationId 
  });

  return messagePopulated;
};

const markConversationAsRead = async (conversationId, userId) => {
  const conversation = await Conversation.findById(conversationId);
  if (conversation && conversation.participants.includes(userId)) {
    // Remettre le compteur de cet utilisateur à 0
    conversation.unreadCounts.set(userId.toString(), 0);
    await conversation.save();

    // Mettre à jour le statut des messages reçus à "read"
    await Message.updateMany(
      { conversationId, sender: { $ne: userId }, status: { $ne: 'read' } },
      { $set: { status: 'read' } }
    );
  }
  return true;
};

module.exports = {
  getOrCreateConversation,
  getUserConversations,
  getMessages,
  sendMessage,
  markConversationAsRead
};