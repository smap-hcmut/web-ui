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
    // Wrap the <img> in a coloured box so the cell never flashes empty
    // while the network round-trips the remote avatar. The same initials
    // sit underneath so a broken image still reads as a recognisable cell
    // instead of a blank.
    return (
      <div
        className="shrink-0 relative flex items-center justify-center overflow-hidden text-white"
        style={{
          width: size,
          height: size,
          borderRadius,
          background: stringToColor(name),
          fontSize: size * 0.35,
          fontWeight: 600,
        }}
      >
        <span aria-hidden="true">{initials}</span>
        <img
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
          style={{ borderRadius }}
          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
      </div>
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
