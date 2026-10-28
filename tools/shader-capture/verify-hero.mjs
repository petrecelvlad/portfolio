// One-off T-019 verification: loads the real preview server (production build) in a real
// Chromium instance and screenshots the achievement row twice, ~800ms apart, to confirm the
// baked assets are actually rendering AND animating (not just present/loaded).
import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  await page.goto('http://localhost:4173/portfolio/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500); // let useDeferredMount + video autoplay settle

  await page.screenshot({ path: 'tools/shader-capture/out/hero-verify-t0.png', fullPage: false });

  await page.waitForTimeout(800);
  await page.screenshot({ path: 'tools/shader-capture/out/hero-verify-t1.png', fullPage: false });

  console.log('Console/page errors:', errors.length ? errors : 'none');
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
