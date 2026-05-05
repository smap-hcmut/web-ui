/**
 * GET /api/analytics/posts?campaignId=xxx&platform=all&sentiment=all&sort=engagement&limit=30&offset=0
 *
 * Returns recent posts from analysis.post_insight with:
 * - content, platform, author, sentiment, engagement, time
 * - uap_metadata engagement breakdown (views, likes, comments, shares)
 * - For LiveTicker + PostCard list + Post detail modal
 */

import { NextRequest, NextResponse } from 'next/server';
import { proxyAnalysis } from '@/lib/analysis/client';
import { IS_MOCK, mockPostsAll } from '@/lib/mock';

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

    if (IS_MOCK) {
      let list = [...mockPostsAll];
      if (platform !== 'all') list = list.filter((p) => p.platform === platform.toUpperCase());
      if (sentiment !== 'all') list = list.filter((p) => p.sentiment === sentiment);
      list.sort((a, b) =>
        sort === 'time' ? (b.time > a.time ? 1 : -1) : b.engagement - a.engagement,
      );
      const total = list.length;
      const paged = list.slice(offset, offset + limit);
      return NextResponse.json({ posts: paged, total });
    }


    return proxyAnalysis(request, '/api/v1/analytics/posts');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[analytics/posts]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
