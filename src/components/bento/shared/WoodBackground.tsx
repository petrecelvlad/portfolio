// Flat-illustrated wood-plank background — the "desk" the clipboard/phone/
// skills/achievement sit on. Prototype, per image copy 2.png's reference:
// horizontal planks, a dark seam + gold highlight at each board joint (the
// same glossyStops() idea BentoResponsibilities.tsx uses, just drawn as flat
// shapes instead of computed from a token, since there's no single "base
// color" here — each plank alternates two fixed tones), and a handful of
// flowing bezier grain lines per plank rather than a procedural noise
// texture (photographic/turbulence noise reads wrong against this site's
// flat-illustrated language everywhere else — see ANTI_PATTERNS.md).
export function WoodBackground() {
  return (
    <svg
      className="absolute inset-0 w-full h-full -z-10 pointer-events-none"
      viewBox="0 0 800 500"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <defs>
        <linearGradient id="wood-plank-a" x1="0" y1="0" x2="1" y2="0.15">
          <stop offset="0%" stopColor="#D99A5E" />
          <stop offset="50%" stopColor="#E5AB6E" />
          <stop offset="100%" stopColor="#CF8F56" />
        </linearGradient>
        <linearGradient id="wood-plank-b" x1="0" y1="0" x2="1" y2="0.15">
          <stop offset="0%" stopColor="#CD8A50" />
          <stop offset="50%" stopColor="#DA9C61" />
          <stop offset="100%" stopColor="#C57F48" />
        </linearGradient>
      </defs>

      {/* Plank bands */}
      <rect x="0" y="0" width="800" height="125" fill="url(#wood-plank-a)" />
      <rect x="0" y="125" width="800" height="125" fill="url(#wood-plank-b)" />
      <rect x="0" y="250" width="800" height="125" fill="url(#wood-plank-a)" />
      <rect x="0" y="375" width="800" height="125" fill="url(#wood-plank-b)" />

      {/* Seams — dark line then a gold highlight just below, same "light
          source from above" logic as glossyStops(), drawn as flat bands */}
      {[125, 250, 375].map((y) => (
        <g key={y}>
          <rect x="0" y={y - 2} width="800" height="3" fill="#6E2A2E" opacity="0.55" />
          <rect x="0" y={y + 1} width="800" height="2.5" fill="#F3CE86" opacity="0.45" />
        </g>
      ))}

      {/* Grain — flowing bezier strokes, alternating a darker and lighter
          tone per plank, deliberately irregular spacing/curvature so it
          doesn't read as a repeating pattern */}
      <g fill="none" strokeLinecap="round">
        <path d="M0 35 Q160 15 340 38 T800 28" stroke="#B97640" strokeWidth="1.6" opacity="0.4" />
        <path d="M0 70 Q220 92 420 68 T800 82" stroke="#F0C489" strokeWidth="1.2" opacity="0.35" />
        <path d="M0 100 Q180 82 400 104 T800 96" stroke="#A8672F" strokeWidth="1.4" opacity="0.3" />

        <path d="M0 155 Q200 172 380 150 T800 162" stroke="#F0C489" strokeWidth="1.3" opacity="0.35" />
        <path d="M0 195 Q240 178 460 200 T800 190" stroke="#AC6C34" strokeWidth="1.5" opacity="0.35" />
        <path d="M0 225 Q160 240 360 220 T800 232" stroke="#F0C489" strokeWidth="1" opacity="0.3" />

        <path d="M0 280 Q220 262 420 284 T800 274" stroke="#B97640" strokeWidth="1.6" opacity="0.4" />
        <path d="M0 315 Q180 335 400 312 T800 325" stroke="#F0C489" strokeWidth="1.2" opacity="0.35" />
        <path d="M0 345 Q260 328 480 348 T800 340" stroke="#A8672F" strokeWidth="1.3" opacity="0.3" />

        <path d="M0 405 Q200 422 380 400 T800 412" stroke="#F0C489" strokeWidth="1.3" opacity="0.35" />
        <path d="M0 445 Q240 428 460 450 T800 440" stroke="#AC6C34" strokeWidth="1.5" opacity="0.35" />
        <path d="M0 475 Q160 490 360 470 T800 482" stroke="#F0C489" strokeWidth="1" opacity="0.3" />
      </g>

      {/* Knots — thin lens shapes, scattered, not centered on any grain line */}
      <ellipse cx="150" cy="55" rx="20" ry="6" fill="#8A4A28" opacity="0.4" transform="rotate(-8 150 55)" />
      <ellipse cx="610" cy="300" rx="24" ry="7" fill="#8A4A28" opacity="0.4" transform="rotate(6 610 300)" />
      <ellipse cx="330" cy="420" rx="16" ry="5" fill="#8A4A28" opacity="0.35" transform="rotate(-4 330 420)" />
    </svg>
  );
}
