import React, { useState, useEffect, useRef, useId } from 'react';

export interface TornPaperPanelProps {
  children: React.ReactNode;
  className?: string;
  paperColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  shadowColor?: string;
  shadowOffset?: number;
  toothWidth?: number;
  toothHeight?: number;
  cornerRadius?: number;
  paddingTop?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  paddingRight?: number;
  ruleInsetX?: number;
  showPunchHoles?: boolean;
  punchHoleCount?: number;
  punchHoleRadius?: number;
  punchHoleMarginX?: number;
  punchHoleY?: number;
  showRuledLines?: boolean;
  lineSpacing?: number;
  lineColor?: string;
  showMarginLine?: boolean;
  marginLineColor?: string;
  rotateDeg?: number;
}

// Deterministic pseudo-random helper to generate consistent organic tear variations
function pseudoRandom(seed: number) {
  const x = Math.sin(seed * 9999 + 1234.5) * 10000;
  return x - Math.floor(x);
}

export const TornPaperPanel: React.FC<TornPaperPanelProps> = ({
  children,
  className = '',
  paperColor = '#FFFDF7',
  strokeColor = '#1C1610',
  strokeWidth = 3,
  shadowColor = '#1C1610',
  shadowOffset = 4,
  toothWidth = 32, // reduced count by ~half for larger, rarer teeth
  toothHeight = 12,
  cornerRadius = 8, // subtle curvature for top corners
  paddingTop = 56, // leaves top breathing room / ~2 empty notebook lines
  paddingBottom = 56, // leaves bottom breathing room / ~2 empty notebook lines
  paddingLeft = 24,
  paddingRight = 24,
  ruleInsetX = 14, // inset ruled horizontal lines from dark side edges
  showPunchHoles = true,
  punchHoleCount = 8,
  punchHoleRadius = 7,
  punchHoleMarginX = 36,
  punchHoleY = 16,
  showRuledLines = true,
  lineSpacing = 28,
  lineColor = 'rgba(203, 213, 225, 0.65)', // subtle slate blue/grey notebook ruling line
  showMarginLine = false,
  marginLineColor = 'rgba(248, 113, 113, 0.4)', // subtle soft red margin line
  rotateDeg = -0.5,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 400, height: 120 });
  const uniqueId = useId().replace(/:/g, '');

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateSize = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setDimensions({
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        });
      }
    };

    updateSize();

    const observer = new ResizeObserver(() => {
      updateSize();
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const { width: W, height: H } = dimensions;

  // Calculate paper shape path with organic zig-zag bottom edge
  const effectiveToothHeight = Math.max(4, toothHeight);
  const bodyHeight = Math.max(20, H - effectiveToothHeight);
  const r = Math.min(cornerRadius, Math.floor(W / 4), Math.floor(bodyHeight / 4));

  // Calculate teeth with variable widths and organic offsets
  const targetWidth = Math.max(16, toothWidth);
  const numTeeth = Math.max(2, Math.round(W / targetWidth));

  // Generate variable weights for each tooth so each triangle has a distinct width
  const weights: number[] = [];
  let totalWeight = 0;
  for (let i = 0; i < numTeeth; i++) {
    const w = 0.6 + pseudoRandom(i * 3 + 1) * 0.8; // weight between 0.6 and 1.4
    weights.push(w);
    totalWeight += w;
  }

  // Pre-calculate teeth coordinates moving from right (W) to left (0)
  interface ToothPoints {
    xPeak: number;
    yPeak: number;
    xLeft: number;
    yValley: number;
  }

  const teethPoints: ToothPoints[] = [];
  let currentX = W;

  for (let i = numTeeth - 1; i >= 0; i--) {
    const toothW = (W * weights[i]) / totalWeight;
    const xLeft = i === 0 ? 0 : Math.round((currentX - toothW) * 100) / 100;

    // Organic peak position (peak is not centered perfectly)
    const peakRatio = 0.32 + pseudoRandom(i * 5 + 2) * 0.36; // 0.32..0.68
    const xPeak = Math.round((currentX - toothW * peakRatio) * 100) / 100;

    // Organic depth/height variation for peaks and valleys
    const yPeak = Math.round((H - pseudoRandom(i * 7 + 3) * 4) * 100) / 100;
    const yValley = Math.round((bodyHeight + (pseudoRandom(i * 11 + 4) * 5 - 2.5)) * 100) / 100;

    teethPoints.push({
      xPeak,
      yPeak,
      xLeft,
      yValley: i === 0 ? bodyHeight : yValley, // smooth connection to left edge
    });

    currentX = xLeft;
  }

  // Build Paper Path
  // 1. Top-left corner
  let paperPath = `M 0 ${r}`;
  if (r > 0) {
    paperPath += ` A ${r} ${r} 0 0 1 ${r} 0`;
  }
  // 2. Top edge
  paperPath += ` L ${W - r} 0`;
  // 3. Top-right corner
  if (r > 0) {
    paperPath += ` A ${r} ${r} 0 0 1 ${W} ${r}`;
  }
  // 4. Right edge
  paperPath += ` L ${W} ${bodyHeight}`;

  // 5. Organic bottom teeth (moving right to left)
  for (const tooth of teethPoints) {
    paperPath += ` L ${tooth.xPeak} ${tooth.yPeak} L ${tooth.xLeft} ${tooth.yValley}`;
  }

  // 6. Left edge & Close
  paperPath += ` L 0 ${r} Z`;

  // Build Shadow Path (offset vertically by shadowOffset)
  let shadowPath = '';
  if (shadowOffset > 0) {
    const s = shadowOffset;
    shadowPath = `M 0 ${r + s}`;
    if (r > 0) {
      shadowPath += ` A ${r} ${r} 0 0 1 ${r} ${s}`;
    }
    shadowPath += ` L ${W - r} ${s}`;
    if (r > 0) {
      shadowPath += ` A ${r} ${r} 0 0 1 ${W} ${r + s}`;
    }
    shadowPath += ` L ${W} ${bodyHeight + s}`;

    for (const tooth of teethPoints) {
      shadowPath += ` L ${tooth.xPeak} ${tooth.yPeak + s} L ${tooth.xLeft} ${tooth.yValley + s}`;
    }

    shadowPath += ` L 0 ${r + s} Z`;
  }

  // Calculate 8 evenly distributed punch holes along the top row
  interface PunchHole {
    cx: number;
    cy: number;
    r: number;
  }
  const punchHoles: PunchHole[] = [];
  if (showPunchHoles && punchHoleCount > 0) {
    const margin = Math.min(punchHoleMarginX, W / 4);
    const count = Math.max(1, punchHoleCount);
    const step = count > 1 ? (W - 2 * margin) / (count - 1) : 0;
    const holeY = punchHoleY || 28;
    const rH = Math.min(punchHoleRadius, 12);

    for (let i = 0; i < count; i++) {
      const cx = count === 1 ? W / 2 : Math.round((margin + i * step) * 10) / 10;
      punchHoles.push({ cx, cy: holeY, r: rH });
    }
  }

  // Generate ruled horizontal lines
  const ruledLines: number[] = [];
  if (showRuledLines && lineSpacing > 0) {
    const startY = lineSpacing;
    for (let y = startY; y < bodyHeight - 2; y += lineSpacing) {
      ruledLines.push(y);
    }
  }

  const clipId = `torn-paper-clip-${uniqueId}`;
  const maskId = `torn-paper-mask-${uniqueId}`;

  return (
    <div
      ref={containerRef}
      className={`relative w-full transition-transform duration-200 ${className}`}
      style={{
        transform: rotateDeg !== 0 ? `rotate(${rotateDeg}deg)` : undefined,
      }}
    >
      {/* SVG Background Layer */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <clipPath id={clipId}>
            <path d={paperPath} />
          </clipPath>

          {/* Mask for punching transparent hole cutouts through the paper fill & shadow */}
          <mask id={maskId}>
            <rect x="-20" y="-20" width={W + 40} height={H + 40} fill="white" />
            {punchHoles.map((hole, idx) => (
              <circle key={idx} cx={hole.cx} cy={hole.cy} r={hole.r} fill="black" />
            ))}
          </mask>
        </defs>

        {/* Shadow Layer with Hole Cutouts */}
        {shadowOffset > 0 && shadowPath && (
          <path
            d={shadowPath}
            fill={shadowColor}
            mask={`url(#${maskId})`}
            opacity={shadowColor.startsWith('#') ? 1 : 0.8}
          />
        )}

        {/* Paper Main Fill with Transparent Hole Cutouts */}
        <path
          d={paperPath}
          fill={paperColor}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
          strokeLinecap="round"
          mask={`url(#${maskId})`}
        />

        {/* Notebook Ruled Lines clipped inside paper and masked by hole cutouts */}
        {showRuledLines && ruledLines.length > 0 && (
          <g clipPath={`url(#${clipId})`} mask={`url(#${maskId})`}>
            {ruledLines.map((yVal, idx) => (
              <line
                key={idx}
                x1={Math.max(6, ruleInsetX)}
                y1={yVal}
                x2={Math.min(W - 6, W - ruleInsetX)}
                y2={yVal}
                stroke={lineColor}
                strokeWidth={1}
                strokeDasharray="none"
              />
            ))}
            {showMarginLine && (
              <line
                x1={28}
                y1={0}
                x2={28}
                y2={H}
                stroke={marginLineColor}
                strokeWidth={1.5}
              />
            )}
          </g>
        )}

        {/* Punch Holes Perspective & Outlines */}
        {punchHoles.map((hole, idx) => {
          const { cx, cy, r: hr } = hole;

          // True 2-arc crescent shape (matching crescent moon curve):
          // Outer top arc along the circle rim (radius hr)
          // Inner bottom arc along a shifted circle (radius r2) curving UPWARDS in the center
          const theta = 0.96; // ~55 deg half-angle span
          const sinT = Math.sin(theta);
          const cosT = Math.cos(theta);

          const x1 = Math.round((cx - hr * sinT) * 10) / 10;
          const x2 = Math.round((cx + hr * sinT) * 10) / 10;
          const y1 = Math.round((cy - hr * cosT) * 10) / 10;

          // Crescent thickness at top center (~28% of hole radius)
          const t = hr * 0.28;

          // Calculate radius r2 for the inner upward-curving arc
          const denom = 2 * (hr * (1 - cosT) - t);
          const y_c = denom !== 0 ? (2 * hr * t - t * t) / denom : 8;
          const r2 = Math.round((hr - t + y_c) * 10) / 10;

          // Outer top arc (sweep=1) + Inner bottom arc curving UPWARDS (sweep=0)
          const halfMoonD = `M ${x1} ${y1} A ${hr} ${hr} 0 0 1 ${x2} ${y1} A ${r2} ${r2} 0 0 0 ${x1} ${y1} Z`;

          return (
            <g key={idx}>
              {/* Hole outer stroke outline */}
              <circle
                cx={cx}
                cy={cy}
                r={hr}
                stroke={strokeColor}
                strokeWidth={2}
                fill="none"
              />
              {/* Top inner perspective shadow crescent */}
              <path
                d={halfMoonD}
                fill={strokeColor}
                opacity={0.85}
              />
            </g>
          );
        })}
      </svg>

      {/* Content Layer over the paper */}
      <div
        className="relative z-10 w-full"
        style={{
          paddingTop: `${paddingTop}px`,
          paddingBottom: `${effectiveToothHeight + paddingBottom}px`,
          paddingLeft: showMarginLine ? `${paddingLeft + 16}px` : `${paddingLeft}px`,
          paddingRight: `${paddingRight}px`,
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default TornPaperPanel;
