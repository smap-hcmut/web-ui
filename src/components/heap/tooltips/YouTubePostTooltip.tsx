'use client';

import type { YouTubePostData } from './types';
import SentimentBadge from './shared/SentimentBadge';
import Avatar from './shared/Avatar';
import { fmtNum, timeAgo } from './shared/tooltip-utils';

export default function YouTubePostTooltip({ post }: { post: YouTubePostData }) {
  const pd = post.platformData;
  const ago = timeAgo(post.publishedAt);

  if (pd.isShort) return <YouTubeShortsTooltip post={post} />;

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

      {/* ── Thumbnail area ── */}
      <div
        className="relative w-full rounded-t-[10px] overflow-hidden"
        style={{
          height: 130,
          background: 'linear-gradient(135deg, rgba(255,0,0,0.04) 0%, rgba(248,249,252,1) 100%)',
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="flex items-center justify-center rounded-md"
            style={{ width: 40, height: 28, background: 'rgba(255,0,0,0.8)' }}
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="white">
              <path d="M5 2.5l9 5.5-9 5.5z" />
            </svg>
          </div>
        </div>
        <span
          className="absolute bottom-1.5 right-1.5 text-[9px] text-white font-medium tabular-nums px-1 py-[1px] rounded"
          style={{ background: 'rgba(0,0,0,0.7)' }}
        >
          {pd.duration}
        </span>
      </div>

      {/* ── Title ── */}
      <div className="px-3 pt-2.5">
        <h4 className="text-[12px] font-semibold text-slate-800 leading-snug line-clamp-2">
          {post.content}
        </h4>
      </div>

      {/* ── Channel row ── */}
      <div className="flex items-center gap-2 px-3 mt-2">
        <Avatar name={pd.channelName} size={20} shape="circle" />
        <span className="text-[10px] text-slate-400 truncate">{pd.channelName}</span>
      </div>

      {/* ── Stats row ── */}
      <div className="px-3 pt-1.5 pb-2.5">
        <p className="text-[9px] text-slate-300 tabular-nums">
          {fmtNum(pd.views)} views · {ago}
        </p>
      </div>
    </div>
  );
}

/* ── YouTube Shorts variant ── */

function YouTubeShortsTooltip({ post }: { post: YouTubePostData }) {
  const pd = post.platformData;

  return (
    <div
      className="relative w-[170px] rounded-[10px] overflow-hidden"
      style={{
        background: '#ffffff',
        border: '1px solid rgba(0,0,0,0.06)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
      }}
    >
      <SentimentBadge value={post.sentiment} />

      <span
        className="absolute top-2 left-2 z-[2] text-[8px] font-bold px-1.5 py-[2px] rounded"
        style={{ background: 'rgba(255,0,0,0.08)', color: '#dc2626' }}
      >
        Shorts
      </span>

      <div
        className="relative"
        style={{
          height: 210,
          background: 'linear-gradient(180deg, rgba(255,0,0,0.03) 0%, transparent 40%)',
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="flex items-center justify-center rounded-md"
            style={{ width: 36, height: 26, background: 'rgba(255,0,0,0.7)' }}
          >
            <svg width="11" height="11" viewBox="0 0 16 16" fill="white">
              <path d="M5 2.5l9 5.5-9 5.5z" />
            </svg>
          </div>
        </div>

        <div className="absolute right-2 bottom-8 flex flex-col items-center gap-3">
          {[
            { icon: '♥', count: post.likes },
            { icon: '💬', count: post.comments },
            { icon: '↗', count: post.shares },
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center">
              <div
                className="w-[24px] h-[24px] rounded-full flex items-center justify-center text-[10px]"
                style={{ background: 'rgba(0,0,0,0.04)', color: '#64748b' }}
              >
                {item.icon}
              </div>
              <span className="text-[7px] text-slate-300 mt-0.5 tabular-nums">{fmtNum(item.count)}</span>
            </div>
          ))}
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ background: 'rgba(0,0,0,0.04)' }}>
          <div className="h-full rounded-r-full" style={{ width: '40%', background: '#FF0000' }} />
        </div>
      </div>

      <div className="px-2.5 py-2">
        <p className="text-[10px] font-medium text-slate-700 line-clamp-2 leading-snug">{post.content}</p>
        <p className="text-[8px] text-slate-400 mt-1">{pd.channelName}</p>
        <p className="text-[8px] text-slate-300 mt-0.5 tabular-nums">{fmtNum(pd.views)} views</p>
      </div>
    </div>
  );
}
