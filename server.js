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

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    // ✅ Set LinkedIn session cookie
    await page.setCookie({
      name: 'li_at',
      value: 'AQEDAUL_NcsFQD-4AAABl6OX8T4AAAGXx6R1PlYAELB0SraAeoKgeWyblyFs_XDSUplRX5KksQqvoODHK8F5Mpdi30qpDlK0g54evFDMVqcMLAhpjEhjLhqulzw-t4GGgx_jsJcOofwtrkfckENqWGga',
      domain: '.linkedin.com'
    });

    // 🧭 Go to LinkedIn search page
    await page.goto(`https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(query)}`, {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    // ⏳ Wait for results to load
    await page.waitForSelector('.reusable-search__result-container', { timeout: 15000 });

    // 🧠 Scrape top 5 profiles
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
      return results.slice(0, 5); // Limit to 5 results
    });

    await browser.close();
    return res.json({ query, leads });

  } catch (err) {
    await browser.close();
    console.error(err);
    return res.status(500).json({ error: 'Scraping failed', details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Scraper API running on port ${PORT}`);
});
