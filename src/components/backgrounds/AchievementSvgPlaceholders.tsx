/**
 * @propolis
 * {
 *   "role": "UI_COMPONENT",
 *   "constraints": [
 *     "Known C-008 violation: each card animates inside an SVG shown as an <img>, so the browser repaints the whole picture on the CPU every frame (measured +18% CPU for the 4 cards, 2026-10-18)",
 *     "Known C-010 violation: index.css's reduced-motion rule can't reach inside an <img>",
 *     "Known C-011 violation: isVisible is accepted and ignored",
 *     "All three are parked by the user until the cards move to MP4 (Hero Smoothness Plan step 3, Moving Parts Audit P6)"
 *   ],
 *   "agent_instructions": "The 4 hero achievement cards as they ship today. Don't add motion here; the planned fix replaces these SVGs with short videos."
 * }
 */
import type { LiveShaderType } from './AchievementLiveShaders';

// Placeholder-only stand-ins for the SVG animation path. Swap each entry's <svg> content for the
// real hand-authored animation as it becomes available — the wiring (AchievementShaderCanvas.tsx's
// dispatcher, the "SVG" option in the Navbar path selector) doesn't need to change when that happens.
// All 4 shaders now have their real animations — see AchievementFactorySvg, AchievementLevelUpSvg,
// AchievementTeamsLeadSvg and AchievementCartridgeSvg below. Nothing is a placeholder type anymore;
// AchievementSvgPlaceholder/PLACEHOLDER_STYLE are unreachable dead code at this point but left as-is
// since removing them is outside the scope of wiring up Cartridge's real asset.
type PlaceholderType = Exclude<LiveShaderType, 'factory' | 'levelup' | 'teamslead' | 'cartridge'>;

const PLACEHOLDER_STYLE: Record<PlaceholderType, { bg: string; accent: string; label: string }> = {};

// Factory's real hand-authored animation (see cone/project/specs/SVG_Recreation_Prompts.md for the
// brief it was built from). Self-contained SVG with its own CSS-driven animations, no JS involved —
// served as a static asset and rendered via <img> so `object-fit: cover` handles sizing for free.
// The asset is drawn at 16:9 (viewBox 0 50 800 450), so no further cropping math is needed here.
export function AchievementFactorySvg({ className }: { className?: string; isVisible?: boolean }) {
  return (
    <img
      src={`${import.meta.env.BASE_URL}achievements/factory-animated.svg`}
      alt=""
      className={`w-full h-full block object-cover ${className ?? ''}`}
    />
  );
}

// Level-Up's animation: 8 bars fill the gauge, each bumping it, then the full gauge launches its
// payoff, all on one 5 s loop, framed 16:9 (800x450) like the other 3.
export function AchievementLevelUpSvg({ className }: { className?: string; isVisible?: boolean }) {
  return (
    <img
      src={`${import.meta.env.BASE_URL}achievements/levelup-animated.svg`}
      alt=""
      className={`w-full h-full block object-cover ${className ?? ''}`}
    />
  );
}

// Teams Lead's animation: a leader picks up a teammate on each island and the team celebrates on the
// last one, all on one 13.5 s loop, framed 16:9 (800x450) like the other 3.
export function AchievementTeamsLeadSvg({ className }: { className?: string; isVisible?: boolean }) {
  return (
    <img
      src={`${import.meta.env.BASE_URL}achievements/teamslead-animated.svg`}
      alt=""
      className={`w-full h-full block object-cover ${className ?? ''}`}
    />
  );
}

// Cartridge's animation: a side-scrolling platformer loop, framed 16:9 (800x450) like the other 3 so
// the whole scene scales to the card at every size. Its level and jump timings are laid out together
// so Mario never passes through a block, pipe or enemy.
export function AchievementCartridgeSvg({ className }: { className?: string; isVisible?: boolean }) {
  return (
    <img
      src={`${import.meta.env.BASE_URL}achievements/cartridge-animated.svg`}
      alt=""
      className={`w-full h-full block object-cover ${className ?? ''}`}
    />
  );
}

export function AchievementSvgPlaceholder({ type, className }: { type: PlaceholderType; className?: string; isVisible?: boolean }) {
  const { bg, accent, label } = PLACEHOLDER_STYLE[type];

  return (
    <svg
      viewBox="0 0 512 288"
      className={`w-full h-full block object-cover ${className ?? ''}`}
      role="img"
      aria-label={`${label} animation placeholder`}
    >
      <rect width="512" height="288" fill={bg} />
      <circle cx="256" cy="144" r="36" fill={accent}>
        <animate attributeName="r" values="30;42;30" dur="2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite" />
      </circle>
      <text
        x="256"
        y="230"
        textAnchor="middle"
        fontFamily="monospace"
        fontSize="20"
        fontWeight="bold"
        fill="#FFFFFF"
        opacity="0.85"
      >
        {label}
      </text>
    </svg>
  );
}
