const mongoose = require('mongoose');

const feedSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  posts: [{
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
    addedAt: { type: Date, default: Date.now }
  }]
});

module.exports = mongoose.model('Feed', feedSchema);