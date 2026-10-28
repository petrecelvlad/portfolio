// Fixed-timestep capture harness for the Hero achievement-card shaders (T-016/T-017/T-018).
//
// Reads a shader's exact GLSL source straight out of AchievementLiveShaders.tsx (no
// hand-copied/duplicated GLSL — verbatim by construction, not by discipline) and
// `webgl.ts`'s createProgram/createShader, mounts them in a standalone headless page with
// u_time driven by an explicit step instead of performance.now().
//
// Usage: node tools/shader-capture/capture.mjs <shaderName> [mode]
//   diff   (default) — render frame(0) and frame(T), diff them in-browser via gl.readPixels,
//                       print the mean/max abs difference. Cheap loop-closure sanity check.
//   sprite — pack the shader's loop into a single sprite-sheet PNG + a manifest JSON
//            (frame count, grid, cell size, fps). Applies a tail crossfade if the shader's
//            config sets `crossfadeSeconds` (only Teamslead needs one — see T-020).
//   video  — capture a PNG per frame and encode to loop.webm (VP9) + loop.mp4 (H.264) via
//            ffmpeg. Only Cartridge uses this — smooth continuous 3D motion suits video over
//            a sprite sheet's steps().
//
// Per-shader config below comes straight from cone/project/specs/Achievement_Shader_Loop_Periods.md.

import { chromium } from 'playwright';
import * as esbuild from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import ffmpegPath from '@ffmpeg-installer/ffmpeg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../..');

// spriteFps: frame rate for sprite-sheet shaders (Level-Up, Factory, Teamslead) — chosen per shader so
// T * spriteFps lands on a whole number of frames (see each shader's console output for the check).
// videoFps: frame rate for Cartridge's video encode — 60fps makes 2*PI*60 = 376.99, ~0.15ms off a whole
// 377 frames, negligible without needing to retune the shader again for a cleaner fps fit.
// crossfadeSeconds: only Teamslead — its water/caustic noise is genuinely aperiodic (T-015/T-020), so the
// tail frames are blended toward the head frames when packed, rather than left as a hard cut.
// spriteCellWidth/Height: output cell size baked into the sheet, independent of the WebGL render
// resolution (always the full CAPTURE_WIDTH/HEIGHT below) — rendering stays full quality, then gets
// downscaled per-frame via canvas drawImage (browser default bilinear smoothing) when packed. Factory and
// Teamslead default to a smaller output cell than Level-Up: their much longer loop windows (33.3s/20s vs.
// 6.5s) mean far more frames even at a lower fps, and their sheets were 15-20MB at full 512x288 — heavy
// for background decoration. SpriteLoopCanvas in AchievementShaderCanvas.tsx sizes purely from the
// displayed container, so this is a capture-time-only choice, no component change needed.
const CAPTURE_WIDTH = 512;
const CAPTURE_HEIGHT = 288;
const SHADERS = {
  levelup: { fn: 'LevelUpShaderCanvas', T: 6.5, spriteFps: 12 },
  factory: { fn: 'FactoryShaderCanvas', T: 100 / 3, spriteFps: 6, spriteCellWidth: 256, spriteCellHeight: 144 },
  teamslead: { fn: 'TeamsLeadShaderCanvas', T: 20, spriteFps: 12, crossfadeSeconds: 1, spriteCellWidth: 256, spriteCellHeight: 144 },
  cartridge: { fn: 'CartridgeShaderCanvas', T: 2 * Math.PI, videoFps: 60 },
};

function extractTemplateLiteral(source, afterIndex, varName) {
  const marker = `const ${varName} = \``;
  const start = source.indexOf(marker, afterIndex);
  if (start === -1) throw new Error(`Could not find "${varName}" declaration after index ${afterIndex}`);
  const contentStart = start + marker.length;
  const end = source.indexOf('`', contentStart);
  if (end === -1) throw new Error(`Unterminated template literal for "${varName}"`);
  return { text: source.slice(contentStart, end), nextIndex: end };
}

