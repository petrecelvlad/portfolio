// Verifies the segmented3-lite background test fork: confirms it's now the default, renders
// correctly, and — the actual point — measures how many times per second the jagged-edge SVG
// path geometry actually gets rewritten, comparing it against the original segmented3 variant.
import { chromium } from 'playwright';

const BASE = 'http://localhost:4174/portfolio/';

async function countPathWrites(page, ms) {
  await page.evaluate(() => {
    window.__pathWriteCount = 0;
    const proto = SVGPathElement.prototype;
    if (!proto.__patchedSetAttribute) {
      const original = proto.setAttribute;
      proto.setAttribute = function (name, value) {
        if (name === 'd') window.__pathWriteCount++;
        return original.call(this, name, value);
      };
      proto.__patchedSetAttribute = true;
    } else {
      window.__pathWriteCount = 0;
    }
  });
  await page.waitForTimeout(ms);
  return page.evaluate(() => window.__pathWriteCount);
}

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });

  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const bgValue = await page.locator('select[aria-label="Background"]').inputValue();
  console.log('Default background selection:', bgValue);

  const liteWrites = await countPathWrites(page, 2000);
  console.log(`Path "d" attribute writes over 2s on "${bgValue}":`, liteWrites);

  await page.screenshot({ path: 'tools/shader-capture/out/segmented-lite-default.png', timeout: 10000 }).catch((e) => console.log('(screenshot skipped)', e.message.split('\n')[0]));

  // Switch to the original segmented3 for a direct comparison.
  await page.locator('select[aria-label="Background"]').selectOption('segmented3');
  await page.waitForTimeout(500);
  const originalWrites = await countPathWrites(page, 2000);
  console.log('Path "d" attribute writes over 2s on "segmented3" (original):', originalWrites);

  await page.screenshot({ path: 'tools/shader-capture/out/segmented-original.png', timeout: 10000 }).catch((e) => console.log('(screenshot skipped)', e.message.split('\n')[0]));

  console.log('Console/page errors:', errors.length ? errors : 'none');
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
