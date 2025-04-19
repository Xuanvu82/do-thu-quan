const express = require('express');
const router = express.Router();
const { scrapeWebsite } = require('../tools/scraper');

// [POST] /api/tools/scrape - Scrape data from a website
router.post('/scrape', async (req, res) => {
  console.log('--- Received POST /api/tools/scrape request ---'); // Add this log
  const { url } = req.body;
  if (!url) {
    console.error('Scrape request failed: URL is missing'); // Add error log
    return res.status(400).json({ message: 'URL is required' });
  }
  console.log(`Scraping URL: ${url}`); // Log the URL being scraped

  try {
    const scrapedData = await scrapeWebsite(url);
    res.status(200).json(scrapedData);
  } catch (error) {
    console.error('Scrape route error:', error); // Add detailed error logging here
    res.status(500).json({ message: 'Failed to scrape data', error: error.message });
  }
});

module.exports = router;