function extractShaderSource(componentSource, functionName) {
  const fnMarker = `function ${functionName}(`;
  const fnStart = componentSource.indexOf(fnMarker);
  if (fnStart === -1) throw new Error(`Could not find function ${functionName} in AchievementShaderCanvas.tsx`);
  const vs = extractTemplateLiteral(componentSource, fnStart, 'vsSource');
  const fsResult = extractTemplateLiteral(componentSource, vs.nextIndex, 'fsSource');
  return { vsSource: vs.text, fsSource: fsResult.text };
}

async function main() {
  const shaderName = process.argv[2] || 'levelup';
  const mode = process.argv[3] || 'diff'; // 'sprite' = pack a sheet, 'video' = encode webm+mp4, 'diff' (default) = loop-closure check only
  const config = SHADERS[shaderName];
  if (!config) {
    throw new Error(`Unknown shader "${shaderName}". Known: ${Object.keys(SHADERS).join(', ')}`);
  }

  const componentPath = path.join(projectRoot, 'src/components/backgrounds/AchievementLiveShaders.tsx');
  const webglPath = path.join(projectRoot, 'src/components/backgrounds/webgl.ts');

  const componentSource = fs.readFileSync(componentPath, 'utf8');
  const { vsSource, fsSource } = extractShaderSource(componentSource, config.fn);

  const webglTs = fs.readFileSync(webglPath, 'utf8');
  const { code: webglJs } = await esbuild.transform(webglTs, {
    loader: 'ts',
    format: 'iife',
    globalName: 'WebGLUtil',
  });

  const outDir = path.join(__dirname, 'out', shaderName);
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });

  const width = CAPTURE_WIDTH;
  const height = CAPTURE_HEIGHT;

  const harnessScript = `
${webglJs}
const canvas = document.getElementById('c');
const gl = canvas.getContext('webgl');
const vsSource = ${JSON.stringify(vsSource)};
const fsSource = ${JSON.stringify(fsSource)};
const program = WebGLUtil.createProgram(gl, vsSource, fsSource);
if (!program) throw new Error('Shader compile/link failed - see console above');

const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);

const aPositionLoc = gl.getAttribLocation(program, 'a_position');
const uResolutionLoc = gl.getUniformLocation(program, 'u_resolution');
const uTimeLoc = gl.getUniformLocation(program, 'u_time');

function drawAt(uTime) {
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.useProgram(program);
  gl.enableVertexAttribArray(aPositionLoc);
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.vertexAttribPointer(aPositionLoc, 2, gl.FLOAT, false, 0, 0);
  gl.uniform2f(uResolutionLoc, canvas.width, canvas.height);
  gl.uniform1f(uTimeLoc, uTime);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
}

window.renderFrame = drawAt;

window.diffFrames = function(t1, t2) {
  drawAt(t1);
  const a = new Uint8Array(canvas.width * canvas.height * 4);
  gl.readPixels(0, 0, canvas.width, canvas.height, gl.RGBA, gl.UNSIGNED_BYTE, a);
  drawAt(t2);
  const b = new Uint8Array(canvas.width * canvas.height * 4);
  gl.readPixels(0, 0, canvas.width, canvas.height, gl.RGBA, gl.UNSIGNED_BYTE, b);
  let sumAbs = 0;
  let maxAbs = 0;
  for (let i = 0; i < a.length; i++) {
    const d = Math.abs(a[i] - b[i]);
    sumAbs += d;
    if (d > maxAbs) maxAbs = d;
  }
  return { meanAbsDiff: sumAbs / a.length, maxAbsDiff: maxAbs, channelCount: a.length };
};

window.packSpriteSheet = function(frameCount, fps, cols, rows, crossfadeFrames, outCellW, outCellH) {
  const cw = outCellW || canvas.width;
  const ch = outCellH || canvas.height;
  const sheet = document.createElement('canvas');
  sheet.width = cols * cw;
  sheet.height = rows * ch;
  const ctx = sheet.getContext('2d');
  const cf = crossfadeFrames || 0;
  for (let i = 0; i < frameCount; i++) {
    drawAt(i / fps);
    const col = i % cols;
    const row = Math.floor(i / cols);
    // Render stays full quality (canvas.width x canvas.height); drawImage does the downscale to the
    // output cell size here, using the browser's default bilinear smoothing — nicer than rendering the
    // WebGL scene natively at a lower resolution would be.
    ctx.drawImage(canvas, 0, 0, canvas.width, canvas.height, col * cw, row * ch, cw, ch);

    // Last cf frames: blend increasingly toward the corresponding head frame, so the tail gradually
    // morphs into matching the loop's start instead of hard-cutting into it. Only used for shaders whose
    // loop can't close exactly by retuning (Teamslead's aperiodic water noise) — see T-020.
    if (cf > 0 && i >= frameCount - cf) {
      const localIdx = i - (frameCount - cf);
      const alpha = (localIdx + 1) / (cf + 1);
      drawAt(localIdx / fps);
      ctx.globalAlpha = alpha;
      ctx.drawImage(canvas, 0, 0, canvas.width, canvas.height, col * cw, row * ch, cw, ch);
      ctx.globalAlpha = 1;
    }
  }
  document.body.appendChild(sheet);
  sheet.id = 'sheet';
  window.__lastSheet = sheet;
  window.__lastCellSize = { cw, ch, cols };
  return sheet.toDataURL('image/png');
};

// Crops one grid cell out of the sheet built by the most recent packSpriteSheet call, for spot-checking
// specific frames (e.g. the first vs. last cell) at full resolution instead of eyeballing the whole sheet.
window.extractCell = function(cellIndex) {
  const { cw, ch, cols } = window.__lastCellSize;
  const col = cellIndex % cols;
  const row = Math.floor(cellIndex / cols);
  const crop = document.createElement('canvas');
  crop.width = cw;
  crop.height = ch;
  crop.getContext('2d').drawImage(window.__lastSheet, col * cw, row * ch, cw, ch, 0, 0, cw, ch);
  return crop.toDataURL('image/png');
};

window.__ready = true;
`;

  const html = `<!doctype html><html><body style="margin:0;background:#000">
<canvas id="c" width="${width}" height="${height}"></canvas>
<script>${harnessScript}</script>
</body></html>`;

  const htmlPath = path.join(outDir, 'harness.html');
  fs.writeFileSync(htmlPath, html, 'utf8');

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width, height } });
  page.on('console', (msg) => console.log('[page]', msg.text()));
  page.on('pageerror', (err) => console.error('[pageerror]', err.message));

  await page.goto('file://' + htmlPath.replace(/\\/g, '/'));
  await page.waitForFunction(() => window.__ready === true);

  if (mode === 'sprite') {
    const spriteFps = config.spriteFps;
    const rawFrameCount = config.T * spriteFps;
    const frameCount = Math.round(rawFrameCount);
    if (Math.abs(rawFrameCount - frameCount) > 1e-6) {
      console.warn(
        `Warning: T=${config.T}s * spriteFps=${spriteFps} = ${rawFrameCount} is not a whole number of frames ` +
        `(rounded to ${frameCount}) — the last frame will sit slightly before the true loop point, a small ` +
        `sub-frame timing residual on top of the shader's own loop-closure error.`
      );
    }
    const crossfadeFrames = config.crossfadeSeconds ? Math.round(config.crossfadeSeconds * spriteFps) : 0;
    const cellW = config.spriteCellWidth || width;
    const cellH = config.spriteCellHeight || height;
    const cols = Math.ceil(Math.sqrt(frameCount));
    const rows = Math.ceil(frameCount / cols);
    console.log(`Packing ${frameCount} frames for "${shaderName}" into a ${cols}x${rows} sprite sheet (T=${config.T}s @ ${spriteFps}fps, cell ${cellW}x${cellH}px, sheet ${cols * cellW}x${rows * cellH}px${crossfadeFrames ? `, ${crossfadeFrames}-frame crossfade tail` : ''})`);

    const dataUrl = await page.evaluate(
      ({ frameCount, spriteFps, cols, rows, crossfadeFrames, cellW, cellH }) => window.packSpriteSheet(frameCount, spriteFps, cols, rows, crossfadeFrames, cellW, cellH),
      { frameCount, spriteFps, cols, rows, crossfadeFrames, cellW, cellH }
    );
    const base64 = dataUrl.split(',')[1];
    const sheetPath = path.join(outDir, 'spritesheet.png');
    fs.writeFileSync(sheetPath, Buffer.from(base64, 'base64'));

    const headCellUrl = await page.evaluate((i) => window.extractCell(i), 0);
    fs.writeFileSync(path.join(outDir, 'cell_head.png'), Buffer.from(headCellUrl.split(',')[1], 'base64'));
    const tailCellUrl = await page.evaluate((i) => window.extractCell(i), frameCount - 1);
    fs.writeFileSync(path.join(outDir, 'cell_tail.png'), Buffer.from(tailCellUrl.split(',')[1], 'base64'));
    console.log(`Wrote cell_head.png (frame 0) and cell_tail.png (frame ${frameCount - 1}) for spot comparison`);

    const manifest = {
      shader: shaderName,
      T: config.T,
      fps: spriteFps,
      frameCount,
      cols,
      rows,
      cellWidth: cellW,
      cellHeight: cellH,
      sheetWidth: cols * cellW,
      sheetHeight: rows * cellH,
      crossfadeFrames,
    };
    fs.writeFileSync(path.join(outDir, 'spritesheet.json'), JSON.stringify(manifest, null, 2));
    console.log(`Wrote ${sheetPath} and spritesheet.json`);
  } else if (mode === 'video') {
    const videoFps = config.videoFps;
    const rawFrameCount = config.T * videoFps;
    const frameCount = Math.round(rawFrameCount);
    const residualSeconds = Math.abs(rawFrameCount - frameCount) / videoFps;
    console.log(`Capturing ${frameCount} frames for "${shaderName}" (T=${config.T}s @ ${videoFps}fps, ${width}x${height}) — sub-frame residual ${(residualSeconds * 1000).toFixed(3)}ms`);

    const framesDir = path.join(outDir, 'frames');
    fs.mkdirSync(framesDir, { recursive: true });
    const canvasLocator = page.locator('#c');
    for (let i = 0; i < frameCount; i++) {
      const t = i / videoFps;
      await page.evaluate((tArg) => window.renderFrame(tArg), t);
      await canvasLocator.screenshot({ path: path.join(framesDir, `frame_${String(i).padStart(4, '0')}.png`) });
    }
    console.log(`Wrote ${frameCount} PNG frames to ${framesDir}`);

    const webmPath = path.join(outDir, 'loop.webm');
    const mp4Path = path.join(outDir, 'loop.mp4');
    const framePattern = path.join(framesDir, 'frame_%04d.png');

    execFileSync(ffmpegPath.path, [
      '-y', '-framerate', String(videoFps), '-i', framePattern,
      '-c:v', 'libvpx-vp9', '-crf', '32', '-b:v', '0', '-pix_fmt', 'yuv420p', webmPath,
    ], { stdio: 'inherit' });
    execFileSync(ffmpegPath.path, [
      '-y', '-framerate', String(videoFps), '-i', framePattern,
      '-c:v', 'libx264', '-crf', '20', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', mp4Path,
    ], { stdio: 'inherit' });
    console.log(`Wrote ${webmPath} and ${mp4Path}`);
  } else {
    console.log(`Diff-only mode for "${shaderName}" (T=${config.T}s) — skipping full frame capture`);
  }

  const diff = await page.evaluate(
    ({ t1, t2 }) => window.diffFrames(t1, t2),
    { t1: 0, t2: config.T }
  );
  console.log(`Loop-closure check: frame(0) vs frame(T=${config.T}) — mean abs diff/channel: ${diff.meanAbsDiff.toFixed(4)}, max abs diff: ${diff.maxAbsDiff} (0-255 scale, ${diff.channelCount} channel samples)`);

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
