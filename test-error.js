const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR STACK:\n', error.stack));
  
  await page.goto('http://localhost:3000/mon-reseau-local/dashboard/profile', { waitUntil: 'networkidle0' });
  await browser.close();
})();
