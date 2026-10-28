import React from 'react';

export interface RowProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  gap?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around';
  wrap?: boolean;
  as?: React.ElementType;
  className?: string;
}

const gapMap = {
  xs: 'gap-xs',
  sm: 'gap-sm',
  md: 'gap-md',
  lg: 'gap-lg',
  xl: 'gap-xl',
};

const alignMap = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
  baseline: 'items-baseline',
};

const justifyMap = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
  around: 'justify-around',
};

export const Row = ({ 
  children, 
  gap = 'md', 
  align = 'center', 
  justify = 'start', 
  wrap = false,
  className = '', 
  as: Component = 'div',
  ...props 
}: RowProps) => {
  return (
    <Component 
      className={`flex flex-row ${wrap ? 'flex-wrap' : ''} ${gapMap[gap]} ${alignMap[align]} ${justifyMap[justify]} ${className}`} 
      {...props}
    >
      {children}
    </Component>
  );
};
