'use client';

interface WaveBackgroundProps {
  color?: string;
  height?: number;
  speed?: number;
  className?: string;
  children?: React.ReactNode;
}

export function WaveBackground({ color = 'var(--accent)', height = 160, speed = 12, className, children }: WaveBackgroundProps) {
  // Two wave layers for depth
  const wave1 = `
    M0,${height * 0.6}
    C${120},${height * 0.3} ${240},${height * 0.8} ${360},${height * 0.5}
    C${480},${height * 0.2} ${600},${height * 0.7} ${720},${height * 0.4}
    C${840},${height * 0.1} ${960},${height * 0.6} ${1080},${height * 0.5}
    C${1200},${height * 0.3} ${1320},${height * 0.8} ${1440},${height * 0.6}
    L1440,${height} L0,${height} Z
  `;

  const wave2 = `
    M0,${height * 0.7}
    C${150},${height * 0.5} ${300},${height * 0.9} ${450},${height * 0.6}
    C${600},${height * 0.3} ${750},${height * 0.8} ${900},${height * 0.55}
    C${1050},${height * 0.3} ${1200},${height * 0.7} ${1350},${height * 0.5}
    C${1500},${height * 0.4} ${1650},${height * 0.85} ${1800},${height * 0.7}
    L1800,${height} L0,${height} Z
  `;

  return (
    <div className={`relative overflow-hidden ${className ?? ''}`} style={{ height }}>
      {/* Wave layers */}
      <div className="absolute inset-0">
        <svg
          className="absolute bottom-0 w-[200%] h-full"
          viewBox={`0 0 1440 ${height}`}
          preserveAspectRatio="none"
          style={{ animation: `waveFlow ${speed}s linear infinite` }}
        >
          <path d={wave1} fill={color} opacity={0.07} />
        </svg>
        <svg
          className="absolute bottom-0 w-[200%] h-full"
          viewBox={`0 0 1800 ${height}`}
          preserveAspectRatio="none"
          style={{ animation: `waveFlow ${speed * 1.4}s linear infinite`, animationDirection: 'reverse' }}
        >
          <path d={wave2} fill={color} opacity={0.04} />
        </svg>
      </div>

      {/* Content */}
      {children && <div className="relative z-10">{children}</div>}
    </div>
  );
}
