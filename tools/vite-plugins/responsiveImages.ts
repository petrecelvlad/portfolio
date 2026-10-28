import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import type { Plugin, ResolvedConfig } from 'vite';

// One original per screenshot lives in public/. The smaller widths exist only in the build output
// (and in memory during dev), so the browser shrinks each image at most ~2x instead of on-the-fly 4x+.
const SOURCE_DIR = 'assets/screenshots';
const WIDTHS = [400, 800, 1200, 1600];
const RESIZABLE = /\.(jpe?g|png|webp)$/i;
const WEBP_QUALITY = 85;
const MODULE_ID = 'virtual:responsive-images';
const RESOLVED_ID = `\0${MODULE_ID}`;

interface Variant { file: string; width: number }
type Manifest = Record<string, { width: number; variants: Variant[] }>;

function variantFile(file: string, width: number) {
  return file.replace(RESIZABLE, `.${width}w.webp`);
}

function listSources(publicDir: string): string[] {
  const root = path.join(publicDir, SOURCE_DIR);
  return fs.readdirSync(root, { recursive: true, encoding: 'utf8' })
    .filter(name => RESIZABLE.test(name))
    .map(name => `/${SOURCE_DIR}/${name.split(path.sep).join('/')}`);
}

async function buildManifest(publicDir: string): Promise<Manifest> {
  const entries = await Promise.all(listSources(publicDir).map(async (file) => {
    const { width = 0 } = await sharp(path.join(publicDir, file)).metadata();
    const variants = WIDTHS.filter(w => w < width).map(w => ({ file: variantFile(file, w), width: w }));
    return [file, { width, variants }] as const;
  }));
  return Object.fromEntries(entries);
}

function resize(publicDir: string, source: string, width: number) {
  return sharp(path.join(publicDir, source)).resize({ width }).webp({ quality: WEBP_QUALITY }).toBuffer();
}

export function responsiveImages(): Plugin {
  let config: ResolvedConfig;
  let manifest: Promise<Manifest> | null = null;
  const getManifest = () => (manifest ??= buildManifest(config.publicDir));

  return {
    name: 'responsive-images',
    configResolved(resolved) {
      config = resolved;
    },
    resolveId(id) {
      return id === MODULE_ID ? RESOLVED_ID : undefined;
    },
    async load(id) {
      if (id !== RESOLVED_ID) return;
      return `export default ${JSON.stringify(await getManifest())};`;
    },
    configureServer(server) {
      const sourceRoot = path.join(config.publicDir, SOURCE_DIR);
      server.watcher.add(sourceRoot);
      const refresh = (file: string) => {
        if (!file.startsWith(sourceRoot)) return;
        manifest = null;
        const module = server.moduleGraph.getModuleById(RESOLVED_ID);
        if (module) server.moduleGraph.invalidateModule(module);
        server.ws.send({ type: 'full-reload' });
      };
      server.watcher.on('add', refresh).on('unlink', refresh).on('change', refresh);

      const cache = new Map<string, Promise<Buffer>>();
      server.middlewares.use(async (req, res, next) => {
        const url = decodeURIComponent((req.url ?? '').split('?')[0]);
        if (!url.startsWith(config.base)) return next();
        const file = `/${url.slice(config.base.length)}`;
        const variant = Object.entries(await getManifest())
          .flatMap(([source, entry]) => entry.variants.map(v => ({ source, ...v })))
          .find(v => v.file === file);
        if (!variant) return next();
        const key = `${variant.file}@${fs.statSync(path.join(config.publicDir, variant.source)).mtimeMs}`;
        if (!cache.has(key)) cache.set(key, resize(config.publicDir, variant.source, variant.width));
        res.setHeader('Content-Type', 'image/webp');
        res.end(await cache.get(key));
      });
    },
    async generateBundle() {
      const jobs = Object.entries(await getManifest()).flatMap(([source, entry]) =>
        entry.variants.map(async (v) => {
          this.emitFile({ type: 'asset', fileName: v.file.slice(1), source: await resize(config.publicDir, source, v.width) });
        }));
      await Promise.all(jobs);
    },
  };
}
