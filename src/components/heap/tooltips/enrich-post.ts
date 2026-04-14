/**
 * Enrich a HeapNode (post type) into a full PostData
 * with platform-specific fields — all deterministically
 * derived so no mock data edits needed.
 */

import type { HeapNode, PlatformType } from '../types';
import type { PostData, FacebookPostData, TikTokPostData, YouTubePostData } from './types';

/* ── deterministic random ── */

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function seeded(id: string, salt: number): number {
  const x = Math.sin((hash(id) + salt) * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

function seededInt(id: string, salt: number, min: number, max: number): number {
  return Math.floor(min + seeded(id, salt) * (max - min));
}

/* ── platform enrichers ── */

function enrichFacebook(node: HeapNode, base: PostData): FacebookPostData {
  const total = base.likes;
  const likeRatio = 0.5 + seeded(node.id, 10) * 0.2;
  const loveRatio = 0.15 + seeded(node.id, 11) * 0.15;
  const hahaRatio = 0.05 + seeded(node.id, 12) * 0.1;
  const sum = likeRatio + loveRatio + hahaRatio;

  const like = Math.round(total * (likeRatio / sum) * 0.85);
  const love = Math.round(total * (loveRatio / sum) * 0.85);
  const haha = Math.round(total * (hahaRatio / sum) * 0.85);
  const wow = seededInt(node.id, 13, 20, Math.max(50, Math.round(total * 0.03)));
  const sad = seededInt(node.id, 14, 5, Math.max(20, Math.round(total * 0.01)));
  const angry = seededInt(node.id, 15, 2, Math.max(10, Math.round(total * 0.008)));

  const categories = ['News', 'Entertainment', 'Community', 'Business', 'Education'];
  const catIdx = seededInt(node.id, 16, 0, categories.length);

  return {
    ...base,
    platform: 'facebook',
    mediaType: seeded(node.id, 17) > 0.5 ? 'link' : 'image',
    platformData: {
      reactions: { like, love, haha, wow, sad, angry },
      isVerified: seeded(node.id, 18) > 0.4,
      pageCategory: categories[catIdx],
      imageCount: seeded(node.id, 19) > 0.6 ? seededInt(node.id, 20, 1, 5) : undefined,
    },
  };
}

function enrichTikTok(node: HeapNode, base: PostData): TikTokPostData {
  // Extract hashtags from content
  const hashtags = (node.content ?? node.name)
    .match(/#\w+/g)
    ?.map(h => h.slice(1)) ?? [];
  if (hashtags.length === 0) hashtags.push('trending', 'fyp');

  const views = base.likes * (8 + seeded(node.id, 30) * 15);
  const musicSources = [
    `original sound - ${node.author ?? 'creator'}`,
    'nhạc nền - Trending Việt Nam',
    'Đưa tay đây nào - Da LAB',
    'See Tình - Hoàng Thùy Linh',
    `original sound - ${node.author ?? 'user'}`,
  ];

  return {
    ...base,
    platform: 'tiktok',
    mediaType: 'video',
    platformData: {
      videoDuration: seededInt(node.id, 31, 15, 180),
      musicName: musicSources[seededInt(node.id, 32, 0, musicSources.length)],
      hashtags,
      views: Math.round(views),
      bookmarks: seededInt(node.id, 33, 100, Math.round(base.likes * 0.3)),
    },
  };
}

function enrichYouTube(node: HeapNode, base: PostData): YouTubePostData {
  const views = base.likes * (12 + seeded(node.id, 40) * 20);
  const mins = seededInt(node.id, 41, 1, 35);
  const secs = seededInt(node.id, 42, 0, 60);
  const duration = `${mins}:${secs.toString().padStart(2, '0')}`;
  const isShort = seeded(node.id, 43) > 0.75;

  const subCounts = ['12K', '45K', '120K', '245K', '890K', '1.2M', '3.4M'];

  return {
    ...base,
    platform: 'youtube',
    mediaType: 'video',
    platformData: {
      videoId: node.id.replace(/[^a-zA-Z0-9]/g, '').slice(0, 11),
      duration: isShort ? `0:${seededInt(node.id, 44, 15, 59)}` : duration,
      views: Math.round(views),
      channelName: node.author ?? base.authorName,
      channelSubscribers: subCounts[seededInt(node.id, 45, 0, subCounts.length)] + ' subscribers',
      isShort,
    },
  };
}

/* ── main enricher ── */

const postDataCache = new Map<string, PostData>();

export function enrichPostData(node: HeapNode): PostData | null {
  if (node.type !== 'post') return null;

  const cached = postDataCache.get(node.id);
  if (cached) return cached;

  const hoursAgo = 1 + seeded(node.id, 1) * 72; // 1h–73h ago
  const engagement = node.metrics.engagement ?? node.metrics.mentions ?? 1000;

  const base: PostData = {
    id: node.id,
    platform: (node.platform as PostData['platform']) ?? 'facebook',
    url: '#',
    content: node.content ?? node.name,
    authorName: node.author ?? node.name.split(' ').slice(0, 2).join(' '),
    authorHandle: node.author ? `@${node.author}` : undefined,
    publishedAt: new Date(Date.now() - hoursAgo * 3600_000),
    sentiment: node.metrics.sentiment ?? 50,
    likes: Math.round(engagement * (0.3 + seeded(node.id, 2) * 0.4)),
    comments: Math.round(engagement * (0.05 + seeded(node.id, 3) * 0.1)),
    shares: Math.round(engagement * (0.02 + seeded(node.id, 4) * 0.06)),
  };

  let result: PostData;

  switch (node.platform as PlatformType | undefined) {
    case 'facebook':
      result = enrichFacebook(node, base);
      break;
    case 'tiktok':
      result = enrichTikTok(node, base);
      break;
    case 'youtube':
      result = enrichYouTube(node, base);
      break;
    default:
      result = base;
  }

  postDataCache.set(node.id, result);
  return result;
}
