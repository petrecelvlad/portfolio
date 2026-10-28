import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 800, height: 450 } });
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));
  page.on('console', (msg) => errors.push(`[console:${msg.type()}] ${msg.text()}`));

  await page.goto('http://localhost:4180/portfolio/achievements/factory-animated.svg', { waitUntil: 'load' });
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'tools/shader-capture/out/conveyor-t0.png' });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'tools/shader-capture/out/conveyor-t1.png' });
  console.log('Direct SVG errors/logs:', errors.length ? errors : 'none');

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
