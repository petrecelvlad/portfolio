import type { ReactNode } from 'react';

interface GamifiedParchmentPanelProps {
  children: ReactNode;
  className?: string;
}

export function GamifiedParchmentPanel({
  children,
  className = '',
}: GamifiedParchmentPanelProps) {
  return (
    <div className={`relative flex flex-col w-full ${className}`}>
      {/* Top Wooden Hanging Bar with Blued Steel Rivets (Extends slightly beyond paper body below).
          Flat fill + --shadow-raised (same construction as BentoAchievement.tsx) instead of a
          gradient + shadow-md — a raised bar reuses the site's own "raised" token, not a bespoke one. */}
      <div className="relative w-full h-[32px] bg-[#673E19] border-[2px] border-[#1C1610] rounded-[4px] flex items-center justify-between px-5 shadow-[var(--shadow-raised)] z-20">
        <div className="w-3.5 h-3.5 rounded-full bg-[#64748B] border border-[#1C1610] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.5)]" />
        <div className="w-3.5 h-3.5 rounded-full bg-[#64748B] border border-[#1C1610] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.5)]" />
      </div>

      {/* Main Parchment Scroll Board (Subtly narrower than top hanging bar).
          Flat fill + --shadow-raised instead of a gradient + plain ambient shadow. */}
      <div className="relative w-[calc(100%-10px)] mx-auto flex-1 -mt-3.5 rounded-b-2xl rounded-t-none border-[3px] border-[#1C1610] bg-[#F3E3C3] shadow-[var(--shadow-raised)] p-5 md:p-6 flex flex-col overflow-hidden">
        
        {/* Parchment Inner Dashed Stitching Border Line */}
        <div className="absolute inset-3 border-[1.5px] border-dashed border-[#C8B289] rounded-b-xl rounded-t-none pointer-events-none" />

        {/* Content Container */}
        <div className="relative z-10 flex-1 flex flex-col">
          {children}
        </div>
      </div>

      {/* Crimson 3D Wax Seal Sigil Accent — outside the parchment, whose overflow-hidden would clip the flaps;
          the flap tips sit ~76px down the 80px box, so -14px puts them ~10px below the parchment's bottom edge */}
      <div className="absolute -bottom-[14px] right-6 z-30 w-20 h-20 pointer-events-none drop-shadow-xl">
        <svg viewBox="-12 -10 75 80" className="w-full h-full overflow-visible">
          {/* Ribbon Ends */}
          <path d="M 10 20 L -10 60 L 10 55 L 20 65 Z" fill="#991B1B" stroke="#450A0A" strokeWidth="1.5" />
          <path d="M 25 20 L 35 65 L 45 55 L 60 60 Z" fill="#7F1D1D" stroke="#450A0A" strokeWidth="1.5" />

          {/* Melted Wax Outer Blob */}
          <path
            d="M 25 -5 C 40 -8 55 2 58 18 C 62 32 50 48 35 50 C 20 52 2 45 -3 30 C -8 15 8 -2 25 -5 Z"
            fill="#991B1B"
            stroke="#450A0A"
            strokeWidth="2"
          />
          <path
            d="M 25 -1 C 37 -4 48 5 51 18 C 54 30 44 42 32 44 C 18 46 4 39 0 27 C -4 15 10 2 25 -1 Z"
            fill="#B91C1C"
          />

          {/* Stamped Inner Emblem */}
          <circle cx="26" cy="22" r="18" fill="#7F1D1D" stroke="#450A0A" strokeWidth="2" />
          <circle cx="26" cy="22" r="16" fill="#991B1B" />
          {/* Embossed Crown Crest Design */}
          <path
            d="M 26 12 L 30 18 L 36 15 L 32 24 L 38 28 L 26 27 L 14 28 L 20 24 L 16 15 L 22 18 Z"
            fill="#FECACA"
            stroke="#7F1D1D"
            strokeWidth="1"
          />
        </svg>
      </div>
    </div>
  );
}

