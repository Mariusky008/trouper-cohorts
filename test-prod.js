const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  // Intercept all network requests to mock authentication
  await page.setRequestInterception(true);
  page.on('request', request => {
    // If it's a supabase auth request, mock a successful response
    if (request.url().includes('supabase') && request.url().includes('auth')) {
      request.respond({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: { id: 'mock-id', email: 'test@example.com' },
          session: { access_token: 'mock-token', refresh_token: 'mock-refresh' }
        })
      });
    } else {
      request.continue();
    }
  });

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR STACK:\n', error.stack));
  
  console.log("Navigating to profile...");
  await page.goto('http://localhost:3000/mon-reseau-local/dashboard/profile', { waitUntil: 'networkidle0' });
  
  await page.screenshot({ path: 'prod-test.png' });
  console.log("Navigation complete");
  await browser.close();
})();
