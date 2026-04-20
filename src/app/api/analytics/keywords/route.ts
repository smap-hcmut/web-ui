/**
 * GET /api/analytics/keywords?campaignId=xxx&limit=50
 *
 * Returns trending keywords data:
 * - Ranked list: keyword text, volume (count), sentiment, change%
 * - Word cloud: text, value, color, opacity (sentiment-based)
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  queryNative,
  getProjectIdsForCampaign,
  projectFilter,
} from '@/lib/metabase/client';

interface KeywordItem {
  text: string;
  volume: number;
  sentiment: number;
  change: number;
}

export async function GET(request: NextRequest) {
  try {
    const campaignId = request.nextUrl.searchParams.get('campaignId');
    const limit = Number(request.nextUrl.searchParams.get('limit') || '50');

    if (!campaignId) {
      return NextResponse.json({ error: 'campaignId is required' }, { status: 400 });
    }

    const projectIds = await getProjectIdsForCampaign(campaignId);
    if (projectIds.length === 0) {
      return NextResponse.json({ keywords: [], wordCloud: [] });
    }

    const pf = projectFilter(projectIds);

    // Unnest keywords array, count and avg sentiment per keyword
    const kwRows = await queryNative<{
      keyword: string;
      volume: number;
      avg_sentiment: number;
    }>(`
      SELECT
        kw AS keyword,
        COUNT(*) AS volume,
        COALESCE(AVG(overall_sentiment_score) * 100, 0) AS avg_sentiment
      FROM analysis.post_insight,
           LATERAL unnest(keywords) AS kw
      WHERE ${pf}
        AND keywords IS NOT NULL
        AND array_length(keywords, 1) > 0
      GROUP BY kw
      ORDER BY COUNT(*) DESC
      LIMIT ${limit}
    `);

    // Change% — compare last 30 days vs previous 30 days per keyword
    const changeRows = await queryNative<{
      keyword: string;
      period: string;
      volume: number;
    }>(`
      SELECT
        kw AS keyword,
        CASE
          WHEN content_created_at >= NOW() - INTERVAL '30 days' THEN 'current'
          WHEN content_created_at >= NOW() - INTERVAL '60 days' THEN 'previous'
        END AS period,
        COUNT(*) AS volume
      FROM analysis.post_insight,
           LATERAL unnest(keywords) AS kw
      WHERE ${pf}
        AND keywords IS NOT NULL
        AND content_created_at >= NOW() - INTERVAL '60 days'
      GROUP BY 1, 2
    `);

    const changeMap = new Map<string, { current: number; previous: number }>();
    for (const row of changeRows) {
      if (!changeMap.has(row.keyword)) changeMap.set(row.keyword, { current: 0, previous: 0 });
      const entry = changeMap.get(row.keyword)!;
      if (row.period === 'current') entry.current = Number(row.volume);
      if (row.period === 'previous') entry.previous = Number(row.volume);
    }

    const keywords: KeywordItem[] = kwRows.map((r) => {
      const change = changeMap.get(r.keyword) || { current: 0, previous: 0 };
      const pctChange = change.previous > 0
        ? Number((((change.current - change.previous) / change.previous) * 100).toFixed(1))
        : 0;

      return {
        text: r.keyword,
        volume: Number(r.volume),
        sentiment: Number(Number(r.avg_sentiment).toFixed(0)),
        change: pctChange,
      };
    });

    // Word cloud items (same data, different shape)
    const wordCloud = keywords.map((k) => ({
      text: k.text,
      value: k.volume,
      color: 'var(--accent)',
      opacity: k.sentiment < 40 ? 0.4 : k.sentiment < 70 ? 0.65 : 1,
    }));

    return NextResponse.json({ keywords, wordCloud });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[analytics/keywords]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
