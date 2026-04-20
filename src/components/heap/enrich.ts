import type { HeapNode } from './types';

/**
 * Deterministic pseudo-random from a seed string.
 * Used to generate consistent enriched data across renders.
 */
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function seeded(id: string, salt: number): number {
  const x = Math.sin((hash(id) + salt) * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

/**
 * Derive mentionVelocity from mentions + entity type.
 * Campaigns naturally have higher velocity than comments.
 */
function deriveMentionVelocity(node: HeapNode): number {
  const mentions = node.metrics.mentions ?? node.metrics.engagement ?? 0;
  const typeScale: Record<string, number> = {
    campaign: 0.008,
    project: 0.006,
    keyword: 0.005,
    post: 0.003,
    comment: 0.001,
  };
  const scale = typeScale[node.type] ?? 0.003;
  const base = mentions * scale;
  // Add deterministic jitter ±30%
  const jitter = 0.7 + seeded(node.id, 1) * 0.6;
  return Math.round(base * jitter * 10) / 10;
}

/**
 * Derive trend direction from sentiment.
 * Low sentiment → likely 'down', high → 'up', mid → 'stable'.
 * With deterministic randomness to add variety.
 */
function deriveTrendDirection(node: HeapNode): 'up' | 'down' | 'stable' {
  const s = node.metrics.sentiment ?? 50;
  const r = seeded(node.id, 2);

  if (s >= 70) return r > 0.25 ? 'up' : 'stable';
  if (s >= 40) return r < 0.3 ? 'up' : r > 0.7 ? 'down' : 'stable';
  return r > 0.3 ? 'down' : 'stable';
}

/**
 * Generate 7 sparkline data points from current mentions.
 * Creates a believable trend curve ending at current value.
 */
function deriveTrendData(node: HeapNode): number[] {
  const current = node.metrics.mentions ?? node.metrics.engagement ?? 100;
  const points: number[] = [];

  for (let i = 0; i < 7; i++) {
    const progress = i / 6; // 0 → 1
    const noise = (seeded(node.id, 10 + i) - 0.5) * 0.15;
    // Start from ~70-90% of current value, trend toward current
    const startRatio = 0.7 + seeded(node.id, 3) * 0.2;
    const value = current * (startRatio + (1 - startRatio) * progress + noise);
    points.push(Math.round(Math.max(0, value)));
  }

  // Ensure last point matches actual mentions
  points[6] = current;
  return points;
}

/**
 * Derive crisis state from sentiment + velocity.
 * Rules from proposal:
 * - sentiment < 30 AND mentionVelocity > 50 → crisis
 * - OR trendDirection === 'down' AND sentiment < 40 AND velocity > 30
 */
function deriveCrisis(node: HeapNode, velocity: number, trend: 'up' | 'down' | 'stable'): boolean {
  const s = node.metrics.sentiment ?? 50;

  if (s < 30 && velocity > 50) return true;
  if (trend === 'down' && s < 40 && velocity > 30) return true;
  return false;
}

/**
 * Enrich a single HeapNode with Phase 1 fields.
 * Does NOT mutate the original — returns a new object.
 */
function enrichNode(node: HeapNode): HeapNode {
  const mentionVelocity = deriveMentionVelocity(node);
  const trendDirection = deriveTrendDirection(node);
  const trendData = deriveTrendData(node);
  const isCrisis = deriveCrisis(node, mentionVelocity, trendDirection);

  return {
    ...node,
    mentionVelocity,
    trendDirection,
    trendData,
    isCrisis,
    children: node.children?.map(enrichNode),
  };
}

/**
 * Enrich the entire heap data tree.
 * Call once at import time — returns new array, original untouched.
 */
export function enrichHeapData(data: HeapNode[]): HeapNode[] {
  return data.map(enrichNode);
}
