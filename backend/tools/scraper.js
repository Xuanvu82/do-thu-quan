const puppeteer = require('puppeteer');
const Story = require('../models/Story');
// const Chapter = require('../models/Chapter'); // Assuming you might have a separate Chapter model or want to handle chapters

async function scrapeWebsite(url) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  try {
    // Validate URL
    if (!url.startsWith('http')) {
      throw new Error('Invalid URL');
    }

    await page.goto(url, { waitUntil: 'networkidle0' }); // Wait until network is idle, might be better for dynamic content

    // --- Explicitly wait for the XPath target ---
    const titleXPath = '//*[@id="truyen"]/div[1]/div[1]/div[1]';
    try {
      console.log(`Waiting for XPath: ${titleXPath}`);
      await page.waitForXPath(titleXPath, { timeout: 15000 }); // Wait up to 15 seconds
      console.log('XPath target found.');
    } catch (error) {
      console.error('Timeout or error waiting for title XPath:', error);
      // Decide how to handle this - maybe return null or throw specific error
      // For now, we'll let evaluate try anyway, it might still work sometimes
    }

    // Scrape story details including genres and chapter list
    const storyData = await page.evaluate((xpath) => {
      // --- Log inside evaluate ---
      console.log('Inside page.evaluate');
      let titleElement = null;
      let title = 'Unknown Title';
      try {
        titleElement = document.evaluate(
          xpath, // Use the passed XPath
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null
        ).singleNodeValue;

        if (titleElement) {
          console.log('Title element found via XPath:', titleElement);
          // Check innerText and textContent
          console.log('Title element innerText:', titleElement.innerText);
          console.log('Title element textContent:', titleElement.textContent);
          title = titleElement.innerText?.trim() || titleElement.textContent?.trim() || 'Title Found, No Text';
        } else {
          console.log('Title element NOT found via XPath.');
        }
      } catch (e) {
        console.error('Error during XPath evaluation in browser context:', e);
      }

      // --- Fallback attempt with CSS selector (optional) ---
      if (title === 'Unknown Title' || title === 'Title Found, No Text') {
          console.log('XPath failed or returned no text, trying CSS selector h3.title[itemprop="name"]');
          const cssElement = document.querySelector('h3.title[itemprop="name"]');
          if (cssElement) {
              console.log('Title element found via CSS:', cssElement);
              console.log('CSS element innerText:', cssElement.innerText);
              console.log('CSS element textContent:', cssElement.textContent);
              title = cssElement.innerText?.trim() || cssElement.textContent?.trim() || 'Title Found via CSS, No Text';
          } else {
              console.log('CSS selector also failed.');
          }
      }

      // --- Rest of the selectors ---
      const author = document.querySelector('.author-name')?.innerText || 'Unknown Author'; // Adjust selector if needed
      const description = document.querySelector('.story-description')?.innerText || 'No description available'; // Adjust selector
      const coverImage = document.querySelector('img.story-cover')?.getAttribute('src') || ''; // Adjust selector

      // --- Genre and Chapter Scraping ---
      const genreElements = document.querySelectorAll('.genres-list a'); // Placeholder selector
      const genres = Array.from(genreElements).map(el => el.innerText.trim());
      const chapterElements = document.querySelectorAll('#chapters-list .chapter-link'); // Placeholder selector
      const chapters = Array.from(chapterElements).map((el, index) => ({
        id: el.getAttribute('href') || `chapter-${index + 1}`,
        title: el.innerText.trim() || `Chapter ${index + 1}`,
      }));

      return { title, author, description, coverImage, genres, chapters };
    }, titleXPath); // Pass the XPath to evaluate

    console.log('Scraped Story Data:', storyData);

    // --- Updated Database Saving ---
    // Check if story already exists (optional, based on title/author or URL)
    let existingStory = await Story.findOne({ title: storyData.title, author: storyData.author });

    if (existingStory) {
      console.log('Story already exists. Skipping save.');
      // Optionally, update existing story here if needed
    } else {
      // Save to database
      const newStory = new Story({
        title: storyData.title,
        author: storyData.author,
        description: storyData.description,
        coverImage: storyData.coverImage,
        genres: storyData.genres, // Save genres
        // chapters: storyData.chapters, // Save basic chapter info (title, id)
        // Note: The Story model expects chapter content.
        // Saving full chapters requires scraping content for each one.
        // For now, we are only scraping the list. You might need a separate
        // process or model adjustments to handle full chapter data.
      });

       // --- Handle Chapters Separately (Example) ---
       // If you want to save chapters according to the schema (including content placeholder)
       // you might map the scraped chapters. This still lacks the actual content.
       const chaptersToSave = storyData.chapters.map(chap => ({
         id: chap.id, // Use the scraped ID/link part
         title: chap.title,
         content: `Content for ${chap.title} needs scraping.` // Placeholder content
       }));
       newStory.chapters = chaptersToSave;

      await newStory.save();
      console.log('Story with basic chapter list saved to database');
    }

    await browser.close();
    return storyData;
  } catch (error) {
    console.error('Error scraping website:', error);
    await browser.close();
    throw error;
  }
}

module.exports = { scrapeWebsite };