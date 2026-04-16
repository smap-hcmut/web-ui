'use client';

import type { PostData, FacebookPostData, TikTokPostData, YouTubePostData } from './types';
import FacebookPostTooltip from './FacebookPostTooltip';
import TikTokPostTooltip from './TikTokPostTooltip';
import YouTubePostTooltip from './YouTubePostTooltip';
import GenericPostTooltip from './GenericPostTooltip';

interface PostTooltipProps {
  post: PostData;
}

export default function PostTooltip({ post }: PostTooltipProps) {
  switch (post.platform) {
    case 'facebook':
      return <FacebookPostTooltip post={post as FacebookPostData} />;
    case 'tiktok':
      return <TikTokPostTooltip post={post as TikTokPostData} />;
    case 'youtube':
      return <YouTubePostTooltip post={post as YouTubePostData} />;
    default:
      return <GenericPostTooltip post={post} />;
  }
}
