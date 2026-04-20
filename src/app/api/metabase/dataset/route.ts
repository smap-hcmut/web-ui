/**
 * POST /api/metabase/dataset
 *
 * Execute an ad-hoc structured query against smap-database.
 * This allows building queries without saving them as Metabase questions.
 *
 * Body: {
 *   sourceTableId: number,
 *   fields?: number[],        // field IDs to select
 *   aggregations?: { fn: string, fieldId?: number }[],
 *   breakouts?: number[],     // field IDs to group by
 *   filters?: { fieldId: number, op: string, value: unknown }[],
 *   orderBy?: { fieldId: number, direction: 'asc' | 'desc' }[],
 *   limit?: number
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { fetchMetabase } from '@/lib/metabase/client';

interface AggregationInput {
  fn: string;
  fieldId?: number;
}

interface FilterInput {
  fieldId: number;
  op: string;
  value: unknown;
}

interface OrderByInput {
  fieldId: number;
  direction: 'asc' | 'desc';
}

interface DatasetBody {
  sourceTableId: number;
  fields?: number[];
  aggregations?: AggregationInput[];
  breakouts?: number[];
  filters?: FilterInput[];
  orderBy?: OrderByInput[];
  limit?: number;
}

function buildMetabaseQuery(body: DatasetBody) {
  const query: Record<string, unknown> = {
    'source-table': body.sourceTableId,
  };

  // Fields to select (if no aggregation)
  if (body.fields?.length && !body.aggregations?.length) {
    query.fields = body.fields.map((id) => ['field', id, null]);
  }

  // Aggregations: count, sum, avg, min, max, distinct
  if (body.aggregations?.length) {
    query.aggregation = body.aggregations.map((agg) => {
      if (agg.fn === 'count') return ['count'];
      if (agg.fieldId) return [agg.fn, ['field', agg.fieldId, null]];
      return ['count'];
    });
  }

  // Breakout (GROUP BY)
  if (body.breakouts?.length) {
    query.breakout = body.breakouts.map((id) => ['field', id, null]);
  }

  // Filters
  if (body.filters?.length) {
    const conditions = body.filters.map((f) => {
      return [f.op, ['field', f.fieldId, null], f.value];
    });
    query.filter = conditions.length === 1 ? conditions[0] : ['and', ...conditions];
  }

  // Order by
  if (body.orderBy?.length) {
    query['order-by'] = body.orderBy.map((o) => [o.direction, ['field', o.fieldId, null]]);
  }

  // Limit
  if (body.limit) {
    query.limit = body.limit;
  }

  return {
    database: 2, // smap-database
    type: 'query',
    query,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: DatasetBody = await request.json();

    if (!body.sourceTableId) {
      return NextResponse.json({ error: 'sourceTableId is required' }, { status: 400 });
    }

    const mbQuery = buildMetabaseQuery(body);

    const res = await fetchMetabase('/api/dataset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mbQuery),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Metabase dataset failed (${res.status}): ${text}`);
    }

    const data = await res.json();
    return NextResponse.json(transformDatasetResponse(data));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

/**
 * Transform Metabase dataset response to the same format as card/query/json
 * so the ChartBuilder can consume both uniformly.
 */
function transformDatasetResponse(data: Record<string, unknown>) {
  const d = data.data as Record<string, unknown> | undefined;
  if (!d) return [];

  const cols = (d.cols as Array<{ name: string; display_name: string; base_type: string }>) || [];
  const rows = (d.rows as unknown[][]) || [];

  // Convert from array-of-arrays to array-of-objects
  return rows.map((row) => {
    const obj: Record<string, unknown> = {};
    cols.forEach((col, i) => {
      obj[col.display_name || col.name] = row[i];
    });
    return obj;
  });
}
