'use client';

import clsx from 'clsx';

interface SkeletonProps {
  variant?: 'text' | 'circle' | 'rect' | 'card';
  width?: number | string;
  height?: number | string;
  className?: string;
}

export function Skeleton({ variant = 'text', width, height, className }: SkeletonProps) {
  const base = 'animate-pulse';

  const variantClass = {
    text: 'rounded-md',
    circle: 'rounded-full',
    rect: 'rounded-xl',
    card: 'rounded-2xl',
  }[variant];

  const defaultSize = {
    text: { width: '100%', height: 14 },
    circle: { width: 40, height: 40 },
    rect: { width: '100%', height: 80 },
    card: { width: '100%', height: 160 },
  }[variant];

  return (
    <div
      className={clsx(base, variantClass, className)}
      style={{
        width: width ?? defaultSize.width,
        height: height ?? defaultSize.height,
        background: 'var(--bg-hover)',
      }}
    />
  );
}
