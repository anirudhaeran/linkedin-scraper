app.get('/scrape', async (req, res) => {
  const query = req.query.q;
  if (!query) {
    return res.status(400).json({ error: 'Please provide a search query ?q=' });
  }

  console.log(`🔍 Starting scrape for query: ${query}`);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    // Set LinkedIn cookie
    console.log(`🍪 Setting li_at cookie`);
    await page.setCookie({
      name: 'li_at',
      value: 'AQEDAUL_NcsDuMptAAABl6NjSbMAAAGXx2_Ns00ACdfYEq3HVMX9Iogx3S2eR1GXyVp6Q05BQxRzNVEZUl2gbIu9gPm5ZFPPfIjKFM4w4W3yAVFPxQTrSftjVwJJeCh4wAwd7QbUmK5HigelEESQmnA8',
      domain: '.linkedin.com'
    });

    console.log(`🌐 Navigating to LinkedIn search page`);
    await page.goto(`https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(query)}`, {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    console.log(`✅ Page loaded: ${await page.url()}`);

    await page.waitForSelector('.reusable-search__result-container', { timeout: 15000 });

    console.log(`🔍 Extracting leads`);
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
      return results.slice(0, 5);
    });

    await browser.close();
    console.log(`✅ Scraping complete`);

    return res.json({ query, leads });

  } catch (err) {
    await browser.close();
    console.error(`❌ Error: ${err.message}`);
    return res.status(500).json({ error: 'Scraping failed', details: err.message });
  }
});
