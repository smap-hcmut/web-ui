'use client';

interface BubbleItem {
  label: string;
  value: number;
  color: string;
}

interface FloatingBubblesProps {
  items: BubbleItem[];
  width?: number;
  height?: number;
  className?: string;
}

/** Deterministic seeded random for SSR/client match */
function seeded(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

export function FloatingBubbles({ items, width = 500, height = 240, className }: FloatingBubblesProps) {
  const maxVal = Math.max(...items.map(b => b.value), 1);
  const minR = 20, maxR = 50;

  // Pre-compute positions deterministically
  const bubbles = items.map((item, i) => {
    const pct = item.value / maxVal;
    const r = minR + (maxR - minR) * pct;
    // Spread across the area
    const cols = Math.ceil(Math.sqrt(items.length));
    const col = i % cols;
    const row = Math.floor(i / cols);
    const cellW = width / cols;
    const cellH = height / Math.ceil(items.length / cols);
    const cx = cellW * col + cellW / 2 + (seeded(i * 7 + 1) - 0.5) * cellW * 0.3;
    const cy = cellH * row + cellH / 2 + (seeded(i * 13 + 3) - 0.5) * cellH * 0.3;

    return { ...item, r, cx, cy, i };
  });

  return (
    <div className={`relative overflow-hidden ${className ?? ''}`} style={{ width, height }}>
      {bubbles.map(b => (
        <div
          key={b.i}
          className="absolute flex flex-col items-center justify-center rounded-full cursor-pointer transition-transform duration-300 hover:scale-110 hover:z-10"
          style={{
            width: b.r * 2,
            height: b.r * 2,
            left: b.cx - b.r,
            top: b.cy - b.r,
            background: `radial-gradient(circle at 35% 35%, ${b.color}dd, ${b.color}88)`,
            boxShadow: `0 4px 20px ${b.color}40, inset 0 -2px 8px ${b.color}30`,
            '--fb-ox': `${(seeded(b.i * 3 + 5) - 0.5) * 10}px`,
            '--fb-oy': `${(seeded(b.i * 5 + 7) - 0.5) * 10}px`,
            animation: `floatBubble ${6 + seeded(b.i * 11) * 4}s ease-in-out infinite`,
            animationDelay: `${seeded(b.i * 17) * -5}s`,
          } as React.CSSProperties}
        >
          <span className="text-white font-bold truncate px-1" style={{ fontSize: Math.max(9, b.r * 0.28) }}>
            {b.label}
          </span>
          <span className="text-white/70 tabular-nums" style={{ fontSize: Math.max(8, b.r * 0.22) }}>
            {b.value >= 1000 ? `${(b.value / 1000).toFixed(1)}K` : b.value}
          </span>
        </div>
      ))}
    </div>
  );
}
