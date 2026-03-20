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
    required: [true, 'L\'URL du fichier est obligatoire'] 
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
    enum: ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt'],
    default: 'pdf'
  },
  category: { 
    type: String, 
    required: [true, 'La catégorie est obligatoire'],
    index: true
  },
  level: { 
    type: String, 
    required: [true, 'Le niveau est obligatoire'],
    index: true
  },
  tags: [String],
  uploadedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  views: { 
    type: Number, 
    default: 0 
  },
  downloads: { 
    type: Number, 
    default: 0 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

resourceSchema.index({ title: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Resource', resourceSchema);