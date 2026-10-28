import React from 'react';
import { SkillsSlotProps } from '@/src/components/bento/ports';
import { SKILL_ICONS } from '@/src/core/domain/skillIcons';
import { HERITAGE_PALETTE } from './palette';

// No panel — these sit loose on the wood, like real sticky notes. Six fixed
// washed-out colors, one per slot position (not per skill), so the same
// slot always reads the same color across projects — sourced from the
// shared HERITAGE_PALETTE (palette.ts) so every heritage component drawing
// from "the six sticky-note colors" stays in sync with this one list.
// Rotations are fixed per slot too, not randomized per render, so the
// layout doesn't jitter on re-render/HMR.
const NOTE_COLORS = HERITAGE_PALETTE;
const NOTE_ROTATIONS = [-4, 3, -2, 4, -3, 2];

// Flat, single-color fill — no gloss/gradient (Vlad, 2026-07-23): paper is
// matte, and the glossy light-source treatment (still used on hard/molded
// surfaces like the clipboard's binder clip) never belonged on it. This also
// resolves the note-background-doesn't-render bug: the previous gradient
// leaned on CSS color-mix(), which only shipped in Chrome 111 (Mar 2023) —
// an older/un-updated Chrome silently drops the whole declaration it
// appears in (invalid value invalidates the entire property), which is why
// the notes rendered with no background at all on an older laptop.
//
// rgbMix below is kept for the fold flap's darker tone (BLACK toward) —
// that's structural "back of the folded paper" shading, not decorative
// gloss, and still needs a computed darker shade. It replicates
// color-mix(in srgb, hex 100%, toward W%)'s exact math — CSS normalizes
// percentages over 100% by scaling both down proportionally, which reduces
// to a plain weighted average — as a static rgb() string every browser can
// parse, so it carries none of color-mix()'s support risk.
const BLACK: [number, number, number] = [0, 0, 0];
function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgbMix(hex: string, toward: [number, number, number], towardWeightPct: number): string {
  const [r, g, b] = hexToRgb(hex);
  const total = 100 + towardWeightPct;
  const wBase = 100 / total;
  const wToward = towardWeightPct / total;
  const chan = (base: number, to: number) => Math.round(base * wBase + to * wToward);
  return `rgb(${chan(r, toward[0])}, ${chan(g, toward[1])}, ${chan(b, toward[2])})`;
}

// image.png's reference sheet varies the embellishment per note (tape,
// thumbtack, paperclip, folded corner). Current direction (Vlad, 2026-07-23):
// every note is a fold now, tape/pin/clip disabled — not deleted, so they're
// a one-line revert (change NOTE_EFFECTS back) if a future pass wants the mix
// again. PIN_COLORS/TapeCorner/PinTack/PaperClip below are unused while this
// holds.
type NoteEffect = 'tape' | 'pin' | 'clip' | 'fold';
const NOTE_EFFECTS: NoteEffect[] = ['fold', 'fold', 'fold', 'fold', 'fold', 'fold'];
const PIN_COLORS = ['#B8483F', '#3D6B8C', '#B8483F', '#3D6B8C', '#B8483F', '#3D6B8C'];

// Which corner each note's fold sits in — fixed per slot position, same
// reasoning as NOTE_ROTATIONS (a real per-render random would jitter on
// every re-render/HMR). Deliberately not all the same corner, so six folded
// notes in a row don't read as one repeated stamp.
type FoldCorner = 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
const NOTE_FOLD_CORNERS: FoldCorner[] = [
  'bottom-left',
  'top-right',
  'bottom-right',
  'top-left',
  'top-right',
  'bottom-left',
];

