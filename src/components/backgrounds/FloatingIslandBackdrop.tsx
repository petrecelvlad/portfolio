/**
 * @propolis
 * {
 *   "role": "UI_COMPONENT",
 *   "constraints": [
 *     "C-008 exception: the waterfall's dash offset and the pebbles animate inside the SVG, so the island repaints every frame",
 *     "C-009: measured near zero CPU on the reference PC 2026-10-18, which is why the exception stands",
 *     "C-010: CSS animations, stopped by index.css's reduced-motion rule"
 *   ],
 *   "agent_instructions": "Always-on hero layer. Keep new motion out of the SVG: put it on its own element and animate transform or opacity (C-008), then measure (C-009)."
 * }
 */
interface FloatingIslandBackdropProps {
  className?: string;
}

const RIM_DRIP_EDGE = 'M -22,0 Q -12,0 -12,10 C -12,15.2 -4.3,19 0,19 C 4.3,19 12,15.2 12,10 Q 12,0 22,0';
// The fill reaches 4px above the rim to cover the rim's ink line, so each drip reads as the top surface spilling over the edge.
const RIM_DRIP_FILL = `${RIM_DRIP_EDGE} L 22,-4 L -22,-4 Z`;
// Points on the top ellipse's front rim (cx 400, cy 220, rx 200, ry 45), each rotated to the rim's tangent there.
const RIM_DRIP_TRANSFORMS = [
  'translate(223.4, 241.1) rotate(22.9)',
  'translate(276.9, 255.5) rotate(10)',
  'translate(358.4, 264) rotate(2.7)',
  'translate(448.4, 263.7) rotate(-3.2)',
  'translate(528.6, 254.5) rotate(-10.7)',
];

/**
 * Flat 2D replacement for the old three.js voxel island — pure SVG + CSS
 * keyframe animation, no RAF/WebGL. Not compositor-only: animating parts inside
 * an SVG (the waterfall's dash offset, the pebbles' transforms) repaints the
 * island every frame. Measured near zero CPU on an HD 4600 (2026-10-18), so it
 * stays; anything heavier added here should move out of the SVG.
 */
