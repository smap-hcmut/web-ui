'use client';

import { useState, useMemo, useCallback } from 'react';
import { useMetabaseCards, useMetabaseQuery } from '@/lib/hooks';
import type { MetabaseColumn, MetabaseQueryResult } from '@/lib/hooks';
import { QueryBuilder } from '@/components/QueryBuilder';

type DataSource = 'saved' | 'build';

// Charts
import { BarChart, type BarCategory } from '@/components/charts/BarChart';
import { LineChart } from '@/components/charts/LineChart';
import { AreaChart } from '@/components/charts/AreaChart';
import { DonutChart, type DonutSegment } from '@/components/charts/DonutChart';
import { RadarChart, type RadarAxis, type RadarSeries } from '@/components/charts/RadarChart';
import { FunnelChart, type FunnelStage } from '@/components/charts/FunnelChart';
import { HeatmapGrid } from '@/components/charts/HeatmapGrid';
import { GaugeChart } from '@/components/charts/GaugeChart';

// ── Constants ──────────────────────────────────────

const CHART_TYPES = [
  { id: 'bar', label: 'Bar', icon: '▐' },
  { id: 'line', label: 'Line', icon: '╱' },
  { id: 'area', label: 'Area', icon: '▟' },
  { id: 'donut', label: 'Donut', icon: '◕' },
  { id: 'radar', label: 'Radar', icon: '⬡' },
  { id: 'funnel', label: 'Funnel', icon: '▽' },
  { id: 'heatmap', label: 'Heatmap', icon: '▦' },
  { id: 'gauge', label: 'Gauge', icon: '◔' },
] as const;

type ChartType = (typeof CHART_TYPES)[number]['id'];

const COLORS = [
  '#6366f1', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6',
  '#06b6d4', '#ec4899', '#14b8a6', '#f97316', '#3b82f6',
];

// ── Field Mapping Config per Chart Type ────────────

interface FieldSlot {
  key: string;
  label: string;
  accepts: MetabaseColumn['type'][];
  required: boolean;
  description: string;
}

const CHART_FIELD_SLOTS: Record<ChartType, FieldSlot[]> = {
  bar: [
    { key: 'category', label: 'Category (X-axis)', accepts: ['string', 'datetime'], required: true, description: 'Labels cho mỗi bar group' },
    { key: 'value', label: 'Value (Y-axis)', accepts: ['number'], required: true, description: 'Giá trị hiển thị' },
    { key: 'group', label: 'Group By', accepts: ['string'], required: false, description: 'Tách thành nhiều bars theo field này' },
  ],
  line: [
    { key: 'x', label: 'X-axis', accepts: ['string', 'datetime', 'number'], required: true, description: 'Trục hoành' },
    { key: 'value', label: 'Y-axis (Value)', accepts: ['number'], required: true, description: 'Giá trị vẽ đường' },
    { key: 'series', label: 'Series (Group)', accepts: ['string'], required: false, description: 'Tách thành nhiều đường' },
  ],
  area: [
    { key: 'x', label: 'X-axis', accepts: ['string', 'datetime', 'number'], required: true, description: 'Trục hoành' },
    { key: 'value', label: 'Y-axis (Value)', accepts: ['number'], required: true, description: 'Giá trị vẽ vùng' },
    { key: 'series', label: 'Series (Group)', accepts: ['string'], required: false, description: 'Tách thành nhiều vùng' },
  ],
  donut: [
    { key: 'label', label: 'Label', accepts: ['string'], required: true, description: 'Tên mỗi phần' },
    { key: 'value', label: 'Value', accepts: ['number'], required: true, description: 'Giá trị mỗi phần' },
  ],
  radar: [
    { key: 'axis', label: 'Axis Label', accepts: ['string'], required: true, description: 'Tên các trục radar' },
    { key: 'value', label: 'Value', accepts: ['number'], required: true, description: 'Giá trị trên mỗi trục' },
    { key: 'series', label: 'Series (Group)', accepts: ['string'], required: false, description: 'Tách thành nhiều lớp' },
  ],
  funnel: [
    { key: 'stage', label: 'Stage Label', accepts: ['string'], required: true, description: 'Tên từng bước' },
    { key: 'value', label: 'Value', accepts: ['number'], required: true, description: 'Giá trị mỗi bước' },
  ],
  heatmap: [
    { key: 'x', label: 'X-axis', accepts: ['string', 'datetime'], required: true, description: 'Cột ngang' },
    { key: 'y', label: 'Y-axis', accepts: ['string'], required: true, description: 'Hàng dọc' },
    { key: 'value', label: 'Value (Intensity)', accepts: ['number'], required: true, description: 'Cường độ màu' },
  ],
  gauge: [
    { key: 'value', label: 'Value (0-100)', accepts: ['number'], required: true, description: 'Giá trị gauge' },
  ],
};

