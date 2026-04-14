/**
 * Bubble content tier — determines what info to show inside each bubble.
 * XL: short label + metric hero + sparkline + sentiment badge
 * LG: short label + metric + sparkline
 * MD: metric only + mini sparkline
 * SM: count/abbreviated metric only
 */
export type BubbleTier = 'xl' | 'lg' | 'md' | 'sm';

export function getBubbleContentTier(radius: number): BubbleTier {
  if (radius > 55) return 'xl';
  if (radius > 40) return 'lg';
  if (radius > 28) return 'md';
  return 'sm';
}

/** Metric font size per tier (px) */
export function getMetricFontSize(tier: BubbleTier): number {
  switch (tier) {
    case 'xl': return 18;
    case 'lg': return 14;
    case 'md': return 12;
    case 'sm': return 10;
  }
}

/** Max chars for label truncation per tier */
export function getLabelMaxChars(tier: BubbleTier): number {
  switch (tier) {
    case 'xl': return 16;
    case 'lg': return 12;
    default:   return 0;  // MD and SM don't show labels
  }
}

/**
 * Pulse speed based on mention velocity (proposal §3.1.4).
 * Returns animation duration in seconds.
 * Crisis = fastest pulse (1.2s), quiet = slow breathing (5s).
 */
export function getPulseSpeed(mentionVelocity: number, isCrisis: boolean): number {
  if (isCrisis) return 1.2;
  if (mentionVelocity > 100) return 1.5;
  if (mentionVelocity > 50)  return 2.0;
  if (mentionVelocity > 20)  return 3.0;
  if (mentionVelocity > 5)   return 4.0;
  return 5.0;
}

/**
 * Generate SVG polyline points string for a sparkline.
 * Fits data into a bounding box centered at (cx, cy).
 *
 * @param data    - array of numeric values (typically 7 points)
 * @param cx      - center X of the sparkline
 * @param cy      - center Y of the sparkline
 * @param width   - total width of the sparkline
 * @param height  - total height of the sparkline
 */
export function sparklinePoints(
  data: number[],
  cx: number,
  cy: number,
  width: number,
  height: number,
): string {
  if (!data.length) return '';

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const startX = cx - width / 2;
  const startY = cy - height / 2;
  const stepX = width / Math.max(data.length - 1, 1);

  return data
    .map((v, i) => {
      const x = startX + i * stepX;
      // Invert Y: higher value = higher on screen (lower Y coord)
      const y = startY + height - ((v - min) / range) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}
