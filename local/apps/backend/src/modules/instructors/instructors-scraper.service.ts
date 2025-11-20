import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import * as puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';

export interface ScrapedMentor {
  name: string;
  title?: string;
  bio?: string;
  avatarUrl?: string;
  expertise?: string[];
  rating?: number;
  reviewCount?: number;
  price?: number;
  currency?: string;
  slug?: string;
  linkedinUrl?: string;
  websiteUrl?: string;
}

@Injectable()
export class InstructorsScraperService {
  private readonly logger = new Logger(InstructorsScraperService.name);
  private readonly mentorsUrl = 'https://www.expertisoracademy.in/mentors';
  private browser: puppeteer.Browser | null = null;
  private hardcodedMentors: ScrapedMentor[] | null = null;

  constructor(private readonly configService: ConfigService) {}

  /**
   * Load hardcoded mentors from JSON file
   */
  private loadHardcodedMentors(): ScrapedMentor[] {
    if (this.hardcodedMentors) {
      return this.hardcodedMentors;
    }

    try {
      const filePath = resolve(__dirname, '../../data/hardcoded-mentors.json');
      const fileContent = readFileSync(filePath, 'utf-8');
      this.hardcodedMentors = JSON.parse(fileContent) as ScrapedMentor[];
      this.logger.log(`Loaded ${this.hardcodedMentors.length} hardcoded mentors from file`);
      return this.hardcodedMentors;
    } catch (error) {
      this.logger.warn('Failed to load hardcoded mentors, falling back to scraping', error);
      return [];
    }
  }

  async scrapeMentors(): Promise<ScrapedMentor[]> {
    // Use hardcoded mentors instead of scraping
    const hardcoded = this.loadHardcodedMentors();
    if (hardcoded.length > 0) {
      this.logger.log(`Returning ${hardcoded.length} hardcoded mentors`);
      return hardcoded;
    }

    // Fallback to scraping if hardcoded data is not available
    return this.scrapeMentorsFromWeb();
  }

