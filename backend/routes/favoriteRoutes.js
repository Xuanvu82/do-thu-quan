const express = require('express');
const router = express.Router();
const favoriteController = require('../controllers/favoriteController');

// POST /api/favorites - Add a story to favorites based on IP
router.post('/', favoriteController.addFavoriteByIP);

// GET /api/favorites - Get favorite stories based on IP
router.get('/', favoriteController.getFavoritesByIP);

// DELETE /api/favorites/:storyId - Remove a story from favorites based on IP
router.delete('/:storyId', favoriteController.removeFavoriteByIP);

module.exports = router;
