'use client';

import { useState, useEffect } from 'react';
import { Radio, ArrowRight, BarChart3, Globe, Zap, Shield } from 'lucide-react';
import Link from 'next/link';

/* ─── Seeded random for deterministic bubble positions ─── */
function seeded(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return Math.round((x - Math.floor(x)) * 10000) / 10000;
}

/* ─── Animated number counter ─── */
function Counter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let frame: number;
    const duration = 2000;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(target * ease));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target]);
  return <>{value.toLocaleString()}{suffix}</>;
}

/* ─── Feature items ─── */
const features = [
  { icon: BarChart3, label: 'Real-time Analytics', desc: 'Track mentions across platforms' },
  { icon: Globe, label: 'Multi-Platform', desc: 'TikTok, Facebook, YouTube' },
  { icon: Zap, label: 'AI-Powered', desc: 'Smart sentiment analysis' },
  { icon: Shield, label: 'Campaign Intel', desc: 'Competitor monitoring' },
];

/* ─── Floating particles data ─── */
const r = (n: number, d = 2) => Math.round(n * 10 ** d) / 10 ** d;

const particles = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  x: r(seeded(i * 7 + 1) * 100),
  y: r(seeded(i * 13 + 3) * 100),
  size: r(3 + seeded(i * 11 + 5) * 5),
  delay: r(seeded(i * 17 + 9) * -8),
  duration: r(6 + seeded(i * 23 + 11) * 6),
  opacity: r(0.15 + seeded(i * 31 + 13) * 0.25),
  fbOx: r((seeded(i * 3 + 5) - 0.5) * 30),
  fbOy: r((seeded(i * 5 + 7) - 0.5) * 30),
}));

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div
      className="h-screen w-screen overflow-hidden relative flex flex-col"
      data-theme="midnight"
      style={{ background: 'var(--bg-base)' }}
    >
      {/* ── Background particles ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Gradient orbs */}
        <div
          className="absolute w-[800px] h-[800px] -top-[300px] -right-[200px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 65%)',
            animation: 'pulseOrb 8s ease-in-out infinite',
          }}
        />
        <div
          className="absolute w-[600px] h-[600px] -bottom-[200px] -left-[200px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(236,72,153,0.06) 0%, transparent 65%)',
            animation: 'pulseOrb 10s ease-in-out infinite 2s',
          }}
        />
        <div
          className="absolute w-[500px] h-[500px] top-[30%] left-[60%] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(14,165,233,0.05) 0%, transparent 65%)',
            animation: 'pulseOrb 12s ease-in-out infinite 4s',
          }}
        />

        {/* Floating particles */}
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-full"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              background: 'var(--accent)',
              opacity: p.opacity,
              animation: `floatBubble ${p.duration}s ease-in-out infinite`,
              animationDelay: `${p.delay}s`,
              '--fb-ox': `${p.fbOx}px`,
              '--fb-oy': `${p.fbOy}px`,
            } as React.CSSProperties}
          />
        ))}

        {/* Grid dots */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      {/* ── Top bar ── */}
      <header
        className="relative z-20 flex items-center justify-between px-8 py-5"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(-10px)',
          transition: 'all 0.6s ease 0.1s',
        }}
      >
        <div className="flex items-center gap-2.5">
          <Radio className="w-5 h-5" style={{ color: 'var(--accent)' }} />
          <span
            className="text-[15px] font-bold tracking-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            SMAP
          </span>
        </div>
        <Link
          href="/auth/login"
          className="flex items-center gap-2 px-5 py-2 rounded-xl text-[13px] font-semibold transition-all duration-300"
          style={{
            background: 'var(--bg-elevated)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--accent)';
            e.currentTarget.style.color = '#fff';
            e.currentTarget.style.borderColor = 'var(--accent)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--bg-elevated)';
            e.currentTarget.style.color = 'var(--text-primary)';
            e.currentTarget.style.borderColor = 'var(--border)';
          }}
        >
          Login
        </Link>
      </header>

      {/* ── Main content ── */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 -mt-8">
        {/* Tagline */}
        <div
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.8s ease 0.2s',
          }}
          className="text-center"
        >
          <div
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-semibold tracking-wide uppercase mb-6"
            style={{
              background: 'var(--accent-subtle)',
              color: 'var(--accent)',
              border: '1px solid rgba(99,102,241,0.2)',
            }}
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
            Social Media Analysis Platform
          </div>

          <h1
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-[1.1] tracking-tight mb-4"
            style={{ color: 'var(--text-primary)' }}
          >
            Listen to what the
            <br />
            <span style={{ color: 'var(--accent)' }}>internet</span> says
          </h1>

          <p
            className="text-base sm:text-lg max-w-[520px] mx-auto mb-8 leading-relaxed"
            style={{ color: 'var(--text-muted)' }}
          >
            Monitor conversations, track sentiment, and discover trends
            across TikTok, Facebook & YouTube — all in real-time.
          </p>

          {/* CTA */}
          <div className="flex items-center justify-center gap-3">
            <Link
              href="/auth/signup"
              className="group flex items-center gap-2 px-7 py-3 rounded-xl text-[14px] font-bold transition-all duration-300"
              style={{
                background: 'var(--accent)',
                color: '#fff',
                boxShadow: '0 4px 24px rgba(99,102,241,0.35)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(99,102,241,0.5)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 24px rgba(99,102,241,0.35)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Get Started
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/smap"
              className="px-7 py-3 rounded-xl text-[14px] font-semibold transition-all duration-300"
              style={{
                background: 'var(--bg-elevated)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--text-muted)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              Live Demo
            </Link>
          </div>
        </div>

        {/* Stats row */}
        <div
          className="flex items-center gap-8 sm:gap-12 mt-12"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.8s ease 0.5s',
          }}
        >
          {[
            { value: 38247, suffix: '+', label: 'Mentions tracked' },
            { value: 3, suffix: '', label: 'Platforms' },
            { value: 97, suffix: '%', label: 'Accuracy' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div
                className="text-2xl sm:text-3xl font-extrabold tabular-nums"
                style={{ color: 'var(--text-primary)' }}
              >
                {mounted ? <Counter target={stat.value} suffix={stat.suffix} /> : `0${stat.suffix}`}
              </div>
              <div
                className="text-[11px] font-medium mt-1"
                style={{ color: 'var(--text-faint)' }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Feature chips */}
        <div
          className="flex flex-wrap items-center justify-center gap-3 mt-10"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.8s ease 0.7s',
          }}
        >
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={i}
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl transition-all duration-300 cursor-default"
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent)';
                  e.currentTarget.style.boxShadow = '0 0 20px rgba(99,102,241,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <Icon
                  className="w-4 h-4"
                  style={{ color: 'var(--accent)' }}
                />
                <div>
                  <div
                    className="text-[12px] font-semibold"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {f.label}
                  </div>
                  <div
                    className="text-[10px]"
                    style={{ color: 'var(--text-faint)' }}
                  >
                    {f.desc}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* ── Bottom fade line ── */}
      <div
        className="relative z-10 h-px mx-20"
        style={{
          background: 'linear-gradient(90deg, transparent, var(--border), transparent)',
          opacity: mounted ? 1 : 0,
          transition: 'opacity 1s ease 1s',
        }}
      />
      <footer
        className="relative z-10 text-center py-4"
        style={{
          opacity: mounted ? 1 : 0,
          transition: 'opacity 1s ease 1s',
        }}
      >
        <span className="text-[11px]" style={{ color: 'var(--text-faint)' }}>
          &copy; 2026 SMAP &mdash; Social Media Analysis Platform
        </span>
      </footer>
    </div>
  );
}
