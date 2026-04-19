/**
 * GET /api/analytics/kpis?campaignId=xxx
 *
 * Returns 4 KPI metrics for a campaign:
 * - Total Mentions (count)
 * - Sentiment Score (avg 0-100)
 * - Engagement (sum from uap_metadata)
 * - Audience Reach (sum reach_estimate)
 *
 * Each KPI includes: value, change%, 12-point sparkline
 * Also returns engagement breakdown: views, likes, comments, shares
 */

import { NextRequest, NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { getProjectIdsForCampaign, projectFilter, percentChange } from '@/lib/db/queries';

interface KPIMetric {
  label: string;
  value: number;
  formatted: string;
  change: number;
  sparkline: number[];
  icon: string;
  suffix?: string;
}

interface KPIsResponse {
  metrics: KPIMetric[];
  engagement: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
  };
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toFixed(0);
}

export async function GET(request: NextRequest) {
  try {
    const campaignId = request.nextUrl.searchParams.get('campaignId');
    if (!campaignId) {
      return NextResponse.json({ error: 'campaignId is required' }, { status: 400 });
    }

    const projectIds = await getProjectIdsForCampaign(campaignId);
    if (projectIds.length === 0) {
      const empty: KPIsResponse = {
        metrics: [
          { label: 'Total Mentions', value: 0, formatted: '0', change: 0, sparkline: [], icon: 'activity' },
          { label: 'Sentiment Score', value: 0, formatted: '0%', change: 0, sparkline: [], icon: 'smile', suffix: '%' },
          { label: 'Engagement', value: 0, formatted: '0', change: 0, sparkline: [], icon: 'heart' },
          { label: 'Audience Reach', value: 0, formatted: '0', change: 0, sparkline: [], icon: 'users' },
        ],
        engagement: { views: 0, likes: 0, comments: 0, shares: 0 },
      };
      return NextResponse.json(empty);
    }

    const pf = projectFilter(projectIds);

    // Current period totals
    const [totals] = await db.execute<{
      total_mentions: string;
      avg_sentiment: string;
      sum_engagement: string;
      sum_reach: string;
      sum_views: string;
      sum_likes: string;
      sum_comments: string;
      sum_shares: string;
    }>(sql`
      SELECT
        COUNT(*)::text AS total_mentions,
        COALESCE(AVG(overall_sentiment_score) * 100, 0)::text AS avg_sentiment,
        COALESCE(SUM(engagement_score), 0)::text AS sum_engagement,
        COALESCE(SUM(reach_estimate), 0)::text AS sum_reach,
        COALESCE(SUM((uap_metadata->'engagement'->>'views')::bigint), 0)::text AS sum_views,
        COALESCE(SUM((uap_metadata->'engagement'->>'likes')::bigint), 0)::text AS sum_likes,
        COALESCE(SUM((uap_metadata->'engagement'->>'comments')::bigint), 0)::text AS sum_comments,
        COALESCE(SUM((uap_metadata->'engagement'->>'shares')::bigint), 0)::text AS sum_shares
      FROM analysis.post_insight
      WHERE ${pf}
    `).then((r) => [r.rows[0]]);

    // Previous 30 days vs current 30 days for change%
    const periods = await db.execute<{
      period: string;
      mentions: string;
      sentiment: string;
      engagement: string;
      reach: string;
    }>(sql`
      SELECT
        CASE
          WHEN content_created_at >= NOW() - INTERVAL '30 days' THEN 'current'
          WHEN content_created_at >= NOW() - INTERVAL '60 days' THEN 'previous'
        END AS period,
        COUNT(*)::text AS mentions,
        COALESCE(AVG(overall_sentiment_score) * 100, 0)::text AS sentiment,
        COALESCE(SUM(engagement_score), 0)::text AS engagement,
        COALESCE(SUM(reach_estimate), 0)::text AS reach
      FROM analysis.post_insight
      WHERE ${pf}
        AND content_created_at >= NOW() - INTERVAL '60 days'
      GROUP BY 1
    `);

    const current = periods.rows.find((r) => r.period === 'current');
    const previous = periods.rows.find((r) => r.period === 'previous');

    const mentionsChange = percentChange(
      Number(current?.mentions || 0),
      Number(previous?.mentions || 0),
    );
    const sentimentChange = percentChange(
      Number(current?.sentiment || 0),
      Number(previous?.sentiment || 0),
    );
    const engagementChange = percentChange(
      Number(current?.engagement || 0),
      Number(previous?.engagement || 0),
    );
    const reachChange = percentChange(
      Number(current?.reach || 0),
      Number(previous?.reach || 0),
    );

    // 12-point sparkline (monthly, last 12 months)
    const sparkRows = await db.execute<{
      month: string;
      mentions: string;
      sentiment: string;
      engagement: string;
      reach: string;
    }>(sql`
      SELECT
        TO_CHAR(date_trunc('month', content_created_at), 'YYYY-MM') AS month,
        COUNT(*)::text AS mentions,
        COALESCE(AVG(overall_sentiment_score) * 100, 0)::text AS sentiment,
        COALESCE(SUM(engagement_score), 0)::text AS engagement,
        COALESCE(SUM(reach_estimate), 0)::text AS reach
      FROM analysis.post_insight
      WHERE ${pf}
        AND content_created_at >= NOW() - INTERVAL '12 months'
      GROUP BY 1
      ORDER BY 1
    `);

    const mentionsSparkline = sparkRows.rows.map((r) => Number(r.mentions));
    const sentimentSparkline = sparkRows.rows.map((r) => Number(r.sentiment));
    const engagementSparkline = sparkRows.rows.map((r) => Number(r.engagement));
    const reachSparkline = sparkRows.rows.map((r) => Number(r.reach));

    const totalMentions = Number(totals.total_mentions);
    const avgSentiment = Number(Number(totals.avg_sentiment).toFixed(1));
    const sumEngagement = Number(totals.sum_engagement);
    const sumReach = Number(totals.sum_reach);

    const response: KPIsResponse = {
      metrics: [
        {
          label: 'Total Mentions',
          value: totalMentions,
          formatted: fmt(totalMentions),
          change: mentionsChange,
          sparkline: mentionsSparkline,
          icon: 'activity',
        },
        {
          label: 'Sentiment Score',
          value: avgSentiment,
          formatted: `${avgSentiment}%`,
          change: sentimentChange,
          sparkline: sentimentSparkline,
          icon: 'smile',
          suffix: '%',
        },
        {
          label: 'Engagement',
          value: sumEngagement,
          formatted: fmt(sumEngagement),
          change: engagementChange,
          sparkline: engagementSparkline,
          icon: 'heart',
        },
        {
          label: 'Audience Reach',
          value: sumReach,
          formatted: fmt(sumReach),
          change: reachChange,
          sparkline: reachSparkline,
          icon: 'users',
        },
      ],
      engagement: {
        views: Number(totals.sum_views),
        likes: Number(totals.sum_likes),
        comments: Number(totals.sum_comments),
        shares: Number(totals.sum_shares),
      },
    };

    return NextResponse.json(response);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[analytics/kpis]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
