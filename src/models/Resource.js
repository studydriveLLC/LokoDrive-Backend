const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Le titre est obligatoire'],
    trim: true,
    index: true
  },
  description: {
    type: String,
    required: [true, 'La description est obligatoire']
  },
  fileUrl: {
    type: String,
    default: null
  },
  thumbnail: {
    type: String,
    default: null
  },
  fileSize: {
    type: Number,
    required: [true, 'La taille du fichier est requise']
  },
  format: {
    type: String,
    enum: ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt', 'jpg', 'jpeg', 'png'],
    default: 'pdf'
  },
  category: {
    type: String,
    required: [true, 'La categorie est obligatoire'],
    trim: true,
    minlength: [2, 'La filiere doit contenir au moins 2 caracteres'],
    maxlength: [100, 'La filiere est trop longue'],
    index: true
  },
  level: {
    type: String,
    required: [true, 'Le niveau est obligatoire'],
    trim: true,
    index: true
  },
  tags: [String],
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['processing', 'ready', 'failed'],
    default: 'processing',
    index: true
  },
  tempFilePath: {
    type: String,
    default: null
  },
  views: {
    type: Number,
    default: 0,
    min: 0
  },
  downloads: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

resourceSchema.index({ title: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Resource', resourceSchema);