// ── Data Transformers ──────────────────────────────

type FieldMapping = Record<string, string>; // slot key → column name

function transformToBar(data: MetabaseQueryResult, mapping: FieldMapping): BarCategory[] {
  const { rows } = data;
  const catField = mapping.category;
  const valField = mapping.value;
  const groupField = mapping.group;

  if (!catField || !valField) return [];

  if (groupField) {
    const groups = [...new Set(rows.map((r) => String(r[groupField])))];
    const categories = [...new Set(rows.map((r) => String(r[catField])))];

    return categories.map((cat) => ({
      label: cat,
      values: groups.map((g, i) => {
        const row = rows.find((r) => String(r[catField]) === cat && String(r[groupField]) === g);
        return {
          key: g,
          value: Number(row?.[valField] ?? 0),
          color: COLORS[i % COLORS.length],
        };
      }),
    }));
  }

  return rows.map((r, i) => ({
    label: String(r[catField]),
    values: [{ key: valField, value: Number(r[valField]), color: COLORS[i % COLORS.length] }],
  }));
}

function transformToLineSeries(data: MetabaseQueryResult, mapping: FieldMapping) {
  const { rows } = data;
  const xField = mapping.x;
  const valField = mapping.value;
  const seriesField = mapping.series;

  if (!xField || !valField) return { series: [], xLabels: [] };

  const xLabels = [...new Set(rows.map((r) => String(r[xField])))];

  if (seriesField) {
    const groups = [...new Set(rows.map((r) => String(r[seriesField])))];
    const series = groups.map((g, i) => ({
      label: g,
      color: COLORS[i % COLORS.length],
      data: xLabels.map((x) => {
        const row = rows.find((r) => String(r[xField]) === x && String(r[seriesField]) === g);
        return Number(row?.[valField] ?? 0);
      }),
    }));
    return { series, xLabels };
  }

  return {
    series: [{
      label: valField,
      color: COLORS[0],
      data: xLabels.map((x) => {
        const row = rows.find((r) => String(r[xField]) === x);
        return Number(row?.[valField] ?? 0);
      }),
    }],
    xLabels,
  };
}

function transformToDonut(data: MetabaseQueryResult, mapping: FieldMapping): DonutSegment[] {
  const { rows } = data;
  return rows.map((r, i) => ({
    label: String(r[mapping.label]),
    value: Number(r[mapping.value]),
    color: COLORS[i % COLORS.length],
  }));
}

function transformToRadar(data: MetabaseQueryResult, mapping: FieldMapping): { axes: RadarAxis[]; series: RadarSeries[] } {
  const { rows } = data;
  const axisField = mapping.axis;
  const valField = mapping.value;
  const seriesField = mapping.series;

  const axisLabels = [...new Set(rows.map((r) => String(r[axisField])))];
  const axes: RadarAxis[] = axisLabels.map((a) => ({ key: a, label: a }));

  if (seriesField) {
    const groups = [...new Set(rows.map((r) => String(r[seriesField])))];
    const series: RadarSeries[] = groups.map((g, i) => ({
      label: g,
      color: COLORS[i % COLORS.length],
      values: Object.fromEntries(
        axisLabels.map((a) => {
          const row = rows.find((r) => String(r[axisField]) === a && String(r[seriesField]) === g);
          return [a, Number(row?.[valField] ?? 0)];
        })
      ),
    }));
    return { axes, series };
  }

  return {
    axes,
    series: [{
      label: valField,
      color: COLORS[0],
      values: Object.fromEntries(
        axisLabels.map((a) => {
          const row = rows.find((r) => String(r[axisField]) === a);
          return [a, Number(row?.[valField] ?? 0)];
        })
      ),
    }],
  };
}

function transformToFunnel(data: MetabaseQueryResult, mapping: FieldMapping): FunnelStage[] {
  const { rows } = data;
  return rows.map((r, i) => ({
    label: String(r[mapping.stage]),
    value: Number(r[mapping.value]),
    color: COLORS[i % COLORS.length],
  }));
}

