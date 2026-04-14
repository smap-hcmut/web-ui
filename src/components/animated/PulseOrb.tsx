'use client';

interface PulseOrbProps {
  color?: string;
  size?: number;
  label?: string;
  /** Intensity 1-3 controls ring count and speed */
  intensity?: 1 | 2 | 3;
  className?: string;
}

export function PulseOrb({ color = 'var(--accent)', size = 48, label, intensity = 2, className }: PulseOrbProps) {
  const rings = intensity;

  return (
    <div className={`relative inline-flex items-center justify-center ${className ?? ''}`} style={{ width: size, height: size }}>
      {/* Expanding rings */}
      {Array.from({ length: rings }, (_, i) => (
        <span
          key={i}
          className="absolute inset-0 rounded-full"
          style={{
            border: `2px solid ${color}`,
            animation: `pulseOrbRing ${1.5 + i * 0.5}s ease-out infinite`,
            animationDelay: `${i * 0.4}s`,
          }}
        />
      ))}

      {/* Core */}
      <span
        className="relative z-10 rounded-full flex items-center justify-center"
        style={{
          width: size * 0.5,
          height: size * 0.5,
          background: color,
          boxShadow: `0 0 ${size * 0.4}px ${color}`,
          animation: `pulseOrb ${2 + (3 - intensity) * 0.5}s ease-in-out infinite`,
        }}
      >
        {label && (
          <span className="text-white font-bold" style={{ fontSize: size * 0.18 }}>
            {label}
          </span>
        )}
      </span>
    </div>
  );
}
