// Verifies the segmented3-loop background fork: confirms it's the default, measures JS-side path
// writes (should be 0, same as the fully-static lite variant, since SMIL animates natively), and
// takes two screenshots a couple seconds apart to confirm the shape is actually visibly moving
// despite zero JS involvement.
import { chromium } from 'playwright';

const BASE = 'http://localhost:4176/portfolio/';

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
  await page.waitForTimeout(500);

  const bgValue = await page.locator('select[aria-label="Background"]').inputValue();
  console.log('Default background selection:', bgValue);

  const writes = await countPathWrites(page, 2000);
  console.log(`JS-side path "d" attribute writes over 2s on "${bgValue}":`, writes);

  await page.screenshot({ path: 'tools/shader-capture/out/segmented-banded-t0.png', timeout: 10000 }).catch((e) => console.log('(screenshot skipped)', e.message.split('\n')[0]));
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'tools/shader-capture/out/segmented-banded-t3.png', timeout: 10000 }).catch((e) => console.log('(screenshot skipped)', e.message.split('\n')[0]));

  console.log('Console/page errors:', errors.length ? errors : 'none');
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
