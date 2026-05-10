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
  contentType?: string;
  rootId?: string;
  parentId?: string;
}

function normalizeFilter(value: string | null): string {
  return (value || 'all').trim().toLowerCase();
}

function normalizeText(value: unknown): string {
  return String(value ?? '').trim().toLowerCase();
}

function sortPosts(list: PostItem[], sort: string): PostItem[] {
  return list.sort((a, b) => {
    if (sort === 'time') {
      const bTime = Date.parse(b.time || '') || 0;
      const aTime = Date.parse(a.time || '') || 0;
      return bTime - aTime;
    }
    return (Number(b.engagement) || 0) - (Number(a.engagement) || 0);
  });
}

function normalizeContentType(value: string | null): string {
  const normalized = normalizeFilter(value);
  if (normalized === 'posts') return 'post';
  if (normalized === 'comments') return 'comment';
  if (normalized === 'replies') return 'reply';
  return ['all', 'post', 'comment', 'reply'].includes(normalized) ? normalized : 'all';
}

function filterPosts(list: PostItem[], platform: string, sentiment: string, contentType: string, sort: string): PostItem[] {
  let filtered = [...list];
  if (platform !== 'all') {
    filtered = filtered.filter((p) => normalizeText(p.platform) === platform);
  }
  if (sentiment !== 'all') {
    filtered = filtered.filter((p) => normalizeText(p.sentiment) === sentiment);
  }
  if (contentType !== 'all') {
    filtered = filtered.filter((p) => normalizeText(p.contentType || 'mention') === contentType);
  }
  return sortPosts(filtered, sort);
}

function getPostsPayload(body: unknown): { posts: PostItem[]; location: 'root' | 'data' | null } {
  if (!body || typeof body !== 'object') {
    return { posts: [], location: null };
  }

  const root = body as { posts?: unknown; data?: { posts?: unknown } };
  if (Array.isArray(root.posts)) {
    return { posts: root.posts as PostItem[], location: 'root' };
  }
  if (root.data && Array.isArray(root.data.posts)) {
    return { posts: root.data.posts as PostItem[], location: 'data' };
  }
  return { posts: [], location: null };
}

function getPayloadTotal(body: unknown, location: 'root' | 'data'): number | null {
  if (!body || typeof body !== 'object') {
    return null;
  }

  const container =
    location === 'data'
      ? (body as { data?: Record<string, unknown> }).data
      : (body as Record<string, unknown>);
  const total = Number(container?.total);
  return Number.isFinite(total) && total >= 0 ? total : null;
}

function withFilteredPosts(body: unknown, posts: PostItem[], total: number, location: 'root' | 'data') {
  if (!body || typeof body !== 'object') {
    return { posts, total };
  }

  if (location === 'data') {
    const current = body as { data?: Record<string, unknown> };
    return {
      ...current,
      data: {
        ...(current.data ?? {}),
        posts,
        total,
      },
    };
  }

  return {
    ...(body as Record<string, unknown>),
    posts,
    total,
  };
}

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const campaignId = params.get('campaignId');
    const platform = normalizeFilter(params.get('platform'));
    const sentiment = normalizeFilter(params.get('sentiment'));
    const requestedContentType = normalizeContentType(params.get('contentType'));
    const sort = normalizeFilter(params.get('sort')) === 'time' ? 'time' : 'engagement';
    const limit = Number(params.get('limit') || '30');
    const offset = Number(params.get('offset') || '0');

    if (!campaignId) {
      return NextResponse.json({ error: 'campaignId is required' }, { status: 400 });
    }

    if (IS_MOCK) {
      const list = filterPosts(mockPostsAll as PostItem[], platform, sentiment, requestedContentType, sort);
      const total = list.length;
      const paged = list.slice(offset, offset + limit);
      return NextResponse.json({ posts: paged, total });
    }

    const upstream = await proxyAnalysis(request, '/api/v1/analytics/posts');
    const contentType = upstream.headers.get('content-type') || 'application/json';
    const text = await upstream.text();

    if (!upstream.ok || !contentType.includes('application/json')) {
      return new Response(text, {
        status: upstream.status,
        headers: { 'Content-Type': contentType },
      });
    }

    const body = JSON.parse(text) as unknown;
    const payload = getPostsPayload(body);
    if (!payload.location) {
      return NextResponse.json(body, { status: upstream.status });
    }

    const upstreamTotal = getPayloadTotal(body, payload.location) ?? payload.posts.length;
    return NextResponse.json(
      withFilteredPosts(body, payload.posts, upstreamTotal, payload.location),
      { status: upstream.status },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[analytics/posts]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
