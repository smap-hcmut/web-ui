/**
 * GET /api/analytics/project-stats?campaignId=xxx
 *
 * Returns per-project analytics for all projects in a campaign:
 * - mentions (count)
 * - avgSentiment (0-100)
 * - platforms (distinct list)
 *
 * Used by ProjectCardsRow to populate flip cards with real data.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  queryNative,
  getProjectIdsForCampaign,
  projectFilter,
} from '@/lib/metabase/client';
import { IS_MOCK, mockProjectStats } from '@/lib/mock';

export interface ProjectStat {
  project_id: string;
  mentions: number;
  avg_sentiment: number;
  platforms: string[];
}

export async function GET(request: NextRequest) {
  try {
    const campaignId = request.nextUrl.searchParams.get('campaignId');
    if (!campaignId) {
      return NextResponse.json({ error: 'campaignId is required' }, { status: 400 });
    }

    if (IS_MOCK) return NextResponse.json(mockProjectStats);

    const projectIds = await getProjectIdsForCampaign(campaignId);
    if (projectIds.length === 0) {
      return NextResponse.json({ stats: [] });
    }

    const pf = projectFilter(projectIds);

    const rows = await queryNative<{
      project_id: string;
      mentions: number;
      avg_sentiment: number;
      platforms: string;
    }>(`
      SELECT
        project_id::text AS project_id,
        COUNT(*) AS mentions,
        COALESCE(AVG(overall_sentiment_score) * 100, 0) AS avg_sentiment,
        STRING_AGG(DISTINCT platform, ',' ORDER BY platform) AS platforms
      FROM analysis.post_insight
      WHERE ${pf}
      GROUP BY project_id
    `);

    const stats: ProjectStat[] = rows.map((r) => ({
      project_id: r.project_id,
      mentions: Number(r.mentions),
      avg_sentiment: Number(Number(r.avg_sentiment).toFixed(1)),
      platforms: r.platforms ? r.platforms.split(',').filter(Boolean) : [],
    }));

    return NextResponse.json({ stats });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[analytics/project-stats]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