// Re-derived from raw pixel sampling of image.png (GetPixel grids at the
// actual corner, not a visual guess) on BOTH reference notes — orange
// (bottom-left fold) and purple (bottom-right fold, mirrored). Both share
// one structure: take the corner's [0-F%] x [(100-F)-100%] rectangle (F =
// FOLD_SIZE). Split it by the diagonal running corner-to-corner across that
// rectangle. The half AWAY from the true corner, flush against the note's
// own remaining edge, is a solid darker flap. The half AT the true corner is
// cut away from the note's own silhouette entirely, revealing whatever sits
// behind the note (the desk). Earlier attempts inverted this — flap at the
// corner, gap next to the note body — which reads as a stain, not a lifted
// corner. So: the front layer is clipped to a plain rectangular notch (the
// diagonal lives entirely on the flap piece, not here), and a separate flap
// div, clipped to the diagonal triangle, sits behind it, filling only the
// half nearer the note body. FOLD_CLIPS below is that same pair of shapes
// mirrored/rotated into each of the 4 corners so any note can fold in any
// corner — bottom-left is the one actually measured from the reference, the
// other three are its reflections, not independently re-derived.
const FOLD_SIZE = 20;
const F = FOLD_SIZE;
const R = 100 - FOLD_SIZE;
const FOLD_CLIPS: Record<FoldCorner, { notch: string; flap: string }> = {
  'bottom-left': {
    notch: `polygon(0% 0%, 100% 0%, 100% 100%, ${F}% 100%, ${F}% ${R}%, 0% ${R}%)`,
    flap: `polygon(0% ${R}%, ${F}% ${R}%, ${F}% 100%)`,
  },
  'bottom-right': {
    notch: `polygon(0% 0%, 100% 0%, 100% ${R}%, ${R}% ${R}%, ${R}% 100%, 0% 100%)`,
    flap: `polygon(${R}% ${R}%, 100% ${R}%, ${R}% 100%)`,
  },
  'top-left': {
    notch: `polygon(${F}% 0%, 100% 0%, 100% 100%, 0% 100%, 0% ${F}%, ${F}% ${F}%)`,
    flap: `polygon(0% ${F}%, ${F}% ${F}%, ${F}% 0%)`,
  },
  'top-right': {
    notch: `polygon(0% 0%, ${R}% 0%, ${R}% ${F}%, 100% ${F}%, 100% 100%, 0% 100%)`,
    flap: `polygon(${R}% 0%, ${R}% ${F}%, 100% ${F}%)`,
  },
};

function FoldFlap({ color, corner }: { color: string; corner: FoldCorner }) {
  return (
    <div
      className="absolute inset-0"
      style={{
        clipPath: FOLD_CLIPS[corner].flap,
        backgroundColor: rgbMix(color, BLACK, 25),
      }}
      aria-hidden
    />
  );
}

function TapeCorner({ rotation }: { rotation: number }) {
  return (
    <div
      className="absolute -top-2 left-1/2 -translate-x-1/2 w-9 h-4 bg-white/50 border border-white/70"
      style={{ transform: `rotate(${rotation}deg)` }}
      aria-hidden
    />
  );
}

function PinTack({ color }: { color: string }) {
  return (
    <svg
      viewBox="0 0 20 24"
      className="absolute -top-3 left-1/2 -translate-x-1/2 w-5 h-6 drop-shadow-sm"
      aria-hidden
    >
      <ellipse cx="10" cy="19" rx="2.5" ry="1" fill="black" opacity="0.2" />
      <path d="M10 12 L10 19" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="10" cy="8" r="6" fill={color} />
      <circle cx="7.5" cy="5.5" r="2" fill="white" opacity="0.4" />
    </svg>
  );
}

