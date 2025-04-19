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

    // --- Use XPath with following-sibling ---
    const titleXPath = "//*[@id='truyen']/div[1]/div[1]/div[1]/following-sibling::h3[@class='title']";
    let title = 'Unknown Title';

    try {
      console.log(`Waiting for XPath and evaluating: ${titleXPath}`);
      // Use page.evaluate with document.evaluate for XPath
      title = await page.evaluate((xpath) => {
        const element = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        // Add extra logging inside evaluate
        if (element) {
            console.log('XPath found element:', element, 'innerText:', element.innerText);
        } else {
            console.log('XPath did not find element.');
        }
        return element ? element.innerText.trim() : 'Unknown Title (XPath Eval)';
      }, titleXPath); // Pass XPath to evaluate

      console.log(`Title extracted via XPath evaluate: ${title}`);

      if (title === 'Unknown Title (XPath Eval)') {
          console.warn(`Warning: XPath "${titleXPath}" did not find the element or element has no text.`);
          title = 'Unknown Title'; // Reset to standard unknown
          // Log HTML for debugging if XPath fails - moved outside evaluate
      } else if (!title) {
          console.warn(`Warning: Extracted title is empty using XPath ${titleXPath}.`);
          title = 'Unknown Title'; // Reset if empty
      }

    } catch (error) {
      console.error(`Error during page.evaluate with XPath "${titleXPath}":`, error);
       // Keep title as 'Unknown Title'
       // Log HTML outside evaluate
    }

    // Log HTML if title is still unknown after evaluate attempt
    if (title === 'Unknown Title') {
        try {
            console.log(`--- Page HTML Content on Title Unknown (${titleXPath}) ---`);
            const pageContentOnError = await page.content();
            console.log(pageContentOnError.substring(0, 5000));
            console.log('--- End of Page HTML Content Snippet ---');
        } catch (htmlError) {
            console.error("Could not get HTML content for debugging:", htmlError);
        }
    }

    // --- Scrape other details ---
    const otherData = await page.evaluate(() => {
        const author = document.querySelector('.author-name')?.innerText || 'Unknown Author';
        const description = document.querySelector('.story-description')?.innerText || 'No description available';
        const coverImage = document.querySelector('img.story-cover')?.getAttribute('src') || '';
        const genreElements = document.querySelectorAll('.genres-list a');
        const genres = Array.from(genreElements).map(el => el.innerText.trim());
        const chapterElements = document.querySelectorAll('#chapters-list .chapter-link');
        const chapters = Array.from(chapterElements).map((el, index) => ({
            id: el.getAttribute('href') || `chapter-${index + 1}`,
            title: el.innerText.trim() || `Chapter ${index + 1}`,
        }));
        return { author, description, coverImage, genres, chapters };
    });

    const storyData = { title, ...otherData }; // Combine title with other data

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

    return storyData;
  } catch (error) {
    console.error('Error scraping website:', error);
    throw error;
  } finally {
     // Ensure browser is closed even if errors occur
     if (browser) {
       console.log('Closing browser...');
       await browser.close();
     }
  }
}

module.exports = { scrapeWebsite };