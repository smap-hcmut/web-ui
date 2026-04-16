'use client';

import type { PostData } from './types';
import SentimentBadge from './shared/SentimentBadge';
import Avatar from './shared/Avatar';
import { fmtNum, timeAgo } from './shared/tooltip-utils';

export default function GenericPostTooltip({ post }: { post: PostData }) {
  const ago = timeAgo(post.publishedAt);

  return (
    <div
      className="relative w-[250px] rounded-[10px] overflow-hidden"
      style={{
        background: '#ffffff',
        border: '1px solid rgba(0,0,0,0.06)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
      }}
    >
      <SentimentBadge value={post.sentiment} />

      <div className="flex items-start gap-2 px-3 pt-3 pb-2">
        <Avatar name={post.authorName} size={28} shape="circle" />
        <div className="min-w-0 flex-1">
          <span className="text-[11px] font-semibold text-slate-700 truncate block">{post.authorName}</span>
          {post.authorHandle && (
            <span className="text-[9px] text-slate-300 block">{post.authorHandle}</span>
          )}
          <span className="text-[8px] text-slate-300 mt-0.5 block">{ago}</span>
        </div>
      </div>

      <div className="px-3 pb-2">
        <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-3">
          {post.content}
        </p>
      </div>

      <div
        className="flex items-center justify-around px-3 py-2 text-[9px] text-slate-400"
        style={{ borderTop: '1px solid rgba(0,0,0,0.04)' }}
      >
        <span>❤ {fmtNum(post.likes)}</span>
        <span>💬 {fmtNum(post.comments)}</span>
        <span>↗ {fmtNum(post.shares)}</span>
      </div>
    </div>
  );
}
