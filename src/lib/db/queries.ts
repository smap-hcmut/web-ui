/**
 * Shared Analytics Query Helpers
 *
 * Reusable SQL fragments and utilities for /api/analytics/* routes.
 */

import { sql } from 'drizzle-orm';
import { db } from './index';

/** Get all project IDs belonging to a campaign (excluding soft-deleted) */
export async function getProjectIdsForCampaign(campaignId: string): Promise<string[]> {
  const rows = await db.execute<{ id: string }>(sql`
    SELECT id::text FROM project.projects
    WHERE campaign_id = ${campaignId}
      AND deleted_at IS NULL
  `);
  return rows.rows.map((r) => r.id);
}

/**
 * Build a SQL fragment for filtering post_insight by project IDs.
 * If projectIds is empty, the condition will match nothing.
 */
export function projectFilter(projectIds: string[]) {
  if (projectIds.length === 0) {
    return sql`1 = 0`; // match nothing
  }
  return sql`project_id = ANY(${projectIds})`;
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
