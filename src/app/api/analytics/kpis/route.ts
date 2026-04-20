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
import {
  queryNative,
  getProjectIdsForCampaign,
  projectFilter,
  fmtNumber,
  percentChange,
} from '@/lib/metabase/client';

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
    const totals = await queryNative<{
      total_mentions: number;
      avg_sentiment: number;
      sum_engagement: number;
      sum_reach: number;
      sum_views: number;
      sum_likes: number;
      sum_comments: number;
      sum_shares: number;
    }>(`
      SELECT
        COUNT(*) AS total_mentions,
        COALESCE(AVG(overall_sentiment_score) * 100, 0) AS avg_sentiment,
        COALESCE(SUM(engagement_score), 0) AS sum_engagement,
        COALESCE(SUM(reach_estimate), 0) AS sum_reach,
        COALESCE(SUM((uap_metadata->'engagement'->>'views')::bigint), 0) AS sum_views,
        COALESCE(SUM((uap_metadata->'engagement'->>'likes')::bigint), 0) AS sum_likes,
        COALESCE(SUM((uap_metadata->'engagement'->>'comments')::bigint), 0) AS sum_comments,
        COALESCE(SUM((uap_metadata->'engagement'->>'shares')::bigint), 0) AS sum_shares
      FROM analysis.post_insight
      WHERE ${pf}
    `);

    const t = totals[0];

    // Previous 30 days vs current 30 days for change%
    const periods = await queryNative<{
      period: string;
      mentions: number;
      sentiment: number;
      engagement: number;
      reach: number;
    }>(`
      SELECT
        CASE
          WHEN content_created_at >= NOW() - INTERVAL '30 days' THEN 'current'
          WHEN content_created_at >= NOW() - INTERVAL '60 days' THEN 'previous'
        END AS period,
        COUNT(*) AS mentions,
        COALESCE(AVG(overall_sentiment_score) * 100, 0) AS sentiment,
        COALESCE(SUM(engagement_score), 0) AS engagement,
        COALESCE(SUM(reach_estimate), 0) AS reach
      FROM analysis.post_insight
      WHERE ${pf}
        AND content_created_at >= NOW() - INTERVAL '60 days'
      GROUP BY 1
    `);

    const current = periods.find((r) => r.period === 'current');
    const previous = periods.find((r) => r.period === 'previous');

    const mentionsChange = percentChange(Number(current?.mentions || 0), Number(previous?.mentions || 0));
    const sentimentChange = percentChange(Number(current?.sentiment || 0), Number(previous?.sentiment || 0));
    const engagementChange = percentChange(Number(current?.engagement || 0), Number(previous?.engagement || 0));
    const reachChange = percentChange(Number(current?.reach || 0), Number(previous?.reach || 0));

    // 12-point sparkline (monthly, last 12 months)
    const sparkRows = await queryNative<{
      month: string;
      mentions: number;
      sentiment: number;
      engagement: number;
      reach: number;
    }>(`
      SELECT
        TO_CHAR(date_trunc('month', content_created_at), 'YYYY-MM') AS month,
        COUNT(*) AS mentions,
        COALESCE(AVG(overall_sentiment_score) * 100, 0) AS sentiment,
        COALESCE(SUM(engagement_score), 0) AS engagement,
        COALESCE(SUM(reach_estimate), 0) AS reach
      FROM analysis.post_insight
      WHERE ${pf}
        AND content_created_at >= NOW() - INTERVAL '12 months'
      GROUP BY 1
      ORDER BY 1
    `);

    const totalMentions = Number(t.total_mentions);
    const avgSentiment = Number(Number(t.avg_sentiment).toFixed(1));
    const sumEngagement = Number(t.sum_engagement);
    const sumReach = Number(t.sum_reach);

    const response: KPIsResponse = {
      metrics: [
        {
          label: 'Total Mentions',
          value: totalMentions,
          formatted: fmtNumber(totalMentions),
          change: mentionsChange,
          sparkline: sparkRows.map((r) => Number(r.mentions)),
          icon: 'activity',
        },
        {
          label: 'Sentiment Score',
          value: avgSentiment,
          formatted: `${avgSentiment}%`,
          change: sentimentChange,
          sparkline: sparkRows.map((r) => Number(r.sentiment)),
          icon: 'smile',
          suffix: '%',
        },
        {
          label: 'Engagement',
          value: sumEngagement,
          formatted: fmtNumber(sumEngagement),
          change: engagementChange,
          sparkline: sparkRows.map((r) => Number(r.engagement)),
          icon: 'heart',
        },
        {
          label: 'Audience Reach',
          value: sumReach,
          formatted: fmtNumber(sumReach),
          change: reachChange,
          sparkline: sparkRows.map((r) => Number(r.reach)),
          icon: 'users',
        },
      ],
      engagement: {
        views: Number(t.sum_views),
        likes: Number(t.sum_likes),
        comments: Number(t.sum_comments),
        shares: Number(t.sum_shares),
      },
    };

    return NextResponse.json(response);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[analytics/kpis]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
