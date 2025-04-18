const mongoose = require('mongoose');

const chapterSchema = mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
});

const storySchema = mongoose.Schema(
  {
    title: { type: String, required: true },
    author: { type: String, required: true },
    genres: [{ type: String }],
    description: { type: String },
    coverImage: { type: String },
    chapters: [chapterSchema],
    status: { type: String, enum: ['completed', 'ongoing'], default: 'ongoing' },
    featured: { type: Boolean, default: false },
    hot: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Story', storySchema);