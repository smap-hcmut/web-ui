'use client';

import type { TikTokPostData } from './types';
import SentimentBadge from './shared/SentimentBadge';
import { fmtNum } from './shared/tooltip-utils';

function fmtDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function TikTokPostTooltip({ post }: { post: TikTokPostData }) {
  const pd = post.platformData;
  const progress = pd.videoDuration
    ? Math.min(100, 30 + Math.random() * 50)
    : 45;

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

      {/* ── Video area ── */}
      <div
        className="relative"
        style={{
          height: 210,
          background: 'linear-gradient(180deg, rgba(254,44,85,0.04) 0%, rgba(248,249,252,1) 40%, rgba(254,44,85,0.03) 100%)',
        }}
      >
        {/* Play button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.06)' }}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="#334155" opacity={0.5}>
              <path d="M4 2l10 6-10 6z" />
            </svg>
          </div>
        </div>

        {/* Duration badge */}
        {pd.videoDuration != null && (
          <span
            className="absolute bottom-8 left-2 text-[8px] text-slate-400 font-medium tabular-nums"
          >
            {fmtDuration(pd.videoDuration)}
          </span>
        )}

        {/* ── Right sidebar — TikTok DNA ── */}
        <div className="absolute right-2 bottom-8 flex flex-col items-center gap-3">
          {[
            { icon: '♥', count: post.likes, color: '#FE2C55' },
            { icon: '💬', count: post.comments },
            { icon: '↗', count: post.shares },
            ...(pd.bookmarks ? [{ icon: '🔖', count: pd.bookmarks }] : []),
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center">
              <div
                className="w-[26px] h-[26px] rounded-full flex items-center justify-center text-[11px]"
                style={{
                  background: 'rgba(0,0,0,0.04)',
                  color: item.color ?? '#64748b',
                }}
              >
                {item.icon}
              </div>
              <span className="text-[7px] text-slate-400 mt-0.5 tabular-nums">{fmtNum(item.count)}</span>
            </div>
          ))}
        </div>

        {/* ── Progress bar — TikTok red ── */}
        <div
          className="absolute bottom-0 left-0 right-0 h-[2px]"
          style={{ background: 'rgba(0,0,0,0.04)' }}
        >
          <div
            className="h-full rounded-r-full"
            style={{ width: `${progress}%`, background: '#FE2C55' }}
          />
        </div>
      </div>

      {/* ── Bottom info ── */}
      <div className="px-2.5 py-2">
        <p className="text-[10px] font-semibold text-slate-700 truncate">
          {post.authorHandle ?? `@${post.authorName}`}
        </p>
        <p className="text-[9px] text-slate-400 mt-1 leading-relaxed line-clamp-2">
          {post.content}
        </p>
        {pd.musicName && (
          <div className="flex items-center gap-1 mt-1.5">
            <span className="text-[8px]" style={{ color: '#FE2C55', opacity: 0.6 }}>♫</span>
            <p className="text-[8px] text-slate-300 truncate">{pd.musicName}</p>
          </div>
        )}
        <p className="text-[8px] text-slate-300 mt-1 tabular-nums">{fmtNum(pd.views)} views</p>
      </div>
    </div>
  );
}
