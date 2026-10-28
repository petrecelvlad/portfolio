import React from 'react';

export interface TextProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
  variant?: 'body' | 'ui' | 'mono';
  size?: 'sm' | 'md' | 'lg';
  color?: 'base' | 'subtle' | 'whisper' | 'inverse' | 'accent' | 'inherit';
  align?: 'left' | 'center' | 'right';
  as?: React.ElementType;
  className?: string;
}

const variantMap = {
  body: "font-body",
  ui: "font-display font-medium",
  mono: "font-mono font-bold tracking-tight",
};

const sizeMap = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
};

const colorMap = {
  base: 'text-ink-base',
  subtle: 'text-ink-subtle',
  whisper: 'text-ink-whisper',
  inverse: 'text-surface-base',
  accent: 'text-theme-accent',
  inherit: 'text-inherit',
};

const alignMap = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

export const Text = ({ 
  children, 
  variant = 'body', 
  size = 'md',
  color = 'base',
  align = 'left',
  className = '', 
  as: Component = 'p',
  ...props 
}: TextProps) => {
  return (
    <Component 
      className={`m-0 ${variantMap[variant]} ${sizeMap[size]} ${colorMap[color]} ${alignMap[align]} ${className}`} 
      {...props}
    >
      {children}
    </Component>
  );
};
