/** Format large numbers: 1200 → "1.2K", 1500000 → "1.5M" */
export function fmtNum(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(n);
}

/** Relative time: "2h ago", "3d ago", "just now" */
export function timeAgo(date: Date): string {
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return `${Math.floor(d / 30)}mo ago`;
}

/** Deterministic color from a string (for avatar fallback) */
export function stringToColor(str: string): string {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  const hue = Math.abs(h) % 360;
  return `hsl(${hue}, 45%, 35%)`;
}

/** Sentiment label + color (light theme) */
export function sentimentConfig(value: number): { bg: string; color: string; label: string } {
  if (value >= 70) return { bg: 'rgba(5,150,105,0.08)', color: '#059669', label: 'positive' };
  if (value >= 40) return { bg: 'rgba(217,119,6,0.08)', color: '#d97706', label: 'neutral' };
  return { bg: 'rgba(220,38,38,0.08)', color: '#dc2626', label: 'negative' };
}
