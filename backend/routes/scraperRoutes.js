const express = require('express');
const router = express.Router();
const { scrapeWebsite } = require('../tools/scraper');

// [POST] /api/tools/scrape - Scrape data from a website
router.post('/scrape', async (req, res) => {
  const { url, startChapterIndex, endChapterIndex, delaySeconds } = req.body;

  if (!url) {
    console.error('Scrape request failed: URL is missing');
    return res.status(400).json({ message: 'URL is required' });
  }

  // Validate and prepare options
  const options = {};
  if (startChapterIndex !== undefined && startChapterIndex !== null && !isNaN(parseInt(startChapterIndex))) {
    options.startChapterIndex = parseInt(startChapterIndex, 10) - 1; // Convert 1-based index from user to 0-based for function
    if (options.startChapterIndex < 0) options.startChapterIndex = 0; // Ensure it's not negative
  }
  if (endChapterIndex !== undefined && endChapterIndex !== null && !isNaN(parseInt(endChapterIndex))) {
    options.endChapterIndex = parseInt(endChapterIndex, 10) - 1; // Convert 1-based index from user to 0-based for function
    if (options.endChapterIndex < 0) options.endChapterIndex = Infinity; // Handle invalid input gracefully
  }
  if (delaySeconds !== undefined && delaySeconds !== null && !isNaN(parseFloat(delaySeconds))) {
    options.delayMs = parseFloat(delaySeconds) * 1000; // Convert seconds to milliseconds
    if (options.delayMs < 0) options.delayMs = 0; // Ensure non-negative delay
  }

  console.log(`Received scrape request for URL: ${url} with options:`, options);

  try {
    const scrapedData = await scrapeWebsite(url, options);

    // Check if scraper returned an error object
    if (scrapedData && scrapedData.error) {
      console.error("Scraping failed:", scrapedData.message);
      return res.status(500).json({ message: `Scraping failed: ${scrapedData.message}` });
    }

    // Check if essential data like title is missing after scrape attempt
    if (!scrapedData || !scrapedData.title || scrapedData.title.startsWith('Unknown Title')) {
      console.warn('Scraping completed but essential data might be missing or incorrect.');
    }

    console.log(`Scraping successful for ${url}. Chapters scraped: ${scrapedData?.chapters?.length || 0}`);
    res.status(200).json(scrapedData);
  } catch (error) {
    console.error('Error in scrape route handler:', error);
    res.status(500).json({ message: 'Failed to scrape website', error: error.message });
  }
});

module.exports = router;