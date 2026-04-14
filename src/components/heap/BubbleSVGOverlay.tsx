'use client';

import { getSentimentColor, getRingStrokeWidth } from '@/lib/map/colors';
import { getPulseSpeed } from '@/lib/map/calculations';
import type { HeapNode } from './types';

interface BubbleSVGOverlayProps {
  node: HeapNode;
  /** Pixel radius of the bubble (from calcRadius) */
  radius: number;
  /** Whether to hide during zoom transitions */
  hidden?: boolean;
}

/**
 * SVG overlay on top of each CSS blob bubble.
 * Renders structural visual elements AROUND the bubble:
 *   1. Sentiment ring (stroke color)
 *   2. Pulse animation (speed = mention velocity)
 *   3. Trend direction arrow (↑↓→)
 *   4. Crisis mode (red glow + fast double-pulse + warning icon)
 *
 * Sparkline + sentiment badge are rendered in the HTML content label
 * to avoid z-index conflicts with text.
 *
 * Does NOT touch HeapSpace physics/layout.
 */
export default function BubbleSVGOverlay({ node, radius, hidden }: BubbleSVGOverlayProps) {
  if (node.type === 'comment') return null;

  const sentiment = node.metrics.sentiment;
  const sentimentColor = getSentimentColor(sentiment);
  const ringWidth = getRingStrokeWidth(node.type);
  const velocity = node.mentionVelocity ?? 0;
  const isCrisis = node.isCrisis ?? false;
  const trendDir = node.trendDirection ?? 'stable';
  const pulseSpeed = getPulseSpeed(velocity, isCrisis);

  // Trend arrow only when bubble large enough
  const showTrend = radius > 28;

  // SVG viewport: slightly larger than bubble to contain pulse rings
  const padding = 22;
  const size = (radius + padding) * 2;
  const cx = size / 2;
  const cy = size / 2;

  return (
    <svg
      className="absolute pointer-events-none"
      width={size}
      height={size}
      style={{
        left: -size / 2,
        top: -size / 2,
        opacity: hidden ? 0 : 1,
        transition: 'opacity 400ms ease',
        zIndex: 9,
      }}
    >
      {/* Crisis red glow filter */}
      {isCrisis && (
        <defs>
          <filter id={`crisis-glow-${node.id}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feFlood floodColor="#dc2626" floodOpacity="0.2" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      )}

      {/* ── 1. Sentiment ring ── */}
      <circle
        cx={cx}
        cy={cy}
        r={radius - ringWidth / 2}
        fill="none"
        stroke={sentimentColor}
        strokeWidth={ringWidth}
        opacity={0.5}
        filter={isCrisis ? `url(#crisis-glow-${node.id})` : undefined}
      />

      {/* ── 2. Pulse ring(s) ── */}
      <circle cx={cx} cy={cy} r={radius} fill="none" stroke={sentimentColor} opacity={0}>
        <animate
          attributeName="r"
          values={`${radius};${radius + 15};${radius}`}
          dur={`${pulseSpeed}s`}
          repeatCount="indefinite"
        />
        <animate
          attributeName="opacity"
          values="0.18;0;0.18"
          dur={`${pulseSpeed}s`}
          repeatCount="indefinite"
        />
        <animate
          attributeName="stroke-width"
          values="2;0.5;2"
          dur={`${pulseSpeed}s`}
          repeatCount="indefinite"
        />
      </circle>

      {/* Crisis: second staggered pulse ring */}
      {isCrisis && (
        <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#dc2626" opacity={0}>
          <animate
            attributeName="r"
            values={`${radius};${radius + 20};${radius}`}
            dur={`${pulseSpeed}s`}
            begin="0.3s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.08;0;0.08"
            dur={`${pulseSpeed}s`}
            begin="0.3s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="stroke-width"
            values="1.5;0.3;1.5"
            dur={`${pulseSpeed}s`}
            begin="0.3s"
            repeatCount="indefinite"
          />
        </circle>
      )}

      {/* ── 3. Trend direction arrow ── */}
      {showTrend && (
        <g transform={`translate(${cx - radius + 6}, ${cy - 4})`}>
          {trendDir === 'up' && (
            <path d="M0 8L4 0L8 8Z" fill="#059669" opacity={0.6} />
          )}
          {trendDir === 'down' && (
            <path d="M0 0L4 8L8 0Z" fill="#dc2626" opacity={0.6} />
          )}
          {trendDir === 'stable' && (
            <rect x={0} y={3} width={8} height={2} rx={1} fill="#94a3b8" opacity={0.4} />
          )}
        </g>
      )}

      {/* ── 4. Crisis warning icon ── */}
      {isCrisis && (
        <g transform={`translate(${cx - 5}, ${cy - radius - 14})`}>
          <path
            d="M5 0L10 9H0Z"
            fill="none"
            stroke="#dc2626"
            strokeWidth={1.5}
            strokeLinejoin="round"
            opacity={0.8}
          />
          <line
            x1={5} y1={3} x2={5} y2={5.5}
            stroke="#dc2626"
            strokeWidth={1.3}
            strokeLinecap="round"
            opacity={0.8}
          />
          <circle cx={5} cy={7} r={0.6} fill="#dc2626" opacity={0.8} />
        </g>
      )}
    </svg>
  );
}
