const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SCREENSHOT_DIR = path.join(__dirname, '..', 'docs', 'screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function capture() {
  console.log('Launching Chrome via puppeteer-core...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 2 },
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();

  // 1. Landing Page
  console.log('1. Capturing Landing Page...');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_landing_page.png'), fullPage: false });

  // 2. Click "Instant Demo Preview" to enable demo role and view demo state
  console.log('2. Activating Instant Demo Preview...');
  const demoBtn = await page.$('button ::-p-text(Instant Demo Preview)');
  if (demoBtn) {
    await demoBtn.click();
    await new Promise(r => setTimeout(r, 800));
  }
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_demo_mode_activated.png'), fullPage: false });

  // 3. Marketplace
  console.log('3. Capturing Marketplace...');
  await page.goto('http://localhost:5173/marketplace', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_marketplace.png'), fullPage: false });

  // 4. Create Loan Request
  console.log('4. Capturing Create Loan Page...');
  await page.goto('http://localhost:5173/borrower/create', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 800));

  // Fill in form values for realistic presentation
  await page.type('input[placeholder*="title" i], input[name*="title" i], input[type="text"]', 'Tech Hardware Expansion');
  const numInputs = await page.$$('input[type="number"]');
  if (numInputs.length >= 3) {
    await numInputs[0].type('1.5');
    await numInputs[1].type('8.5');
    await numInputs[2].type('30');
  }
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_create_loan_form.png'), fullPage: false });

  // 5. Borrower Dashboard
  console.log('5. Capturing Borrower Dashboard...');
  await page.goto('http://localhost:5173/borrower', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_borrower_dashboard.png'), fullPage: false });

  // 6. Lender Dashboard
  console.log('6. Capturing Lender Dashboard...');
  await page.goto('http://localhost:5173/lender', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_lender_dashboard.png'), fullPage: false });

  // 7. Admin Dashboard
  console.log('7. Capturing Admin Dashboard...');
  await page.goto('http://localhost:5173/admin', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_admin_dashboard.png'), fullPage: false });

  // 8. FastAPI Swagger Docs
  console.log('8. Capturing FastAPI Swagger Documentation...');
  await page.goto('http://127.0.0.1:8000/docs', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08_fastapi_swagger_docs.png'), fullPage: false });

  await browser.close();
  console.log('All screenshots captured successfully in docs/screenshots/');
}

capture().catch(err => {
  console.error('Capture failed:', err);
  process.exit(1);
});
