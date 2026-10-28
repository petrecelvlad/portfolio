import React, { useState, useEffect, useRef } from 'react';

export interface PixelRibbonBannerProps {
  children: React.ReactNode;
  className?: string;
  hasTails?: boolean;
  faceColor?: string;
  highlightColor?: string;
  tailColor?: string;
  shadeColor?: string;
  foldColor?: string;
  outlineColor?: string;
}

// One art pixel. Fixed, not scaled with the width: the ribbon grows longer, its pixels never grow.
const PX = 6;
const OUTLINE = 6;
const BEVEL_WIDTH = 3;
const HEIGHT = 14 * PX;

/**
 * PixelRibbonBanner: an 8-bit ribbon on a 6px grid — stepped body corners, notched tails, a dark
 * fold where each tail tucks under the body, a hard one-pixel drop shadow.
 * Drawn as two layers — tails at z-0, body + label at z-20 — and the root sets no z-index, so a
 * sibling the caller stacks at z-10 (the Hero's paper) sits between them: tails behind it, body over it.
 * Picked from the Asset Whiteboard (Banners · Round 1, design 07).
 */
export const PixelRibbonBanner: React.FC<PixelRibbonBannerProps> = ({
  children,
  className = '',
  hasTails = true,
  faceColor = '#FF2A6D',
  highlightColor = '#FF8AAF',
  tailColor = '#D9245D',
  shadeColor = '#B31D4C',
  foldColor = '#801537',
  outlineColor = '#1C1610',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(400);

  useEffect(() => {
    const el = containerRef.current!;
    const updateWidth = () => setW(Math.round(el.getBoundingClientRect().width));
    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const u = PX;
  const leftTail = `M0,${3 * u} H${10 * u} V${13 * u} H0 V${12 * u} H${u} V${11 * u} H${2 * u} V${10 * u} H${3 * u} V${9 * u} H${4 * u} V${7 * u} H${3 * u} V${6 * u} H${2 * u} V${5 * u} H${u} V${4 * u} H0 Z`;
  const rightTail = `M${W},${3 * u} H${W - 10 * u} V${13 * u} H${W} V${12 * u} H${W - u} V${11 * u} H${W - 2 * u} V${10 * u} H${W - 3 * u} V${9 * u} H${W - 4 * u} V${7 * u} H${W - 3 * u} V${6 * u} H${W - 2 * u} V${5 * u} H${W - u} V${4 * u} H${W} Z`;
  const body = `M${9 * u},0 H${W - 9 * u} V${u} H${W - 8 * u} V${10 * u} H${W - 9 * u} V${11 * u} H${9 * u} V${10 * u} H${8 * u} V${u} H${9 * u} Z`;
  const outlined = { stroke: outlineColor, strokeWidth: OUTLINE, strokeLinejoin: 'miter' as const, paintOrder: 'stroke' };

  const svgProps = {
    className: 'absolute inset-0 w-full h-full pointer-events-none overflow-visible',
    width: W,
    height: HEIGHT,
    viewBox: `0 0 ${W} ${HEIGHT}`,
    shapeRendering: 'crispEdges',
    xmlns: 'http://www.w3.org/2000/svg',
  };

  return (
    <div ref={containerRef} className={`relative ${className}`} style={{ height: HEIGHT }}>
      {/* Back layer: the tails. */}
      {hasTails && <svg {...svgProps} style={{ zIndex: 0 }}>
        <g transform={`translate(0, ${u})`} fill={outlineColor} stroke={outlineColor} strokeWidth={OUTLINE} strokeLinejoin="miter">
          <path d={leftTail} />
          <path d={rightTail} />
        </g>
        <path d={leftTail} fill={tailColor} {...outlined} />
        <path d={rightTail} fill={tailColor} {...outlined} />
        {/* The tails' notched outer edge steps in one pixel on the second-to-last row. */}
        <rect x={u} y={11 * u} width={9 * u} height={u} fill={shadeColor} />
        <rect x={0} y={12 * u} width={10 * u} height={u} fill={shadeColor} />
        <rect x={W - 10 * u} y={11 * u} width={9 * u} height={u} fill={shadeColor} />
        <rect x={W - 10 * u} y={12 * u} width={10 * u} height={u} fill={shadeColor} />
        <rect x={8 * u} y={11 * u} width={2 * u} height={2 * u} fill={foldColor} />
        <rect x={W - 10 * u} y={11 * u} width={2 * u} height={2 * u} fill={foldColor} />
      </svg>}

      {/* Front layer: the body and its label. */}
      <svg {...svgProps} style={{ zIndex: 20 }}>
        <path d={body} transform={`translate(0, ${u})`} fill={outlineColor} stroke={outlineColor} strokeWidth={OUTLINE} strokeLinejoin="miter" />
        <path d={body} fill={faceColor} {...outlined} />
        <rect x={9 * u} y={0} width={W - 18 * u} height={BEVEL_WIDTH} fill={highlightColor} />
        <rect x={9 * u} y={11 * u - BEVEL_WIDTH} width={W - 18 * u} height={BEVEL_WIDTH} fill={shadeColor} />
        <rect x={10 * u} y={u} width={3 * u} height={u} fill={highlightColor} />
        <rect x={10 * u} y={2 * u} width={u} height={u} fill={highlightColor} />
      </svg>

      <div
        className="absolute left-0 top-0 z-20 w-full flex items-center justify-center font-press-start text-base text-white uppercase tracking-[1px] leading-none drop-shadow-[0_3px_0_#1C1610]"
        style={{ height: 11 * u, paddingLeft: 9 * u, paddingRight: 9 * u }}
      >
        {/* The outline is a stroked copy behind the white text, not paint-order: Chrome before
            123 ignores paint-order on HTML text and strokes over the fill, hiding the white. */}
        <div className="grid">
          <div aria-hidden className="[grid-area:1/1]" style={{ color: outlineColor, WebkitTextStroke: `4px ${outlineColor}` }}>{children}</div>
          <div className="[grid-area:1/1]">{children}</div>
        </div>
      </div>
    </div>
  );
};

export default PixelRibbonBanner;
