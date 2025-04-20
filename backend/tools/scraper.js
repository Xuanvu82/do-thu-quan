const puppeteer = require('puppeteer');
const Story = require('../models/Story');

// Add options parameter with default values
async function scrapeWebsite(url, options = {}) {
  const {
    startChapterIndex = 0, // Default: start from the first chapter (index 0)
    endChapterIndex = Infinity, // Default: scrape until the last chapter
    delayMs = 1000 // Default: 1 second delay between chapters
  } = options;

  console.log(`Scraping options: start=${startChapterIndex}, end=${endChapterIndex}, delay=${delayMs}ms`);

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  // Set a realistic user agent
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
  // Increase default timeout
  page.setDefaultNavigationTimeout(60000); // 60 seconds

  try {
    console.log(`Navigating to URL: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle0' });
    console.log('Page navigation complete, network idle.');

    // --- Scrape Title --- // Updated XPath based on previous debugging
    const titleXPath = "//h3[@class='title']"; // Simpler XPath, adjust if needed
    let title = 'Unknown Title';
    try {
      console.log(`Waiting for XPath and evaluating: ${titleXPath}`);
      const titleElement = await page.waitForXPath(titleXPath, { timeout: 10000 }); // Wait for element
      if (titleElement) {
        title = await page.evaluate(el => el.innerText.trim(), titleElement);
        console.log(`Title extracted via XPath evaluate: ${title}`);
      } else {
        console.warn(`Warning: XPath "${titleXPath}" did not find the title element.`);
        title = 'Unknown Title (XPath Not Found)';
      }
    } catch (error) {
      console.error(`Error during title scraping with XPath "${titleXPath}":`, error);
      title = 'Unknown Title (Error)';
    }

    if (title.startsWith('Unknown Title')) {
        console.warn('Could not determine story title. Proceeding with caution.');
        // Log HTML snippet for debugging title issues
        try {
            console.log(`--- Page HTML Content on Title Unknown (${titleXPath}) ---`);
            const pageContentOnError = await page.content();
            console.log(pageContentOnError.substring(0, 5000)); // Log first 5KB
            console.log('--- End of Page HTML Content Snippet ---');
        } catch (htmlError) {
            console.error("Could not get HTML content for debugging title:", htmlError);
        }
        // Decide if you want to proceed without a title or throw an error
        // For now, we proceed but log the issue.
    }


    // --- Scrape other details AND chapter list --- // Updated selectors based on common patterns
    const initialData = await page.evaluate(() => {
        const author = document.querySelector('.info a[itemprop="author"]')?.innerText || document.querySelector('.info div:contains("Tác giả") a')?.innerText || 'Unknown Author';
        const description = document.querySelector('.desc-text[itemprop="description"]')?.innerText || document.querySelector('.desc-text')?.innerText || 'No description available';
        const coverImage = document.querySelector('.book img[itemprop="image"]')?.getAttribute('src') || document.querySelector('.book img')?.getAttribute('src') || '';
        const genreElements = document.querySelectorAll('.info a[itemprop="genre"]') || document.querySelectorAll('.info div:contains("Thể loại") a');
        const genres = Array.from(genreElements).map(el => el.innerText.trim());

        // !!! IMPORTANT: Verify this selector for the specific website !!!
        // Try common selectors for chapter lists
        const chapterSelectors = [
            '#list-chapter .row a', // Common pattern 1
            '.list-chapter li a',   // Common pattern 2
            '#chapters-list .chapter-link', // Original selector
            '.chapter-list a'       // Another common pattern
        ];
        let chapterElements = [];
        for (const selector of chapterSelectors) {
            chapterElements = document.querySelectorAll(selector);
            if (chapterElements.length > 0) {
                console.log(`Found ${chapterElements.length} chapter elements using selector '${selector}'`);
                break; // Use the first selector that works
            }
        }
        if (chapterElements.length === 0) {
             console.warn('Could not find chapter list using common selectors.');
        }

        const chapters = Array.from(chapterElements).map((el, index) => {
             const href = el.getAttribute('href');
             const chapterUrl = href ? new URL(href, document.baseURI).href : null; // Resolve relative URLs robustly
             const chapterTitle = el.innerText.trim() || `Chapter ${index + 1}`;
             // console.log(`Chapter ${index}: Title='${chapterTitle}', Raw Href='${href}', Resolved URL='${chapterUrl}'`);
             return {
                // Use URL as ID if available and valid, otherwise generate one
                id: chapterUrl && chapterUrl.startsWith('http') ? chapterUrl : `chap-${index}-${Date.now()}`,
                title: chapterTitle,
                url: chapterUrl,
                content: ''
             };
        }).filter(chap => chap.url && chap.url.startsWith('http')); // Ensure chapters have valid, absolute URLs

        console.log(`Filtered down to ${chapters.length} chapters with valid URLs.`);
        return { author, description, coverImage, genres, chapters };
    });

    let storyData = { title, ...initialData };
    console.log(`Found ${storyData.chapters.length} total chapters with valid URLs.`);

    // --- Filter chapters based on options --- // Ensure indices are numbers
    const startIdx = parseInt(startChapterIndex, 10) || 0;
    const endIdx = parseInt(endChapterIndex, 10);
    const actualEndIdx = isNaN(endIdx) || endIdx < 0 ? storyData.chapters.length -1 : Math.min(endIdx, storyData.chapters.length - 1);

    const chaptersToScrape = storyData.chapters.slice(startIdx, actualEndIdx + 1); // end index is inclusive
    console.log(`Selected ${chaptersToScrape.length} chapters to scrape (Index ${startIdx} to ${actualEndIdx}).`);


    // --- Scrape Content for Each Selected Chapter --- // Updated selectors
    // !!! IMPORTANT: Verify this selector for the specific website !!!
    const chapterContentSelectors = [
        '#chapter-c', // Common pattern 1
        '.reading-content', // Common pattern 2
        '#content', // Common pattern 3
        '#chapter-content' // Original selector
    ];
    let chapterContentSelector = chapterContentSelectors[chapterContentSelectors.length - 1]; // Default to original

    for (let i = 0; i < chaptersToScrape.length; i++) {
        const chapter = chaptersToScrape[i];
        const overallIndex = storyData.chapters.findIndex(c => c.id === chapter.id); // Get original index for logging

        if (!chapter.url) {
            console.warn(`Skipping chapter ${overallIndex + 1} ("${chapter.title}") due to missing URL.`);
            chapter.content = 'Error: Missing URL';
            continue;
        }

        try {
            console.log(`Navigating to chapter ${overallIndex + 1}/${storyData.chapters.length}: "${chapter.title}" (${chapter.url})`);
            await page.goto(chapter.url, { waitUntil: 'networkidle0' });

            // Find the correct content selector for this page (only needs to be done once per scrape ideally)
            if (i === 0) { // Check selectors only for the first chapter in the batch
                for (const selector of chapterContentSelectors) {
                    const contentElement = await page.$(selector);
                    if (contentElement) {
                        chapterContentSelector = selector;
                        console.log(`Using chapter content selector: ${chapterContentSelector}`);
                        break;
                    }
                }
            }

            const content = await page.evaluate((selector) => {
                const contentElement = document.querySelector(selector);
                 if (!contentElement) {
                    console.error(`Content selector "${selector}" not found on page ${document.URL}`);
                    // Log HTML snippet for debugging content issues
                    console.log(`--- Page HTML Content Snippet on Content Not Found (${selector}) ---`);
                    console.log(document.body.innerHTML.substring(0, 3000)); // Log first 3KB of body
                    console.log('--- End of Page HTML Content Snippet ---');
                    return `Error: Content selector "${selector}" not found.`;
                }
                // Use innerHTML to preserve basic formatting like <p>, <br>
                // Remove potential ad scripts or unwanted elements if necessary
                // Example: Remove script tags within the content
                contentElement.querySelectorAll('script, style, iframe, ins, .adsbygoogle').forEach(el => el.remove());
                return contentElement.innerHTML.trim();
            }, chapterContentSelector);

            if (content.startsWith('Error:')) {
                 console.error(`Failed to scrape content for chapter ${overallIndex + 1}: ${content}`);
            } else {
                 console.log(` -> Scraped content length: ${content.length}`);
            }
            chapter.content = content;


            // Add delay if not the last chapter in the selected range
            const actualDelay = parseInt(delayMs, 10) || 0;
            if (i < chaptersToScrape.length - 1 && actualDelay > 0) {
                console.log(`Waiting for ${actualDelay}ms before next chapter...`);
                await new Promise(resolve => setTimeout(resolve, actualDelay));
            }

        } catch (chapterError) {
            console.error(`Error scraping chapter ${overallIndex + 1} ("${chapter.title}") at URL ${chapter.url}:`, chapterError.message);
            chapter.content = `Error scraping: ${chapterError.message}`;
             // Log HTML snippet on general chapter error
            try {
                console.log(`--- Page HTML Content Snippet on Chapter Error (${chapter.url}) ---`);
                const pageContentOnError = await page.content();
                console.log(pageContentOnError.substring(0, 3000)); // Log first 3KB
                console.log('--- End of Page HTML Content Snippet ---');
            } catch (htmlError) {
                console.error("Could not get HTML content for debugging chapter error:", htmlError);
            }
        }
    }

    console.log('Finished scraping selected chapter content.');

    // --- Database Saving Logic (Updated to merge chapters) ---
    let existingStory = await Story.findOne({ title: storyData.title, author: storyData.author });

    if (existingStory) {
      console.log('Story already exists. Merging scraped chapters...');
      let updated = false;

      // Create a map of existing chapters by ID for efficient lookup
      const existingChaptersMap = new Map(existingStory.chapters.map(chap => [chap.id, chap]));

      chaptersToScrape.forEach(scrapedChap => {
        // Ensure scraped chapter has a valid ID and content
        if (!scrapedChap.id || scrapedChap.content.startsWith('Error:')) {
            console.warn(`Skipping chapter merge for "${scrapedChap.title}" due to invalid ID or scraping error.`);
            return; // Skip this chapter
        }

        const existingChap = existingChaptersMap.get(scrapedChap.id);
        if (existingChap) {
          // Update existing chapter only if new content is valid and different
          if (existingChap.content !== scrapedChap.content) {
            existingChap.content = scrapedChap.content;
            updated = true;
            console.log(` -> Updated content for existing chapter: "${scrapedChap.title}"`);
          }
          // Optionally update title if changed
          if (existingChap.title !== scrapedChap.title) {
             existingChap.title = scrapedChap.title;
             updated = true;
             console.log(` -> Updated title for existing chapter: "${scrapedChap.title}"`);
          }
        } else {
          // Add new chapter if it doesn't exist and content is valid
          existingStory.chapters.push({
            id: scrapedChap.id,
            title: scrapedChap.title,
            content: scrapedChap.content
          });
          updated = true;
          console.log(` -> Added new chapter: "${scrapedChap.title}"`);
        }
      });

       // Optional: Sort chapters after merging (e.g., based on original order if needed, requires storing index)
       // existingStory.chapters.sort((a, b) => /* comparison logic */);


      if (updated) {
        await existingStory.save();
        console.log('Updated existing story with new/updated chapter content.');
      } else {
        console.log('No chapter content updates needed for existing story.');
      }
      // Return the potentially updated existing story data
      storyData = existingStory.toObject(); // Use toObject() for plain JS object

    } else {
      // Save new story with only the scraped chapters
      console.log('Saving new story with scraped chapters...');
      const newStory = new Story({
        title: storyData.title,
        author: storyData.author,
        description: storyData.description,
        coverImage: storyData.coverImage,
        genres: storyData.genres,
        // Only save the chapters that were actually scraped and don't have errors
        chapters: chaptersToScrape
          .filter(chap => chap.id && !chap.content.startsWith('Error:'))
          .map(chap => ({
            id: chap.id,
            title: chap.title,
            content: chap.content
          }))
      });
      await newStory.save();
      console.log('New story with scraped chapter content saved to database');
      storyData = newStory.toObject(); // Use toObject() for plain JS object
    }

     // Return data with full content of scraped chapters
     // Filter the returned chapters to only include those that were scraped in this run
     // Ensure storyData.chapters exists before filtering
     if (storyData && storyData.chapters) {
        storyData.chapters = storyData.chapters.filter(chap =>
            chaptersToScrape.some(scrapedChap => scrapedChap.id === chap.id)
        );
     } else {
        storyData.chapters = []; // Ensure chapters array exists even if empty
     }
    return storyData;

  } catch (error) {
    console.error('Error during scraping process:', error);
    // Log HTML of the page where the error occurred, if possible
     try {
        const currentUrl = page.url();
        console.log(`--- Page HTML Content Snippet on Error (${currentUrl}) ---`);
        const pageContentOnError = await page.content();
        console.log(pageContentOnError.substring(0, 5000)); // Log first 5KB
        console.log('--- End of Page HTML Content Snippet ---');
    } catch (htmlError) {
        console.error("Could not get HTML content for debugging main error:", htmlError);
    }
    // Return a structured error object instead of throwing
    return { error: true, message: error.message, stack: error.stack };
    // throw error; // Re-throw the error to be handled by the caller
  } finally {
     if (browser) {
       console.log('Closing browser...');
       await browser.close();
     }
  }
}

module.exports = { scrapeWebsite };