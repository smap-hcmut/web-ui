'use client';

import { useState, useMemo } from 'react';
import { useMetabaseMetadata, useMetabaseDataset } from '@/lib/hooks';
import type { MetabaseTableMeta, MetabaseFieldMeta, MetabaseQueryResult, DatasetRequest } from '@/lib/hooks';

// ── Helpers ────────────────────────────────────────

/** Map Metabase base_type to a simple category for display */
function fieldCategory(f: MetabaseFieldMeta): 'number' | 'text' | 'bool' | 'time' | 'json' | 'other' {
  const bt = f.base_type.toLowerCase();
  const dt = f.database_type.toLowerCase();
  if (bt.includes('integer') || bt.includes('float') || bt.includes('number') || dt.includes('int') || dt.includes('float') || dt.includes('numeric')) return 'number';
  if (bt.includes('boolean') || dt.includes('bool')) return 'bool';
  if (bt.includes('datetime') || bt.includes('temporal') || dt.includes('timestamp') || dt.includes('date')) return 'time';
  if (bt.includes('json') || dt.includes('json')) return 'json';
  if (bt.includes('text') || bt.includes('string') || dt.includes('varchar') || dt.includes('text') || dt.includes('uuid')) return 'text';
  return 'other';
}

const CATEGORY_COLORS: Record<string, string> = {
  number: '#6366f1',
  text: '#10b981',
  bool: '#f59e0b',
  time: '#3b82f6',
  json: '#8b5cf6',
  other: '#6b7280',
};

const AGG_FUNCTIONS = [
  { value: 'count', label: 'Count', needsField: false },
  { value: 'sum', label: 'Sum', needsField: true },
  { value: 'avg', label: 'Average', needsField: true },
  { value: 'min', label: 'Min', needsField: true },
  { value: 'max', label: 'Max', needsField: true },
  { value: 'distinct', label: 'Distinct', needsField: true },
];

const FILTER_OPS = [
  { value: '=', label: '=', types: ['text', 'number', 'bool'] },
  { value: '!=', label: '!=', types: ['text', 'number', 'bool'] },
  { value: '>', label: '>', types: ['number', 'time'] },
  { value: '<', label: '<', types: ['number', 'time'] },
  { value: '>=', label: '>=', types: ['number', 'time'] },
  { value: '<=', label: '<=', types: ['number', 'time'] },
  { value: 'contains', label: 'contains', types: ['text'] },
  { value: 'not-null', label: 'is not null', types: ['text', 'number', 'bool', 'time', 'json'] },
  { value: 'is-null', label: 'is null', types: ['text', 'number', 'bool', 'time', 'json'] },
];

// ── Types ──────────────────────────────────────────

interface AggregationRow {
  fn: string;
  fieldId: number | null;
}

interface FilterRow {
  fieldId: number | null;
  op: string;
  value: string;
}

interface QueryBuilderProps {
  onResult: (result: MetabaseQueryResult) => void;
}

// ── Component ──────────────────────────────────────

