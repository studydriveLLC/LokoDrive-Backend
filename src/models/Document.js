const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
    default: 'Document sans titre',
    maxlength: 100,
  },
  content: {
    type: String, // Stockera le HTML riche ou le code LaTeX formaté
    default: '',
  },
  status: {
    type: String,
    enum: ['draft', 'ready'],
    default: 'draft',
  },
  lastSavedAt: {
    type: Date,
    default: Date.now,
  }
}, {
  timestamps: true,
});

// Index pour lister rapidement les documents d'un utilisateur par date de modification
documentSchema.index({ author: 1, updatedAt: -1 });

module.exports = mongoose.model('Document', documentSchema);