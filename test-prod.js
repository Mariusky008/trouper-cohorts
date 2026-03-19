const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR STACK:\n', error.stack));
  
  // Set up auth to simulate a logged-in user if needed, or just let it redirect
  await page.goto('http://localhost:3000/mon-reseau-local/dashboard/profile', { waitUntil: 'networkidle0' });
  
  // Take a screenshot to see what's actually rendering
  await page.screenshot({ path: 'prod-test.png' });
  
  console.log("Navigation complete");
  await browser.close();
})();
