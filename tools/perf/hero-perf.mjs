// npm run perf: builds the site, serves it, measures the hero and compares with baseline.json.
// npm run perf -- --save-baseline: same, then records the result as the new baseline.
// Method and how to read the numbers: README.md beside this file.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { cpus } from 'node:os';
import { fileURLToPath } from 'node:url';
import { setTimeout as sleep } from 'node:timers/promises';
import { build, preview } from 'vite';
import { launchEdge } from './edge.mjs';

const PROJECT_ROOT = fileURLToPath(new URL('../../', import.meta.url));
const BASELINE_PATH = new URL('./baseline.json', import.meta.url);
const VIEWPORT = { width: 1920, height: 969 };
const RUNS = 3;
const SETTLE_MS = 6000;
const SAMPLE_MS = 8000;
const BACKGROUND_WAIT_MS = 20000;

// How far a metric may move the wrong way before it counts as a regression. Wider than the measured
// run-to-run noise (CPU varies about ±15% between runs on the reference PC).
const METRICS = {
  heroFps: { label: 'Hero frame rate', unit: 'fps', higherIsBetter: true, tolerance: 0.10 },
  heroCpuPercent: { label: 'Hero CPU (100% = one core)', unit: '%', higherIsBetter: false, tolerance: 0.25 },
  heroRamMb: { label: 'Browser RAM', unit: 'MB', higherIsBetter: false, tolerance: 0.10 },
  backgroundMsPerFrame: { label: '3D background alone, per frame', unit: 'ms', higherIsBetter: false, tolerance: 0.15 },
};

const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];

const WEBGL_RENDERER = `(() => {
  const gl = document.createElement('canvas').getContext('webgl');
  const info = gl && gl.getExtension('WEBGL_debug_renderer_info');
  return info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : 'none';
})()`;

// The 3D background is the canvas covering (nearly) the whole hero; it mounts late (lazy chunk).
const WAIT_FOR_BACKGROUND = `new Promise((resolve, reject) => {
  const deadline = performance.now() + ${BACKGROUND_WAIT_MS};
  const check = () => {
    const hero = document.querySelector('main > :first-child');
    const heroArea = hero.clientWidth * hero.clientHeight;
    const canvas = [...hero.querySelectorAll('canvas')].find((c) => c.clientWidth * c.clientHeight > heroArea * 0.9);
    if (canvas) resolve(true);
    else if (performance.now() > deadline) reject(new Error('The 3D background never appeared in the hero'));
    else setTimeout(check, 100);
  };
  check();
})`;

// Hides everything in the hero but the 3D background and stops every video, so only the background draws.
const ISOLATE_BACKGROUND = `(() => {
  const hero = document.querySelector('main > :first-child');
  const heroArea = hero.clientWidth * hero.clientHeight;
  let node = [...hero.querySelectorAll('canvas')].find((c) => c.clientWidth * c.clientHeight > heroArea * 0.9);
  while (node !== hero) {
    for (const sibling of node.parentElement.children) if (sibling !== node) sibling.style.display = 'none';
    node = node.parentElement;
  }
  document.querySelectorAll('video').forEach((video) => video.pause());
})()`;

const COUNT_FRAMES = `new Promise((done) => {
  let frames = 0;
  const end = performance.now() + ${SAMPLE_MS};
  const tick = (time) => { frames++; time < end ? requestAnimationFrame(tick) : done(frames); };
  requestAnimationFrame(tick);
})`;

function workingSetMb(pids) {
  const total = execFileSync('powershell', [
    '-NoProfile', '-Command',
    `(Get-Process -Id ${pids.join(',')} -ErrorAction SilentlyContinue | Measure-Object WorkingSet64 -Sum).Sum`,
  ]).toString().trim();
  const megabytes = Math.round(Number(total) / 1048576);
  if (!(megabytes > 0)) throw new Error(`Could not read the browser's memory (processes ${pids.join(',')}, got "${total}")`);
  return megabytes;
}

/** One fresh browser, one measurement. 'hero' = as a visitor sees it; 'background' = 3D background alone, uncapped. */
async function measureOnce(mode, url) {
  const edge = await launchEdge({ ...VIEWPORT, isFrameRateUncapped: mode === 'background' });
  try {
    await edge.open(url);
    const gpu = await edge.evaluate(WEBGL_RENDERER);
    if (/swiftshader|basic render|none/i.test(gpu)) {
      throw new Error(`Edge is rendering without the real GPU (${gpu}); the numbers would be meaningless`);
    }
    await edge.evaluate(WAIT_FOR_BACKGROUND);
    if (mode === 'background') await edge.evaluate(ISOLATE_BACKGROUND);
    await sleep(SETTLE_MS);

    const before = await edge.processUsage();
    const frames = await edge.evaluate(COUNT_FRAMES);
    const after = await edge.processUsage();
    const seconds = SAMPLE_MS / 1000;
    const fps = frames / seconds;
    return {
      gpu,
      fps,
      cpuPercent: ((after.cpuSeconds - before.cpuSeconds) / seconds) * 100,
      ramMb: workingSetMb(after.pids),
    };
  } finally {
    await edge.close();
  }
}

