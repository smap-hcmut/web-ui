'use client';

import { stringToColor } from './tooltip-utils';

interface AvatarProps {
  src?: string;
  name: string;
  size: number;
  shape?: 'circle' | 'square';
}

export default function Avatar({ src, name, size, shape = 'circle' }: AvatarProps) {
  const initials = name
    .split(/[\s.]+/)
    .filter(Boolean)
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const borderRadius = shape === 'circle' ? '50%' : 4;

  if (src) {
    return (
      <img
        src={src}
        alt=""
        className="shrink-0 object-cover"
        style={{ width: size, height: size, borderRadius }}
        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
      />
    );
  }

  return (
    <div
      className="shrink-0 flex items-center justify-center text-white"
      style={{
        width: size,
        height: size,
        borderRadius,
        background: stringToColor(name),
        fontSize: size * 0.35,
        fontWeight: 600,
      }}
    >
      {initials}
    </div>
  );
}
