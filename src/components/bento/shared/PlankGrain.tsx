// Trimmed from the former DeskBoardSVGAssets.tsx (2026-08-26) down to just PlankGrain, the one
// export Navbar.tsx's plank-styled bar still uses. Rivet/PlankGrainPaths/the JAGGED_* path data
// only existed for the heritage DeskBoard frame, which has been removed — see
// src/laboratory/frames/ (external archive) for that code.
export function PlankGrain({ vertical = false }: { vertical?: boolean }) {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none opacity-40 mix-blend-multiply"
      preserveAspectRatio="none"
      viewBox={vertical ? "0 0 100 800" : "0 0 800 100"}
      aria-hidden
    >
      <g fill="none" strokeLinecap="round">
        {vertical ? (
          <>
            <path d="M 35 0 Q 15 160 38 340 T 28 800" stroke="#B97640" strokeWidth="4" />
            <path d="M 70 0 Q 92 220 68 420 T 82 800" stroke="#F0C489" strokeWidth="3" />
            <path d="M 10 0 Q 25 250 5 500 T 20 800" stroke="#A8672F" strokeWidth="3" />
            <path d="M 85 0 Q 60 300 90 600 T 70 800" stroke="#AC6C34" strokeWidth="4" />
          </>
        ) : (
          <>
            <path d="M 0 35 Q 160 15 340 38 T 800 28" stroke="#B97640" strokeWidth="4" />
            <path d="M 0 70 Q 220 92 420 68 T 800 82" stroke="#F0C489" strokeWidth="3" />
            <path d="M 0 10 Q 25 250 5 500 T 20 800" stroke="#A8672F" strokeWidth="3" />
            <path d="M 0 85 Q 300 60 600 90 T 800 70" stroke="#AC6C34" strokeWidth="4" />
          </>
        )}
      </g>
    </svg>
  );
}