function currentCommit() {
  const commit = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: PROJECT_ROOT }).toString().trim();
  const isDirty = execFileSync('git', ['status', '--porcelain'], { cwd: PROJECT_ROOT }).toString().trim() !== '';
  return isDirty ? `${commit} + uncommitted changes` : commit;
}

function formatValue(key, value) {
  return `${value.toFixed(key === 'backgroundMsPerFrame' ? 1 : 0)} ${METRICS[key].unit}`;
}

/** Compares against the baseline; returns the keys that got worse beyond their tolerance. */
function compare(metrics, baseline) {
  const regressions = [];
  console.log(`\nCompared with the baseline from ${baseline.recordedAt} (${baseline.commit}):`);
  for (const [key, spec] of Object.entries(METRICS)) {
    const before = baseline.metrics[key];
    const now = metrics[key];
    const change = (now - before) / before;
    const isWorse = spec.higherIsBetter ? change < -spec.tolerance : change > spec.tolerance;
    if (isWorse) regressions.push(key);
    const sign = change >= 0 ? '+' : '';
    console.log(`  ${isWorse ? 'WORSE' : 'ok   '}  ${spec.label.padEnd(32)} ${formatValue(key, before).padStart(9)} -> ${formatValue(key, now).padStart(9)}  (${sign}${(change * 100).toFixed(0)}%)`);
  }
  return regressions;
}

async function main() {
  const shouldSaveBaseline = process.argv.includes('--save-baseline');

  console.log('Building the site...');
  await build({ root: PROJECT_ROOT, logLevel: 'error' });
  const server = await preview({ root: PROJECT_ROOT, logLevel: 'warn', preview: { port: 4173 } });
  const url = server.resolvedUrls.local[0];

  const runs = { hero: [], background: [] };
  try {
    // Modes alternate so slow drift (heat, background apps) spreads over both instead of skewing one.
    for (let run = 1; run <= RUNS; run++) {
      for (const mode of ['hero', 'background']) {
        const result = await measureOnce(mode, url);
        runs[mode].push(result);
        console.log(`  run ${run} ${mode.padEnd(10)} ${result.fps.toFixed(1)} fps, CPU ${result.cpuPercent.toFixed(0)}%, RAM ${result.ramMb} MB`);
      }
    }
  } finally {
    await server.close();
  }

  const metrics = {
    heroFps: median(runs.hero.map((r) => r.fps)),
    heroCpuPercent: median(runs.hero.map((r) => r.cpuPercent)),
    heroRamMb: median(runs.hero.map((r) => r.ramMb)),
    backgroundMsPerFrame: median(runs.background.map((r) => 1000 / r.fps)),
  };
  const machine = { gpu: runs.hero[0].gpu, cpu: cpus()[0].model.trim(), viewport: `${VIEWPORT.width}x${VIEWPORT.height}` };

  console.log('\nResult (middle of 3 runs):');
  for (const key of Object.keys(METRICS)) console.log(`  ${METRICS[key].label.padEnd(32)} ${formatValue(key, metrics[key])}`);

  if (shouldSaveBaseline) {
    const baseline = { recordedAt: new Date().toISOString().slice(0, 10), commit: currentCommit(), machine, metrics };
    writeFileSync(BASELINE_PATH, `${JSON.stringify(baseline, null, 2)}\n`);
    console.log('\nSaved as the new baseline (tools/perf/baseline.json).');
    return;
  }

  if (!existsSync(BASELINE_PATH)) {
    console.log('\nNo baseline yet. Record one on the reference PC with: npm run perf -- --save-baseline');
    return;
  }
  const baseline = JSON.parse(readFileSync(BASELINE_PATH, 'utf8'));
  if (baseline.machine.gpu !== machine.gpu) {
    console.error(`\nThe baseline was recorded on a different GPU (${baseline.machine.gpu}); comparing would be meaningless.`);
    process.exitCode = 2;
    return;
  }
  const regressions = compare(metrics, baseline);
  if (regressions.length > 0) {
    console.error(`\n${regressions.length} metric(s) got worse beyond their tolerance. Re-run once to rule out noise before trusting it.`);
    process.exitCode = 1;
  } else {
    console.log('\nNo regression.');
  }
}

await main();
