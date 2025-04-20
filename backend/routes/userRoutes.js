const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// POST /api/users/:userId/favorites - Add a story to favorites
router.post('/:userId/favorites', userController.addFavoriteStory);

// GET /api/users/:userId/favorites - Get favorite stories for a user
router.get('/:userId/favorites', userController.getFavoriteStories);

// Add other user-related routes here (e.g., get user profile, update user)

module.exports = router;
