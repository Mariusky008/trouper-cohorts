const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  // Set the error listener to capture EXACTLY what is crashing
  page.on('pageerror', error => console.log('PAGE ERROR STACK:\n', error.stack));
  
  console.log("Navigating to dashboard...");
  // We navigate to localhost:3000 to see what the prod build does
  await page.goto('http://localhost:3000/mon-reseau-local/dashboard/profile', { waitUntil: 'networkidle0' });
  
  await browser.close();
})();
