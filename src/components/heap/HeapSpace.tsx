'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Search, X, Maximize2, Minimize2 } from 'lucide-react';
import clsx from 'clsx';
import type { HeapNode, PhysicsState, SatelliteData, EntityType, PlatformType } from './types';
import { heapData } from './mock-data';

/* ═══════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════ */

const COLORS: Record<EntityType, { primary: string; secondary: string; glow: string; glowStrong: string }> = {
  campaign: { primary: '#c084fc', secondary: '#a855f7', glow: 'rgba(192,132,252,0.25)', glowStrong: 'rgba(192,132,252,0.5)' },
  project:  { primary: '#22d3ee', secondary: '#06b6d4', glow: 'rgba(34,211,238,0.25)',  glowStrong: 'rgba(34,211,238,0.5)' },
  keyword:  { primary: '#34d399', secondary: '#10b981', glow: 'rgba(52,211,153,0.25)',  glowStrong: 'rgba(52,211,153,0.5)' },
  post:     { primary: '#fb923c', secondary: '#f97316', glow: 'rgba(251,146,60,0.25)',  glowStrong: 'rgba(251,146,60,0.5)' },
  comment:  { primary: '#cbd5e1', secondary: '#94a3b8', glow: 'rgba(203,213,225,0.18)', glowStrong: 'rgba(203,213,225,0.35)' },
};

const ICONS: Record<EntityType, string> = {
  campaign: '◆', project: '⬡', keyword: '#', post: '◉', comment: '◦',
};

const TYPE_LABEL: Record<EntityType, string> = {
  campaign: 'Campaign', project: 'Project', keyword: 'Keyword', post: 'Post', comment: 'Comment',
};

const PLATFORM_COLOR: Record<PlatformType, string> = {
  tiktok: '#fe2c55', facebook: '#1877f2', youtube: '#ff0000',
};

const PARTICLE_COUNT = 30;

/* ═══════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════ */

function calcRadius(node: HeapNode, index: number): number {
  const val = node.metrics.mentions ?? node.metrics.engagement ?? 1000;
  const base = node.type === 'comment' ? 18 : node.type === 'post' ? 22 : 30;
  const max  = node.type === 'campaign' ? 58 : node.type === 'project' ? 48 : 40;
  const r = Math.min(max, Math.max(base, base + Math.log10(Math.max(1, val)) * 5));
  // add randomness ±10%
  const jitter = 0.9 + (((index * 7919) % 100) / 100) * 0.2;
  return Math.round(r * jitter);
}

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return String(n);
}

function sentimentHue(s: number | undefined): string {
  if (s == null) return '#94a3b8';
  if (s >= 70) return '#10b981';
  if (s >= 40) return '#f59e0b';
  return '#ef4444';
}

/** Golden-angle spiral for organic scatter */
function createPhysics(count: number, w: number, h: number): PhysicsState[] {
  const cx = w / 2;
  const cy = h / 2;
  const maxR = Math.min(w, h) * 0.38;
  const golden = Math.PI * (3 - Math.sqrt(5));

  return Array.from({ length: count }, (_, i) => {
    const r = maxR * Math.sqrt((i + 0.5) / Math.max(count, 1)) * (0.7 + Math.random() * 0.55);
    const angle = i * golden + (Math.random() - 0.5) * 0.5;
    return {
      baseX: cx + Math.cos(angle) * r,
      baseY: cy + Math.sin(angle) * r,
      oscFreqX: 0.18 + Math.random() * 0.3,
      oscFreqY: 0.14 + Math.random() * 0.26,
      oscAmpX:  8 + Math.random() * 22,
      oscAmpY:  6 + Math.random() * 20,
      phaseX:   Math.random() * Math.PI * 2,
      phaseY:   Math.random() * Math.PI * 2,
    };
  });
}

function createSatPhysics(parentRadius: number, idx: number, total: number): PhysicsState {
  const angle = (Math.PI * 2 * idx) / total - Math.PI / 2 + (Math.random() - 0.5) * 0.6;
  const dist = parentRadius * 2.2 + 12 + Math.random() * 10;
  return {
    baseX: Math.cos(angle) * dist,
    baseY: Math.sin(angle) * dist,
    oscFreqX: 0.5 + Math.random() * 0.6,
    oscFreqY: 0.4 + Math.random() * 0.5,
    oscAmpX:  2 + Math.random() * 4,
    oscAmpY:  2 + Math.random() * 4,
    phaseX:   Math.random() * Math.PI * 2,
    phaseY:   Math.random() * Math.PI * 2,
  };
}

