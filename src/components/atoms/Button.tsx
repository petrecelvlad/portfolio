import React from 'react';

export interface ButtonColor {
  fill: string;
  /** The bevel's dark bottom line — a deeper shade of `fill`. */
  deep: string;
}

export const BUTTON_COLORS = {
  periwinkle: { fill: 'var(--color-periwinkle)', deep: 'var(--color-periwinkle-darkest)' },
  linkedin: { fill: 'var(--color-linkedin)', deep: 'var(--color-linkedin-deep)' },
  white: { fill: 'var(--color-button-white)', deep: 'var(--color-button-white-deep)' },
  butter: { fill: 'var(--color-butter)', deep: 'var(--color-butter-deep)' },
  mint: { fill: 'var(--color-mint)', deep: 'var(--color-mint-deep)' },
  coral: { fill: 'var(--color-coral)', deep: 'var(--color-coral-deep)' },
} satisfies Record<string, ButtonColor>;

const SHAPES = {
  rounded: 'rounded-md',
  chip: 'rounded-xl',
  pill: 'rounded-2xl',
};

// Physical parameters for the shared .raised-button behaviour in index.css.
const SIZES = {
  icon: { border: 'var(--border-width-xs)', bevel: '2px', depth: 'var(--ui-depth)', padding: 'p-1.5' },
  sm: { border: '2.5px', bevel: '3px', depth: '3px', padding: '' },
  lg: { border: 'var(--border-width-sm)', bevel: '3px', depth: '5px', padding: 'px-8 sm:px-10 py-3.5 sm:py-4' },
};

export interface ButtonProps extends Omit<React.HTMLAttributes<HTMLElement>, 'color'> {
  children: React.ReactNode;
  color: ButtonColor;
  shape?: keyof typeof SHAPES;
  size?: keyof typeof SIZES;
  /** Opacity of the bevel's light top line. */
  highlight?: number;
  href?: string;
  target?: string;
  rel?: string;
}

// The only raised button on the site: every instance shares the bevel and the hover/press slide;
// callers vary color, shape and size, and add their own typography/layout through className.
export function Button({
  children,
  color,
  shape = 'rounded',
  size = 'icon',
  highlight,
  href,
  target,
  rel,
  className = '',
  style,
  ...props
}: ButtonProps) {
  const { border, bevel, depth, padding } = SIZES[size];
  const buttonStyle = {
    '--btn-fill': color.fill,
    '--btn-deep': color.deep,
    '--btn-border': border,
    '--btn-bevel': bevel,
    '--btn-depth': depth,
    ...(highlight !== undefined && { '--btn-highlight': highlight }),
    ...style,
  } as React.CSSProperties;
  const buttonClassName = `raised-button ${SHAPES[shape]} ${padding} ${className}`;

  if (href) {
    return (
      <a href={href} target={target} rel={rel} className={buttonClassName} style={buttonStyle} {...props}>
        {children}
      </a>
    );
  }
  return (
    <button type="button" className={buttonClassName} style={buttonStyle} {...props}>
      {children}
    </button>
  );
}
