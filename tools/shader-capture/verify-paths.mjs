// T-021 scaffolding verification: confirms the animation-path dropdown actually gates network
// traffic and code execution the way it's supposed to — default (SVG) fetches neither the
// AchievementLiveShaders JS chunk nor the baked mp4/png assets; selecting "Baked" fetches the
// assets but not the shader chunk; selecting "Live Shader" fetches the chunk.
import { chromium } from 'playwright';

const BASE = 'http://localhost:4173/portfolio/';

async function loadAndCollectRequests(page) {
  const urls = [];
  const handler = (req) => urls.push(req.url());
  page.on('request', handler);
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  page.off('request', handler);
  return urls;
}

function relevant(urls) {
  return {
    shaderChunk: urls.filter((u) => u.includes('AchievementLiveShaders')),
    bakedAssets: urls.filter((u) => u.includes('/achievements/')),
  };
}

async function main() {
  const browser = await chromium.launch();

  // 1. Default load — should be SVG path, nothing extra fetched.
  const page1 = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  const errors = [];
  page1.on('pageerror', (err) => errors.push(err.message));
  page1.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
  const urls1 = await loadAndCollectRequests(page1);
  const rel1 = relevant(urls1);
  console.log('DEFAULT (should be SVG):');
  console.log('  shader chunk requests:', rel1.shaderChunk.length, rel1.shaderChunk);
  console.log('  baked asset requests:', rel1.bakedAssets.length, rel1.bakedAssets);
  const selected1 = await page1.locator('select[aria-label="Achievement Animation Path"]').inputValue();
  console.log('  dropdown value:', selected1);
  await page1.screenshot({ path: 'tools/shader-capture/out/paths-svg.png', timeout: 10000 }).catch((e) => console.log('  (screenshot skipped:', e.message.split('\n')[0], ')'));

  // 2. Switch to Baked — expect asset fetches, still no shader chunk.
  const urls2 = [];
  const handler2 = (req) => urls2.push(req.url());
  page1.on('request', handler2);
  await page1.locator('select[aria-label="Achievement Animation Path"]').selectOption('baked');
  await page1.waitForTimeout(1500);
  page1.off('request', handler2);
  const rel2 = relevant(urls2);
  console.log('AFTER SELECTING BAKED:');
  console.log('  shader chunk requests:', rel2.shaderChunk.length, rel2.shaderChunk);
  console.log('  baked asset requests:', rel2.bakedAssets.length, rel2.bakedAssets);
  await page1.screenshot({ path: 'tools/shader-capture/out/paths-baked.png', timeout: 10000 }).catch((e) => console.log('  (screenshot skipped:', e.message.split('\n')[0], ')'));

  // 3. Switch to Live Shader — expect the chunk to be fetched now.
  const urls3 = [];
  const handler3 = (req) => urls3.push(req.url());
  page1.on('request', handler3);
  await page1.locator('select[aria-label="Achievement Animation Path"]').selectOption('shader');
  await page1.waitForTimeout(1500);
  page1.off('request', handler3);
  const rel3 = relevant(urls3);
  console.log('AFTER SELECTING LIVE SHADER:');
  console.log('  shader chunk requests:', rel3.shaderChunk.length, rel3.shaderChunk);
  await page1.screenshot({ path: 'tools/shader-capture/out/paths-shader.png', timeout: 10000 }).catch((e) => console.log('  (screenshot skipped:', e.message.split('\n')[0], ')'));

  console.log('Console/page errors across the whole run:', errors.length ? errors : 'none');
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
