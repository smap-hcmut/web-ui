'use client';

import { useEffect, useRef, useState } from 'react';
import type { SpotlightEvent } from '@/hooks/useAutoSpotlight';
import type { HeapNode, EntityType, PlatformType } from './types';
import PostTooltip from './tooltips/PostTooltip';
import { enrichPostData } from './tooltips/enrich-post';

/* ═══════════════════════════════════════════
   BADGE STYLES
   ═══════════════════════════════════════════ */

const BADGE: Record<SpotlightEvent['type'], { bg: string; color: string; label: string; icon: string }> = {
  spotlight: {
    bg: 'rgba(62, 207, 160, 0.10)',
    color: '#3ECFA0',
    label: 'Spotlight',
    icon: '✦',
  },
  spike: {
    bg: 'rgba(239, 159, 39, 0.12)',
    color: '#EF9F27',
    label: 'Spike detected',
    icon: '⚡',
  },
  milestone: {
    bg: 'rgba(62, 207, 160, 0.12)',
    color: '#3ECFA0',
    label: 'Goal reached',
    icon: '✓',
  },
  crisis: {
    bg: 'rgba(226, 75, 74, 0.12)',
    color: '#E24B4A',
    label: 'Crisis alert',
    icon: '!',
  },
};

const TYPE_LABEL: Record<EntityType, string> = {
  campaign: 'Campaign', project: 'Project', keyword: 'Keyword', post: 'Post', comment: 'Comment',
};

const ENTITY_COLOR: Record<EntityType, string> = {
  campaign: '#8b5cf6', project: '#0891b2', keyword: '#059669', post: '#ea580c', comment: '#64748b',
};

const PLATFORM_COLOR: Record<PlatformType, string> = {
  tiktok: '#fe2c55', facebook: '#1877f2', youtube: '#ff0000',
};

const PLATFORM_ABBR: Record<PlatformType, string> = {
  tiktok: 'TT', facebook: 'FB', youtube: 'YB',
};

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return String(n);
}

function sentimentHue(s: number | undefined): string {
  if (s == null) return '#94a3b8';
  if (s >= 70) return '#059669';
  if (s >= 40) return '#d97706';
  return '#dc2626';
}

/* ═══════════════════════════════════════════
   TOOLTIP POSITION
   ═══════════════════════════════════════════ */

interface TooltipPos {
  x: number;
  y: number;
  anchor: 'right' | 'left';
}

function computeTooltipPosition(
  bubbleX: number,
  bubbleY: number,
  bubbleR: number,
  mapW: number,
  mapH: number,
  tooltipW: number = 230,
  tooltipH: number = 150,
): TooltipPos {
  // Default: right of bubble
  let x = bubbleX + bubbleR + 16;
  let y = bubbleY - tooltipH / 2;
  let anchor: 'right' | 'left' = 'right';

  // Flip left if goes off right edge
  if (x + tooltipW > mapW - 20) {
    x = bubbleX - bubbleR - tooltipW - 16;
    anchor = 'left';
  }

  // Clamp vertically
  if (y < 20) y = 20;
  if (y + tooltipH > mapH - 40) y = mapH - tooltipH - 40;

  return { x, y, anchor };
}

/* ═══════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════ */

interface AutoSpotlightTooltipProps {
  event: SpotlightEvent;
  entity: HeapNode;
  /** Bubble center position in container coordinates */
  bubblePos: { x: number; y: number };
  /** Bubble radius in px */
  bubbleRadius: number;
  /** Container dimensions */
  containerSize: { width: number; height: number };
}