/** Blob animation duration per entity (varied) */
function blobDur(index: number): number {
  return 10 + ((index * 2741) % 12);
}

interface DragState {
  id: string;
  isSatellite: boolean;
  entityIdx: number;
  startMouseX: number;
  startMouseY: number;
  baseX: number;
  baseY: number;
  moved: boolean;
}

/* ═══════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════ */

export default function HeapSpace() {

  /* ─── refs ─── */
  const containerRef  = useRef<HTMLDivElement>(null);
  const bubbleEls     = useRef<Map<string, HTMLDivElement>>(new Map());
  const satEls        = useRef<Map<string, HTMLDivElement>>(new Map());
  const lineEls       = useRef<Map<string, SVGLineElement>>(new Map());
  const physicsArr    = useRef<PhysicsState[]>([]);
  const satPhysicsMap = useRef<Map<string, PhysicsState>>(new Map());
  const hovIdRef      = useRef<string | null>(null);
  const hovElRef      = useRef<HTMLDivElement | null>(null);
  const tooltipPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragRef       = useRef<DragState | null>(null);
  const rafId         = useRef(0);
  const t0            = useRef(performance.now());

  /* ─── state ─── */
  const [navStack, setNavStack]     = useState<HeapNode[]>([]);
  const [entities, setEntities]     = useState<HeapNode[]>(heapData);
  const [hovered, setHovered]       = useState<{ node: HeapNode; x: number; y: number } | null>(null);
  const [search, setSearch]         = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [phase, setPhase]           = useState<'idle' | 'exit' | 'enter'>('idle');
  const [zoomTarget, setZoomTarget] = useState<string | null>(null);
  const [entered, setEntered]       = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  /* ─── derived ─── */
  const showSats = entities.length <= 10;

  const satellites = useMemo<SatelliteData[]>(() => {
    if (!showSats) return [];
    return entities.flatMap(e => {
      const kids = (e.children ?? []).slice(0, 4);
      return kids.map((child, i) => ({
        ...child,
        parentId: e.id,
        satIndex: i,
        satTotal: kids.length,
      }));
    });
  }, [entities, showSats]);

  const particles = useMemo(
    () =>
      Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 1 + Math.random() * 1.5,
        opacity: 0.03 + Math.random() * 0.06,
        dur: 18 + Math.random() * 24,
        delay: -Math.random() * 30,
      })),
    [],
  );

  const matchIds = useMemo(() => {
    if (!search) return null;
    const q = search.toLowerCase();
    return new Set(
      entities
        .filter(e =>
          e.name.toLowerCase().includes(q) ||
          e.description?.toLowerCase().includes(q) ||
          e.author?.toLowerCase().includes(q),
        )
        .map(e => e.id),
    );
  }, [search, entities]);

  const currentType: EntityType = entities[0]?.type ?? 'campaign';

  /* ─── sync entities ←→ navStack ─── */
  useEffect(() => {
    setEntities(
      navStack.length === 0
        ? heapData
        : navStack[navStack.length - 1].children ?? [],
    );
  }, [navStack]);

  /* ─── init physics ─── */
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const { width: w, height: h } = el.getBoundingClientRect();
    physicsArr.current = createPhysics(entities.length, w, h);

    satPhysicsMap.current.clear();
    if (showSats) {
      satellites.forEach(sat => {
        const pi = entities.findIndex(e => e.id === sat.parentId);
        if (pi >= 0) {
          satPhysicsMap.current.set(
            sat.id,
            createSatPhysics(calcRadius(entities[pi], pi), sat.satIndex, sat.satTotal),
          );
        }
      });
    }
  }, [entities, satellites, showSats]);

  /* ─── resize ─── */
  useEffect(() => {
    const onResize = () => {
      const el = containerRef.current;
      if (!el) return;
      const { width: w, height: h } = el.getBoundingClientRect();
      physicsArr.current = createPhysics(entities.length, w, h);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [entities.length]);

  /* ─── animation loop ─── */
  useEffect(() => {
    const animate = () => {
      const t = (performance.now() - t0.current) / 1000;
      const parentPos = new Map<string, { x: number; y: number }>();

      entities.forEach((entity, i) => {
        const p = physicsArr.current[i];
        const el = bubbleEls.current.get(entity.id);
        if (!p || !el) return;

        const dragging = dragRef.current?.id === entity.id && dragRef.current?.moved;
        const x = dragging ? p.baseX : p.baseX + Math.sin(t * p.oscFreqX + p.phaseX) * p.oscAmpX;
        const y = dragging ? p.baseY : p.baseY + Math.cos(t * p.oscFreqY + p.phaseY) * p.oscAmpY;

        el.style.transform = `translate(${x}px, ${y}px)`;
        parentPos.set(entity.id, { x, y });
      });

      satellites.forEach(sat => {
        const sp = satPhysicsMap.current.get(sat.id);
        const el = satEls.current.get(sat.id);
        const pp = parentPos.get(sat.parentId);
        if (!sp || !el || !pp) return;

        const draggingSat = dragRef.current?.id === sat.id && dragRef.current?.moved;
        const sx = pp.x + sp.baseX + (draggingSat ? 0 : Math.sin(t * sp.oscFreqX + sp.phaseX) * sp.oscAmpX);
        const sy = pp.y + sp.baseY + (draggingSat ? 0 : Math.cos(t * sp.oscFreqY + sp.phaseY) * sp.oscAmpY);
        el.style.transform = `translate(${sx}px, ${sy}px)`;

        const line = lineEls.current.get(sat.id);
        if (line) {
          line.setAttribute('x1', String(pp.x));
          line.setAttribute('y1', String(pp.y));
          line.setAttribute('x2', String(sx));
          line.setAttribute('y2', String(sy));
        }
      });

      // update tooltip position to follow floating bubble
      if (hovElRef.current && hovIdRef.current) {
        const r = hovElRef.current.getBoundingClientRect();
        const c = containerRef.current?.getBoundingClientRect();
        if (c) {
          tooltipPosRef.current = { x: r.left - c.left + r.width / 2, y: r.top - c.top - 12 };
          const ttEl = containerRef.current?.querySelector('[data-tooltip]') as HTMLElement | null;
          if (ttEl) {
            ttEl.style.left = `${tooltipPosRef.current.x}px`;
            ttEl.style.top = `${tooltipPosRef.current.y}px`;
          }
        }
      }

      rafId.current = requestAnimationFrame(animate);
    };
    rafId.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId.current);
  }, [entities, satellites]);

  /* ─── entrance stagger ─── */
  useEffect(() => {
    if (phase !== 'enter') return;
    setEntered(false);
    const f = requestAnimationFrame(() => requestAnimationFrame(() => setEntered(true)));
    const timer = setTimeout(() => setPhase('idle'), 800);
    return () => { cancelAnimationFrame(f); clearTimeout(timer); };
  }, [phase]);

  /* ═══════════════════════════════════════════
     HANDLERS
     ═══════════════════════════════════════════ */

  const zoomIn = useCallback((entity: HeapNode) => {
    if (!entity.children?.length || phase !== 'idle') return;
    setHovered(null);
    hovIdRef.current = null;
    setPhase('exit');
    setZoomTarget(entity.id);
    setTimeout(() => {
      setNavStack(prev => [...prev, entity]);
      setZoomTarget(null);
      setPhase('enter');
    }, 550);
  }, [phase]);

  const navigateTo = useCallback((index: number) => {
    if (phase !== 'idle') return;
    setHovered(null);
    hovIdRef.current = null;
    setPhase('exit');
    setTimeout(() => {
      setNavStack(prev => prev.slice(0, index));
      setPhase('enter');
    }, 450);
  }, [phase]);

  /* ─── hover ─── */
  const handleHover = useCallback((entity: HeapNode | null, outerEl?: HTMLDivElement) => {
    if (dragRef.current?.moved) return;
    hovIdRef.current = entity?.id ?? null;
    hovElRef.current = outerEl ?? null;
    if (entity && outerEl) {
      const r = outerEl.getBoundingClientRect();
      const c = containerRef.current?.getBoundingClientRect();
      if (c) {
        tooltipPosRef.current = { x: r.left - c.left + r.width / 2, y: r.top - c.top - 12 };
        setHovered({ node: entity, x: tooltipPosRef.current.x, y: tooltipPosRef.current.y });
      }
    } else {
      hovElRef.current = null;
      setHovered(null);
    }
  }, []);

  /* ─── drag & drop ─── */
  const handlePointerDown = useCallback((e: React.PointerEvent, entityId: string) => {
    if (phase !== 'idle') return;
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    const idx = entities.findIndex(ent => ent.id === entityId);
    if (idx < 0) return;
    const p = physicsArr.current[idx];
    if (!p) return;

    dragRef.current = {
      id: entityId,
      isSatellite: false,
      entityIdx: idx,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      baseX: p.baseX,
      baseY: p.baseY,
      moved: false,
    };
    hovIdRef.current = entityId;
  }, [phase, entities]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;

    const dx = e.clientX - d.startMouseX;
    const dy = e.clientY - d.startMouseY;

    if (!d.moved && Math.abs(dx) + Math.abs(dy) > 6) {
      d.moved = true;
      setHovered(null);
      document.body.style.cursor = 'grabbing';
    }
    if (d.moved) {
      if (d.isSatellite) {
        const sp = satPhysicsMap.current.get(d.id);
        if (sp) {
          sp.baseX = d.baseX + dx;
          sp.baseY = d.baseY + dy;
        }
      } else if (physicsArr.current[d.entityIdx]) {
        physicsArr.current[d.entityIdx].baseX = d.baseX + dx;
        physicsArr.current[d.entityIdx].baseY = d.baseY + dy;
      }
    }
  }, []);

  const handlePointerUp = useCallback(() => {
    const d = dragRef.current;
    document.body.style.cursor = '';
    if (!d) return;

    if (!d.moved) {
      if (d.isSatellite) {
        const sat = satellites.find(s => s.id === d.id);
        if (sat) zoomIn(sat);
      } else {
        const entity = entities[d.entityIdx];
        if (entity) zoomIn(entity);
      }
    }
    hovIdRef.current = null;
    dragRef.current = null;
  }, [entities, satellites, zoomIn]);

  /* ─── satellite drag ─── */
  const handleSatPointerDown = useCallback((e: React.PointerEvent, satId: string) => {
    if (phase !== 'idle') return;
    e.preventDefault();
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    const sp = satPhysicsMap.current.get(satId);
    if (!sp) return;

    dragRef.current = {
      id: satId,
      isSatellite: true,
      entityIdx: -1,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      baseX: sp.baseX,
      baseY: sp.baseY,
      moved: false,
    };
    hovIdRef.current = satId;
  }, [phase]);

  /* ─── fullscreen ─── */
  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  /* ═══════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════ */

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden select-none bg-[#06060a]"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >

      {/* ── ambient gradient ── */}
      <div
        className="absolute inset-0 pointer-events-none transition-all duration-1000"
        style={{
          background: `
            radial-gradient(ellipse 70% 60% at 50% 50%, ${COLORS[currentType].glow}, transparent),
            radial-gradient(ellipse 50% 40% at 25% 70%, ${COLORS[currentType].glow.replace('0.25', '0.06')}, transparent),
            radial-gradient(ellipse 40% 50% at 80% 30%, ${COLORS[currentType].glow.replace('0.25', '0.04')}, transparent)
          `,
        }}
      />

      {/* ── ambient particles ── */}
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute rounded-full pointer-events-none heap-particle"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
            background: COLORS[currentType].primary,
            opacity: p.opacity,
            animationDuration: `${p.dur}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}

      {/* ── SVG connections ── */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 5 }}>
        {showSats && satellites.map(sat => {
          const parentType = entities.find(e => e.id === sat.parentId)?.type ?? 'keyword';
          return (
            <line
              key={sat.id}
              ref={el => { if (el) lineEls.current.set(sat.id, el); else lineEls.current.delete(sat.id); }}
              className="heap-line"
              stroke={COLORS[parentType].primary}
              strokeOpacity={phase === 'exit' ? 0 : 0.1}
              strokeWidth={1}
              style={{ transition: 'stroke-opacity 500ms' }}
            />
          );
        })}
      </svg>

      {/* ═══ MAIN BUBBLES ═══ */}
      {entities.map((entity, i) => {
        const radius   = calcRadius(entity, i);
        const color    = COLORS[entity.type];
        const isTarget = zoomTarget === entity.id;
        const dimmed   = matchIds != null && !matchIds.has(entity.id);
        const hasKids  = (entity.children?.length ?? 0) > 0;

        // phase-driven visual state
        let opacity = 1;
        let scale   = 1;
        let delay   = 0;
        if (phase === 'exit') {
          opacity = isTarget ? 1 : 0;
          scale   = isTarget ? 1.7 : 0.15;
        } else if (phase === 'enter') {
          opacity = entered ? 1 : 0;
          scale   = entered ? 1 : 0.2;
          delay   = i * 65;
        }
        if (dimmed) opacity *= 0.1;

        const isZooming = phase !== 'idle';

        return (
          <div
            key={entity.id}
            ref={el => { if (el) bubbleEls.current.set(entity.id, el); else bubbleEls.current.delete(entity.id); }}
            className="absolute will-change-transform"
            style={{ left: 0, top: 0, zIndex: isTarget ? 50 : 10 }}
          >
            {/* visual bubble */}
            <div
              className={clsx(
                'heap-blob group',
                hasKids && 'cursor-grab active:cursor-grabbing',
              )}
              style={{
                width:  radius * 2,
                height: radius * 2,
                marginLeft: -radius,
                marginTop:  -radius,
                animationDuration: `${blobDur(i)}s`,

                background: `
                  radial-gradient(circle at 30% 30%, ${color.primary}30 0%, transparent 55%),
                  radial-gradient(circle at 70% 70%, ${color.secondary}18 0%, transparent 55%),
                  radial-gradient(circle at 50% 50%, rgba(255,255,255,0.03) 0%, transparent 70%)
                `,
                border: entity.metrics.sentiment != null
                  ? `2px solid ${sentimentHue(entity.metrics.sentiment)}90`
                  : `1.5px solid ${color.primary}40`,

                boxShadow: `
                  0 0 ${radius * 0.3}px ${color.glow},
                  0 0 ${radius * 0.6}px ${color.glow.replace('0.25', '0.10')},
                  inset 0 1px 1px rgba(255,255,255,0.04)${
                    entity.metrics.sentiment != null
                      ? `, inset 0 0 ${radius * 0.4}px ${sentimentHue(entity.metrics.sentiment)}20`
                      : ''
                  }
                `,

                ...(isZooming
                  ? {
                      opacity,
                      transform: `scale(${scale})`,
                      transition: `
                        opacity 520ms cubic-bezier(.4,0,.2,1) ${delay}ms,
                        transform 520ms cubic-bezier(.16,1,.3,1) ${delay}ms
                      `,
                    }
                  : {
                      opacity: dimmed ? 0.1 : undefined,
                      transition: 'opacity 500ms ease',
                    }),
              }}
              onPointerDown={e => handlePointerDown(e, entity.id)}
              onMouseEnter={e => {
                if (phase === 'idle' && !dragRef.current?.moved)
                  handleHover(entity, e.currentTarget.parentElement as HTMLDivElement);
              }}
              onMouseLeave={() => {
                if (!dragRef.current) handleHover(null);
              }}
            >
              {/* inner content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2 z-10">
                {entity.platform ? (
                  <span
                    className="text-[11px] font-bold transition-opacity duration-300"
                    style={{ color: PLATFORM_COLOR[entity.platform] }}
                  >
                    {entity.platform.slice(0, 2).toUpperCase()}
                  </span>
                ) : (
                  <span
                    className="text-base transition-opacity duration-300"
                    style={{ color: color.primary }}
                  >
                    {ICONS[entity.type]}
                  </span>
                )}

                <span
                  className="text-[11px] font-semibold mt-0.5 leading-tight line-clamp-2 max-w-[92%] text-white transition-colors duration-300"
                >
                  {entity.name}
                </span>

                {entity.metrics.mentions != null && (
                  <span className="text-[9px] text-white/60 mt-0.5 tabular-nums transition-colors duration-300">
                    {fmt(entity.metrics.mentions)}
                  </span>
                )}
              </div>
            </div>

            {/* child count badge */}
            {hasKids && (
              <div
                className="absolute left-1/2 -translate-x-1/2 px-2.5 py-[3px] rounded-full text-[9px] font-bold tabular-nums border opacity-70 pointer-events-none"
                style={{
                  bottom: -radius + 4,
                  background: `${color.primary}15`,
                  borderColor: `${color.primary}30`,
                  color: color.primary,
                }}
              >
                {entity.children!.length}
              </div>
            )}
          </div>
        );
      })}

      {/* ═══ SATELLITES ═══ */}
      {showSats && satellites.map((sat, si) => {
        const r = 12 + ((si * 3571) % 5);
        const color = COLORS[sat.type];
        const isExiting = phase !== 'idle';
        const hasKidsSat = (sat.children?.length ?? 0) > 0;

        return (
          <div
            key={`sat-${sat.id}`}
            ref={el => { if (el) satEls.current.set(sat.id, el); else satEls.current.delete(sat.id); }}
            className="absolute will-change-transform"
            style={{ left: 0, top: 0, zIndex: 8 }}
          >
            <div
              className={clsx(
                'heap-blob-sm group/sat',
                hasKidsSat && 'cursor-grab active:cursor-grabbing',
              )}
              style={{
                width: r * 2, height: r * 2,
                marginLeft: -r, marginTop: -r,
                animationDuration: `${8 + si * 1.3}s`,
                background: `radial-gradient(circle at 30% 30%, ${color.primary}20, transparent)`,
                border: `1px solid ${color.primary}30`,
                boxShadow: `0 0 ${r * 0.6}px ${color.glow}`,
                opacity: isExiting ? (phase === 'enter' && entered ? 0.7 : 0) : (matchIds ? 0.1 : 0.7),
                transform: `scale(${isExiting && !(phase === 'enter' && entered) ? 0.1 : 1})`,
                transition: isExiting
                  ? 'all 450ms cubic-bezier(.16,1,.3,1) 400ms'
                  : 'opacity 500ms ease, filter 300ms ease',
              }}
              onPointerDown={e => handleSatPointerDown(e, sat.id)}
              onMouseEnter={e => {
                if (phase === 'idle' && !dragRef.current?.moved)
                  handleHover(sat, e.currentTarget.parentElement as HTMLDivElement);
              }}
              onMouseLeave={() => { if (!dragRef.current) handleHover(null); }}
            >
              <span className="absolute inset-0 flex items-center justify-center text-[8px] text-white/40 font-medium truncate px-1 text-center group-hover/sat:text-white/70 transition-colors duration-300">
                {sat.name.length > 10 ? sat.name.slice(0, 8) + '…' : sat.name}
              </span>
            </div>
          </div>
        );
      })}

      {/* ═══ TOOLTIP ═══ */}
      {hovered && phase === 'idle' && (
        <div
          data-tooltip
          className="absolute pointer-events-none heap-tooltip-enter"
          style={{ left: hovered.x, top: hovered.y, transform: 'translate(-50%, -100%)', zIndex: 60 }}
        >
          <div
            className="px-4 py-3 rounded-2xl min-w-[210px] max-w-[290px]"
            style={{
              background: 'rgba(6, 6, 14, 0.92)',
              backdropFilter: 'blur(30px)',
              WebkitBackdropFilter: 'blur(30px)',
              border: `1px solid ${COLORS[hovered.node.type].primary}25`,
              boxShadow: `
                0 16px 48px rgba(0,0,0,0.6),
                0 0 1px rgba(255,255,255,0.05),
                0 0 30px ${COLORS[hovered.node.type].glow}
              `,
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span
                className="text-[9px] px-2 py-[3px] rounded-md font-bold uppercase tracking-wider"
                style={{
                  background: `${COLORS[hovered.node.type].primary}15`,
                  color: COLORS[hovered.node.type].primary,
                }}
              >
                {TYPE_LABEL[hovered.node.type]}
              </span>
              {hovered.node.platform && (
                <span className="text-[8px] font-bold uppercase tracking-wide" style={{ color: PLATFORM_COLOR[hovered.node.platform] }}>
                  {hovered.node.platform}
                </span>
              )}
            </div>

            <h3 className="text-[13px] font-semibold text-white leading-snug">{hovered.node.name}</h3>

            {hovered.node.author && (
              <p className="text-[10px] text-white/25 mt-0.5">@{hovered.node.author}</p>
            )}

            {(hovered.node.description || hovered.node.content) && (
              <p className="text-[11px] text-white/25 mt-1.5 leading-relaxed line-clamp-2">
                {hovered.node.description || hovered.node.content}
              </p>
            )}

            <div className="flex gap-4 mt-2.5 text-[10px]">
              {hovered.node.metrics.mentions != null && (
                <div>
                  <span className="text-white/15 block mb-0.5">Mentions</span>
                  <span className="text-white font-semibold">{fmt(hovered.node.metrics.mentions)}</span>
                </div>
              )}
              {hovered.node.metrics.engagement != null && (
                <div>
                  <span className="text-white/15 block mb-0.5">Engagement</span>
                  <span className="text-white font-semibold">{fmt(hovered.node.metrics.engagement)}</span>
                </div>
              )}
              {hovered.node.metrics.sentiment != null && (
                <div>
                  <span className="text-white/15 block mb-0.5">Sentiment</span>
                  <span className="font-semibold" style={{ color: sentimentHue(hovered.node.metrics.sentiment) }}>
                    {hovered.node.metrics.sentiment}%
                  </span>
                </div>
              )}
            </div>

            {(hovered.node.children?.length ?? 0) > 0 && (
              <div className="mt-2.5 pt-2 border-t border-white/[0.04] text-[9px] text-white/15 tracking-wide flex items-center gap-1">
                <span>Click to explore</span>
                <span className="font-semibold text-white/25">{hovered.node.children!.length}</span>
                <span>{TYPE_LABEL[hovered.node.children![0].type].toLowerCase()}s</span>
                <span className="ml-auto opacity-50">→</span>
              </div>
            )}
          </div>

          {/* arrow */}
          <div
            className="absolute left-1/2 -translate-x-1/2 -bottom-[5px] w-2.5 h-2.5 rotate-45"
            style={{
              background: 'rgba(6, 6, 14, 0.92)',
              borderRight: `1px solid ${COLORS[hovered.node.type].primary}25`,
              borderBottom: `1px solid ${COLORS[hovered.node.type].primary}25`,
            }}
          />
        </div>
      )}

      {/* ═══ BREADCRUMB ═══ */}
      <div className="absolute top-3 left-4 z-30 flex items-center gap-0.5">
        <button
          onClick={() => navigateTo(0)}
          className={clsx(
            'px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all duration-300',
            navStack.length === 0
              ? 'bg-white/[0.06] text-white/50'
              : 'text-white/15 hover:text-white/45 hover:bg-white/[0.04]',
          )}
        >
          ⬡ All
        </button>
        {navStack.map((node, i) => (
          <div key={node.id} className="flex items-center gap-0.5">
            <span className="text-white/[0.06] text-[9px] mx-0.5">›</span>
            <button
              onClick={() => navigateTo(i + 1)}
              className={clsx(
                'px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all duration-300 max-w-[140px] truncate',
                i === navStack.length - 1
                  ? 'bg-white/[0.06] text-white/50'
                  : 'text-white/15 hover:text-white/45 hover:bg-white/[0.04]',
              )}
            >
              {node.name}
            </button>
          </div>
        ))}
      </div>

      {/* ═══ FULLSCREEN + SEARCH ═══ */}
      <div className="absolute top-3 right-4 z-30 flex items-center gap-1.5">
        <button
          onClick={toggleFullscreen}
          className="p-2 rounded-xl text-white/10 hover:text-white/35 hover:bg-white/[0.03] transition-all"
          title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
        >
          {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>
        {searchOpen ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.03] backdrop-blur-2xl border border-white/[0.06]">
            <Search className="w-3.5 h-3.5 text-white/15 shrink-0" />
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => { if (e.key === 'Escape') { setSearchOpen(false); setSearch(''); } }}
              placeholder="Search…"
              className="bg-transparent text-[12px] text-white placeholder:text-white/10 outline-none w-40"
            />
            {search && (
              <span className="text-[8px] text-white/15 tabular-nums shrink-0">
                {matchIds?.size ?? 0}/{entities.length}
              </span>
            )}
            <button onClick={() => { setSearchOpen(false); setSearch(''); }}>
              <X className="w-3 h-3 text-white/10 hover:text-white/35 transition-colors" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setSearchOpen(true)}
            className="p-2 rounded-xl text-white/10 hover:text-white/35 hover:bg-white/[0.03] transition-all"
          >
            <Search className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* ═══ LEVEL INFO ═══ */}
      <div className="absolute bottom-3 left-4 z-30 pointer-events-none">
        <p className="text-[9px] text-white/15 uppercase tracking-[0.2em] font-semibold mb-0.5">
          {entities.length} {currentType}{entities.length !== 1 ? 's' : ''}
        </p>
        <h2 className="text-sm font-semibold text-white/35 tracking-tight">
          {navStack.length === 0 ? 'All Campaigns' : navStack[navStack.length - 1].name}
        </h2>
      </div>

      {/* ═══ DRAG HINT ═══ */}
      {navStack.length === 0 && phase === 'idle' && !hovered && (
        <div className="absolute bottom-3 right-4 z-30 text-[10px] text-white/15 tracking-wider pointer-events-none">
          drag · click to explore
        </div>
      )}
    </div>
  );
}
