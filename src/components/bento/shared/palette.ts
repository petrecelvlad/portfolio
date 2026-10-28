// The six washed-out sticky-note colors are heritage's one shared color
// language for "handwritten desk" accents. Introduced for the Skills sticky
// notes (BentoSkills.tsx) and centralized here (2026-07-24) so every other
// heritage component that needs the same family of colors — the
// responsibilities clipboard's page tabs, and whatever's next — reads from
// one source instead of each one inventing its own set. Order is fixed and
// meaningful: components that assign by index (e.g. "slot i gets color i")
// stay visually consistent with each other using the same index.
//
// Recolored/reordered (2026-07-24, Vlad): blue, yellow, purple, green, red,
// orange — six clearly-named hues spread around the wheel, replacing the
// original set (which had no true red, purple, or green — mint/peach/
// lavender were all closer to a neighboring hue than the name implied).
// Kept in the same pastel lightness/saturation family as the originals so
// the sticky notes' soft "washed paper" character doesn't change, only
// which hues are available.
export const HERITAGE_PALETTE = [
  '#A8CDEC', // blue
  '#F5E9A8', // yellow
  '#CBAEE0', // purple
  '#A9D8AE', // green
  '#E8A3A0', // red
  '#F0B87D', // orange
] as const;

function hexToHsl(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l * 100];

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  switch (max) {
    case r: h = (g - b) / d + (g < b ? 6 : 0); break;
    case g: h = (b - r) / d + 2; break;
    default: h = (r - g) / d + 4; break;
  }
  return [h * 60, s * 100, l * 100];
}