export default function AutoSpotlightTooltip({
  event,
  entity,
  bubblePos,
  bubbleRadius,
  containerSize,
}: AutoSpotlightTooltipProps) {
  const badge = BADGE[event.type];
  const entityColor = ENTITY_COLOR[entity.type];
  const sentColor = sentimentHue(entity.metrics.sentiment);

  const tooltipRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<TooltipPos>({ x: 0, y: 0, anchor: 'right' });

  // Compute position
  useEffect(() => {
    setPos(computeTooltipPosition(
      bubblePos.x, bubblePos.y, bubbleRadius,
      containerSize.width, containerSize.height,
    ));
  }, [bubblePos.x, bubblePos.y, bubbleRadius, containerSize.width, containerSize.height]);

  // Connector line endpoints
  const connectorStart = pos.anchor === 'right'
    ? { x: pos.x, y: pos.y + 75 }
    : { x: pos.x + 230, y: pos.y + 75 };
  const connectorEnd = {
    x: bubblePos.x + (pos.anchor === 'right' ? bubbleRadius : -bubbleRadius),
    y: bubblePos.y,
  };

  return (
    <>
      {/* ── Connector line (tooltip → bubble) ── */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none auto-spotlight-enter"
        style={{ zIndex: 58 }}
      >
        <line
          x1={connectorStart.x}
          y1={connectorStart.y}
          x2={connectorEnd.x}
          y2={connectorEnd.y}
          stroke={sentColor}
          strokeWidth={0.5}
          strokeDasharray="4 3"
          opacity={0.3}
        />
      </svg>

      {/* ── Tooltip card ── */}
      <div
        ref={tooltipRef}
        className="absolute auto-spotlight-enter"
        style={{
          left: pos.x,
          top: pos.y,
          zIndex: 59,
          pointerEvents: 'none',
        }}
      >
        {/* Platform-native tooltip for posts */}
        {entity.type === 'post' && (() => {
          const postData = enrichPostData(entity);
          if (!postData) return null;
          return (
            <div className="relative">
              {/* Spotlight badge overlay */}
              {event.type !== 'spotlight' && (
                <div className="absolute -top-6 left-0 z-[3]">
                  <span
                    className="text-[8px] px-2 py-[2px] rounded font-bold tracking-wide flex items-center gap-1 whitespace-nowrap"
                    style={{ background: badge.bg, color: badge.color }}
                  >
                    <span className="text-[7px]">{badge.icon}</span>
                    {badge.label}
                  </span>
                </div>
              )}
              <div style={{
                boxShadow: `0 8px 32px rgba(0,0,0,0.08), 0 0 0 1px ${entityColor}12`,
                borderRadius: 10,
              }}>
                <PostTooltip post={postData} />
              </div>
              {/* Context line for event-triggered */}
              {event.type !== 'spotlight' && event.description && (
                <div
                  className="mt-1 px-2 py-1 rounded-md text-[8px] leading-relaxed"
                  style={{ background: 'rgba(255,255,255,0.9)', color: badge.color, border: '1px solid rgba(0,0,0,0.04)' }}
                >
                  {event.description}
                </div>
              )}
            </div>
          );
        })()}

        {/* Generic tooltip for non-posts */}
        {entity.type !== 'post' && (
          <div
            className="px-3.5 py-3 rounded-xl"
            style={{
              width: 230,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: `1px solid ${entityColor}18`,
              boxShadow: `
                0 8px 32px rgba(0,0,0,0.08),
                0 1px 2px rgba(0,0,0,0.04)
              `,
            }}
          >
            {/* Badge */}
            <div className="flex items-center gap-2 mb-2">
              <span
                className="text-[9px] px-2 py-[3px] rounded-md font-bold tracking-wide flex items-center gap-1"
                style={{ background: badge.bg, color: badge.color }}
              >
                <span className="text-[8px]">{badge.icon}</span>
                {badge.label}
              </span>

              <span
                className="text-[8px] px-1.5 py-[2px] rounded font-bold uppercase tracking-wider"
                style={{ background: `${entityColor}10`, color: entityColor }}
              >
                {TYPE_LABEL[entity.type]}
              </span>

              {entity.platform && (
                <span
                  className="text-[8px] font-bold px-1 py-[1px] rounded"
                  style={{ color: PLATFORM_COLOR[entity.platform], background: `${PLATFORM_COLOR[entity.platform]}10` }}
                >
                  {PLATFORM_ABBR[entity.platform]}
                </span>
              )}
            </div>

            <h4 className="text-[12px] font-semibold text-slate-800 leading-snug">{entity.name}</h4>

            {(entity.description || event.description) && (
              <p className="text-[10px] text-slate-400 mt-1 leading-relaxed line-clamp-1">
                {entity.description || event.description}
              </p>
            )}

            <div className="flex gap-3.5 mt-2 text-[10px]">
              {entity.metrics.mentions != null && (
                <div>
                  <span className="text-slate-300 block mb-0.5 text-[8px]">Mentions</span>
                  <span className="text-slate-700 font-semibold tabular-nums">{fmt(entity.metrics.mentions)}</span>
                </div>
              )}
              {entity.metrics.sentiment != null && (
                <div>
                  <span className="text-slate-300 block mb-0.5 text-[8px]">Sentiment</span>
                  <span className="font-semibold tabular-nums" style={{ color: sentColor }}>
                    {entity.metrics.sentiment}%
                  </span>
                </div>
              )}
              {entity.metrics.engagement != null && (
                <div>
                  <span className="text-slate-300 block mb-0.5 text-[8px]">Engage</span>
                  <span className="text-slate-700 font-semibold tabular-nums">{fmt(entity.metrics.engagement)}</span>
                </div>
              )}
            </div>

            {event.type !== 'spotlight' && event.description && (
              <p
                className="text-[9px] mt-2 pt-1.5 border-t border-slate-100 leading-relaxed line-clamp-1"
                style={{ color: badge.color }}
              >
                {event.description}
              </p>
            )}
          </div>
        )}
      </div>
    </>
  );
}
