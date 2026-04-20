/**
 * Platform URL detection — maps a URL's host to one of the supported platforms.
 * Used by the competitor-report generate flow to verify that pasted URLs belong
 * to one of the user-selected platforms.
 */

import type { Platform } from '@/lib/types';

const PLATFORM_DOMAINS: Record<Platform, string[]> = {
  tiktok: ['tiktok.com'],
  facebook: ['facebook.com', 'fb.com', 'fb.watch'],
  youtube: ['youtube.com', 'youtu.be'],
};

export function detectPlatform(url: string): Platform | null {
  const lower = url.toLowerCase();
  for (const [platform, domains] of Object.entries(PLATFORM_DOMAINS) as [Platform, string[]][]) {
    if (domains.some((d) => lower.includes(d))) return platform;
  }
  return null;
}

export const PLATFORM_LABEL: Record<Platform, string> = {
  tiktok: 'TikTok',
  facebook: 'Facebook',
  youtube: 'YouTube',
};
