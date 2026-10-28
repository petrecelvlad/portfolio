import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 800, height: 450 } });
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));
  page.on('console', (msg) => errors.push(`[console:${msg.type()}] ${msg.text()}`));

  await page.goto('http://localhost:4177/portfolio/achievements/factory-animated.svg', { waitUntil: 'load' });
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'tools/shader-capture/out/factory-svg-direct.png' });
  console.log('Direct SVG render errors/logs:', errors.length ? errors : 'none');

  // Now test it embedded via <img> with the exact same classes as the real component.
  const page2 = await browser.newPage({ viewport: { width: 500, height: 281 } });
  await page2.setContent(`
    <html><body style="margin:0">
      <div style="width:500px;height:281px;">
        <img src="http://localhost:4177/portfolio/achievements/factory-animated.svg"
             style="width:100%;height:100%;display:block;object-fit:cover" />
      </div>
    </body></html>
  `);
  await page2.waitForTimeout(500);
  const dims = await page2.evaluate(() => {
    const img = document.querySelector('img');
    return { naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight, complete: img.complete };
  });
  console.log('img element natural dims:', dims);
  await page2.screenshot({ path: 'tools/shader-capture/out/factory-svg-img-test.png' });

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
