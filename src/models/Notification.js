const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // Peut être null si c'est une notification système (ex: Badge validé)
  },
  type: {
    type: String,
    enum: ['like', 'comment', 'message', 'badge_approved', 'badge_rejected', 'system'],
    required: true
  },
  referenceId: {
    type: mongoose.Schema.Types.ObjectId, // ID du post, du commentaire ou de la conversation
    required: true
  },
  content: {
    type: String, // ex: "Kevyamon a commenté votre publication."
    required: true
  },
  isRead: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index pour lister rapidement les notifications non lues d'un utilisateur
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);