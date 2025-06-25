const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('✅ LinkedIn Scraper is running! Use /scrape?q=your-query');
});

app.get('/scrape', async (req, res) => {
  const query = req.query.q;
  if (!query) {
    return res.status(400).json({ error: 'Please provide a search query ?q=' });
  }

  console.log(`🔍 Starting scrape for query: ${query}`);

  const browser = await puppeteer.launch({
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--disable-software-rasterizer',
    '--single-process',
    '--no-zygote'
  ]
});

  try {
    const page = await browser.newPage();

    // Set LinkedIn session cookie
    console.log(`🍪 Setting li_at cookie`);
    await page.setCookie({
      name: 'li_at',
      value: 'AQEDAUL_NcsDuMptAAABl6NjSbMAAAGXx2_Ns00ACdfYEq3HVMX9Iogx3S2eR1GXyVp6Q05BQxRzNVEZUl2gbIu9gPm5ZFPPfIjKFM4w4W3yAVFPxQTrSftjVwJJeCh4wAwd7QbUmK5HigelEESQmnA8',
      domain: '.linkedin.com'
    });

    try {
  console.log(`🌐 Navigating to LinkedIn...`);
  await page.goto(`https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(query)}`, {
    waitUntil: 'networkidle2',
    timeout: 90000 // ⏰ Increased to 90 seconds
  });
} catch (navErr) {
  const currentUrl = await page.url();
  console.error(`❌ Navigation error. Current URL: ${currentUrl}`);
  throw new Error('LinkedIn did not load. Possible login redirect or slow connection.');
}

    const currentUrl = await page.url();
    console.log(`✅ Page loaded: ${currentUrl}`);

    await page.screenshot({ path: 'debug.png', fullPage: true });
    
    // If redirected to login, throw error
    if (currentUrl.includes('/login') || currentUrl.includes('checkpoint')) {
      throw new Error('Invalid or expired li_at cookie. Redirected to login.');
    }

    console.log(`🕵️ Waiting for search results...`);
    await page.waitForSelector('.reusable-search__result-container', { timeout: 15000 });

    console.log(`📄 Extracting leads...`);
    const leads = await page.evaluate(() => {
      const results = [];
      const cards = document.querySelectorAll('.reusable-search__result-container');
      cards.forEach(card => {
        const name = card.querySelector('span.entity-result__title-text')?.innerText.trim() || null;
        const occupation = card.querySelector('.entity-result__primary-subtitle')?.innerText.trim() || null;
        const location = card.querySelector('.entity-result__secondary-subtitle')?.innerText.trim() || null;
        const profile = card.querySelector('a.app-aware-link')?.href.split('?')[0] || null;

        if (name && profile) {
          results.push({ name, occupation, location, profile });
        }
      });
      return results.slice(0, 5); // limit to 5 results
    });

    console.log(`✅ Scraping complete. Found ${leads.length} leads.`);
    await browser.close();
    return res.json({ query, leads });

  } catch (err) {
    await browser.close();
    console.error(`❌ Error: ${err.message}`);
    return res.status(500).json({ error: 'Scraping failed', details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Scraper API running on port ${PORT}`);
});
