const express = require('express');
const router = express.Router();
const Story = require('../models/Story');

// [GET] /api/stories - Get all stories with optional filters
router.get('/', async (req, res) => {
  try {
    const { category, search } = req.query;
    let filter = {};

    if (category === 'featured') filter = { featured: true };
    if (category === 'new') filter = {}; // Sort by createdAt later
    if (category === 'hot') filter = { hot: true };

    if (search) {
      const regex = new RegExp(search, 'i'); // Case-insensitive search
      filter = { $or: [{ title: regex }, { author: regex }] };
    }

    const stories = await Story.find(filter).sort(
      category === 'new' ? { createdAt: -1 } : {}
    );
    res.json(stories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// [GET] /api/stories/:id - Get story details
router.get('/:id', async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ message: 'Story not found' });
    res.json(story);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// [POST] /api/stories - Add a new story
router.post('/', async (req, res) => {
  try {
    const newStory = new Story(req.body);
    const savedStory = await newStory.save();
    res.status(201).json(savedStory);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// [PUT] /api/stories/:id - Update a story
router.put('/:id', async (req, res) => {
  try {
    const updatedStory = await Story.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedStory) return res.status(404).json({ message: 'Story not found' });
    res.json(updatedStory);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// [DELETE] /api/stories/:id - Delete a story
router.delete('/:id', async (req, res) => {
  try {
    const deletedStory = await Story.findByIdAndDelete(req.params.id);
    if (!deletedStory) return res.status(404).json({ message: 'Story not found' });
    res.json({ message: 'Story deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// [GET] /api/stories/:id/chapters - Get all chapters of a story
router.get('/:id/chapters', async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ message: 'Story not found' });
    res.json(story.chapters);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// [GET] /api/stories/:id/chapters/:chapterId - Get a specific chapter
router.get('/:id/chapters/:chapterId', async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ message: 'Story not found' });
    const chapter = story.chapters.find((chap) => chap.id === req.params.chapterId);
    if (!chapter) return res.status(404).json({ message: 'Chapter not found' });
    res.json(chapter);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;