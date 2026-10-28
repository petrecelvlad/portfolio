import React from 'react';

export interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  gap?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around';
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
};

const justifyMap = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
  around: 'justify-around',
};

export const Stack = ({ 
  children, 
  gap = 'md', 
  align = 'stretch', 
  justify = 'start', 
  className = '', 
  as: Component = 'div',
  ...props 
}: StackProps) => {
  return (
    <Component 
      className={`flex flex-col ${gapMap[gap]} ${alignMap[align]} ${justifyMap[justify]} ${className}`} 
      {...props}
    >
      {children}
    </Component>
  );
};
