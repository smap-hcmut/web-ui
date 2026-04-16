'use client';

import type { FacebookPostData, FacebookReactions } from './types';
import SentimentBadge from './shared/SentimentBadge';
import Avatar from './shared/Avatar';
import { fmtNum, timeAgo } from './shared/tooltip-utils';

/* ── reaction helpers ── */

const REACTION_META: Record<keyof FacebookReactions, { emoji: string; bg: string }> = {
  like:  { emoji: '👍', bg: '#2563EB' },
  love:  { emoji: '❤️', bg: '#DC2626' },
  haha:  { emoji: '😂', bg: '#D97706' },
  wow:   { emoji: '😮', bg: '#D97706' },
  sad:   { emoji: '😢', bg: '#D97706' },
  angry: { emoji: '😡', bg: '#EA580C' },
};

function topReactions(reactions: FacebookReactions, n: number) {
  return (Object.entries(reactions) as [keyof FacebookReactions, number][])
    .sort((a, b) => b[1] - a[1])
    .slice(0, n);
}

function sumReactions(reactions: FacebookReactions): number {
  return Object.values(reactions).reduce((s, v) => s + v, 0);
}

/* ── component ── */

export default function FacebookPostTooltip({ post }: { post: FacebookPostData }) {
  const reactions = post.platformData.reactions;
  const top3 = topReactions(reactions, 3);
  const total = sumReactions(reactions);
  const ago = timeAgo(post.publishedAt);

  return (
    <div
      className="relative w-[260px] rounded-[10px] overflow-hidden"
      style={{
        background: '#ffffff',
        border: '1px solid rgba(0,0,0,0.06)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
      }}
    >
      <SentimentBadge value={post.sentiment} />

      {/* ── Header: avatar + name + meta ── */}
      <div className="flex items-start gap-2.5 px-3 pt-3 pb-2">
        <Avatar name={post.authorName} size={32} shape="circle" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <span className="text-[12px] font-semibold text-slate-800 truncate">{post.authorName}</span>
            {post.platformData.isVerified && (
              <svg width="12" height="12" viewBox="0 0 16 16" className="shrink-0">
                <circle cx="8" cy="8" r="7" fill="#1877F2" />
                <path d="M6.5 11L4 8.5l1-1 1.5 1.5L10 5.5l1 1z" fill="#fff" />
              </svg>
            )}
          </div>
          <div className="flex items-center gap-1 text-[9px] text-slate-300 mt-0.5">
            <span>{ago}</span>
            <span>·</span>
            <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor" className="opacity-50">
              <path d="M8 1a7 7 0 100 14A7 7 0 008 1zM5.4 12.3C4.2 11.2 3.4 9.7 3.2 8h2.2c.1.9.2 1.8.5 2.6.2.6.5 1.2.8 1.7h-1.3zm-2.2-5c.2-1.7 1-3.2 2.2-4.3H6.7c-.3.5-.6 1-.8 1.7-.3.8-.4 1.7-.5 2.6H3.2zm9.6 0H10.6c-.1-.9-.2-1.8-.5-2.6-.2-.6-.5-1.2-.8-1.7h1.3c1.2 1.1 2 2.6 2.2 4.3zm-2.2 5c-1.2 1.1-2.8 1.8-4.6 1.8V8h2.4c-.1.9-.2 1.8-.5 2.6-.2.6-.5 1.2-.8 1.7h3.5z"/>
            </svg>
          </div>
        </div>
      </div>

      {/* ── Body text ── */}
      <div className="px-3 pb-2">
        <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">
          {post.content}
        </p>
      </div>

      {/* ── Thumbnail placeholder ── */}
      <div
        className="mx-3 mb-2 rounded-lg overflow-hidden"
        style={{
          height: 100,
          background: 'linear-gradient(135deg, rgba(24,119,242,0.05) 0%, rgba(24,119,242,0.02) 100%)',
          border: '1px solid rgba(0,0,0,0.03)',
        }}
      >
        {post.platformData.imageCount && (
          <div className="h-full flex items-center justify-center">
            <div className="flex items-center gap-1.5 text-slate-300">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
              </svg>
              <span className="text-[10px] font-medium">{post.platformData.imageCount} photos</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Reactions row ── */}
      <div className="flex items-center justify-between px-3 pb-1.5">
        <div className="flex items-center gap-1">
          <div className="flex items-center">
            {top3.map(([type], i) => {
              const meta = REACTION_META[type];
              return (
                <div
                  key={type}
                  className="w-[16px] h-[16px] rounded-full flex items-center justify-center border border-white"
                  style={{
                    background: meta.bg,
                    fontSize: 8,
                    zIndex: 3 - i,
                    marginLeft: i > 0 ? -4 : 0,
                  }}
                >
                  {meta.emoji}
                </div>
              );
            })}
          </div>
          <span className="text-[10px] text-slate-400 ml-1">{fmtNum(total)}</span>
        </div>
        <span className="text-[9px] text-slate-300">{fmtNum(post.comments)} comments</span>
      </div>

      {/* ── Action bar ── */}
      <div
        className="flex items-center justify-around px-3 py-2 text-[9px] text-slate-400"
        style={{ borderTop: '1px solid rgba(0,0,0,0.04)' }}
      >
        <span className="flex items-center gap-1">👍 {fmtNum(post.likes)}</span>
        <span className="flex items-center gap-1">💬 {fmtNum(post.comments)}</span>
        <span className="flex items-center gap-1">↗ {fmtNum(post.shares)}</span>
      </div>
    </div>
  );
}
