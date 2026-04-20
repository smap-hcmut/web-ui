/**
 * GET /api/analytics/posts?campaignId=xxx&platform=all&sentiment=all&sort=engagement&limit=30&offset=0
 *
 * Returns recent posts from analysis.post_insight with:
 * - content, platform, author, sentiment, engagement, time
 * - uap_metadata engagement breakdown (views, likes, comments, shares)
 * - For LiveTicker + PostCard list + Post detail modal
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  queryNative,
  getProjectIdsForCampaign,
  projectFilter,
} from '@/lib/metabase/client';

export interface PostItem {
  id: string;
  platform: string;
  author: string;
  authorUsername: string;
  authorFollowers: number;
  authorVerified: boolean;
  content: string;
  time: string;
  url: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  sentimentScore: number;
  engagement: number;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  keywords: string[];
  riskLevel: string;
  hashtags: string[];
}

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const campaignId = params.get('campaignId');
    const platform = params.get('platform') || 'all';
    const sentiment = params.get('sentiment') || 'all';
    const sort = params.get('sort') || 'engagement';
    const limit = Number(params.get('limit') || '30');
    const offset = Number(params.get('offset') || '0');

    if (!campaignId) {
      return NextResponse.json({ error: 'campaignId is required' }, { status: 400 });
    }

    const projectIds = await getProjectIdsForCampaign(campaignId);
    if (projectIds.length === 0) {
      return NextResponse.json({ posts: [], total: 0 });
    }

    const pf = projectFilter(projectIds);

    // Build dynamic WHERE conditions
    const conditions: string[] = [pf];

    if (platform !== 'all') {
      conditions.push(`UPPER(platform) = '${platform.toUpperCase().replace(/'/g, "''")}'`);
    }

    if (sentiment === 'positive') {
      conditions.push('overall_sentiment_score >= 0.7');
    } else if (sentiment === 'negative') {
      conditions.push('overall_sentiment_score < 0.4');
    } else if (sentiment === 'neutral') {
      conditions.push('overall_sentiment_score >= 0.4 AND overall_sentiment_score < 0.7');
    }

    const where = conditions.join(' AND ');

    const orderBy = sort === 'time'
      ? 'content_created_at DESC NULLS LAST'
      : 'engagement_score DESC NULLS LAST';

    // Total count
    const countRows = await queryNative<{ total: number }>(`
      SELECT COUNT(*) AS total
      FROM analysis.post_insight
      WHERE ${where}
    `);

    const total = Number(countRows[0]?.total || 0);

    // Posts
    const rows = await queryNative<{
      id: string;
      platform: string;
      content: string;
      content_created_at: string;
      overall_sentiment: string;
      overall_sentiment_score: number;
      engagement_score: number;
      reach_estimate: number;
      risk_level: string;
      keywords: string | string[];
      uap_metadata: string | Record<string, unknown>;
    }>(`
      SELECT
        id::text,
        LOWER(platform) AS platform,
        COALESCE(content, '') AS content,
        COALESCE(TO_CHAR(content_created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"'), '') AS content_created_at,
        COALESCE(overall_sentiment, 'NEUTRAL') AS overall_sentiment,
        COALESCE(overall_sentiment_score, 0) AS overall_sentiment_score,
        COALESCE(engagement_score, 0) AS engagement_score,
        COALESCE(reach_estimate, 0) AS reach_estimate,
        COALESCE(risk_level, 'LOW') AS risk_level,
        COALESCE(keywords, '{}') AS keywords,
        COALESCE(uap_metadata::text, '{}') AS uap_metadata
      FROM analysis.post_insight
      WHERE ${where}
      ORDER BY ${orderBy}
      LIMIT ${limit} OFFSET ${offset}
    `);

    const posts: PostItem[] = rows.map((r) => {
      let uap: Record<string, unknown> = {};
      try {
        uap = typeof r.uap_metadata === 'string' ? JSON.parse(r.uap_metadata) : (r.uap_metadata || {});
      } catch { /* ignore parse error */ }

      const eng = (uap.engagement || {}) as Record<string, number>;
      const sentimentScore = Number(r.overall_sentiment_score);

      let sentimentLabel: 'positive' | 'negative' | 'neutral' = 'neutral';
      if (sentimentScore >= 0.7) sentimentLabel = 'positive';
      else if (sentimentScore < 0.4) sentimentLabel = 'negative';

      // Keywords may come back as a string like "{foo,bar}" or an actual array
      let keywordsList: string[] = [];
      if (Array.isArray(r.keywords)) {
        keywordsList = r.keywords;
      } else if (typeof r.keywords === 'string' && r.keywords !== '{}') {
        keywordsList = r.keywords.replace(/^\{|\}$/g, '').split(',').filter(Boolean);
      }

      return {
        id: r.id,
        platform: r.platform || 'unknown',
        author: (uap.author_display_name as string) || (uap.author_username as string) || 'Unknown',
        authorUsername: (uap.author_username as string) || '',
        authorFollowers: (uap.author_followers as number) || 0,
        authorVerified: (uap.author_is_verified as boolean) || false,
        content: r.content,
        time: r.content_created_at,
        url: (uap.url as string) || '',
        sentiment: sentimentLabel,
        sentimentScore,
        engagement: Number(r.engagement_score),
        views: eng.views || 0,
        likes: eng.likes || 0,
        comments: eng.comments || 0,
        shares: eng.shares || 0,
        keywords: keywordsList,
        riskLevel: r.risk_level,
        hashtags: (uap.hashtags as string[]) || [],
      };
    });

    return NextResponse.json({ posts, total });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[analytics/posts]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
