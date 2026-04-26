/**
 * Metabase API Client (Server-side only)
 *
 * Shared session management and query execution for analytics routes.
 * Uses Metabase native query API instead of direct PostgreSQL connection.
 *
 * Flow: Next.js API route → Metabase HTTP API → PostgreSQL
 */

import { API_CONFIG } from '@/lib/api/config';

// ── Session Management (singleton, survives hot-reload) ────────────────────

interface CachedSession {
  id: string;
  expiresAt: number;
}

interface CachedCampaignProjects {
  value: string[];
  expiresAt: number;
}

const globalForMb = globalThis as unknown as {
  mbSession: CachedSession | null;
  mbCampaignProjects?: Record<string, CachedCampaignProjects>;
};

const CAMPAIGN_PROJECTS_TTL_MS = 5 * 60 * 1000;

async function getSession(): Promise<string> {
  if (globalForMb.mbSession && Date.now() < globalForMb.mbSession.expiresAt) {
    return globalForMb.mbSession.id;
  }

  const username = process.env.METABASE_USERNAME || 'api-service@smap.dev';
  const password = process.env.METABASE_PASSWORD || 'SmapApi@2026!!';

  const res = await fetch(`${API_CONFIG.METABASE.URL}/api/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Metabase auth failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  globalForMb.mbSession = {
    id: data.id,
    expiresAt: Date.now() + 13 * 24 * 60 * 60 * 1000, // 13 days
  };
  return data.id;
}

function invalidateSession() {
  globalForMb.mbSession = null;
}

// ── Query Execution ────────────────────────────────────────────────────────

interface MetabaseColumn {
  name: string;
  display_name: string;
  base_type: string;
}

interface MetabaseDatasetResponse {
  data: {
    rows: unknown[][];
    cols: MetabaseColumn[];
    native_form?: { query: string };
  };
  status: string;
  error?: string;
}

/**
 * Execute a native SQL query against the SMAP Database via Metabase API.
 * Returns rows as an array of objects keyed by column name.
 */
export async function queryNative<T extends Record<string, unknown>>(
  sqlQuery: string,
): Promise<T[]> {
  const sessionId = await getSession();

  const payload = {
    database: 2, // SMAP Database
    type: 'native' as const,
    native: { query: sqlQuery },
  };

  let res = await fetch(`${API_CONFIG.METABASE.URL}/api/dataset`, {
    method: 'POST',
    headers: {
      'X-Metabase-Session': sessionId,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  // Retry on 401 (session expired)
  if (res.status === 401) {
    invalidateSession();
    const newSession = await getSession();
    res = await fetch(`${API_CONFIG.METABASE.URL}/api/dataset`, {
      method: 'POST',
      headers: {
        'X-Metabase-Session': newSession,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Metabase query failed (${res.status}): ${text}`);
  }

  const result: MetabaseDatasetResponse = await res.json();

  if (result.status !== 'completed') {
    throw new Error(`Metabase query error: ${result.error || result.status}`);
  }

  // Transform array-of-arrays → array-of-objects
  const cols = result.data.cols.map((c) => c.name);
  return result.data.rows.map((row) => {
    const obj: Record<string, unknown> = {};
    cols.forEach((col, i) => {
      obj[col] = row[i];
    });
    return obj as T;
  });
}

// ── Generic Metabase API Fetch (for proxy routes) ─────────────────────────

/**
 * Fetch any Metabase API endpoint with automatic session management and 401 retry.
 * Use this for non-native-query endpoints (cards, metadata, dataset structured queries).
 *
 * @param path - API path (e.g. '/api/card', '/api/database/2/metadata')
 * @param init - Standard RequestInit (method, body, extra headers, etc.)
 * @returns The raw Response object
 */
export async function fetchMetabase(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const sessionId = await getSession();
  const url = `${API_CONFIG.METABASE.URL}${path}`;

  const headers: Record<string, string> = {
    'X-Metabase-Session': sessionId,
    ...(init?.headers as Record<string, string> || {}),
  };

  let res = await fetch(url, { ...init, headers });

  // Retry on 401 (session expired)
  if (res.status === 401) {
    invalidateSession();
    const newSession = await getSession();
    headers['X-Metabase-Session'] = newSession;
    res = await fetch(url, { ...init, headers });
  }

  return res;
}

// ── Query Helpers ──────────────────────────────────────────────────────────

