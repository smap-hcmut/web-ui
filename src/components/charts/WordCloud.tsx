'use client';

import { useState } from 'react';

export interface WordItem {
  text: string;
  value: number;
  color?: string;
  opacity?: number;
}

interface WordCloudProps {
  words: WordItem[];
  maxWords?: number;
  height?: number;
  className?: string;
}

/**
 * Pure-SVG word cloud with deterministic spiral placement.
 * No external dependencies.
 */
export function WordCloud({ words, maxWords = 30, height = 320, className }: WordCloudProps) {
  const [tip, setTip] = useState<{ cx: number; cy: number; text: string; value: number } | null>(null);

  if (!words.length) return null;

  const display = words
    .slice()
    .sort((a, b) => b.value - a.value)
    .slice(0, maxWords);

  const maxVal = display[0].value;
  const minVal = display[display.length - 1].value;
  const range = maxVal - minVal || 1;

  const vw = 800;
  const cx = vw / 2;
  const cy = height / 2;

  // Map value -> font size (12..42)
  const fontSize = (v: number) => 12 + ((v - minVal) / range) * 30;

  // Deterministic spiral placement
  const placed: { x: number; y: number; w: number; h: number }[] = [];

  function findPos(idx: number, fs: number, textLen: number) {
    const estW = textLen * fs * 0.58;
    const estH = fs * 1.3;

    // Spiral outward from center — wider spread
    for (let t = 0; t < 600; t++) {
      const angle = t * 0.18 + idx * 0.5;
      const radius = t * 0.8;
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;

      // Bounds check
      if (x - estW / 2 < 8 || x + estW / 2 > vw - 8) continue;
      if (y - estH / 2 < 8 || y + estH / 2 > height - 8) continue;

      // Overlap check
      const box = { x: x - estW / 2, y: y - estH / 2, w: estW, h: estH };
      const overlaps = placed.some(
        (p) =>
          box.x < p.x + p.w &&
          box.x + box.w > p.x &&
          box.y < p.y + p.h &&
          box.y + box.h > p.y
      );

      if (!overlaps) {
        placed.push(box);
        return { x, y };
      }
    }
    // Fallback: place it anyway
    return { x: cx + (idx % 5) * 60 - 120, y: cy + Math.floor(idx / 5) * 30 - 60 };
  }

  const items = display.map((word, i) => {
    const fs = fontSize(word.value);
    const pos = findPos(i, fs, word.text.length);
    const baseOp = word.opacity ?? (0.5 + (word.value - minVal) / range * 0.5);
    const opacity = baseOp;
    return { ...word, ...pos, fs, opacity };
  });

  return (
    <div className={className}>
      <svg
        viewBox={`0 0 ${vw} ${height}`}
        className="w-full" style={{ height }}
        onMouseLeave={() => setTip(null)}
      >
        {items.map((item, i) => (
          <text
            key={i}
            x={item.x}
            y={item.y}
            textAnchor="middle"
            dominantBaseline="central"
            fill={item.color || 'var(--accent)'}
            opacity={tip ? (tip.text === item.text ? 1 : item.opacity * 0.35) : item.opacity}
            fontSize={item.fs}
            fontWeight={item.fs > 28 ? 700 : item.fs > 18 ? 600 : 500}
            fontFamily="system-ui, sans-serif"
            className="transition-opacity duration-200 cursor-pointer"
            onMouseEnter={(e) => setTip({ cx: e.clientX, cy: e.clientY, text: item.text, value: item.value })}
            onMouseMove={(e) => setTip(t => t ? { ...t, cx: e.clientX, cy: e.clientY } : null)}
          >
            {item.text}
          </text>
        ))}
      </svg>

      {/* Tooltip */}
      {tip && (
        <div
          className="fixed z-50 pointer-events-none px-3 py-2 rounded-lg text-[11px]"
          style={{
            left: tip.cx, top: tip.cy,
            transform: 'translate(-50%, calc(-100% - 12px))',
            background: 'var(--bg-surface-solid)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-md)',
            whiteSpace: 'nowrap',
          }}
        >
          <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>{tip.text}</div>
          <div style={{ color: 'var(--text-secondary)' }}>
            Volume: <span className="font-bold tabular-nums">{tip.value.toLocaleString()}</span>
          </div>
        </div>
      )}
    </div>
  );
}
