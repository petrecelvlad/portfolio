const CAP_SIZE = 34;
const CAP_FILL = 'var(--color-butter)';
const CAP_DEEP = 'var(--color-butter-deep)';
const CAP_LIGHT = '#FFE08A';
const CONTOUR = '#1C1610';

const CORNERS = [
  { position: 'top-0 left-0', radius: 'var(--radius-lg) 6px 6px 6px' },
  { position: 'top-0 right-0', radius: '6px var(--radius-lg) 6px 6px' },
  { position: 'bottom-0 right-0', radius: '6px 6px var(--radius-lg) 6px' },
  { position: 'bottom-0 left-0', radius: '6px 6px 6px var(--radius-lg)' },
];

// Flat, ink-outlined caps clasping the four outer corners of a board. Rendered by the board's
// outer wrapper, not inside the frame, because the frame clips its own corners.
export function GamifiedCornerCaps() {
  return (
    <>
      {CORNERS.map(({ position, radius }) => (
        <div
          key={position}
          aria-hidden
          className={`absolute ${position} z-20 pointer-events-none`}
          style={{
            width: CAP_SIZE,
            height: CAP_SIZE,
            borderRadius: radius,
            border: `3px solid ${CONTOUR}`,
            backgroundColor: CAP_FILL,
            boxShadow: `inset 0 var(--bevel-width) 0 0 ${CAP_LIGHT}, inset 0 calc(var(--bevel-width) * -1) 0 0 ${CAP_DEEP}, 0 var(--bevel-width) 0 0 ${CONTOUR}`,
          }}
        />
      ))}
    </>
  );
}
