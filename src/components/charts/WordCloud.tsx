'use client';

import { useState } from 'react';

interface WordItem {
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
  const PAD_X = 6;
  const PAD_Y = 3;

  // Pessimistic width estimate for system-ui-ish font. Slight padding so
  // rendered glyphs don't visually touch.
  function estimateBox(fs: number, textLen: number) {
    const w = textLen * fs * 0.62 + PAD_X * 2;
    const h = fs * 1.25 + PAD_Y * 2;
    return { w, h };
  }

  function findPos(idx: number, fs: number, textLen: number): { x: number; y: number } | null {
    const { w: estW, h: estH } = estimateBox(fs, textLen);

    // Spiral outward from center with more iterations for reliable placement.
    for (let t = 0; t < 2000; t++) {
      const angle = t * 0.18 + idx * 0.5;
      const radius = t * 0.7;
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;

      if (x - estW / 2 < 8 || x + estW / 2 > vw - 8) continue;
      if (y - estH / 2 < 8 || y + estH / 2 > height - 8) continue;

      const box = { x: x - estW / 2, y: y - estH / 2, w: estW, h: estH };
      const overlaps = placed.some(
        (p) =>
          box.x < p.x + p.w &&
          box.x + box.w > p.x &&
          box.y < p.y + p.h &&
          box.y + box.h > p.y,
      );

      if (!overlaps) {
        placed.push(box);
        return { x, y };
      }
    }
    return null;
  }

  // Place with shrink-to-fit: if a word can't fit at its target size, drop
  // the font step by step until it fits. Below the floor, drop the word
  // entirely rather than overlapping.
  const items = display
    .map((word) => {
      let fs = fontSize(word.value);
      let pos: { x: number; y: number } | null = null;
      for (let step = 0; step < 4; step++) {
        pos = findPos(0, fs, word.text.length);
        if (pos) break;
        fs *= 0.85;
        if (fs < 10) break;
      }
      if (!pos) return null;
      const baseOp = word.opacity ?? 0.5 + ((word.value - minVal) / range) * 0.5;
      return { ...word, ...pos, fs, opacity: baseOp };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

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
