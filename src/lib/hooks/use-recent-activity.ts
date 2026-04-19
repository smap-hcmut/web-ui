/**
 * Recent Activity (Posts) Hook
 *
 * React Query hook for fetching posts from the analytics API.
 * Supports filtering by platform, sentiment, sorting, and pagination.
 * Used for: LiveTicker, PostCard list, Post detail modal.
 */

import { useQuery, useInfiniteQuery } from '@tanstack/react-query';

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
}

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const postsKeys = {
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
  return useQuery({
    queryKey: postsKeys.page({ campaignId: campaignId!, ...rest }),
    queryFn: () => fetchPosts({ campaignId: campaignId!, ...rest }),
    enabled: !!campaignId,
    staleTime: 30_000, // posts are more dynamic — shorter stale time
    refetchInterval: 2 * 60_000, // refresh every 2 minutes
  });
}

/**
 * Infinite scrolling posts for a campaign with filters.
 * Use for: scrollable post feed with "Load More".
 */
export function useInfinitePosts(params: Omit<PostsParams, 'campaignId' | 'offset'> & { campaignId?: string }) {
  const { campaignId, limit = 30, ...rest } = params;
  return useInfiniteQuery({
    queryKey: postsKeys.list({ campaignId: campaignId!, limit, ...rest }),
    queryFn: ({ pageParam = 0 }) =>
      fetchPosts({ campaignId: campaignId!, limit, offset: pageParam as number, ...rest }),
    enabled: !!campaignId,
    staleTime: 30_000,
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      const nextOffset = (lastPageParam as number) + limit;
      return nextOffset < lastPage.total ? nextOffset : undefined;
    },
  });
}
