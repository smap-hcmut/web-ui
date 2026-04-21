/**
 * GET /api/analytics/heap?campaignId=xxx
 *
 * Returns hierarchical data for HeapSpace bubble visualization:
 * campaign → project → keyword → (aggregated post metrics)
 *
 * Each node has: name, type, metrics (mentions, engagement, sentiment, childCount)
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  queryNative,
  getProjectIdsForCampaign,
  projectFilter,
} from '@/lib/metabase/client';
import { IS_MOCK, mockHeap } from '@/lib/mock';

interface HeapNode {
  id: string;
  type: 'campaign' | 'project' | 'keyword';
  name: string;
  platform?: string;
  metrics: {
    mentions: number;
    engagement: number;
    sentiment: number;
    childCount: number;
  };
  children?: HeapNode[];
}

export async function GET(request: NextRequest) {
  try {
    const campaignId = request.nextUrl.searchParams.get('campaignId');
    if (!campaignId) {
      return NextResponse.json({ error: 'campaignId is required' }, { status: 400 });
    }

    if (IS_MOCK) return NextResponse.json(mockHeap);

    const projectIds = await getProjectIdsForCampaign(campaignId);
    if (projectIds.length === 0) {
      return NextResponse.json({ tree: null });
    }

    const pf = projectFilter(projectIds);

    // Get campaign name
    const campRows = await queryNative<{ name: string }>(`
      SELECT name FROM project.campaigns WHERE id = '${campaignId}'
    `);
    const campRow = campRows[0];

    // Get projects info
    const projectRows = await queryNative<{
      id: string;
      name: string;
    }>(`
      SELECT id::text, name
      FROM project.projects
      WHERE campaign_id = '${campaignId}' AND deleted_at IS NULL
    `);

    // Per-project aggregations
    const projStats = await queryNative<{
      project_id: string;
      mentions: number;
      avg_sentiment: number;
      sum_engagement: number;
    }>(`
      SELECT
        project_id,
        COUNT(*) AS mentions,
        COALESCE(AVG(overall_sentiment_score) * 100, 0) AS avg_sentiment,
        COALESCE(SUM(engagement_score), 0) AS sum_engagement
      FROM analysis.post_insight
      WHERE ${pf}
      GROUP BY project_id
    `);

    const projStatsMap = new Map(
      projStats.map((r) => [r.project_id, r]),
    );

    // Per-keyword per-project (top 10 per project for performance)
    const kwRows = await queryNative<{
      project_id: string;
      keyword: string;
      volume: number;
      avg_sentiment: number;
      sum_engagement: number;
    }>(`
      WITH ranked AS (
        SELECT
          project_id,
          kw AS keyword,
          COUNT(*) AS volume,
          AVG(overall_sentiment_score) * 100 AS avg_sentiment,
          SUM(engagement_score) AS sum_engagement,
          ROW_NUMBER() OVER (PARTITION BY project_id ORDER BY COUNT(*) DESC) AS rn
        FROM analysis.post_insight,
             LATERAL unnest(keywords) AS kw
        WHERE ${pf}
          AND keywords IS NOT NULL
          AND array_length(keywords, 1) > 0
        GROUP BY project_id, kw
      )
      SELECT
        project_id,
        keyword,
        volume,
        COALESCE(avg_sentiment, 0) AS avg_sentiment,
        COALESCE(sum_engagement, 0) AS sum_engagement
      FROM ranked
      WHERE rn <= 10
      ORDER BY project_id, volume DESC
    `);

    // Build keyword children per project
    const kwByProject = new Map<string, HeapNode[]>();
    for (const r of kwRows) {
      if (!kwByProject.has(r.project_id)) kwByProject.set(r.project_id, []);
      kwByProject.get(r.project_id)!.push({
        id: `kw-${r.project_id}-${r.keyword}`,
        type: 'keyword',
        name: r.keyword,
        metrics: {
          mentions: Number(r.volume),
          engagement: Number(r.sum_engagement),
          sentiment: Number(Number(r.avg_sentiment).toFixed(0)),
          childCount: 0,
        },
      });
    }

    // Build project children
    const projectChildren: HeapNode[] = projectRows.map((p) => {
      const stats = projStatsMap.get(p.id);
      const kwChildren = kwByProject.get(p.id) || [];

      return {
        id: `proj-${p.id}`,
        type: 'project' as const,
        name: p.name,
        metrics: {
          mentions: stats ? Number(stats.mentions) : 0,
          engagement: stats ? Number(stats.sum_engagement) : 0,
          sentiment: stats ? Number(Number(stats.avg_sentiment).toFixed(0)) : 0,
          childCount: kwChildren.length,
        },
        children: kwChildren,
      };
    });

    // Build root campaign node
    const totalMentions = projectChildren.reduce((s, p) => s + p.metrics.mentions, 0);
    const totalEngagement = projectChildren.reduce((s, p) => s + p.metrics.engagement, 0);
    const avgSentiment = projectChildren.length > 0
      ? Math.round(projectChildren.reduce((s, p) => s + p.metrics.sentiment, 0) / projectChildren.length)
      : 0;

    const tree: HeapNode = {
      id: `camp-${campaignId}`,
      type: 'campaign',
      name: campRow?.name || 'Campaign',
      metrics: {
        mentions: totalMentions,
        engagement: totalEngagement,
        sentiment: avgSentiment,
        childCount: projectChildren.length,
      },
      children: projectChildren,
    };

    return NextResponse.json({ tree });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[analytics/heap]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
