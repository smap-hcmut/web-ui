/**
 * GET /api/analytics/platforms?campaignId=xxx
 *
 * Returns per-platform breakdown:
 * - mentions, engagement, sentiment, reach per platform
 * - 12-month time-series mentions per platform
 * - Radar chart data (5 axes per platform)
 */

import { NextRequest, NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { getProjectIdsForCampaign, projectFilter } from '@/lib/db/queries';

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toFixed(0);
}

interface PlatformStat {
  platform: string;
  name: string;
  mentions: number;
  mentionsChange: number;
  engagement: string;
  engagementRaw: number;
  sentiment: number;
  reach: number;
  status: 'active' | 'inactive';
  color: string;
}

interface PlatformTimeSeries {
  label: string;
  data: number[];
  color: string;
}

const platformMeta: Record<string, { name: string; color: string; chartColor: string }> = {
  TIKTOK: { name: 'TikTok', color: 'var(--platform-tiktok)', chartColor: 'var(--chart-1)' },
  FACEBOOK: { name: 'Facebook', color: '#1877f2', chartColor: 'var(--chart-2)' },
  YOUTUBE: { name: 'YouTube', color: '#ff0000', chartColor: 'var(--chart-3)' },
};

export async function GET(request: NextRequest) {
  try {
    const campaignId = request.nextUrl.searchParams.get('campaignId');
    if (!campaignId) {
      return NextResponse.json({ error: 'campaignId is required' }, { status: 400 });
    }

    const projectIds = await getProjectIdsForCampaign(campaignId);
    if (projectIds.length === 0) {
      return NextResponse.json({ stats: [], timeSeries: [], months: [] });
    }

    const pf = projectFilter(projectIds);

    // Per-platform aggregation
    const platformRows = await db.execute<{
      platform: string;
      mentions: string;
      avg_sentiment: string;
      sum_engagement: string;
      sum_reach: string;
    }>(sql`
      SELECT
        UPPER(platform) AS platform,
        COUNT(*)::text AS mentions,
        COALESCE(AVG(overall_sentiment_score) * 100, 0)::text AS avg_sentiment,
        COALESCE(SUM(engagement_score), 0)::text AS sum_engagement,
        COALESCE(SUM(reach_estimate), 0)::text AS sum_reach
      FROM analysis.post_insight
      WHERE ${pf} AND platform IS NOT NULL
      GROUP BY UPPER(platform)
      ORDER BY COUNT(*) DESC
    `);

    // Per-platform change% (current vs previous 30 days)
    const changeRows = await db.execute<{
      platform: string;
      period: string;
      mentions: string;
    }>(sql`
      SELECT
        UPPER(platform) AS platform,
        CASE
          WHEN content_created_at >= NOW() - INTERVAL '30 days' THEN 'current'
          WHEN content_created_at >= NOW() - INTERVAL '60 days' THEN 'previous'
        END AS period,
        COUNT(*)::text AS mentions
      FROM analysis.post_insight
      WHERE ${pf}
        AND platform IS NOT NULL
        AND content_created_at >= NOW() - INTERVAL '60 days'
      GROUP BY 1, 2
    `);

    const changeMap = new Map<string, { current: number; previous: number }>();
    for (const row of changeRows.rows) {
      const key = row.platform;
      if (!changeMap.has(key)) changeMap.set(key, { current: 0, previous: 0 });
      const entry = changeMap.get(key)!;
      if (row.period === 'current') entry.current = Number(row.mentions);
      if (row.period === 'previous') entry.previous = Number(row.mentions);
    }

    const stats: PlatformStat[] = platformRows.rows.map((r) => {
      const meta = platformMeta[r.platform] || { name: r.platform, color: '#888', chartColor: '#888' };
      const change = changeMap.get(r.platform) || { current: 0, previous: 0 };
      const mentionsChange = change.previous > 0
        ? Number((((change.current - change.previous) / change.previous) * 100).toFixed(1))
        : 0;
      const engRaw = Number(r.sum_engagement);

      return {
        platform: r.platform.toLowerCase(),
        name: meta.name,
        mentions: Number(r.mentions),
        mentionsChange,
        engagement: fmt(engRaw),
        engagementRaw: engRaw,
        sentiment: Number(Number(r.avg_sentiment).toFixed(0)),
        reach: Number(r.sum_reach),
        status: 'active' as const,
        color: meta.color,
      };
    });

    // Ensure all 3 platforms are represented
    for (const [key, meta] of Object.entries(platformMeta)) {
      if (!stats.find((s) => s.platform === key.toLowerCase())) {
        stats.push({
          platform: key.toLowerCase(),
          name: meta.name,
          mentions: 0,
          mentionsChange: 0,
          engagement: '0',
          engagementRaw: 0,
          sentiment: 0,
          reach: 0,
          status: 'inactive',
          color: meta.color,
        });
      }
    }

    // 12-month time-series per platform
    const tsRows = await db.execute<{
      month: string;
      platform: string;
      mentions: string;
    }>(sql`
      SELECT
        TO_CHAR(date_trunc('month', content_created_at), 'YYYY-MM') AS month,
        UPPER(platform) AS platform,
        COUNT(*)::text AS mentions
      FROM analysis.post_insight
      WHERE ${pf}
        AND platform IS NOT NULL
        AND content_created_at >= NOW() - INTERVAL '12 months'
      GROUP BY 1, 2
      ORDER BY 1
    `);

    // Build month labels and series
    const monthSet = new Set<string>();
    tsRows.rows.forEach((r) => monthSet.add(r.month));
    const months = Array.from(monthSet).sort();

    const timeSeries: PlatformTimeSeries[] = Object.entries(platformMeta).map(([key, meta]) => ({
      label: meta.name,
      color: meta.chartColor,
      data: months.map((m) => {
        const row = tsRows.rows.find((r) => r.month === m && r.platform === key);
        return row ? Number(row.mentions) : 0;
      }),
    }));

    return NextResponse.json({ stats, timeSeries, months });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[analytics/platforms]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
