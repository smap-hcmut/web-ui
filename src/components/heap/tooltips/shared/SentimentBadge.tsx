'use client';

import { sentimentConfig } from './tooltip-utils';

export default function SentimentBadge({ value }: { value: number }) {
  const c = sentimentConfig(value);
  return (
    <span
      className="absolute top-2 right-2 z-[2] text-[8px] font-semibold px-1.5 py-[2px] rounded"
      style={{ background: c.bg, color: c.color }}
    >
      {c.label}
    </span>
  );
}
