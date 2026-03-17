const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 150,
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500,
  },
  major: { // Filière d'étude (ex: GMPE, Informatique)
    type: String,
    required: true,
    index: true,
  },
  fileUrl: {
    type: String,
    required: true,
  },
  fileType: {
    type: String,
    required: true,
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  stats: {
    views: { type: Number, default: 0 },
    downloads: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
  }
}, {
  timestamps: true,
});

// Index composé pour trier rapidement les ressources par filière et popularité ou date
resourceSchema.index({ major: 1, createdAt: -1 });

module.exports = mongoose.model('Resource', resourceSchema);