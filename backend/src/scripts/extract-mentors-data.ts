/**
 * Script to extract and save scraped mentor data to a JSON file
 * Run with: npx ts-node src/scripts/extract-mentors-data.ts
 */

import { writeFileSync } from 'fs';
import { resolve } from 'path';
import * as puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';

interface ScrapedMentor {
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

async function scrapeMentors(): Promise<ScrapedMentor[]> {
  const mentorsUrl = 'https://www.expertisoracademy.in/mentors';
  console.log(`Scraping mentors from ${mentorsUrl}...`);

  let browser: puppeteer.Browser | null = null;
  try {
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
    await page.setViewport({ width: 1920, height: 1080 });
    
    await page.goto(mentorsUrl, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    await new Promise(resolve => setTimeout(resolve, 5000));

    // Extract mentor data from DOM
    const pageData = await page.evaluate((): ScrapedMentor[] | null => {
      const mentors: ScrapedMentor[] = [];
      const cards = Array.from(document.querySelectorAll('div, article')).filter((el) => {
        const text = el.textContent || '';
        const hasName = /[A-Z][a-z]+ [A-Z][a-z]+/.test(text);
        const hasPrice = /₹|\$|INR|price/i.test(text);
        return hasName && text.length > 50 && text.length < 2000;
      });

      for (const card of cards.slice(0, 100)) {
        const mentor: any = { name: '' };
        const text = card.textContent || '';
        
        const nameMatch = text.match(/([A-Z][a-z]+ [A-Z][a-z]+)/);
        if (nameMatch) {
          mentor.name = nameMatch[1];
        }

        const titleMatch = text.match(/(?:CEO|CTO|Founder|Director|Manager|Lead|Senior|Engineer|Designer|Product|Marketing|Sales|Consultant|Expert|Specialist|Advisor)/i);
        if (titleMatch) {
          const titleStart = text.indexOf(titleMatch[0]);
          const titleEnd = Math.min(titleStart + 100, text.length);
          mentor.title = text.substring(titleStart, titleEnd).split('\n')[0].trim();
        }

        const priceMatch = text.match(/₹\s*(\d+[,\d]*)/) || text.match(/\$\s*(\d+[,\d]*)/);
        if (priceMatch) {
          mentor.price = parseInt(priceMatch[1].replace(/,/g, ''), 10);
          mentor.currency = 'INR';
        }

        const img = card.querySelector('img') as HTMLImageElement | null;
        if (img) {
          mentor.avatarUrl = img.src || img.getAttribute('data-src') || '';
          if (mentor.avatarUrl && !mentor.avatarUrl.startsWith('http')) {
            mentor.avatarUrl = `https://www.expertisoracademy.in${mentor.avatarUrl}`;
          }
        }

        const paragraphs = Array.from(card.querySelectorAll('p')).map(p => p.textContent?.trim() || '');
        const bio = paragraphs.find(p => p.length > 50 && p.length < 500);
        if (bio) {
          mentor.bio = bio;
        }

        if (mentor.name) {
          mentor.slug = mentor.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
          mentors.push(mentor as ScrapedMentor);
        }
      }

      return mentors.length > 0 ? mentors : null;
    });

    await browser.close();
    browser = null;

    if (pageData && pageData.length > 0) {
      console.log(`Extracted ${pageData.length} mentors from DOM`);
      return pageData;
    }

    // Fallback: parse HTML
    const html = await page.content();
    const $ = cheerio.load(html);
    const mentors: ScrapedMentor[] = [];

    // Simple extraction from HTML
    $('div, article').each((index: number, element: cheerio.Element) => {
      if (index >= 100) return false;
      const $el = $(element);
      const text = $el.text().trim();
      
      if (text.length < 10 || text.length > 2000) return;

      const nameMatch = text.match(/([A-Z][a-z]+ [A-Z][a-z]+)/);
      if (!nameMatch) return;

      const mentor: ScrapedMentor = {
        name: nameMatch[1],
        slug: nameMatch[1].toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      };

      const priceMatch = text.match(/₹\s*(\d+[,\d]*)/);
      if (priceMatch) {
        mentor.price = parseInt(priceMatch[1].replace(/,/g, ''), 10);
        mentor.currency = 'INR';
      }

      const img = $el.find('img').first();
      const imgUrl = img.attr('src') || img.attr('data-src');
      if (imgUrl) {
        mentor.avatarUrl = imgUrl.startsWith('http') ? imgUrl : `https://www.expertisoracademy.in${imgUrl}`;
      }

      const paragraphs = $el.find('p').map((_, p) => $(p).text().trim()).get();
      const bio = paragraphs.find(p => p.length > 50 && p.length < 500);
      if (bio) {
        mentor.bio = bio;
      }

      if (mentor.name && mentor.name.length > 0) {
        mentors.push(mentor);
      }
    });

    return mentors;
  } catch (error) {
    console.error('Failed to scrape mentors:', error);
    if (browser) {
      await browser.close().catch(() => {});
    }
    return [];
  }
}

async function extractAndSave() {
  try {
    console.log('Starting mentor data extraction...');
    const mentors = await scrapeMentors();
    console.log(`Extracted ${mentors.length} mentors`);

    // Remove duplicates based on name
    const uniqueMentors = mentors.filter((mentor, index, self) =>
      index === self.findIndex(m => m.name === mentor.name)
    );

    console.log(`Found ${uniqueMentors.length} unique mentors`);

    // Save to JSON file
    const outputPath = resolve(__dirname, '../data/hardcoded-mentors.json');
    writeFileSync(outputPath, JSON.stringify(uniqueMentors, null, 2), 'utf-8');

    console.log(`✅ Saved ${uniqueMentors.length} mentors to ${outputPath}`);
  } catch (error) {
    console.error('❌ Error extracting mentors:', error);
    process.exit(1);
  }
}

extractAndSave();

