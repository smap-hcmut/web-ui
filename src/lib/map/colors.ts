/** Sentiment color palette from proposal §2.1 */
export const SENTIMENT = {
  positive: '#3ECFA0',
  neutral: '#EF9F27',
  negative: '#E24B4A',
  mixed: '#A78BFA',
} as const;

/** Get sentiment ring color based on 0-100 score */
export function getSentimentColor(sentiment: number | undefined): string {
  if (sentiment == null) return '#94a3b8';
  if (sentiment >= 70) return SENTIMENT.positive;
  if (sentiment >= 40) return SENTIMENT.neutral;
  return SENTIMENT.negative;
}

/** Ring stroke width per entity level (proposal §3.1.3) */
export function getRingStrokeWidth(level: string): number {
  switch (level) {
    case 'campaign': return 3;
    case 'project':  return 2.5;
    case 'keyword':  return 2;
    default:         return 1.5;
  }
}