function transformToHeatmap(data: MetabaseQueryResult, mapping: FieldMapping) {
  const { rows } = data;
  const xLabels = [...new Set(rows.map((r) => String(r[mapping.x])))];
  const yLabels = [...new Set(rows.map((r) => String(r[mapping.y])))];

  const values = rows.map((r) => Number(r[mapping.value]));
  const maxVal = Math.max(...values, 1);

  const grid = yLabels.map((y) =>
    xLabels.map((x) => {
      const row = rows.find((r) => String(r[mapping.x]) === x && String(r[mapping.y]) === y);
      return Number(row?.[mapping.value] ?? 0) / maxVal;
    })
  );

  return { data: grid, xLabels, yLabels };
}

// ── Component ──────────────────────────────────────

export function ChartBuilder() {
  const [dataSource, setDataSource] = useState<DataSource>('build');
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [fieldMapping, setFieldMapping] = useState<FieldMapping>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [buildResult, setBuildResult] = useState<MetabaseQueryResult | null>(null);

  const { data: cards, isLoading: cardsLoading, error: cardsError } = useMetabaseCards();
  const { data: savedQueryResult, isLoading: queryLoading, error: queryError } = useMetabaseQuery(selectedCardId);

  // Unified result: from saved question OR from query builder
  const queryResult = dataSource === 'saved' ? savedQueryResult : buildResult;
  const isLoading = dataSource === 'saved' ? queryLoading : false;
  const hasData = dataSource === 'saved' ? selectedCardId !== null : buildResult !== null;

  const filteredCards = useMemo(() => {
    if (!cards) return [];
    if (!searchQuery) return cards;
    const q = searchQuery.toLowerCase();
    return cards.filter(
      (c) => c.name.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q)
    );
  }, [cards, searchQuery]);

  const currentSlots = CHART_FIELD_SLOTS[chartType];
  const availableColumns = queryResult?.columns ?? [];

  const allRequiredMapped = currentSlots
    .filter((s) => s.required)
    .every((s) => fieldMapping[s.key]);

  const handleChartTypeChange = (type: ChartType) => {
    setChartType(type);
    setFieldMapping({});
  };

  const handleCardSelect = (cardId: number) => {
    setSelectedCardId(cardId);
    setFieldMapping({});
  };

  const handleDataSourceChange = (source: DataSource) => {
    setDataSource(source);
    setFieldMapping({});
    if (source === 'build') {
      setSelectedCardId(null);
    } else {
      setBuildResult(null);
    }
  };

  const handleBuildResult = useCallback((result: MetabaseQueryResult) => {
    setBuildResult(result);
    setFieldMapping({});
  }, []);

  // ── Chart Preview ──────────────────────────────

  const chartPreview = useMemo(() => {
    if (!queryResult || !allRequiredMapped) return null;

    try {
      switch (chartType) {
        case 'bar':
          return <BarChart categories={transformToBar(queryResult, fieldMapping)} height={320} />;

        case 'line': {
          const { series, xLabels } = transformToLineSeries(queryResult, fieldMapping);
          return <LineChart series={series} xLabels={xLabels} height={320} />;
        }

        case 'area': {
          const { series, xLabels } = transformToLineSeries(queryResult, fieldMapping);
          return <AreaChart series={series} xLabels={xLabels} height={320} />;
        }

        case 'donut':
          return <DonutChart segments={transformToDonut(queryResult, fieldMapping)} size={200} />;

        case 'radar': {
          const { axes, series } = transformToRadar(queryResult, fieldMapping);
          return <RadarChart axes={axes} series={series} size={320} />;
        }

        case 'funnel':
          return <FunnelChart stages={transformToFunnel(queryResult, fieldMapping)} height={320} />;

        case 'heatmap': {
          const hm = transformToHeatmap(queryResult, fieldMapping);
          return <HeatmapGrid data={hm.data} xLabels={hm.xLabels} yLabels={hm.yLabels} cellSize="fill" />;
        }

        case 'gauge': {
          const val = Number(queryResult.rows[0]?.[fieldMapping.value] ?? 0);
          return <GaugeChart value={Math.min(100, Math.max(0, val))} label={fieldMapping.value} />;
        }

        default:
          return null;
      }
    } catch {
      return <div className="text-center py-8" style={{ color: 'var(--text-danger)' }}>Transform error — check field mapping</div>;
    }
  }, [queryResult, fieldMapping, chartType, allRequiredMapped]);

  // ── Render ─────────────────────────────────────

  return (
    <div className="grid grid-cols-[380px_1fr] gap-6 h-full">
      {/* ── Left Panel: Config ── */}
      <div
        className="flex flex-col gap-4 overflow-y-auto pr-2 pb-4"
        style={{ maxHeight: 'calc(100vh - 160px)' }}
      >
        {/* Data Source Toggle */}
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
            1. Data Source
          </h3>
          <div
            className="grid grid-cols-2 gap-0 rounded-lg overflow-hidden"
            style={{ border: '1px solid var(--border)' }}
          >
            {([
              { id: 'build' as const, label: 'Build Query', desc: 'Table + columns + filters' },
              { id: 'saved' as const, label: 'Saved Question', desc: 'From Metabase' },
            ]).map((opt) => (
              <button
                key={opt.id}
                onClick={() => handleDataSourceChange(opt.id)}
                className="py-2.5 px-3 text-left transition-colors"
                style={{
                  background: dataSource === opt.id ? 'var(--bg-active)' : 'var(--bg-surface)',
                  color: dataSource === opt.id ? 'var(--text-primary)' : 'var(--text-muted)',
                  borderRight: opt.id === 'build' ? '1px solid var(--border)' : undefined,
                }}
              >
                <div className="text-xs font-semibold">{opt.label}</div>
                <div className="text-[10px] mt-0.5 opacity-60">{opt.desc}</div>
              </button>
            ))}
          </div>
        </section>

        {/* Data Source Content */}
        {dataSource === 'build' && (
          <section>
            <QueryBuilder onResult={handleBuildResult} />
          </section>
        )}

        {dataSource === 'saved' && (
          <section>
            <input
              type="text"
              placeholder="Search saved questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
              }}
            />
            <div
              className="mt-2 rounded-lg overflow-y-auto"
              style={{ maxHeight: 240, border: '1px solid var(--border)', background: 'var(--bg-surface)' }}
            >
              {cardsLoading && (
                <div className="p-4 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                  Loading questions...
                </div>
              )}
              {cardsError && (
                <div className="p-4 text-center text-sm" style={{ color: 'var(--text-danger)' }}>
                  {(cardsError as Error).message}
                </div>
              )}
              {filteredCards.map((card) => (
                <button
                  key={card.id}
                  onClick={() => handleCardSelect(card.id)}
                  className="w-full text-left px-3 py-2.5 text-sm transition-colors border-b last:border-b-0"
                  style={{
                    borderColor: 'var(--border-subtle)',
                    background: selectedCardId === card.id ? 'var(--bg-active)' : 'transparent',
                    color: selectedCardId === card.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                  }}
                >
                  <div className="font-medium truncate">{card.name}</div>
                  {card.description && (
                    <div className="text-[11px] truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {card.description}
                    </div>
                  )}
                </button>
              ))}
              {!cardsLoading && !cardsError && filteredCards.length === 0 && (
                <div className="p-4 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                  No questions found
                </div>
              )}
            </div>
          </section>
        )}

        {/* Chart Type */}
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
            2. Chart Type
          </h3>
          <div className="grid grid-cols-4 gap-1.5">
            {CHART_TYPES.map((ct) => (
              <button
                key={ct.id}
                onClick={() => handleChartTypeChange(ct.id)}
                className="flex flex-col items-center gap-1 py-2.5 px-1 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: chartType === ct.id ? 'var(--bg-active)' : 'var(--bg-surface)',
                  border: `1.5px solid ${chartType === ct.id ? 'var(--accent)' : 'var(--border)'}`,
                  color: chartType === ct.id ? 'var(--text-primary)' : 'var(--text-muted)',
                }}
              >
                <span className="text-lg leading-none">{ct.icon}</span>
                {ct.label}
              </button>
            ))}
          </div>
        </section>

        {/* Field Mapping */}
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
            3. Field Mapping
          </h3>
          {!queryResult && !isLoading && (
            <div className="text-sm py-3 text-center" style={{ color: 'var(--text-muted)' }}>
              {dataSource === 'saved' ? 'Select a question to see columns' : 'Run a query to see columns'}
            </div>
          )}
          {isLoading && (
            <div className="text-sm py-3 text-center" style={{ color: 'var(--text-muted)' }}>
              Loading data...
            </div>
          )}
          {dataSource === 'saved' && queryError && (
            <div className="text-sm py-3 text-center" style={{ color: 'var(--text-danger)' }}>
              {(queryError as Error).message}
            </div>
          )}
          {queryResult && (
            <div className="flex flex-col gap-2.5">
              {currentSlots.map((slot) => {
                const compatibleCols = availableColumns.filter(
                  (col) => slot.accepts.includes(col.type) || slot.accepts.includes('unknown' as MetabaseColumn['type'])
                );

                return (
                  <div key={slot.key}>
                    <label className="flex items-center gap-1.5 text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                      {slot.label}
                      {slot.required && <span style={{ color: 'var(--text-danger)' }}>*</span>}
                    </label>
                    <select
                      value={fieldMapping[slot.key] ?? ''}
                      onChange={(e) =>
                        setFieldMapping((prev) => ({
                          ...prev,
                          [slot.key]: e.target.value || undefined!,
                        }))
                      }
                      className="w-full px-3 py-2 rounded-lg text-sm outline-none appearance-none cursor-pointer"
                      style={{
                        background: 'var(--bg-input)',
                        border: `1px solid ${fieldMapping[slot.key] ? 'var(--accent)' : 'var(--border)'}`,
                        color: 'var(--text-primary)',
                      }}
                    >
                      <option value="">— {slot.description} —</option>
                      {compatibleCols.map((col) => (
                        <option key={col.name} value={col.name}>
                          {col.name} ({col.type})
                        </option>
                      ))}
                      {availableColumns
                        .filter((col) => !compatibleCols.includes(col))
                        .map((col) => (
                          <option key={col.name} value={col.name} disabled>
                            {col.name} ({col.type}) — not recommended
                          </option>
                        ))}
                    </select>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Data Preview Table */}
        {queryResult && queryResult.rows.length > 0 && (
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
              Data Preview ({queryResult.rows.length} rows)
            </h3>
            <div
              className="rounded-lg overflow-auto"
              style={{ maxHeight: 200, border: '1px solid var(--border)', background: 'var(--bg-surface)' }}
            >
              <table className="w-full text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-hover)' }}>
                    {queryResult.columns.map((col) => (
                      <th
                        key={col.name}
                        className="px-2 py-1.5 text-left font-semibold whitespace-nowrap sticky top-0"
                        style={{ background: 'var(--bg-hover)', color: 'var(--text-primary)' }}
                      >
                        <div>{col.name}</div>
                        <div className="font-normal" style={{ color: 'var(--text-muted)', fontSize: 9 }}>
                          {col.type}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {queryResult.rows.slice(0, 10).map((row, ri) => (
                    <tr key={ri} className="border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                      {queryResult.columns.map((col) => (
                        <td key={col.name} className="px-2 py-1 whitespace-nowrap max-w-[150px] truncate">
                          {row[col.name] === null ? (
                            <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>null</span>
                          ) : (
                            String(row[col.name])
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>

      {/* ── Right Panel: Chart Preview ── */}
      <div
        className="rounded-2xl p-6 flex flex-col"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          minHeight: 400,
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Preview
          </h3>
          {queryResult && (
            <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)' }}>
              {queryResult.rows.length} rows &middot; {queryResult.columns.length} columns
            </span>
          )}
        </div>

        <div className="flex-1 flex items-center justify-center">
          {!hasData && (
            <div className="text-center">
              <div className="text-4xl mb-3 opacity-30">&#x1F4CA;</div>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                {dataSource === 'saved'
                  ? 'Select a Metabase question to get started'
                  : 'Build and run a query to get started'}
              </p>
            </div>
          )}

          {hasData && isLoading && (
            <div className="text-center">
              <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin mx-auto mb-3" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Querying Metabase...</p>
            </div>
          )}

          {hasData && queryResult && !allRequiredMapped && (
            <div className="text-center">
              <div className="text-4xl mb-3 opacity-30">&#x1F517;</div>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Map required fields to see the chart
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5 justify-center">
                {currentSlots
                  .filter((s) => s.required && !fieldMapping[s.key])
                  .map((s) => (
                    <span
                      key={s.key}
                      className="text-[11px] px-2 py-0.5 rounded-full"
                      style={{ background: 'var(--bg-hover)', color: 'var(--text-danger)' }}
                    >
                      {s.label}
                    </span>
                  ))}
              </div>
            </div>
          )}

          {hasData && queryResult && allRequiredMapped && (
            <div className="w-full">{chartPreview}</div>
          )}
        </div>
      </div>
    </div>
  );
}
