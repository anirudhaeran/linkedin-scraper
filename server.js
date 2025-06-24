const express = require('express');
const puppeteer = require('puppeteer');
const app = express();

app.get('/scrape', async (req, res) => {
  const query = req.query.q || 'marketing manager India';

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  await page.setCookie({
    name: 'li_at',
    value: 'AQEDAUL_NcsDuMptAAABl6NjSbMAAAGXx2_Ns00ACdfYEq3HVMX9Iogx3S2eR1GXyVp6Q05BQxRzNVEZUl2gbIu9gPm5ZFPPfIjKFM4w4W3yAVFPxQTrSftjVwJJeCh4wAwd7QbUmK5HigelEESQmnA8',
    domain: '.linkedin.com'
  });

  await page.goto(`https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(query)}`);

  await page.waitForSelector('.reusable-search__result-container');

  const leads = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.reusable-search__result-container')).map(el => ({
      name: el.querySelector('.entity-result__title-text span span')?.innerText || null,
      occupation: el.querySelector('.entity-result__primary-subtitle')?.innerText || null,
      location: el.querySelector('.entity-result__secondary-subtitle')?.innerText || null,
      profile: el.querySelector('a.app-aware-link')?.href || null
    }));
  });

  await browser.close();
  res.json({ query, leads });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Scraper API running on port ${PORT}`));
