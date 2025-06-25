const express = require('express');
const puppeteer = require('puppeteer');

const app = express();

app.get('/', (req, res) => {
  res.send('✅ LinkedIn Scraper is running! Use /scrape?q=your-query');
});

app.get('/scrape', async (req, res) => {
  const query = req.query.q || 'marketing manager';
  console.log(`🔍 Starting scrape for query: ${query}`);

  try {
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

    const page = await browser.newPage();

    // Set LinkedIn session cookie
    console.log(`🍪 Setting li_at cookie`);
    await page.setCookie({
      name: 'li_at',
      value: 'AQEDAUL_NcsAxSlEAAABl6Vn7yUAAAGXyXRzJVYAUvC-SHfxBBsY1muPvTEgQP22d59VEzghmGYlcohl8HeqNXV5XGXsB9RxR-kN7rfd8g6ioPT7IF-q8_M9JvFasHIrX83AVHeJVo7cx7LB9-t5PU6A',
      domain: '.linkedin.com'
    });

    console.log(`🌐 Navigating to LinkedIn...`);
    try {
      await page.goto(`https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(query)}`, {
        waitUntil: 'networkidle2',
        timeout: 90000
      });
    } catch (err) {
      const currentUrl = await page.url();
      await page.screenshot({ path: 'debug.png', fullPage: true });
      console.error(`❌ Navigation error. Current URL: ${currentUrl}`);
      return res.status(500).json({ error: 'Navigation failed', details: currentUrl });
    }

    const currentUrl = await page.url();
    console.log(`✅ Page loaded: ${currentUrl}`);
    await page.screenshot({ path: 'debug.png', fullPage: true });

    if (currentUrl.includes('/login') || currentUrl.includes('checkpoint')) {
      await browser.close();
      return res.status(401).json({ error: 'Redirected to login. li_at may be expired.', url: currentUrl });
    }

    // 🔧 Dummy scraped data (replace with real scraping logic)
    const leads = [
      { name: 'John Doe', title: 'Marketing Manager', location: 'New York' },
      { name: 'Jane Smith', title: 'Digital Strategist', location: 'San Francisco' }
    ];

    await browser.close();
    res.json({ leads });

  } catch (err) {
    console.error('❌ Scraping failed', err);
    res.status(500).json({ error: 'Scraping failed', details: err.message });
  }
});

// 📸 View Puppeteer's screenshot for debugging
app.get('/debug', (req, res) => {
  res.sendFile(__dirname + '/debug.png');
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Scraper API running on port ${PORT}`);
});