/** Validate UUID format to prevent SQL injection */
function isUUID(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

/** Escape a string for safe SQL interpolation (single quotes) */
function escapeSQL(s: string): string {
  return s.replace(/'/g, "''");
}

/**
 * Get all project IDs belonging to a campaign (excluding soft-deleted).
 */
export async function getProjectIdsForCampaign(campaignId: string): Promise<string[]> {
  if (!isUUID(campaignId)) return [];

  const cached = globalForMb.mbCampaignProjects?.[campaignId];
  if (cached && Date.now() < cached.expiresAt) {
    return cached.value;
  }

  const rows = await queryNative<{ id: string }>(`
    SELECT id::text FROM project.projects
    WHERE campaign_id = '${campaignId}'
      AND deleted_at IS NULL
  `);
  const projectIds = rows.map((r) => r.id);
  globalForMb.mbCampaignProjects = {
    ...(globalForMb.mbCampaignProjects || {}),
    [campaignId]: {
      value: projectIds,
      expiresAt: Date.now() + CAMPAIGN_PROJECTS_TTL_MS,
    },
  };
  return projectIds;
}

/**
 * Build a SQL WHERE fragment for filtering by project IDs.
 * Returns '1 = 0' if empty (match nothing).
 */
export function projectFilter(projectIds: string[]): string {
  if (projectIds.length === 0) return '1 = 0';

  // Validate all IDs are UUIDs
  const valid = projectIds.filter(isUUID);
  if (valid.length === 0) return '1 = 0';

  const quoted = valid.map((id) => `'${escapeSQL(id)}'`).join(', ');
  return `project_id IN (${quoted})`;
}

/**
 * Build a reusable CTE that keeps only the latest snapshot row per canonical post key.
 * Canonical key: platform + durable source key.
 *
 * NOTE: Do not include timestamps in the partition key. Older campaigns can have
 * multiple snapshot rows for the same logical post with different ingest/content
 * timestamps; including time in the key prevents deduplication.
 */
export function latestPostInsightCTE(projectIds: string[]): string {
  const pf = projectFilter(projectIds);

  return `
WITH latest_post_insight AS (
  SELECT *
  FROM (
    SELECT
      pi.*,
      ROW_NUMBER() OVER (
        PARTITION BY
          COALESCE(NULLIF(UPPER(pi.platform), ''), 'UNKNOWN'),
          COALESCE(
            NULLIF(pi.source_id, ''),
            NULLIF(pi.uap_metadata->>'post_id', ''),
            NULLIF(pi.uap_metadata->>'comment_id', ''),
            NULLIF(pi.uap_metadata->>'video_id', ''),
            NULLIF(pi.uap_metadata->>'url', ''),
            MD5(CONCAT_WS(
              '|',
              COALESCE(NULLIF(LOWER(pi.uap_metadata->>'author_username'), ''), 'unknown'),
              COALESCE(NULLIF(pi.content, ''), '__empty__')
            ))
          )
        ORDER BY
          COALESCE(pi.updated_at, pi.analyzed_at, pi.ingested_at, pi.created_at) DESC NULLS LAST,
          pi.created_at DESC NULLS LAST,
          pi.id DESC
      ) AS snapshot_rank
    FROM analysis.post_insight pi
    WHERE ${pf}
  ) ranked
  WHERE snapshot_rank = 1
)
`;
}

/**
 * Build a campaign-level deduped relation for analytics routes.
 *
 * This sits on top of latest snapshot dedupe and collapses repeated rows that
 * represent the same logical post/comment content on the same platform by the
 * same author. Campaign dashboards should read from this relation so every
 * route reports on the same population.
 */
export function dedupedPostInsightCTE(projectIds: string[]): string {
  const latestCTE = latestPostInsightCTE(projectIds);

  return `${latestCTE}, deduped_post_insight AS (
  SELECT *
  FROM (
    SELECT
      lpi.*,
      ROW_NUMBER() OVER (
        PARTITION BY
          COALESCE(NULLIF(UPPER(lpi.platform), ''), 'UNKNOWN'),
          COALESCE(
            NULLIF(LOWER(lpi.uap_metadata->>'author_username'), ''),
            NULLIF(LOWER(lpi.uap_metadata->>'author_display_name'), ''),
            'unknown'
          ),
          COALESCE(
            NULLIF(TRIM(REGEXP_REPLACE(COALESCE(lpi.content, ''), '\\s+', ' ', 'g')), ''),
            NULLIF(lpi.source_id, ''),
            NULLIF(lpi.uap_metadata->>'post_id', ''),
            NULLIF(lpi.uap_metadata->>'comment_id', ''),
            NULLIF(lpi.uap_metadata->>'video_id', ''),
            NULLIF(lpi.uap_metadata->>'url', ''),
            lpi.id::text
          )
        ORDER BY
          COALESCE(lpi.updated_at, lpi.analyzed_at, lpi.ingested_at, lpi.created_at) DESC NULLS LAST,
          lpi.created_at DESC NULLS LAST,
          lpi.id DESC
      ) AS display_rank
    FROM latest_post_insight lpi
  ) ranked
  WHERE display_rank = 1
)
`;
}

/** Format large numbers for display */
export function fmtNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toFixed(0);
}

/** Calculate percentage change between two values */
export function percentChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Number((((current - previous) / previous) * 100).toFixed(1));
}