function hslToHex(h: number, s: number, l: number): string {
  h /= 360; s /= 100; l /= 100;
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const r = s === 0 ? l : hue2rgb(p, q, h + 1 / 3);
  const g = s === 0 ? l : hue2rgb(p, q, h);
  const b = s === 0 ? l : hue2rgb(p, q, h - 1 / 3);
  const toHex = (x: number) => Math.round(x * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// The per-component knob the shared palette is meant to be used with: bump
// (or reduce) a base color's saturation without changing its hue or
// lightness, so a component that needs more visual punch than the flat
// pastel notes (e.g. a small clickable tab, which needs to read clearly
// against the wood and the paper) still derives from the same six colors
// instead of hand-picking a new, unrelated shade.
export function saturate(hex: string, deltaPct: number): string {
  const [h, s, l] = hexToHsl(hex);
  return hslToHex(h, Math.min(100, Math.max(0, s + deltaPct)), l);
}

// Same knob as `saturate`, but for lightness — reduces a base color's own lightness by
// `deltaPct` points without touching hue/saturation, so a "darker shade of this exact color"
// (an elevation/shadow rectangle attached to an element, a pressed state, etc) derives from the
// element's own fill instead of a hand-picked unrelated dark color.
export function darken(hex: string, deltaPct: number): string {
  const [h, s, l] = hexToHsl(hex);
  return hslToHex(h, s, Math.min(100, Math.max(0, l - deltaPct)));
}

// Mirror of `darken` — raises lightness instead of lowering it. Same use case, opposite
// direction: a "lighter shade of this exact color" (a highlight rectangle attached to an
// element's near edge, mirroring an elevation/shadow rectangle on its far edge) derived from the
// element's own fill instead of a hand-picked unrelated light color.
export function lighten(hex: string, deltaPct: number): string {
  const [h, s, l] = hexToHsl(hex);
  return hslToHex(h, s, Math.min(100, Math.max(0, l + deltaPct)));
}

// ============================================================================
// THE HERITAGE EMBOSS EFFECT — read this before styling any hard/molded
// surface (a button, a tab, a clip — anything that isn't paper) in this
// skin. Documented here once (2026-07-24, Vlad) so it never gets reinvented
// or mis-implemented again.
//
// WHAT IT IS: a thin solid-color lighter bar along the top edge and a thin
// solid-color darker bar along the bottom edge of an element, on top of its
// flat base-color fill. Nothing else. This is what "the achievement bar"
// and the clipboard board (BentoResponsibilities' BOARD_COLOR div, via its
// `var(--shadow-raised)` boxShadow) already do correctly.
//
// WHAT IT IS NOT: a gradient. Heritage does not use gradients anywhere,
// full stop — a smooth blended fill (however it's produced: a CSS
// linear-gradient, an SVG <linearGradient>, anything that interpolates
// between color stops) is never correct for this skin, regardless of how
// close it might look. A previous version of this file implemented the
// tabs' depth cue as exactly that — an SVG/CSS gradient overlay — which is
// the wrong technique, not just a wrong percentage. It has been removed.
//
// THE ACTUAL MECHANISM — already built, do not re-derive it: the
// `--shadow-raised` / `--shadow-sunken` CSS custom properties, defined for
// this skin in `src/index.css` under `[data-skin="heritage"]` (search
// `--depth-style: embossed`) — THE SINGLE SOURCE for both bar colors AND
// thicknesses. Under heritage `--shadow-raised` resolves to solid (non-
// gradient) inset box-shadows: `inset 0 3px 0 0 rgba(255,246,219,0.5),
// inset 0 -3px 0 0 rgba(36,26,16,0.3), <soft ambient shadow>` — a light
// line at the top, a dark line at the bottom, deliberately the SAME 3px
// thickness (fixed 2026-07-24 — they started at 1.5px/3px, which read as
// barely-there on top vs. clearly visible on the bottom). Consume it as:
//   - `style={{ boxShadow: 'var(--shadow-raised)' }}` (inline style), or
//   - `shadow-[var(--shadow-raised)]` (Tailwind's arbitrary-value bracket
//     syntax)
// Never the bare `.shadow-raised` / `.shadow-sunken` Tailwind utility
// classes — Tailwind v4 inlines the DEFAULT expression into those classes
// at build time, so they silently ignore any skin's override of the
// underlying custom property (documented at length in
// `cone/project/architecture/systems/SKIN_SYSTEM.md`, DR-017's correction).
//
// Current real consumers of this exact mechanism: BentoAchievement.tsx
// (shared/, `shadow-[var(--shadow-raised)]`), BentoResponsibilities.tsx's
// clipboard board AND its page tabs. Any new hard-surface component joins
// this list by consuming `var(--shadow-raised)` directly — it does not get
// its own gloss/emboss constants, and it does not hardcode these rgba
// values as a local copy.
//
// ONE exception, and only one: BinderClip (BentoResponsibilities.tsx) is
// an SVG path, and box-shadow can't follow an arbitrary path — it paints a
// rectangle around the SVG's whole bounding box instead (confirmed via a
// visible stray-rectangle bug, 2026-07-24). SVG also has no way to read a
// CSS custom property into a fill color. EMBOSS_LIGHT/EMBOSS_DARK/
// EMBOSS_AMBIENT_SHADOW below are that one unavoidable mirror — the exact
// same two rgba values as --shadow-raised's inset lines, kept as the
// single JS-side copy so nothing else re-derives its own. If
// --shadow-raised's colors or thickness ratio ever change in index.css,
// update these three constants to match in the same edit — light and dark
// must stay the same thickness in both places.
export const EMBOSS_LIGHT = 'rgba(255, 246, 219, 0.5)';
export const EMBOSS_DARK = 'rgba(36, 26, 16, 0.3)';
export const EMBOSS_AMBIENT_SHADOW = 'drop-shadow(0 4px 12px rgba(20, 14, 8, 0.4))';
// ============================================================================

// The "board" — heritage's one hard-surface base color, and its paper-white
// inset counterpart. Originally local to BentoResponsibilities.tsx's clipboard
// (sampled from image.png's mockup: a saturated warm peach/kraft tan, distinctly
// warmer than the near-white paper); promoted here 2026-07-27 once DeskBoard.tsx
// became a second real consumer, same "extract on the second use" discipline as
// HERITAGE_PALETTE above — every board in this skin (the clipboard, SkillTree's
// two new desk panels) reads from one source instead of each inventing its own.
export const BOARD_COLOR = '#E4B77E';
export const PAPER_COLOR = '#FDF7E9';
// DeskBoard.tsx's recessed interior panel tone. Sampled with an actual pixel scan of image.png
// (not eyeballing a crop) at multiple clean points away from any icon: the interior is a FLAT
// #C49A6C (L≈60%), only modestly darker than BOARD_COLOR's own L≈70% — a subtle contrast, not
// the dramatic caramel-vs-tan split the previous value (#A97748, L≈47%) assumed. That previous
// value overcorrected from the first attempt's "too light" mistake straight into "too dark" —
// same axis, wrong direction, still not measured against the real pixels.
export const BOARD_INSET_COLOR = '#C49A6C';
// Bauhaus's own flat shadow (--shadow-raised on every other slot: the phone,
// skills, achievement) is a fully OPAQUE straight-down offset —
// `0 var(--ui-depth) 0 0 #000000` — which is what actually reads as a solid
// grounding line under those elements, not just "a shadow." A translucent
// rgba offset never matches that solid-line weight regardless of opacity
// tuning — it has to be fully opaque. This mirrors that exact mechanism with
// heritage's own ink color instead of literal black, layered in FRONT of the
// embossed shadow (paired as `${BOARD_UNDERSHADOW}, var(--shadow-raised)}` —
// box-shadow paints first-listed on top; listed behind, it gets masked by
// the blur).
export const BOARD_UNDERSHADOW = '0 var(--ui-depth) 0px var(--color-ink-base)';
