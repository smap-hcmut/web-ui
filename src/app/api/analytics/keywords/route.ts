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
  dedupedPostInsightCTE,
} from '@/lib/metabase/client';
import { IS_MOCK, mockKeywords } from '@/lib/mock';

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

    if (IS_MOCK) {
      return NextResponse.json({
        keywords: mockKeywords.keywords.slice(0, limit),
        wordCloud: mockKeywords.wordCloud,
      });
    }

    const projectIds = await getProjectIdsForCampaign(campaignId);
    if (projectIds.length === 0) {
      return NextResponse.json({ keywords: [], wordCloud: [] });
    }

    const analyticsCTE = dedupedPostInsightCTE(projectIds);

    const kwRows = await queryNative<{
      keyword: string;
      volume: number;
      avg_sentiment: number;
      current_volume: number;
      previous_volume: number;
    }>(`
      ${analyticsCTE}
      SELECT
        kw AS keyword,
        COUNT(*) AS volume,
        COALESCE(AVG(overall_sentiment_score) * 100, 0) AS avg_sentiment,
        COUNT(*) FILTER (WHERE content_created_at >= NOW() - INTERVAL '30 days') AS current_volume,
        COUNT(*) FILTER (
          WHERE content_created_at >= NOW() - INTERVAL '60 days'
            AND content_created_at < NOW() - INTERVAL '30 days'
        ) AS previous_volume
      FROM deduped_post_insight,
           LATERAL unnest(keywords) AS kw
      WHERE keywords IS NOT NULL
        AND array_length(keywords, 1) > 0
      GROUP BY kw
      ORDER BY COUNT(*) DESC
      LIMIT ${limit}
    `);

    const keywords: KeywordItem[] = kwRows.map((r) => {
      const currentVolume = Number(r.current_volume);
      const previousVolume = Number(r.previous_volume);
      const pctChange = previousVolume > 0
        ? Number((((currentVolume - previousVolume) / previousVolume) * 100).toFixed(1))
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
