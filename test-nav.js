const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  // Intercept all network requests to mock authentication
  await page.setRequestInterception(true);
  page.on('request', request => {
    if (request.url().includes('supabase') && request.url().includes('auth')) {
      request.respond({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: { id: 'mock-id', email: 'test@example.com' },
          session: { access_token: 'mock-token', refresh_token: 'mock-refresh' }
        })
      });
    } else if (request.url().includes('profiles') && request.url().includes('select')) {
      request.respond({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{
           id: 'mock-id',
           display_name: 'Test', // incomplete profile
           trade: null
        }])
      });
    } else {
      request.continue();
    }
  });

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR STACK:\n', error.stack));
  
  console.log("Navigating to dashboard...");
  await page.goto('http://localhost:3000/mon-reseau-local/dashboard', { waitUntil: 'networkidle0' });
  
  console.log("Waiting a bit...");
  await new Promise(r => setTimeout(r, 2000));
  
  await page.screenshot({ path: 'nav-test.png' });
  console.log("Test complete");
  await browser.close();
})();
