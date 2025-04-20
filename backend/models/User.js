const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true, // Assuming username should be unique
  },
  // Add other user fields as needed (e.g., password, email)
  favoriteStories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Story' // Reference to the Story model
  }]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
