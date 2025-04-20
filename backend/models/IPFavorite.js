const mongoose = require('mongoose');

const ipFavoriteSchema = new mongoose.Schema({
  ipAddress: {
    type: String,
    required: true,
    unique: true, // Each IP should have one document
    index: true, // Index for faster lookups
  },
  favoriteStories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Story'
  }]
}, { timestamps: true });

module.exports = mongoose.model('IPFavorite', ipFavoriteSchema);
