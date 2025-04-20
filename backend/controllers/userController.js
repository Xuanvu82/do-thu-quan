const User = require('../models/User');
const Story = require('../models/Story');
const mongoose = require('mongoose');

// Add a story to a user's favorites
exports.addFavoriteStory = async (req, res) => {
  const { userId } = req.params; // Assuming userId is in the route params like /api/users/:userId/favorites
  const { storyId } = req.body;

  // Basic validation
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: 'Invalid User ID format' });
  }
  if (!mongoose.Types.ObjectId.isValid(storyId)) {
    return res.status(400).json({ message: 'Invalid Story ID format' });
  }

  try {
    // Find the user and the story concurrently
    const [user, story] = await Promise.all([
      User.findById(userId),
      Story.findById(storyId).select('_id') // Only select _id to check existence
    ]);

    // Check if user and story exist
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }

    // Check if the story is already in favorites
    // Convert ObjectId to string for comparison if necessary, or use $addToSet
    if (user.favoriteStories.includes(storyId)) {
      return res.status(400).json({ message: 'Story already in favorites' });
    }

    // Add story to favorites using $addToSet to prevent duplicates implicitly
    user.favoriteStories.addToSet(storyId);
    await user.save();

    res.status(200).json({ message: 'Story added to favorites successfully', favorites: user.favoriteStories });

  } catch (error) {
    console.error('Error adding favorite story:', error);
    res.status(500).json({ message: 'Server error while adding favorite' });
  }
};

// Get user's favorite stories (Optional, but useful)
exports.getFavoriteStories = async (req, res) => {
  const { userId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: 'Invalid User ID format' });
  }

  try {
    const user = await User.findById(userId).populate('favoriteStories'); // Populate the story details

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(user.favoriteStories);

  } catch (error) {
    console.error('Error getting favorite stories:', error);
    res.status(500).json({ message: 'Server error while getting favorites' });
  }
};
