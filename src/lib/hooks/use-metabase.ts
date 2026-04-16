/**
 * Metabase React Query Hooks
 *
 * Fetch saved questions (cards) and query results from Metabase
 * via the Next.js API proxy routes.
 */

import { useQuery, useMutation } from '@tanstack/react-query';

// ── Types ──────────────────────────────────────────

export interface MetabaseCard {
  id: number;
  name: string;
  description: string | null;
  display: string; // "table", "bar", "line", "scalar", etc.
  collection_id: number | null;
  database_id: number;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface MetabaseColumn {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'datetime' | 'unknown';
  sampleValues: (string | number | boolean | null)[];
}

export interface MetabaseQueryResult {
  rows: Record<string, unknown>[];
  columns: MetabaseColumn[];
}

export interface MetabaseTableMeta {
  id: number;
  name: string;
  display_name: string;
  schema: string;
  fields: MetabaseFieldMeta[];
}

export interface MetabaseFieldMeta {
  id: number;
  name: string;
  display_name: string;
  database_type: string;
  base_type: string;
  semantic_type: string | null;
  table_id: number;
}

export interface DatasetRequest {
  sourceTableId: number;
  fields?: number[];
  aggregations?: { fn: string; fieldId?: number }[];
  breakouts?: number[];
  filters?: { fieldId: number; op: string; value: unknown }[];
  orderBy?: { fieldId: number; direction: 'asc' | 'desc' }[];
  limit?: number;
}

// ── Query Keys ─────────────────────────────────────

export const metabaseKeys = {
  all: ['metabase'] as const,
  cards: () => [...metabaseKeys.all, 'cards'] as const,
  query: (cardId: number) => [...metabaseKeys.all, 'query', cardId] as const,
  metadata: () => [...metabaseKeys.all, 'metadata'] as const,
  dataset: (hash: string) => [...metabaseKeys.all, 'dataset', hash] as const,
};

// ── Helpers ────────────────────────────────────────

function inferColumnType(values: unknown[]): MetabaseColumn['type'] {
  for (const v of values) {
    if (v === null || v === undefined) continue;
    if (typeof v === 'number') return 'number';
    if (typeof v === 'boolean') return 'boolean';
    if (typeof v === 'string') {
      // Check if it looks like a date
      if (/^\d{4}-\d{2}-\d{2}/.test(v)) return 'datetime';
      // Check if it's a numeric string
      if (!isNaN(Number(v)) && v.trim() !== '') return 'number';
    }
    return 'string';
  }
  return 'unknown';
}

function parseQueryResult(raw: Record<string, unknown>[]): MetabaseQueryResult {
  if (!raw.length) return { rows: [], columns: [] };

  const keys = Object.keys(raw[0]);
  const columns: MetabaseColumn[] = keys.map((name) => {
    const sampleValues = raw.slice(0, 20).map((row) => row[name] as string | number | boolean | null);
    return {
      name,
      type: inferColumnType(sampleValues),
      sampleValues: sampleValues.slice(0, 5),
    };
  });

  return { rows: raw, columns };
}

// ── Hooks ──────────────────────────────────────────

/** Fetch list of saved questions from Metabase */
export function useMetabaseCards() {
  return useQuery({
    queryKey: metabaseKeys.cards(),
    queryFn: async (): Promise<MetabaseCard[]> => {
      const res = await fetch('/api/metabase/cards');
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to fetch cards');
      }
      const cards: MetabaseCard[] = await res.json();
      // Only return non-archived cards, sorted by most recent
      return cards
        .filter((c) => !c.archived)
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/** Execute a saved question and get parsed results */
export function useMetabaseQuery(cardId: number | null) {
  return useQuery({
    queryKey: metabaseKeys.query(cardId!),
    queryFn: async (): Promise<MetabaseQueryResult> => {
      const res = await fetch('/api/metabase/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to query');
      }
      const raw: Record<string, unknown>[] = await res.json();
      return parseQueryResult(raw);
    },
    enabled: cardId !== null,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/** Fetch database metadata (tables + columns) for smap-database */
export function useMetabaseMetadata() {
  return useQuery({
    queryKey: metabaseKeys.metadata(),
    queryFn: async (): Promise<MetabaseTableMeta[]> => {
      const res = await fetch('/api/metabase/metadata');
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to fetch metadata');
      }
      const data = await res.json();
      const tables: MetabaseTableMeta[] = (data.tables || [])
        .filter((t: Record<string, unknown>) => t.visibility_type !== 'hidden')
        .map((t: Record<string, unknown>) => ({
          id: t.id,
          name: t.name,
          display_name: t.display_name || t.name,
          schema: t.schema || 'public',
          fields: ((t.fields as Array<Record<string, unknown>>) || [])
            .filter((f) => f.visibility_type !== 'retired')
            .map((f) => ({
              id: f.id,
              name: f.name,
              display_name: f.display_name || f.name,
              database_type: f.database_type || 'unknown',
              base_type: f.base_type || 'type/Unknown',
              semantic_type: f.semantic_type || null,
              table_id: f.table_id,
            })),
        }))
        .sort((a: MetabaseTableMeta, b: MetabaseTableMeta) =>
          (`${a.schema}.${a.name}`).localeCompare(`${b.schema}.${b.name}`)
        );
      return tables;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes — schema rarely changes
  });
}

/** Execute an ad-hoc dataset query and get parsed results */
export function useMetabaseDataset() {
  return useMutation({
    mutationFn: async (request: DatasetRequest): Promise<MetabaseQueryResult> => {
      const res = await fetch('/api/metabase/dataset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to run query');
      }
      const raw: Record<string, unknown>[] = await res.json();
      return parseQueryResult(raw);
    },
  });
}