export function FloatingIslandBackdrop({ className = '' }: FloatingIslandBackdropProps) {
  return (
    <div className={`w-full h-full relative flex items-center justify-center ${className}`}>
      <svg viewBox="0 0 800 600" preserveAspectRatio="xMidYMid meet" className="w-full h-full" aria-hidden="true">
        <defs>
          <style>{`
            @keyframes waterfallFlow {
              0% { stroke-dashoffset: 0; }
              100% { stroke-dashoffset: -40; }
            }
            @keyframes pebbleFloat {
              0%, 100% { transform: translateY(0px) rotate(0deg); }
              50% { transform: translateY(-14px) rotate(4deg); }
            }

            .ink-edge {
              stroke: #1C1610;
              stroke-width: 4px;
              stroke-linecap: round;
              stroke-linejoin: round;
            }
            .ink-edge-thin {
              stroke: #1C1610;
              stroke-width: 2.5px;
              stroke-linecap: round;
              stroke-linejoin: round;
            }
            .water-stream {
              stroke-dasharray: 12 8;
              animation: waterfallFlow 1.2s linear infinite;
            }
            .water-stream-fast {
              stroke-dasharray: 16 6;
              animation: waterfallFlow 0.8s linear infinite;
            }
            .pebble {
              animation: pebbleFloat 6s ease-in-out infinite;
              transform-box: fill-box;
              transform-origin: center;
            }
            .pebble-late { animation-duration: 7s; animation-delay: -2.5s; }
          `}</style>
        </defs>

        {/* MAIN PEDESTAL ASSEMBLY */}
        <g>

          {/* HARD OFFSET DROP SHADOW (Comic/Arcade Sticker Base) — the turf and rock silhouettes, offset down-right */}
          <g transform="translate(12 16)">
            <path d="M 160,230 C 150,260 190,285 220,270 C 240,290 280,295 310,280 C 340,300 390,305 420,280 C 450,300 500,295 530,280 C 560,295 610,285 630,250 C 650,230 630,200 590,190 C 530,170 270,170 200,190 C 170,200 160,215 160,230 Z" fill="#1C1610" />
            <path d="M 165,248 L 250,372 L 330,460 L 390,525 L 430,460 L 510,430 L 590,320 L 635,248 Z" fill="#1C1610" stroke="#1C1610" strokeWidth="4" strokeLinejoin="round" />
          </g>

          {/* SATELLITE DEBRIS (FLOATING ROCKS) */}
          <g className="pebble">
            <polygon points="125,257 150,247 160,272 135,287" fill="#1C1610" opacity="0.95" />
            <polygon points="120,250 145,240 155,265 130,280" fill="#334155" className="ink-edge" />
            <polygon points="120,250 135,265 130,280" fill="#1E293B" />
            <path d="M 125,242 L 140,250 L 150,260" fill="none" stroke="#4ADE80" strokeWidth="3" strokeLinecap="round" />
          </g>
          <g className="pebble pebble-late">
            <polygon points="655,377 680,367 690,392 665,402" fill="#1C1610" opacity="0.95" />
            <polygon points="650,370 675,360 685,385 660,395" fill="#475569" className="ink-edge" />
            <polygon points="650,370 665,385 660,395" fill="#1E293B" />
            <path d="M 655,363 L 670,368" fill="none" stroke="#4ADE80" strokeWidth="3" strokeLinecap="round" />
          </g>

          {/* DANGLING ROOTS (BEHIND ROCK BASE) */}
          <g>
            <path d="M 310,410 Q 290,460 320,510 T 305,550" fill="none" stroke="#1C1610" strokeWidth="7" strokeLinecap="round" />
            <path d="M 310,410 Q 290,460 320,510 T 305,550" fill="none" stroke="#451A03" strokeWidth="3" strokeLinecap="round" />
          </g>
          <g>
            <path d="M 460,420 Q 490,470 460,520 T 480,565" fill="none" stroke="#1C1610" strokeWidth="8" strokeLinecap="round" />
            <path d="M 460,420 Q 490,470 460,520 T 480,565" fill="none" stroke="#78350F" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M 475,480 Q 500,500 495,530" fill="none" stroke="#1C1610" strokeWidth="4" strokeLinecap="round" />
            <path d="M 475,480 Q 500,500 495,530" fill="none" stroke="#451A03" strokeWidth="1.5" strokeLinecap="round" />
          </g>

          {/* JAGGED ROCK BASE / UNDERSIDE (DARK SLATE) — its top edge (y 248) runs the full width under the turf, so no gap opens between cap and rock */}
          <path d="M 165,248 L 250,372 L 330,460 L 390,525 L 430,460 L 510,430 L 590,320 L 635,248 Z" fill="#0F172A" className="ink-edge" />

          <path d="M 165,248 L 250,372 L 330,460 L 310,360 L 220,290 L 205,248 Z" fill="#1E293B" className="ink-edge" />
          <path d="M 330,460 L 390,525 L 430,460 L 380,380 L 310,360 Z" fill="#334155" className="ink-edge" />
          <path d="M 430,460 L 510,430 L 590,320 L 635,248 L 560,248 L 510,330 L 380,380 Z" fill="#1E293B" className="ink-edge" />
          <path d="M 205,248 L 220,290 L 310,360 L 380,380 L 390,300 L 400,248 Z" fill="#475569" className="ink-edge" />
          <path d="M 380,380 L 430,460 L 510,330 L 560,248 L 400,248 L 390,300 Z" fill="#334155" className="ink-edge" />
          <path d="M 310,360 L 380,380 L 390,300 Z" fill="#64748B" className="ink-edge" />

          <path d="M 280,320 L 260,350 L 290,380" fill="none" className="ink-edge-thin" />
          <path d="M 450,350 L 480,380 L 460,420" fill="none" className="ink-edge-thin" />
          <path d="M 370,410 L 390,470" fill="none" className="ink-edge-thin" />
          <path d="M 548,300 L 572,296 L 590,282" fill="none" className="ink-edge-thin" />

          {/* WATERFALL 1 (LEFT BACK STEP) */}
          <g>
            <path d="M 280,255 L 300,285 L 320,280 L 300,250 Z" fill="#0F172A" />
            <path d="M 295,265 L 290,410 L 298,410 L 305,265 Z" fill="#6EE7B7" className="ink-edge-thin" />
            <path d="M 293,270 L 293,400" stroke="#ECFDF5" strokeWidth="4" className="water-stream-fast" strokeLinecap="round" />
            <circle cx="288" cy="420" r="3" fill="#ECFDF5" />
            <circle cx="296" cy="428" r="2" fill="#A7F3D0" />
            <circle cx="302" cy="415" r="2.5" fill="#ECFDF5" />
          </g>

          {/* WATERFALL 2 (FRONT RIGHT LEDGE) */}
          <g>
            <path d="M 475,260 C 460,270 490,278 505,268 Z" fill="#15803D" />
            <path d="M 480,268 L 485,440 L 493,440 L 495,268 Z" fill="#34D399" className="ink-edge-thin" />
            <path d="M 488,268 L 488,430" stroke="#ECFDF5" strokeWidth="5" className="water-stream" strokeLinecap="round" />
            <circle cx="482" cy="450" r="3.5" fill="#ECFDF5" />
            <circle cx="490" cy="458" r="2" fill="#A7F3D0" />
            <circle cx="497" cy="446" r="2.5" fill="#ECFDF5" />
          </g>

          {/* OVERHANGING MOSSY CROWN / TURF */}
          <path d="M 160,230
                   C 150,260 190,285 220,270
                   C 240,290 280,295 310,280
                   C 340,300 390,305 420,280
                   C 450,300 500,295 530,280
                   C 560,295 610,285 630,250
                   C 650,230 630,200 590,190
                   C 530,170 270,170 200,190
                   C 170,200 160,215 160,230 Z"
                fill="#15803D" className="ink-edge" />

          <path d="M 165,225
                   C 155,250 190,275 220,258
                   C 240,278 280,280 310,268
                   C 340,288 390,290 420,268
                   C 450,288 500,280 528,268
                   C 558,285 605,270 625,240
                   C 640,220 620,195 585,185
                   C 525,168 275,168 205,185
                   C 175,195 165,210 165,225 Z"
                fill="#22C55E" className="ink-edge" />

          <ellipse cx="400" cy="220" rx="200" ry="45" fill="#4ADE80" className="ink-edge" />

          <ellipse cx="395" cy="214" rx="175" ry="36" fill="#86EFAC" />
          <ellipse cx="395" cy="214" rx="150" ry="30" fill="#4ADE80" className="ink-edge-thin" />

          {/* RIM DRIPS */}
          {RIM_DRIP_TRANSFORMS.map((transform) => (
            <g key={transform} transform={transform}>
              <path d={RIM_DRIP_FILL} fill="#4ADE80" />
              <path d={RIM_DRIP_EDGE} fill="none" className="ink-edge" />
            </g>
          ))}

          <ellipse cx="320" cy="210" rx="18" ry="6" fill="#334155" className="ink-edge-thin" />
          <ellipse cx="470" cy="225" rx="25" ry="8" fill="#334155" className="ink-edge-thin" />
          <ellipse cx="472" cy="223" rx="18" ry="5" fill="#475569" />

          {/* GRASS TUFTS */}
          <g transform="translate(210, 222)">
            <path d="M -6,4 Q -8,-2 -3,-6 Q 0,-9 3,-6 Q 8,-2 6,4 Q 0,7 -6,4 Z" fill="#15803D" className="ink-edge-thin" />
          </g>
          <g transform="translate(255, 213) scale(0.8)">
            <path d="M -6,4 Q -8,-2 -3,-6 Q 0,-9 3,-6 Q 8,-2 6,4 Q 0,7 -6,4 Z" fill="#4ADE80" className="ink-edge-thin" />
          </g>
          <g transform="translate(300, 224) scale(1.05)">
            <path d="M -6,4 Q -8,-2 -3,-6 Q 0,-9 3,-6 Q 8,-2 6,4 Q 0,7 -6,4 Z" fill="#15803D" className="ink-edge-thin" />
          </g>
          <g transform="translate(400, 206) scale(0.85)">
            <path d="M -6,4 Q -8,-2 -3,-6 Q 0,-9 3,-6 Q 8,-2 6,4 Q 0,7 -6,4 Z" fill="#4ADE80" className="ink-edge-thin" />
          </g>
          <g transform="translate(455, 218)">
            <path d="M -6,4 Q -8,-2 -3,-6 Q 0,-9 3,-6 Q 8,-2 6,4 Q 0,7 -6,4 Z" fill="#15803D" className="ink-edge-thin" />
          </g>
          <g transform="translate(500, 210) scale(1.1)">
            <path d="M -6,4 Q -8,-2 -3,-6 Q 0,-9 3,-6 Q 8,-2 6,4 Q 0,7 -6,4 Z" fill="#4ADE80" className="ink-edge-thin" />
          </g>
          <g transform="translate(560, 220) scale(0.85)">
            <path d="M -6,4 Q -8,-2 -3,-6 Q 0,-9 3,-6 Q 8,-2 6,4 Q 0,7 -6,4 Z" fill="#15803D" className="ink-edge-thin" />
          </g>

          {/* ANCIENT GLOWING RUNES */}
          <g>
            <path d="M 210,250 L 220,260 M 215,252 L 222,254" stroke="#A7F3D0" strokeWidth="3" strokeLinecap="round" />
            <path d="M 315,265 L 320,275 M 312,270 L 322,268" stroke="#A7F3D0" strokeWidth="3" strokeLinecap="round" />
            <path d="M 405,270 L 405,282 M 400,275 L 410,275" stroke="#A7F3D0" strokeWidth="3" strokeLinecap="round" />
            <path d="M 515,260 L 522,270 M 512,265 L 525,262" stroke="#A7F3D0" strokeWidth="3" strokeLinecap="round" />
          </g>

          {/* MAGIC MOTES / RUNIC PARTICLES */}
          <g>
            <g transform="translate(200, 260)">
              <polygon points="0,-6 5,0 0,6 -5,0" fill="#A7F3D0" />
            </g>
            <g transform="translate(270, 280)">
              <circle cx="0" cy="0" r="3.5" fill="#6EE7B7" />
            </g>
            <g transform="translate(350, 290)">
              <polygon points="0,-5 4,0 0,5 -4,0" fill="#ECFDF5" />
            </g>
            <g transform="translate(440, 295)">
              <circle cx="0" cy="0" r="4" fill="#A7F3D0" />
            </g>
            <g transform="translate(520, 280)">
              <polygon points="0,-7 6,0 0,7 -6,0" fill="#34D399" />
            </g>
            <g transform="translate(600, 250)">
              <circle cx="0" cy="0" r="3" fill="#ECFDF5" />
            </g>
            <g transform="translate(160, 220)">
              <circle cx="0" cy="0" r="2" fill="#A7F3D0" />
            </g>
            <g transform="translate(490, 230)">
              <polygon points="0,-4 3,0 0,4 -3,0" fill="#ECFDF5" />
            </g>
          </g>

        </g>
      </svg>
    </div>
  );
}
