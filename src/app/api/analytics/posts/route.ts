/**
 * GET /api/analytics/posts?campaignId=xxx&platform=all&sentiment=all&sort=engagement&limit=30&offset=0
 *
 * Returns recent posts from analysis.post_insight with:
 * - content, platform, author, sentiment, engagement, time
 * - uap_metadata engagement breakdown (views, likes, comments, shares)
 * - For LiveTicker + PostCard list + Post detail modal
 */

import { NextRequest, NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { getProjectIdsForCampaign, projectFilter } from '@/lib/db/queries';

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
    const conditions = [pf];

    if (platform !== 'all') {
      conditions.push(sql`UPPER(platform) = ${platform.toUpperCase()}`);
    }

    if (sentiment === 'positive') {
      conditions.push(sql`overall_sentiment_score >= 0.7`);
    } else if (sentiment === 'negative') {
      conditions.push(sql`overall_sentiment_score < 0.4`);
    } else if (sentiment === 'neutral') {
      conditions.push(sql`overall_sentiment_score >= 0.4 AND overall_sentiment_score < 0.7`);
    }

    const where = sql.join(conditions, sql` AND `);

    const orderBy = sort === 'time'
      ? sql`content_created_at DESC NULLS LAST`
      : sql`engagement_score DESC NULLS LAST`;

    // Total count
    const [countRow] = await db.execute<{ total: string }>(sql`
      SELECT COUNT(*)::text AS total
      FROM analysis.post_insight
      WHERE ${where}
    `).then((r) => [r.rows[0]]);

    // Posts
    const rows = await db.execute<{
      id: string;
      platform: string;
      content: string;
      content_created_at: string;
      overall_sentiment: string;
      overall_sentiment_score: string;
      engagement_score: string;
      reach_estimate: string;
      risk_level: string;
      keywords: string[];
      uap_metadata: string;
    }>(sql`
      SELECT
        id::text,
        LOWER(platform) AS platform,
        COALESCE(content, '') AS content,
        COALESCE(TO_CHAR(content_created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"'), '') AS content_created_at,
        COALESCE(overall_sentiment, 'NEUTRAL') AS overall_sentiment,
        COALESCE(overall_sentiment_score, 0)::text AS overall_sentiment_score,
        COALESCE(engagement_score, 0)::text AS engagement_score,
        COALESCE(reach_estimate, 0)::text AS reach_estimate,
        COALESCE(risk_level, 'LOW') AS risk_level,
        COALESCE(keywords, '{}') AS keywords,
        COALESCE(uap_metadata::text, '{}') AS uap_metadata
      FROM analysis.post_insight
      WHERE ${where}
      ORDER BY ${orderBy}
      LIMIT ${limit} OFFSET ${offset}
    `);

    const posts: PostItem[] = rows.rows.map((r) => {
      let uap: Record<string, unknown> = {};
      try {
        uap = typeof r.uap_metadata === 'string' ? JSON.parse(r.uap_metadata) : (r.uap_metadata || {});
      } catch { /* ignore parse error */ }

      const eng = (uap.engagement || {}) as Record<string, number>;
      const sentimentScore = Number(r.overall_sentiment_score);

      let sentimentLabel: 'positive' | 'negative' | 'neutral' = 'neutral';
      if (sentimentScore >= 0.7) sentimentLabel = 'positive';
      else if (sentimentScore < 0.4) sentimentLabel = 'negative';

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
        keywords: r.keywords || [],
        riskLevel: r.risk_level,
        hashtags: (uap.hashtags as string[]) || [],
      };
    });

    return NextResponse.json({ posts, total: Number(countRow.total) });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[analytics/posts]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
