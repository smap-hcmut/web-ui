'use client';

import { useRef, useState } from 'react';

interface GlowCardProps {
  children: React.ReactNode;
  color?: string;
  className?: string;
}

export function GlowCard({ children, color = 'var(--accent)', className }: GlowCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 50, y: 50 });
  const [hovering, setHovering] = useState(false);

  const onMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setPos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  return (
    <div
      ref={ref}
      className={`relative rounded-2xl overflow-hidden transition-all duration-300 ${className ?? ''}`}
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
      }}
      onMouseMove={onMove}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      {/* Glow effect */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-500"
        style={{
          opacity: hovering ? 1 : 0,
          background: `radial-gradient(circle at ${pos.x}% ${pos.y}%, ${color}20 0%, transparent 60%)`,
        }}
      />

      {/* Border glow */}
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-500"
        style={{
          opacity: hovering ? 1 : 0,
          boxShadow: `inset 0 0 0 1px ${color}30, 0 0 30px ${color}15`,
        }}
      />

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