export function QueryBuilder({ onResult }: QueryBuilderProps) {
  const { data: tables, isLoading: metaLoading, error: metaError } = useMetabaseMetadata();
  const dataset = useMetabaseDataset();

  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
  const [selectedFieldIds, setSelectedFieldIds] = useState<number[]>([]);
  const [aggregations, setAggregations] = useState<AggregationRow[]>([]);
  const [breakoutIds, setBreakoutIds] = useState<number[]>([]);
  const [filters, setFilters] = useState<FilterRow[]>([]);
  const [orderFieldId, setOrderFieldId] = useState<number | null>(null);
  const [orderDir, setOrderDir] = useState<'asc' | 'desc'>('desc');
  const [limit, setLimit] = useState(100);
  const [tableSearch, setTableSearch] = useState('');

  const selectedTable = useMemo(
    () => tables?.find((t) => t.id === selectedTableId) ?? null,
    [tables, selectedTableId]
  );

  const numericFields = useMemo(
    () => selectedTable?.fields.filter((f) => fieldCategory(f) === 'number') ?? [],
    [selectedTable]
  );

  const filteredTables = useMemo(() => {
    if (!tables) return [];
    if (!tableSearch) return tables;
    const q = tableSearch.toLowerCase();
    return tables.filter(
      (t) => t.name.toLowerCase().includes(q) || t.schema.toLowerCase().includes(q) || t.display_name.toLowerCase().includes(q)
    );
  }, [tables, tableSearch]);

  const hasAggregation = aggregations.length > 0;

  // ── Handlers ─────────────────────────────────────

  const handleSelectTable = (table: MetabaseTableMeta) => {
    setSelectedTableId(table.id);
    setSelectedFieldIds([]);
    setAggregations([]);
    setBreakoutIds([]);
    setFilters([]);
    setOrderFieldId(null);
  };

  const toggleField = (fieldId: number) => {
    setSelectedFieldIds((prev) =>
      prev.includes(fieldId) ? prev.filter((id) => id !== fieldId) : [...prev, fieldId]
    );
  };

  const selectAllFields = () => {
    if (!selectedTable) return;
    setSelectedFieldIds(selectedTable.fields.map((f) => f.id));
  };

  const clearAllFields = () => setSelectedFieldIds([]);

  const addAggregation = () => setAggregations((prev) => [...prev, { fn: 'count', fieldId: null }]);
  const removeAggregation = (i: number) => setAggregations((prev) => prev.filter((_, idx) => idx !== i));
  const updateAggregation = (i: number, update: Partial<AggregationRow>) => {
    setAggregations((prev) => prev.map((a, idx) => (idx === i ? { ...a, ...update } : a)));
  };

  const toggleBreakout = (fieldId: number) => {
    setBreakoutIds((prev) =>
      prev.includes(fieldId) ? prev.filter((id) => id !== fieldId) : [...prev, fieldId]
    );
  };

  const addFilter = () => setFilters((prev) => [...prev, { fieldId: null, op: '=', value: '' }]);
  const removeFilter = (i: number) => setFilters((prev) => prev.filter((_, idx) => idx !== i));
  const updateFilter = (i: number, update: Partial<FilterRow>) => {
    setFilters((prev) => prev.map((f, idx) => (idx === i ? { ...f, ...update } : f)));
  };

  const handleRun = () => {
    if (!selectedTableId) return;

    const request: DatasetRequest = {
      sourceTableId: selectedTableId,
      limit,
    };

    if (!hasAggregation && selectedFieldIds.length > 0) {
      request.fields = selectedFieldIds;
    }

    if (hasAggregation) {
      request.aggregations = aggregations
        .filter((a) => a.fn === 'count' || a.fieldId !== null)
        .map((a) => ({ fn: a.fn, fieldId: a.fieldId ?? undefined }));
    }

    if (breakoutIds.length > 0) {
      request.breakouts = breakoutIds;
    }

    const validFilters = filters.filter((f) => f.fieldId !== null && (f.op === 'not-null' || f.op === 'is-null' || f.value !== ''));
    if (validFilters.length > 0) {
      request.filters = validFilters.map((f) => ({
        fieldId: f.fieldId!,
        op: f.op,
        value: f.op === 'not-null' || f.op === 'is-null' ? null : f.value,
      }));
    }

    if (orderFieldId) {
      request.orderBy = [{ fieldId: orderFieldId, direction: orderDir }];
    }

    dataset.mutate(request, {
      onSuccess: (result) => onResult(result),
    });
  };

  // ── Render ───────────────────────────────────────

  return (
    <div className="flex flex-col gap-3">
      {/* Table Selector */}
      <div>
        <label className="text-[11px] font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-muted)' }}>
          Table
        </label>
        <input
          type="text"
          placeholder="Search tables..."
          value={tableSearch}
          onChange={(e) => setTableSearch(e.target.value)}
          className="w-full px-3 py-1.5 rounded-lg text-sm outline-none mb-1.5"
          style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
        />
        <div
          className="rounded-lg overflow-y-auto"
          style={{ maxHeight: 160, border: '1px solid var(--border)', background: 'var(--bg-surface)' }}
        >
          {metaLoading && <div className="p-3 text-xs text-center" style={{ color: 'var(--text-muted)' }}>Loading tables...</div>}
          {metaError && <div className="p-3 text-xs text-center" style={{ color: 'var(--text-danger)' }}>{(metaError as Error).message}</div>}
          {filteredTables.map((t) => (
            <button
              key={t.id}
              onClick={() => handleSelectTable(t)}
              className="w-full text-left px-3 py-2 text-xs transition-colors border-b last:border-b-0"
              style={{
                borderColor: 'var(--border-subtle)',
                background: selectedTableId === t.id ? 'var(--bg-active)' : 'transparent',
                color: selectedTableId === t.id ? 'var(--text-primary)' : 'var(--text-secondary)',
              }}
            >
              <span className="font-mono text-[10px] mr-1.5 opacity-50">{t.schema}.</span>
              <span className="font-medium">{t.name}</span>
              <span className="ml-1.5 text-[10px] opacity-40">{t.fields.length} cols</span>
            </button>
          ))}
        </div>
      </div>

      {/* Fields */}
      {selectedTable && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Columns {!hasAggregation && selectedFieldIds.length > 0 && `(${selectedFieldIds.length})`}
            </label>
            <div className="flex gap-2">
              <button onClick={selectAllFields} className="text-[10px] underline" style={{ color: 'var(--accent)' }}>All</button>
              <button onClick={clearAllFields} className="text-[10px] underline" style={{ color: 'var(--text-muted)' }}>Clear</button>
            </div>
          </div>
          <div
            className="rounded-lg overflow-y-auto p-2 flex flex-wrap gap-1.5"
            style={{ maxHeight: 140, border: '1px solid var(--border)', background: 'var(--bg-surface)' }}
          >
            {selectedTable.fields.map((f) => {
              const cat = fieldCategory(f);
              const selected = selectedFieldIds.includes(f.id);
              return (
                <button
                  key={f.id}
                  onClick={() => toggleField(f.id)}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-all"
                  style={{
                    background: selected ? `${CATEGORY_COLORS[cat]}20` : 'var(--bg-hover)',
                    border: `1px solid ${selected ? CATEGORY_COLORS[cat] : 'transparent'}`,
                    color: selected ? 'var(--text-primary)' : 'var(--text-muted)',
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: CATEGORY_COLORS[cat] }} />
                  {f.name}
                  <span className="text-[9px] opacity-50">{f.database_type}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Aggregations */}
      {selectedTable && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Aggregation
            </label>
            <button onClick={addAggregation} className="text-[10px] px-2 py-0.5 rounded" style={{ background: 'var(--bg-hover)', color: 'var(--accent)' }}>
              + Add
            </button>
          </div>
          {aggregations.map((agg, i) => {
            const aggDef = AGG_FUNCTIONS.find((a) => a.value === agg.fn);
            return (
              <div key={i} className="flex items-center gap-1.5 mb-1.5">
                <select
                  value={agg.fn}
                  onChange={(e) => updateAggregation(i, { fn: e.target.value, fieldId: null })}
                  className="px-2 py-1.5 rounded text-[11px] outline-none flex-shrink-0"
                  style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                >
                  {AGG_FUNCTIONS.map((a) => (
                    <option key={a.value} value={a.value}>{a.label}</option>
                  ))}
                </select>
                {aggDef?.needsField && (
                  <select
                    value={agg.fieldId ?? ''}
                    onChange={(e) => updateAggregation(i, { fieldId: Number(e.target.value) || null })}
                    className="px-2 py-1.5 rounded text-[11px] outline-none flex-1 min-w-0"
                    style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  >
                    <option value="">— field —</option>
                    {numericFields.map((f) => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                )}
                <button onClick={() => removeAggregation(i)} className="text-xs px-1.5 shrink-0" style={{ color: 'var(--text-danger)' }}>x</button>
              </div>
            );
          })}
        </div>
      )}

      {/* Breakout (Group By) */}
      {selectedTable && hasAggregation && (
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-muted)' }}>
            Group By
          </label>
          <div className="flex flex-wrap gap-1.5">
            {selectedTable.fields.map((f) => {
              const cat = fieldCategory(f);
              const selected = breakoutIds.includes(f.id);
              return (
                <button
                  key={f.id}
                  onClick={() => toggleBreakout(f.id)}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-all"
                  style={{
                    background: selected ? `${CATEGORY_COLORS[cat]}20` : 'var(--bg-hover)',
                    border: `1px solid ${selected ? CATEGORY_COLORS[cat] : 'transparent'}`,
                    color: selected ? 'var(--text-primary)' : 'var(--text-muted)',
                  }}
                >
                  {f.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      {selectedTable && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Filters
            </label>
            <button onClick={addFilter} className="text-[10px] px-2 py-0.5 rounded" style={{ background: 'var(--bg-hover)', color: 'var(--accent)' }}>
              + Add
            </button>
          </div>
          {filters.map((f, i) => {
            const selectedField = selectedTable.fields.find((fld) => fld.id === f.fieldId);
            const cat = selectedField ? fieldCategory(selectedField) : 'text';
            const availableOps = FILTER_OPS.filter((op) => op.types.includes(cat));
            const needsValue = f.op !== 'not-null' && f.op !== 'is-null';

            return (
              <div key={i} className="flex items-center gap-1.5 mb-1.5">
                <select
                  value={f.fieldId ?? ''}
                  onChange={(e) => updateFilter(i, { fieldId: Number(e.target.value) || null })}
                  className="px-2 py-1.5 rounded text-[11px] outline-none min-w-0"
                  style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)', flex: '0 0 35%' }}
                >
                  <option value="">— field —</option>
                  {selectedTable.fields.map((fld) => (
                    <option key={fld.id} value={fld.id}>{fld.name}</option>
                  ))}
                </select>
                <select
                  value={f.op}
                  onChange={(e) => updateFilter(i, { op: e.target.value })}
                  className="px-2 py-1.5 rounded text-[11px] outline-none flex-shrink-0"
                  style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                >
                  {availableOps.map((op) => (
                    <option key={op.value} value={op.value}>{op.label}</option>
                  ))}
                </select>
                {needsValue && (
                  <input
                    value={f.value}
                    onChange={(e) => updateFilter(i, { value: e.target.value })}
                    placeholder="value"
                    className="px-2 py-1.5 rounded text-[11px] outline-none flex-1 min-w-0"
                    style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  />
                )}
                <button onClick={() => removeFilter(i)} className="text-xs px-1.5 shrink-0" style={{ color: 'var(--text-danger)' }}>x</button>
              </div>
            );
          })}
        </div>
      )}

      {/* Order + Limit */}
      {selectedTable && (
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-[10px] uppercase tracking-wider mb-1 block" style={{ color: 'var(--text-muted)' }}>Order By</label>
            <div className="flex gap-1">
              <select
                value={orderFieldId ?? ''}
                onChange={(e) => setOrderFieldId(Number(e.target.value) || null)}
                className="px-2 py-1.5 rounded text-[11px] outline-none flex-1 min-w-0"
                style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              >
                <option value="">— none —</option>
                {selectedTable.fields.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
              <select
                value={orderDir}
                onChange={(e) => setOrderDir(e.target.value as 'asc' | 'desc')}
                className="px-2 py-1.5 rounded text-[11px] outline-none shrink-0"
                style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              >
                <option value="asc">ASC</option>
                <option value="desc">DESC</option>
              </select>
            </div>
          </div>
          <div style={{ flex: '0 0 80px' }}>
            <label className="text-[10px] uppercase tracking-wider mb-1 block" style={{ color: 'var(--text-muted)' }}>Limit</label>
            <input
              type="number"
              value={limit}
              onChange={(e) => setLimit(Math.max(1, Math.min(2000, Number(e.target.value) || 100)))}
              className="w-full px-2 py-1.5 rounded text-[11px] outline-none"
              style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            />
          </div>
        </div>
      )}

      {/* Run Button */}
      {selectedTable && (
        <button
          onClick={handleRun}
          disabled={dataset.isPending || (!hasAggregation && selectedFieldIds.length === 0)}
          className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-40"
          style={{
            background: 'var(--accent)',
            color: '#fff',
          }}
        >
          {dataset.isPending ? 'Running...' : 'Run Query'}
        </button>
      )}

      {dataset.error && (
        <div className="text-xs p-2 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--text-danger)' }}>
          {(dataset.error as Error).message}
        </div>
      )}
    </div>
  );
}
