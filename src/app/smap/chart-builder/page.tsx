'use client';

import { ChartBuilder } from '@/components/ChartBuilder';

export default function ChartBuilderPage() {
  return (
    <div className="max-w-[1400px] mx-auto px-6 pt-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Chart Builder
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Connect Metabase queries to SMAP charts — select a saved question, map fields, preview in real-time.
        </p>
      </div>
      <ChartBuilder />
    </div>
  );
}