function PaperClip() {
  return (
    <svg
      viewBox="0 0 20 26"
      className="absolute -top-3 left-1/2 -translate-x-1/2 w-4 h-5 drop-shadow-sm"
      aria-hidden
    >
      <path
        d="M6 12 V6 a4 4 0 0 1 8 0 v11 a2.5 2.5 0 0 1 -5 0 V9"
        fill="none"
        stroke="#8B93A0"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

interface StickyNoteProps {
  key?: React.Key;
  color: string;
  rotation: number;
  skill: string;
  effect: NoteEffect;
  pinColor: string;
  foldCorner: FoldCorner;
}

function StickyNote({ color, rotation, skill, effect, pinColor, foldCorner }: StickyNoteProps) {
  const isFold = effect === 'fold';
  const Icon = SKILL_ICONS[skill];
  return (
    <div
      className="relative [container-type:size] w-[124px] h-[124px] tablet:w-[var(--note-size)] tablet:h-[var(--note-size)] flex-shrink-0"
      style={{
        transform: `rotate(${rotation}deg)`,
        // clip-path (the fold notch) clips away box-shadow along with it, so
        // the notched variant needs filter: drop-shadow() instead — same
        // incompatibility documented for the clipboard's torn photo frame.
        // Near-zero blur, matching the hard-offset shadow language already
        // used elsewhere (e.g. the phone's --chrome-device-shadow, a flat
        // 0-blur offset) rather than a soft halo — a crisp solid duplicate
        // of the note's own silhouette, offset behind it, reads as "resting
        // on the desk" without any diffuse haze around the edges.
        filter: isFold ? 'drop-shadow(3px 6px 1px rgba(30, 22, 14, 0.5))' : undefined,
      }}
    >
      {isFold && <FoldFlap color={color} corner={foldCorner} />}

      <div
        className="relative z-10 w-full h-full flex flex-col items-center justify-center gap-1 p-1.5"
        style={{
          background: color,
          clipPath: isFold ? FOLD_CLIPS[foldCorner].notch : undefined,
          boxShadow: !isFold ? '3px 6px 1px 0 rgba(30, 22, 14, 0.5)' : 'none',
        }}
      >
        <div className="text-ink-base flex-shrink-0">
          <Icon strokeWidth={2} className="w-[24.3cqw] h-[24.3cqw]" />
        </div>
        <span
          style={{ fontFamily: 'var(--font-hand)' }}
          className="text-[11.5cqw] leading-[1.05] text-ink-base text-center line-clamp-2"
        >
          {skill}
        </span>

        {effect === 'tape' && <TapeCorner rotation={rotation >= 0 ? -6 : 6} />}
        {effect === 'pin' && <PinTack color={pinColor} />}
        {effect === 'clip' && <PaperClip />}
      </div>
    </div>
  );
}

export function BentoSkills({ skills }: SkillsSlotProps) {
  const displaySkills = skills.slice(0, 6);

  return (
    <div className="flex flex-col items-center gap-2 md:gap-3">
      {/* SKILLS label — debossed into the desk (Vlad, 2026-07-23; see
          cone/agent/sessions/Handoff_CarvedSkillsText.md for the full history of
          what didn't work). Single flat fill color, no gradient, no stroke.
          Depth comes only from two zero-blur text-shadows: dark offset UP
          (the groove's far wall, in shadow) and light offset DOWN (the
          near wall, catching the same light-from-above already used on the
          wood's own plank seams) — same two seam colors WoodBackground.tsx
          uses for its board-joint seams (#6E2A2E dark line, #F3CE86 gold
          highlight), same opacities, so the text's depth cue reads as the
          same material logic as the desk itself, not an invented pair. */}
      <span className="carved-text flex-shrink-0 rotate-[-2deg] text-[30px] md:text-[30px] leading-none px-1">
        Skills
      </span>

      {/* No dashed placeholders for unused slots (Vlad, 2026-07-23) — only
          the skills a project actually has get a note, spread evenly across
          the same width regardless of count, rather than reserving all 6
          positions and marking the rest empty. */}
      {/* Mobile: 124px notes, two per row. Tablet and up: one row, each note 148px or whatever the
          row's width allows for this many notes. */}
      <div
        className="flex flex-wrap justify-center gap-x-6 gap-y-4 tablet:flex-nowrap tablet:justify-evenly tablet:gap-2 w-full [container-type:inline-size] max-w-[300px] tablet:max-w-none"
        style={{ '--note-size': `min(148px, calc((100cqw - ${displaySkills.length - 1} * 8px) / ${displaySkills.length}))` } as React.CSSProperties}
      >
        {displaySkills.map((skill, i) => (
          <StickyNote
            key={i}
            color={NOTE_COLORS[i]}
            rotation={NOTE_ROTATIONS[i]}
            skill={skill}
            effect={NOTE_EFFECTS[i]}
            pinColor={PIN_COLORS[i]}
            foldCorner={NOTE_FOLD_CORNERS[i]}
          />
        ))}
      </div>
    </div>
  );
}
