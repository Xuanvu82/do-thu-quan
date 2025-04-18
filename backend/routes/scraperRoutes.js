const express = require('express');
const router = express.Router();
const { scrapeWebsite } = require('../tools/scraper');

// [POST] /api/tools/scrape - Scrape data from a website
router.post('/scrape', async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ message: 'URL is required' });
  }

  try {
    const scrapedData = await scrapeWebsite(url);
    res.status(200).json(scrapedData);
  } catch (error) {
    res.status(500).json({ message: 'Failed to scrape data', error: error.message });
  }
});

module.exports = router;