'use client';

import { useState, useRef, useCallback } from 'react';
import clsx from 'clsx';

interface SplitPaneProps {
  left: React.ReactNode;
  right: React.ReactNode;
  defaultRatio?: number; // 0-1
  minWidth?: number; // px
  className?: string;
}

export function SplitPane({ left, right, defaultRatio = 0.5, minWidth = 200, className }: SplitPaneProps) {
  const [ratio, setRatio] = useState(defaultRatio);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const onMouseDown = useCallback(() => {
    dragging.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const onMove = (e: MouseEvent) => {
      if (!dragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const pct = Math.max(minWidth / rect.width, Math.min(1 - minWidth / rect.width, x / rect.width));
      setRatio(pct);
    };

    const onUp = () => {
      dragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [minWidth]);

  return (
    <div ref={containerRef} className={clsx('flex h-full', className)}>
      <div className="overflow-auto" style={{ width: `${ratio * 100}%` }}>{left}</div>
      <div
        className="w-1 shrink-0 cursor-col-resize hover:w-1.5 transition-all"
        style={{ background: 'var(--border)' }}
        onMouseDown={onMouseDown}
      />
      <div className="overflow-auto flex-1">{right}</div>
    </div>
  );
}
