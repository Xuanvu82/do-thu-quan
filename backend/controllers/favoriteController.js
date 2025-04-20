const IPFavorite = require('../models/IPFavorite');
const Story = require('../models/Story');
const mongoose = require('mongoose');

// Add a story to favorites based on IP address
exports.addFavoriteByIP = async (req, res) => {
  const ipAddress = req.ip; // Get IP address from request
  const { storyId } = req.body;

  if (!ipAddress) {
    return res.status(400).json({ message: 'Could not determine IP address.' });
  }

  if (!mongoose.Types.ObjectId.isValid(storyId)) {
    return res.status(400).json({ message: 'Invalid Story ID format' });
  }

  try {
    // Check if story exists
    const storyExists = await Story.findById(storyId).select('_id');
    if (!storyExists) {
      return res.status(404).json({ message: 'Story not found' });
    }

    // Find the IPFavorite document for this IP or create it if it doesn't exist
    // Add the storyId to the favoriteStories array using $addToSet to prevent duplicates
    const updatedFavorites = await IPFavorite.findOneAndUpdate(
      { ipAddress: ipAddress },
      { $addToSet: { favoriteStories: storyId } },
      {
        new: true, // Return the updated document
        upsert: true, // Create the document if it doesn't exist
        select: 'favoriteStories' // Only return the favorites array
      }
    );

    res.status(200).json({ message: 'Story added to favorites successfully', favorites: updatedFavorites.favoriteStories });

  } catch (error) {
    console.error('Error adding favorite story by IP:', error);
    res.status(500).json({ message: 'Server error while adding favorite' });
  }
};

// Get favorite stories based on IP address
exports.getFavoritesByIP = async (req, res) => {
  const ipAddress = req.ip;

  if (!ipAddress) {
    return res.status(400).json({ message: 'Could not determine IP address.' });
  }

  try {
    const favoritesDoc = await IPFavorite.findOne({ ipAddress: ipAddress })
                                         .populate('favoriteStories'); // Populate story details

    if (!favoritesDoc) {
      // If no document exists for this IP, return an empty array
      return res.status(200).json([]);
    }

    res.status(200).json(favoritesDoc.favoriteStories);

  } catch (error) {
    console.error('Error getting favorite stories by IP:', error);
    res.status(500).json({ message: 'Server error while getting favorites' });
  }
};

// Remove a story from favorites based on IP address
exports.removeFavoriteByIP = async (req, res) => {
  const ipAddress = req.ip;
  const { storyId } = req.params; // Get storyId from route parameter

  if (!ipAddress) {
    return res.status(400).json({ message: 'Could not determine IP address.' });
  }

  if (!mongoose.Types.ObjectId.isValid(storyId)) {
    return res.status(400).json({ message: 'Invalid Story ID format' });
  }

  try {
    // Find the IPFavorite document and pull the storyId from the array
    const updatedFavorites = await IPFavorite.findOneAndUpdate(
      { ipAddress: ipAddress },
      { $pull: { favoriteStories: storyId } }, // Use $pull to remove the item
      {
        new: true, // Return the updated document
        select: 'favoriteStories' // Only return the favorites array
      }
    );

    if (!updatedFavorites) {
      // If no document for the IP, it means the story wasn't favorited anyway
      return res.status(200).json({ message: 'Story was not in favorites.', favorites: [] });
    }

    res.status(200).json({ message: 'Story removed from favorites successfully', favorites: updatedFavorites.favoriteStories });

  } catch (error) {
    console.error('Error removing favorite story by IP:', error);
    res.status(500).json({ message: 'Server error while removing favorite' });
  }
};
