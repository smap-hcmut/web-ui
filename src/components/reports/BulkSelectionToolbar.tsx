'use client';

import { CheckSquare, Square, Download, Send, X } from 'lucide-react';

interface Props {
  selectedCount: number;
  totalOnPage: number;
  onSelectAllOnPage: () => void;
  onClear: () => void;
  onExport?: () => void;
  onMark?: () => void;
}

export function BulkSelectionToolbar({
  selectedCount,
  totalOnPage,
  onSelectAllOnPage,
  onClear,
  onExport,
  onMark,
}: Props) {
  const allSelected = selectedCount > 0 && selectedCount >= totalOnPage;

  return (
    <div
      className="sticky top-0 z-10 flex items-center gap-3 px-4 py-2.5 rounded-xl"
      style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <button
        onClick={onSelectAllOnPage}
        className="flex items-center gap-1.5 text-[12px] font-medium"
        style={{ color: 'var(--text-secondary)' }}
      >
        {allSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
        Select all on page
      </button>

      <span className="text-[12px] tabular-nums" style={{ color: 'var(--text-muted)' }}>
        {selectedCount} selected
      </span>

      <div className="ml-auto flex items-center gap-1">
        {onMark && (
          <button
            onClick={onMark}
            disabled={selectedCount === 0}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors disabled:opacity-40"
            style={{ color: 'var(--accent)' }}
            onMouseEnter={(e) => { if (selectedCount > 0) e.currentTarget.style.background = 'var(--accent-subtle)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <Send className="w-3.5 h-3.5" /> Mark for analysis
          </button>
        )}
        {onExport && (
          <button
            onClick={onExport}
            disabled={selectedCount === 0}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors disabled:opacity-40"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => { if (selectedCount > 0) e.currentTarget.style.background = 'var(--bg-hover)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <Download className="w-3.5 h-3.5" /> Export selected
          </button>
        )}
        {selectedCount > 0 && (
          <button
            onClick={onClear}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <X className="w-3.5 h-3.5" /> Clear
          </button>
        )}
      </div>
    </div>
  );
}
