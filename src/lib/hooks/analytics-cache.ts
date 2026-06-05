'use client';

import { useEffect } from 'react';

const ANALYTICS_CACHE_PREFIX = 'smap:analytics-cache:v3:';
const ANALYTICS_CACHE_TTL_MS = 15 * 60 * 1000;

type AnalyticsQueryKey = readonly unknown[];

interface AnalyticsCacheEntry<T> {
  data: T;
  updatedAt: number;
}

function cacheKey(queryKey: AnalyticsQueryKey): string {
  return `${ANALYTICS_CACHE_PREFIX}${JSON.stringify(queryKey)}`;
}

function readEntry<T>(queryKey: AnalyticsQueryKey): AnalyticsCacheEntry<T> | undefined {
  if (typeof window === 'undefined') return undefined;

  try {
    const raw = localStorage.getItem(cacheKey(queryKey));
    if (!raw) return undefined;

    const parsed = JSON.parse(raw) as AnalyticsCacheEntry<T>;
    if (!parsed || typeof parsed.updatedAt !== 'number') return undefined;

    if (Date.now() - parsed.updatedAt > ANALYTICS_CACHE_TTL_MS) {
      localStorage.removeItem(cacheKey(queryKey));
      return undefined;
    }

    return parsed;
  } catch {
    return undefined;
  }
}

export function getCachedAnalyticsData<T>(queryKey: AnalyticsQueryKey): T | undefined {
  return readEntry<T>(queryKey)?.data;
}

export function getCachedAnalyticsUpdatedAt(queryKey: AnalyticsQueryKey): number | undefined {
  return readEntry(queryKey)?.updatedAt;
}

export function usePersistedAnalyticsCache<T>(
  queryKey: AnalyticsQueryKey,
  data: T | undefined,
  updatedAt: number,
  enabled: boolean,
) {
  useEffect(() => {
    if (!enabled || typeof window === 'undefined' || data === undefined || updatedAt <= 0) {
      return;
    }

    try {
      const entry: AnalyticsCacheEntry<T> = { data, updatedAt };
      localStorage.setItem(cacheKey(queryKey), JSON.stringify(entry));
    } catch {
      // Ignore storage quota / serialization failures.
    }
  }, [data, enabled, queryKey, updatedAt]);
}