  private async scrapeMentorsFromWeb(): Promise<ScrapedMentor[]> {
    let browser: puppeteer.Browser | null = null;
    try {
      this.logger.log(`Scraping mentors from ${this.mentorsUrl}`);
      
      // Launch browser
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
        ],
      });

      const page = await browser.newPage();
      
      // Set viewport
      await page.setViewport({ width: 1920, height: 1080 });
      
      // Navigate to the page
      await page.goto(this.mentorsUrl, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });

      // Wait for page to fully load
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds for React to render

      // Try to extract mentor data directly from rendered DOM
      let pageData: ScrapedMentor[] | null = null;
      try {
        pageData = await page.evaluate((): ScrapedMentor[] | null => {
          const mentors: ScrapedMentor[] = [];
          
          // Find all potential mentor cards
          const cards = Array.from(document.querySelectorAll('div, article')).filter((el) => {
            const text = el.textContent || '';
            const hasName = /[A-Z][a-z]+ [A-Z][a-z]+/.test(text); // Name pattern
            const hasPrice = /₹|\$|INR|price/i.test(text);
            return hasName && text.length > 50 && text.length < 2000;
          });

          for (const card of cards.slice(0, 100)) {
            const mentor: any = { name: '' };
            const text = card.textContent || '';
            
            // Extract name (look for capitalized words that look like names)
            const nameMatch = text.match(/([A-Z][a-z]+ [A-Z][a-z]+)/);
            if (nameMatch) {
              mentor.name = nameMatch[1];
            }

            // Extract title/role (usually after name)
            const titleMatch = text.match(/(?:CEO|CTO|Founder|Director|Manager|Lead|Senior|Engineer|Designer|Product|Marketing|Sales|Consultant|Expert|Specialist|Advisor)/i);
            if (titleMatch) {
              const titleStart = text.indexOf(titleMatch[0]);
              const titleEnd = Math.min(titleStart + 100, text.length);
              mentor.title = text.substring(titleStart, titleEnd).split('\n')[0].trim();
            }

            // Extract price
            const priceMatch = text.match(/₹\s*(\d+[,\d]*)/) || text.match(/\$\s*(\d+[,\d]*)/);
            if (priceMatch) {
              mentor.price = parseInt(priceMatch[1].replace(/,/g, ''), 10);
              mentor.currency = 'INR';
            }

            // Extract image
            const img = card.querySelector('img') as HTMLImageElement | null;
            if (img) {
              mentor.avatarUrl = img.src || img.getAttribute('data-src') || '';
              if (mentor.avatarUrl && !mentor.avatarUrl.startsWith('http')) {
                mentor.avatarUrl = `https://www.expertisoracademy.in${mentor.avatarUrl}`;
              }
            }

            // Extract bio (longest paragraph)
            const paragraphs = Array.from(card.querySelectorAll('p')).map(p => p.textContent?.trim() || '');
            const bio = paragraphs.find(p => p.length > 50 && p.length < 500);
            if (bio) {
              mentor.bio = bio;
            }

            // Generate slug
            if (mentor.name) {
              mentor.slug = mentor.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
            }

            if (mentor.name && mentor.name.length > 0) {
              mentors.push(mentor as ScrapedMentor);
            }
          }

          return mentors.length > 0 ? mentors : null;
        });
        
        if (pageData && pageData.length > 0) {
          this.logger.log(`Extracted ${pageData.length} mentors directly from DOM`);
        }
      } catch (e) {
        this.logger.warn('Could not extract data from DOM', e);
      }

      // Wait for mentor cards to load (wait for specific selectors)
      try {
        await page.waitForSelector('div, article, [class*="card"], [class*="mentor"]', {
          timeout: 5000,
        });
      } catch (e) {
        this.logger.warn('Mentor cards selector not found, proceeding with full page HTML...');
      }

      // Scroll to load lazy-loaded content
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
            await new Promise(resolve => setTimeout(resolve, 2000));

      // Get the rendered HTML
      const html = await page.content();
      
      // Close browser
      await browser.close();
      browser = null;

      // If we got data directly from DOM, use it (more reliable)
      if (pageData && pageData.length > 0) {
        return pageData;
      }

      // Otherwise, parse from HTML
      const mentors = this.parseMentors(html);
      return mentors;
    } catch (error) {
      this.logger.error('Failed to scrape mentors', error);
      if (browser) {
        await browser.close().catch(() => {});
      }
      // Return empty array on error to prevent breaking the app
      return [];
    }
  }

  private parseMentors(html: string): ScrapedMentor[] {
    const mentors: ScrapedMentor[] = [];
    
    try {
      const $ = cheerio.load(html);
      
      // Try multiple selectors to find mentor cards - Expertisor Academy specific
      const selectors = [
        '[class*="Mentor"]',
        '[class*="mentor"]',
        '[class*="Card"]',
        '[class*="card"]',
        '[class*="Profile"]',
        '[class*="profile"]',
        '[class*="Instructor"]',
        '[class*="instructor"]',
        'article',
        '[data-mentor]',
        '[data-instructor]',
        '[class*="grid"] > div',
        '[class*="Grid"] > div',
      ];

      let mentorElements: cheerio.Cheerio = $([]);
      let foundSelector = '';

      // Try each selector until we find elements
      for (const selector of selectors) {
        const elements = $(selector);
        if (elements.length > 3) { // Need at least 3 to be meaningful
          mentorElements = elements;
          foundSelector = selector;
          this.logger.log(`Found ${elements.length} mentor elements using selector: ${selector}`);
          break;
        }
      }

      // If no specific selector worked, try to find all potential cards in grids
      if (mentorElements.length === 0) {
        // Look for grid containers and their children
        const grids = $('[class*="grid"], [class*="Grid"], [class*="container"]');
        grids.each((_, grid) => {
          const $grid = $(grid);
          const children = $grid.children('div, article');
          if (children.length > mentorElements.length) {
            mentorElements = children;
            foundSelector = 'grid children';
          }
        });
      }

      this.logger.log(`Using selector: ${foundSelector}, found ${mentorElements.length} elements`);

      mentorElements.each((index: number, element: cheerio.Element) => {
        if (index >= 100) return false; // Limit to 100 mentors

        const $el = $(element);
        const mentor: ScrapedMentor = {
          name: '',
        };

        // Get all text content to analyze
        const allText = $el.text().trim();
        
        // Skip if element is too small (likely not a mentor card)
        if (allText.length < 10) {
          return;
        }

        // Extract name - try multiple patterns (Expertisor Academy specific)
        const nameSelectors = [
          'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
          '[class*="Name"]',
          '[class*="name"]',
          '[class*="Title"]',
          '[class*="title"]',
          '[class*="heading"]',
          '[class*="Heading"]',
          '[data-name]',
          'strong',
          'b',
        ];

        for (const sel of nameSelectors) {
          const nameText = $el.find(sel).first().text().trim();
          // Filter out common non-name text
          if (
            nameText && 
            nameText.length > 2 && 
            nameText.length < 100 &&
            !nameText.match(/^(view|read|more|click|book|session|mentor|instructor)$/i) &&
            !nameText.match(/^\d+$/) // Not just numbers
          ) {
            mentor.name = nameText;
            break;
          }
        }

        // If no name found, try to extract from first meaningful text
        if (!mentor.name) {
          const paragraphs = $el.find('p, div, span').map((_, el) => $(el).text().trim()).get();
          for (const text of paragraphs) {
            if (text.length > 5 && text.length < 100 && !text.match(/^(view|read|more|click|book|session)$/i)) {
              mentor.name = text.split('\n')[0].split('.')[0].trim();
              break;
            }
          }
        }

        // Extract title/headline
        const titleSelectors = [
          '[class*="headline"]',
          '[class*="title"]',
          '[class*="role"]',
          '[class*="position"]',
          'p[class*="subtitle"]',
        ];

        for (const sel of titleSelectors) {
          const titleText = $el.find(sel).first().text().trim();
          if (titleText && titleText !== mentor.name && titleText.length < 200) {
            mentor.title = titleText;
            break;
          }
        }

        // Extract bio/description
        const bioSelectors = [
          '[class*="bio"]',
          '[class*="description"]',
          '[class*="about"]',
          'p:not([class*="name"]):not([class*="title"])',
        ];

        for (const sel of bioSelectors) {
          const bioText = $el.find(sel).first().text().trim();
          if (bioText && bioText.length > 20 && bioText.length < 500) {
            mentor.bio = bioText;
            break;
          }
        }

        // Extract avatar/image
        const imgSelectors = [
          'img[class*="avatar"]',
          'img[class*="profile"]',
          'img[class*="photo"]',
          'img',
          '[style*="background-image"]',
        ];

        for (const sel of imgSelectors) {
          const img = $el.find(sel).first();
          let imgUrl = img.attr('src') || img.attr('data-src') || img.attr('data-lazy-src');
          
          // Check for background-image
          if (!imgUrl) {
            const bgStyle = img.attr('style') || $el.attr('style') || '';
            const bgMatch = bgStyle.match(/background-image:\s*url\(['"]?([^'"]+)['"]?\)/);
            if (bgMatch) {
              imgUrl = bgMatch[1];
            }
          }

          if (imgUrl) {
            // Make absolute URL if relative
            if (imgUrl.startsWith('/')) {
              imgUrl = `https://www.expertisoracademy.in${imgUrl}`;
            } else if (imgUrl.startsWith('http')) {
              mentor.avatarUrl = imgUrl;
            } else {
              mentor.avatarUrl = `https://www.expertisoracademy.in/${imgUrl}`;
            }
            break;
          }
        }

        // Extract price
        const priceText = $el.text();
        const priceMatches = [
          priceText.match(/₹\s*(\d+[,\d]*)/),
          priceText.match(/\$\s*(\d+[,\d]*)/),
          priceText.match(/INR\s*(\d+[,\d]*)/),
          priceText.match(/price[^:]*:\s*(\d+)/i),
        ];

        for (const match of priceMatches) {
          if (match && match[1]) {
            mentor.price = parseInt(match[1].replace(/,/g, ''), 10);
            mentor.currency = 'INR';
            break;
          }
        }

        // Extract rating
        const ratingMatch = priceText.match(/(\d+\.?\d*)\s*(?:star|rating|rated)/i);
        if (ratingMatch) {
          mentor.rating = parseFloat(ratingMatch[1]);
        }

        // Extract review count
        const reviewMatch = priceText.match(/(\d+)\s*(?:review|rating)/i);
        if (reviewMatch) {
          mentor.reviewCount = parseInt(reviewMatch[1], 10);
        }

        // Extract links
        const linkedinLink = $el.find('a[href*="linkedin"]').attr('href');
        if (linkedinLink) {
          mentor.linkedinUrl = linkedinLink.startsWith('http') 
            ? linkedinLink 
            : `https://www.linkedin.com${linkedinLink}`;
        }

        // Generate slug from name
        if (mentor.name) {
          mentor.slug = mentor.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
        }

        // Only add if we have at least a name
        if (mentor.name && mentor.name.length > 0) {
          mentors.push(mentor);
        }
      });

      this.logger.log(`Successfully parsed ${mentors.length} mentors`);
      return mentors;
    } catch (error) {
      this.logger.error('Error parsing mentors HTML', error);
      return [];
    }
  }

  // Convert scraped mentor to instructor profile format
  convertToInstructorProfile(mentor: ScrapedMentor, userId: string) {
    return {
      userId,
      slug: mentor.slug || mentor.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      displayName: mentor.name,
      headline: mentor.title || mentor.expertise?.join(', ') || 'Expert Mentor',
      bio: mentor.bio || `Professional mentor specializing in ${mentor.expertise?.join(', ') || 'various domains'}`,
      avatarUrl: mentor.avatarUrl,
      pricingAmount: mentor.price ? mentor.price * 100 : 250000, // Convert to paise/cents
      pricingCurrency: mentor.currency || 'INR',
      meetingDuration: 30,
      bufferBefore: 0,
      bufferAfter: 0,
      calendarTimezone: 'Asia/Kolkata',
      active: true,
    };
  }
}

