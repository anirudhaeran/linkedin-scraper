const express = require('express');
const puppeteer = require('puppeteer');
const fs = require('fs');

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

    console.log(`🍪 Setting li_at cookie`);
    await page.setCookie({
      name: 'li_at',
      value: 'AQEDAUL_NcsFKj0SAAABl6V-DTcAAAGXyYqRN1YAK2EJh-nOODPWLpavtnfxAnQ-AbbtIgWJnwpD9-KvdGip6L04FWWBSBIUIxN_7CgcGLgnuixI7DJt2kazcjn-RoCSJ21eznqLAnQHDW3_YbispDNe', // ← Replace this with your real cookie
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
      console.error(`❌ Navigation error. Current URL: ${currentUrl}`);
      await browser.close();
      return res.status(500).json({ error: 'Navigation failed', url: currentUrl });
    }

    const currentUrl = await page.url();
    console.log(`✅ Page loaded: ${currentUrl}`);

    // Screenshot only if redirected
    if (currentUrl.includes('/login') || currentUrl.includes('checkpoint')) {
      console.warn('🔐 Redirected to login/checkpoint page. Taking screenshot for debug...');
      await page.screenshot({ path: 'debug.png', fullPage: true });
      await browser.close();
      return res.status(401).json({
        error: 'Redirected to login. li_at may be expired or blocked.',
        url: currentUrl
      });
    }

    // ✅ Page loaded successfully — add your scraping logic here
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

// Debug route for screenshot
app.get('/debug', (req, res) => {
  const screenshotPath = __dirname + '/debug.png';
  if (fs.existsSync(screenshotPath)) {
    res.sendFile(screenshotPath);
  } else {
    res.status(404).send('❌ Screenshot not available. Make sure a screenshot was taken.');
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Scraper API running on port ${PORT}`);
});
