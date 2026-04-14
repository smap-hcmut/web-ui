'use client';

import { Fragment } from 'react';
import clsx from 'clsx';

interface HeatmapGridProps {
  /** 2D array [row][col] of values 0-1 (normalized) */
  data: number[][];
  xLabels: string[];
  yLabels: string[];
  color?: string;
  /** Cell size: 'sm' = 24px, 'md' = 32px, 'lg' = 40px, 'fill' = stretch to container */
  cellSize?: 'sm' | 'md' | 'lg' | 'fill';
  className?: string;
}

const cellSizeMap = { sm: 'w-6 h-6', md: 'w-8 h-8', lg: 'w-10 h-10', fill: 'aspect-square' };

export function HeatmapGrid({ data, xLabels, yLabels, color = '99, 102, 241', cellSize = 'sm', className }: HeatmapGridProps) {
  if (!data.length) return null;

  const isFill = cellSize === 'fill';
  const cellClass = cellSizeMap[cellSize];

  return (
    <div className={clsx('overflow-x-auto', isFill && 'w-full', className)}>
      <div
        className={clsx('grid gap-[3px]', isFill ? 'w-full' : 'inline-grid')}
        style={{ gridTemplateColumns: `40px repeat(${xLabels.length}, ${isFill ? '1fr' : 'auto'})` }}
      >
        {/* Corner */}
        <div />
        {/* X headers */}
        {xLabels.map((l, i) => (
          <div key={i} className="text-[10px] font-medium text-center pb-1" style={{ color: 'var(--text-muted)' }}>
            {l}
          </div>
        ))}

        {/* Rows */}
        {yLabels.map((yl, ri) => (
          <Fragment key={ri}>
            <div className="text-[10px] font-medium flex items-center pr-2 justify-end" style={{ color: 'var(--text-muted)' }}>
              {yl}
            </div>
            {xLabels.map((_, ci) => {
              const val = data[ri]?.[ci] ?? 0;
              return (
                <div
                  key={ci}
                  className={clsx(cellClass, 'rounded-[5px] transition-colors duration-300')}
                  style={{
                    background: val > 0 ? `rgba(${color}, ${0.08 + val * 0.72})` : 'var(--bg-hover)',
                  }}
                  title={`${yLabels[ri]} × ${xLabels[ci]}: ${(val * 100).toFixed(0)}%`}
                />
              );
            })}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
