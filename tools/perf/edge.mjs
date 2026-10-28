// Launches headless Microsoft Edge and drives it over the Chrome DevTools Protocol with Node's own
// WebSocket. No Playwright or Puppeteer: the user had them removed because they made the PC lag
// (cone/project/memory/PLAYBOOK.md).
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

const DEFAULT_EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const STARTUP_TIMEOUT_MS = 20000;

class CdpConnection {
  #socket;
  #nextId = 1;
  #pending = new Map();
  #listeners = new Map();

  constructor(socket) {
    this.#socket = socket;
    socket.addEventListener('message', (event) => this.#handleMessage(JSON.parse(event.data)));
  }

  #handleMessage(message) {
    if (message.id !== undefined) {
      const request = this.#pending.get(message.id);
      this.#pending.delete(message.id);
      if (message.error) request.reject(new Error(`${request.method} failed: ${message.error.message}`));
      else request.resolve(message.result);
      return;
    }
    const key = `${message.sessionId ?? ''}:${message.method}`;
    for (const listener of this.#listeners.get(key) ?? []) listener(message.params);
  }

  send(method, params = {}, sessionId) {
    const id = this.#nextId++;
    this.#socket.send(JSON.stringify({ id, method, params, sessionId }));
    return new Promise((resolve, reject) => this.#pending.set(id, { method, resolve, reject }));
  }

  waitFor(method, sessionId, timeoutMs) {
    const key = `${sessionId ?? ''}:${method}`;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`Timed out after ${timeoutMs} ms waiting for ${method}`)), timeoutMs);
      const listener = (params) => {
        clearTimeout(timer);
        this.#listeners.set(key, this.#listeners.get(key).filter((l) => l !== listener));
        resolve(params);
      };
      this.#listeners.set(key, [...(this.#listeners.get(key) ?? []), listener]);
    });
  }

  close() {
    this.#socket.close();
  }
}

async function readDevToolsEndpoint(profileDir) {
  const portFile = join(profileDir, 'DevToolsActivePort');
  const deadline = Date.now() + STARTUP_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (existsSync(portFile)) {
      const [port, path] = readFileSync(portFile, 'utf8').trim().split('\n');
      if (port && path) return `ws://127.0.0.1:${port}${path}`;
    }
    await sleep(100);
  }
  throw new Error(`Edge did not open its DevTools port within ${STARTUP_TIMEOUT_MS} ms`);
}

/**
 * Starts Edge with one page at the given viewport size. `isFrameRateUncapped` turns off vsync and the
 * frame limiter so requestAnimationFrame runs as fast as the page can render.
 */
export async function launchEdge({ width, height, isFrameRateUncapped = false }) {
  const edgePath = process.env.PERF_EDGE_PATH ?? DEFAULT_EDGE;
  if (!existsSync(edgePath)) throw new Error(`Edge not found at ${edgePath}; set PERF_EDGE_PATH to its msedge.exe`);

  const profileDir = mkdtempSync(join(tmpdir(), 'hero-perf-'));
  const args = [
    '--headless=new',
    '--remote-debugging-port=0',
    `--user-data-dir=${profileDir}`,
    `--window-size=${width},${height}`,
    '--no-first-run',
    '--no-default-browser-check',
    // Use the real GPU even where Edge would fall back to software rendering.
    '--ignore-gpu-blocklist',
    '--enable-gpu',
    '--use-angle=d3d11',
  ];
  if (isFrameRateUncapped) args.push('--disable-gpu-vsync', '--disable-frame-rate-limit');
  const edgeProcess = spawn(edgePath, [...args, 'about:blank'], { stdio: 'ignore' });

  const socket = new WebSocket(await readDevToolsEndpoint(profileDir));
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', () => reject(new Error('Could not connect to Edge DevTools')), { once: true });
  });
  const cdp = new CdpConnection(socket);

  const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });
  await cdp.send('Page.enable', {}, sessionId);
  await cdp.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false }, sessionId);

  const evaluate = async (expression) => {
    const { result, exceptionDetails } = await cdp.send(
      'Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }, sessionId);
    if (exceptionDetails) throw new Error(`Page script failed: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
    return result.value;
  };

  return {
    evaluate,
    async open(url, timeoutMs = 30000) {
      const loaded = cdp.waitFor('Page.loadEventFired', sessionId, timeoutMs);
      await cdp.send('Page.navigate', { url }, sessionId);
      await loaded;
    },
    /** CPU seconds per browser process, summed, plus the process ids for memory lookups. */
    async processUsage() {
      const { processInfo } = await cdp.send('SystemInfo.getProcessInfo');
      return { cpuSeconds: processInfo.reduce((sum, p) => sum + p.cpuTime, 0), pids: processInfo.map((p) => p.id) };
    },
    async close() {
      await cdp.send('Browser.close').catch(() => {});
      cdp.close();
      await new Promise((resolve) => (edgeProcess.exitCode !== null ? resolve() : edgeProcess.once('exit', resolve)));
      // Edge can hold profile files for a moment after exiting. A leftover temp folder must not
      // discard a finished measurement, so a failed cleanup only warns.
      try {
        rmSync(profileDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
      } catch (error) {
        console.warn(`Could not delete the temporary browser profile ${profileDir}: ${error.message}`);
      }
    },
  };
}
