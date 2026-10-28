import type { Key } from 'react';
import { ResponsiveImage } from './ResponsiveImage';

export interface InstantPhotoProps {
  key?: Key;
  src: string;
  srcSet?: string;
  alt: string;
  rotation?: number;
  /** Width / height of the photo itself. When set, the frame's height follows from its width so
   *  the photo is never cropped; when omitted, the frame fills the footprint className gives it. */
  photoAspect?: number;
  hasTape?: boolean;
  /** Controls the outer footprint (size, position) — the atom owns the frame/tape/shadow recipe only. */
  className?: string;
}

// The one shared "instant photo" recipe — white frame with a deeper bottom margin (the
// polaroid tell), a scotch-tape strip pinned at the top only. Used by both the clipboard's
// project icon (bento/shared/BentoResponsibilities.tsx) and SkillTree's project photos —
// same shape and tape everywhere, callers only vary size/position/rotation via props.
//
// No border anywhere in this component (2026-07-27, per reference: a real instant-photo print
// has no ink outline at all — its edges read purely from shadow). One soft ambient shadow on
// the frame lifts the whole card off whatever it's sitting on. The photo itself has no shadow
// or ring (removed 2026-10-12, user): on icons with transparent rounded corners it drew a grey
// square around them. Deliberately soft/blurred, not the site's usual hard-offset --shadow-raised — that flat-offset
// language is correct for UI cards (WindowCard, badges, etc.) but reads as a drawn-on outline
// here; this is a physical object shadow, not a UI element's, same "opt out of the shared card
// language on purpose" reasoning as the --chrome-device-* lock (Token_Contract.md §13).
const TAPE_ROTATION = -4;
const FRAME_SHADOW = '1.5px 4px 6px rgba(20, 14, 8, 0.3), 0 1px 2px rgba(20, 14, 8, 0.18)';
// Mat widths as a percentage of the frame's width (CSS padding percentages are width-based).
const MAT_SIDE_PCT = 5;
const MAT_BOTTOM_PCT = 16;

function getFrameAspectRatio(photoAspect: number) {
  const photoHeightPct = (100 - 2 * MAT_SIDE_PCT) / photoAspect;
  return `100 / ${photoHeightPct + MAT_SIDE_PCT + MAT_BOTTOM_PCT}`;
}

export function InstantPhoto({ src, srcSet, alt, rotation = 0, photoAspect, hasTape = true, className = '' }: InstantPhotoProps) {
  return (
    <div
      className={`relative ${className}`}
      style={{
        transform: `rotate(${rotation}deg)`,
        aspectRatio: photoAspect ? getFrameAspectRatio(photoAspect) : undefined,
      }}
      title={alt}
    >
      {hasTape && (
        <div
          className="absolute -top-[8%] left-1/2 -translate-x-1/2 w-[38%] aspect-[7/3] bg-white/50 border border-white/70 z-10"
          style={{ transform: `rotate(${TAPE_ROTATION}deg)` }}
          aria-hidden
        />
      )}
      <div
        className="relative w-full h-full bg-white"
        style={{ boxShadow: FRAME_SHADOW, padding: `${MAT_SIDE_PCT}% ${MAT_SIDE_PCT}% ${MAT_BOTTOM_PCT}%` }}
      >
        <ResponsiveImage src={src} srcSet={srcSet} alt={alt} className="w-full h-full object-cover" />
      </div>
    </div>
  );
}
