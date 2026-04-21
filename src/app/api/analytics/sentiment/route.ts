/**
 * GET /api/analytics/sentiment?campaignId=xxx
 *
 * Returns sentiment analysis data:
 * - Donut: positive/neutral/negative counts
 * - Timeline: monthly sentiment by platform (12 months)
 * - Pulse: overall average sentiment score (0-100)
 * - Distribution: histogram of sentiment scores
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  queryNative,
  getProjectIdsForCampaign,
  projectFilter,
} from '@/lib/metabase/client';
import { IS_MOCK, mockSentiment } from '@/lib/mock';

export async function GET(request: NextRequest) {
  try {
    const campaignId = request.nextUrl.searchParams.get('campaignId');
    if (!campaignId) {
      return NextResponse.json({ error: 'campaignId is required' }, { status: 400 });
    }

    if (IS_MOCK) return NextResponse.json(mockSentiment);

    const projectIds = await getProjectIdsForCampaign(campaignId);
    if (projectIds.length === 0) {
      return NextResponse.json({
        donut: [
          { label: 'Positive', value: 0, color: 'var(--success)' },
          { label: 'Neutral', value: 0, color: 'var(--warning)' },
          { label: 'Negative', value: 0, color: 'var(--danger)' },
        ],
        timeline: [],
        months: [],
        pulse: 0,
        total: 0,
      });
    }

    const pf = projectFilter(projectIds);

    // Donut: positive/neutral/negative counts
    const sentimentCounts = await queryNative<{
      category: string;
      count: number;
    }>(`
      SELECT
        CASE
          WHEN overall_sentiment_score >= 0.7 THEN 'Positive'
          WHEN overall_sentiment_score >= 0.4 THEN 'Neutral'
          ELSE 'Negative'
        END AS category,
        COUNT(*) AS count
      FROM analysis.post_insight
      WHERE ${pf} AND overall_sentiment_score IS NOT NULL
      GROUP BY 1
    `);

    const donutMap: Record<string, number> = { Positive: 0, Neutral: 0, Negative: 0 };
    for (const row of sentimentCounts) {
      donutMap[row.category] = Number(row.count);
    }
    const donut = [
      { label: 'Positive', value: donutMap.Positive || 1, color: 'var(--success)' },
      { label: 'Neutral', value: donutMap.Neutral || 1, color: 'var(--warning)' },
      { label: 'Negative', value: donutMap.Negative || 1, color: 'var(--danger)' },
    ];

    // Overall pulse (average sentiment 0-100)
    const pulseRows = await queryNative<{
      avg_sentiment: number;
      total: number;
    }>(`
      SELECT
        COALESCE(AVG(overall_sentiment_score) * 100, 0) AS avg_sentiment,
        COUNT(*) AS total
      FROM analysis.post_insight
      WHERE ${pf}
    `);

    const pulseRow = pulseRows[0];

    // Timeline: monthly sentiment by platform (12 months)
    const tlRows = await queryNative<{
      month: string;
      platform: string;
      avg_sentiment: number;
    }>(`
      SELECT
        TO_CHAR(date_trunc('month', content_created_at), 'YYYY-MM') AS month,
        UPPER(platform) AS platform,
        COALESCE(AVG(overall_sentiment_score) * 100, 0) AS avg_sentiment
      FROM analysis.post_insight
      WHERE ${pf}
        AND platform IS NOT NULL
        AND content_created_at >= NOW() - INTERVAL '12 months'
      GROUP BY 1, 2
      ORDER BY 1
    `);

    const monthSet = new Set<string>();
    tlRows.forEach((r) => monthSet.add(r.month));
    const months = Array.from(monthSet).sort();

    const platformColors: Record<string, { name: string; color: string }> = {
      TIKTOK: { name: 'TikTok', color: 'var(--chart-1)' },
      FACEBOOK: { name: 'Facebook', color: 'var(--chart-2)' },
      YOUTUBE: { name: 'YouTube', color: 'var(--chart-3)' },
    };

    const platforms = new Set(tlRows.map((r) => r.platform));
    const timeline = Array.from(platforms).map((p) => ({
      label: platformColors[p]?.name || p,
      color: platformColors[p]?.color || '#888',
      data: months.map((m) => {
        const row = tlRows.find((r) => r.month === m && r.platform === p);
        return row ? Number(Number(row.avg_sentiment).toFixed(0)) : 0;
      }),
    }));

    return NextResponse.json({
      donut,
      timeline,
      months,
      pulse: Number(Number(pulseRow.avg_sentiment).toFixed(1)),
      total: Number(pulseRow.total),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[analytics/sentiment]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
