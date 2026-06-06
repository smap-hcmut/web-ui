/**
 * Recent Activity (Posts) Hook
 *
 * React Query hook for fetching posts from the analytics API.
 * Supports filtering by platform, sentiment, sorting, and pagination.
 * Used for: LiveTicker, PostCard list, Post detail modal.
 */

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  getCachedAnalyticsData,
  getCachedAnalyticsUpdatedAt,
  usePersistedAnalyticsCache,
} from './analytics-cache';
import { appendAnalyticsScope } from './analytics-scope';
import { analyticsQueryOptions } from './analytics-query-options';

// ─── Types ────────────────────────────────────────────────────────────────────

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
  sourceKind?: string;
  dataSourceId?: string;
  targetId?: string;
  contentType?: 'post' | 'comment' | 'reply' | 'mention' | string;
  rootId?: string;
  parentId?: string;
}

export interface PostsResponse {
  posts: PostItem[];
  total: number;
}

export interface PostsParams {
  campaignId: string;
  platform?: string;
  sentiment?: string;
  sort?: 'engagement' | 'time';
  limit?: number;
  offset?: number;
  sourceKind?: string;
  projectIds?: readonly string[];
  keywords?: readonly string[];
  contentType?: string;
}

// ─── Query Keys ───────────────────────────────────────────────────────────────

const postsKeys = {
  all: ['analytics', 'posts'] as const,
  list: (params: Omit<PostsParams, 'offset'>) =>
    [...postsKeys.all, params] as const,
  page: (params: PostsParams) =>
    [...postsKeys.all, params] as const,
};

// ─── Fetch ────────────────────────────────────────────────────────────────────

async function fetchPosts(params: PostsParams): Promise<PostsResponse> {
  const searchParams = new URLSearchParams({
    campaignId: params.campaignId,
    ...(params.platform && params.platform !== 'all' && { platform: params.platform }),
    ...(params.sentiment && params.sentiment !== 'all' && { sentiment: params.sentiment }),
    ...(params.sort && { sort: params.sort }),
    limit: String(params.limit || 30),
    offset: String(params.offset || 0),
  });
  appendAnalyticsScope(searchParams, params, true);
  const res = await fetch(`/api/analytics/posts?${searchParams}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Failed to fetch posts (${res.status})`);
  }
  return res.json();
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

/**
 * Fetch a single page of posts for a campaign with filters.
 * Use for: PostCard list, LiveTicker (first page only).
 */
export function useRecentActivity(params: Omit<PostsParams, 'campaignId'> & { campaignId?: string }) {
  const { campaignId, ...rest } = params;
  const queryKey = campaignId
    ? postsKeys.page({ campaignId, ...rest })
    : [...postsKeys.all, '__pending__', rest] as const;

  const query = useQuery({
    queryKey,
    queryFn: () => fetchPosts({ campaignId: campaignId!, ...rest }),
    enabled: !!campaignId,
    placeholderData: keepPreviousData,
    initialData: campaignId ? getCachedAnalyticsData<PostsResponse>(queryKey) : undefined,
    initialDataUpdatedAt: campaignId ? getCachedAnalyticsUpdatedAt(queryKey) : undefined,
    ...analyticsQueryOptions,
    staleTime: 30_000, // posts are more dynamic — shorter stale time
  });

  usePersistedAnalyticsCache(queryKey, query.data, query.dataUpdatedAt, !!campaignId);

  return query;
}
