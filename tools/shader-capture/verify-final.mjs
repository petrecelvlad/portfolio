import { chromium } from 'playwright';

const BASE = 'http://localhost:4180/portfolio/';

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });

  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const bgValue = await page.locator('select[aria-label="Background"]').inputValue();
  console.log('Default background:', bgValue);
  const pathValue = await page.locator('select[aria-label="Achievement Animation Path"]').inputValue();
  console.log('Default animation path:', pathValue);

  await page.screenshot({ path: 'tools/shader-capture/out/final-check.png', timeout: 10000 }).catch((e) => console.log('(screenshot skipped)', e.message.split('\n')[0]));

  console.log('Console/page errors:', errors.length ? errors : 'none');
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
