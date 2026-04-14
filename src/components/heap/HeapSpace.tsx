'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Search, X, Maximize2, Minimize2, ExternalLink } from 'lucide-react';
import clsx from 'clsx';
import type { HeapNode, PhysicsState, SatelliteData, EntityType, PlatformType } from './types';
import { heapData as rawHeapData } from './mock-data';
import { enrichMockData } from './enrich';
import BubbleSVGOverlay from './BubbleSVGOverlay';
import AutoSpotlightTooltip from './AutoSpotlightTooltip';
import PostTooltip from './tooltips/PostTooltip';
import { enrichPostData } from './tooltips/enrich-post';
import { SentimentDonut, SparkBars, MiniArea } from './tooltips/shared/MiniCharts';
import { useAutoSpotlight } from '@/hooks/useAutoSpotlight';
import { getBubbleContentTier, getMetricFontSize, getLabelMaxChars, sparklinePoints } from '@/lib/map/calculations';
import { getSentimentColor } from '@/lib/map/colors';
import { truncateBubbleLabel } from '@/lib/map/truncate';

const heapData = enrichMockData(rawHeapData);

/* ═══════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════ */

const COLORS: Record<EntityType, { primary: string; secondary: string; glow: string; glowStrong: string }> = {
  campaign: { primary: '#8b5cf6', secondary: '#7c3aed', glow: 'rgba(139,92,246,0.18)', glowStrong: 'rgba(139,92,246,0.35)' },
  project:  { primary: '#0891b2', secondary: '#0e7490', glow: 'rgba(8,145,178,0.18)',  glowStrong: 'rgba(8,145,178,0.35)' },
  keyword:  { primary: '#059669', secondary: '#047857', glow: 'rgba(5,150,105,0.18)',  glowStrong: 'rgba(5,150,105,0.35)' },
  post:     { primary: '#ea580c', secondary: '#c2410c', glow: 'rgba(234,88,12,0.18)',  glowStrong: 'rgba(234,88,12,0.35)' },
  comment:  { primary: '#64748b', secondary: '#475569', glow: 'rgba(100,116,139,0.12)', glowStrong: 'rgba(100,116,139,0.25)' },
};

const ICONS: Record<EntityType, string> = {
  campaign: '◆', project: '⬡', keyword: '#', post: '◉', comment: '💬',
};

const TYPE_LABEL: Record<EntityType, string> = {
  campaign: 'Campaign', project: 'Project', keyword: 'Keyword', post: 'Post', comment: 'Comment',
};

const PLATFORM_COLOR: Record<PlatformType, string> = {
  tiktok: '#fe2c55', facebook: '#1877f2', youtube: '#ff0000',
};

const PLATFORM_ABBR: Record<PlatformType, string> = {
  tiktok: 'TT', facebook: 'FB', youtube: 'YB',
};

const PARTICLE_COUNT = 30;

/* ═══════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════ */

/** Deterministic pseudo-random so SSR & client produce identical values */
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

/** Radius based on mentions — more mentions = bigger bubble.
 *  Minimum 36px diameter (18px radius) for touch targets. */
function calcRadius(node: HeapNode, index: number): number {
  const val = node.metrics.mentions ?? node.metrics.engagement ?? 1000;
  const base = node.type === 'comment' ? 18 : node.type === 'post' ? 24 : 32;
  const max  = node.type === 'campaign' ? 64 : node.type === 'project' ? 52 : 44;
  const r = Math.min(max, Math.max(base, base + Math.log10(Math.max(1, val)) * 6));
  const jitter = 0.93 + (((index * 7919) % 100) / 100) * 0.14;
  return Math.round(r * jitter);
}

/** Compute engagement rank (0-1) for visual hierarchy differentiation */
function engagementRank(node: HeapNode, allNodes: HeapNode[]): number {
  const val = node.metrics.mentions ?? node.metrics.engagement ?? 0;
  const vals = allNodes
    .filter(n => n.type !== 'comment')
    .map(n => n.metrics.mentions ?? n.metrics.engagement ?? 0);
  if (vals.length <= 1) return 1;
  const sorted = [...vals].sort((a, b) => a - b);
  const idx = sorted.findIndex(v => v >= val);
  return idx / (sorted.length - 1);
}

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return String(n);
}

function sentimentHue(s: number | undefined): string {
  if (s == null) return '#94a3b8';
  if (s >= 70) return '#059669';
  if (s >= 40) return '#d97706';
  return '#dc2626';
}

/** Higher sentiment → more visually prominent (0.5–1.0) */
function sentimentIntensity(s: number | undefined): number {
  if (s == null) return 0.7;
  return 0.5 + (s / 100) * 0.5;
}

/** Golden-angle spiral + collision resolution for even spread across full area */
function createPhysics(count: number, w: number, h: number, radii?: number[]): PhysicsState[] {
  const cx = w / 2;
  const cy = h / 2;
  // Use most of the container — leave 80px padding
  const spreadX = (w - 160) / 2;
  const spreadY = (h - 160) / 2;
  const golden = Math.PI * (3 - Math.sqrt(5));
  const padding = 80;

  // Initial placement: golden spiral scaled to ellipse
  const positions = Array.from({ length: count }, (_, i) => {
    const t = (i + 0.5) / Math.max(count, 1);
    const r = Math.sqrt(t);
    const angle = i * golden;
    return {
      x: cx + Math.cos(angle) * r * spreadX,
      y: cy + Math.sin(angle) * r * spreadY,
    };
  });

  // Collision resolution: 20 relaxation iterations
  const minGap = 14; // minimum gap between bubble edges
  for (let iter = 0; iter < 20; iter++) {
    for (let i = 0; i < count; i++) {
      for (let j = i + 1; j < count; j++) {
        const dx = positions[j].x - positions[i].x;
        const dy = positions[j].y - positions[i].y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const ri = (radii?.[i] ?? 35) + minGap;
        const rj = (radii?.[j] ?? 35) + minGap;
        const minDist = ri + rj;
        if (dist < minDist) {
          const overlap = (minDist - dist) / 2;
          const nx = dx / dist;
          const ny = dy / dist;
          positions[i].x -= nx * overlap * 0.5;
          positions[i].y -= ny * overlap * 0.5;
          positions[j].x += nx * overlap * 0.5;
          positions[j].y += ny * overlap * 0.5;
        }
      }
      // Clamp to bounds
      positions[i].x = Math.max(padding, Math.min(w - padding, positions[i].x));
      positions[i].y = Math.max(padding, Math.min(h - padding, positions[i].y));
    }
  }

  return positions.map(pos => ({
    baseX: pos.x,
    baseY: pos.y,
    oscFreqX: 0.10 + Math.random() * 0.15,
    oscFreqY: 0.08 + Math.random() * 0.12,
    oscAmpX:  3 + Math.random() * 8,
    oscAmpY:  2 + Math.random() * 7,
    phaseX:   Math.random() * Math.PI * 2,
    phaseY:   Math.random() * Math.PI * 2,
  }));
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
  const hideTimeoutRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tooltipHoveredRef = useRef(false);

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
  const [mounted, setMounted]           = useState(false);
  const [detailNode, setDetailNode]     = useState<HeapNode | null>(null);

  useEffect(() => { setMounted(true); }, []);

  /* ─── auto-spotlight ─── */
  const bubblePosMap = useRef<Map<string, { x: number; y: number }>>(new Map());
  const spotlightPaused = !!(hovered || phase !== 'idle' || searchOpen || detailNode || !mounted);
  const { activeTooltip: spotlight, spotlightedId, dismiss: dismissSpotlight } = useAutoSpotlight(
    entities,
    containerRef.current,
    spotlightPaused,
  );

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
        x: seededRandom(i * 6 + 1) * 100,
        y: seededRandom(i * 6 + 2) * 100,
        size: 2 + seededRandom(i * 6 + 3) * 2,
        opacity: 0.06 + seededRandom(i * 6 + 4) * 0.08,
        dur: 18 + seededRandom(i * 6 + 5) * 24,
        delay: -seededRandom(i * 6 + 6) * 30,
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
    const radii = entities.map((e, i) => calcRadius(e, i));
    physicsArr.current = createPhysics(entities.length, w, h, radii);

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
      const radii = entities.map((e, i) => calcRadius(e, i));
      physicsArr.current = createPhysics(entities.length, w, h, radii);
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
        bubblePosMap.current.set(entity.id, { x, y });
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

  /* ─── hover (with delayed hide for hoverable tooltip) ─── */
  const handleHover = useCallback((entity: HeapNode | null, outerEl?: HTMLDivElement) => {
    if (dragRef.current?.moved) return;

    if (entity && outerEl) {
      // Clear any pending hide
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }
      hovIdRef.current = entity.id;
      hovElRef.current = outerEl;
      const r = outerEl.getBoundingClientRect();
      const c = containerRef.current?.getBoundingClientRect();
      if (c) {
        tooltipPosRef.current = { x: r.left - c.left + r.width / 2, y: r.top - c.top - 12 };
        setHovered({ node: entity, x: tooltipPosRef.current.x, y: tooltipPosRef.current.y });
      }
    } else {
      // Delay hide to allow mouse to reach tooltip
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = setTimeout(() => {
        if (!tooltipHoveredRef.current) {
          hovIdRef.current = null;
          hovElRef.current = null;
          setHovered(null);
        }
      }, 300);
    }
  }, []);

  const handleTooltipEnter = useCallback(() => {
    tooltipHoveredRef.current = true;
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  }, []);

  const handleTooltipLeave = useCallback(() => {
    tooltipHoveredRef.current = false;
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    hideTimeoutRef.current = setTimeout(() => {
      hovIdRef.current = null;
      hovElRef.current = null;
      setHovered(null);
    }, 200);
  }, []);

  const openDetail = useCallback((node: HeapNode) => {
    setDetailNode(node);
    setHovered(null);
    hovIdRef.current = null;
    hovElRef.current = null;
    tooltipHoveredRef.current = false;
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
      className="relative w-full h-full overflow-hidden select-none transition-colors duration-300"
      style={{ background: 'var(--bg-base)' }}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >

      {/* ── subtle dot grid for spatial reference ── */}
      <div className="absolute inset-0 pointer-events-none bg-grid" />

      {/* ── ambient particles (client-only to avoid hydration mismatch) ── */}
      {mounted && particles.map(p => (
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
        const isComment = entity.type === 'comment';
        const si = sentimentIntensity(entity.metrics.sentiment);
        // Engagement rank (0=lowest, 1=highest) for visual hierarchy
        const rank = isComment ? 0.3 : engagementRank(entity, entities);

        // Comment: just a text line, no bubble shape
        const bubbleW = isComment ? radius * 5 : radius * 2;
        const bubbleH = isComment ? radius * 1.2 : radius * 2;

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

        // Visual weight from engagement rank (0.3–1.0)
        const weight = 0.3 + rank * 0.7;
        const blobOpacity = opacity;

        const isZooming = phase !== 'idle';

        // Sentiment drives the main hue — this is functional color
        const sentHue = sentimentHue(entity.metrics.sentiment);
        // Type color is secondary — used for subtle tint only
        const typeHue = color.primary;

        return (
          <div
            key={entity.id}
            ref={el => { if (el) bubbleEls.current.set(entity.id, el); else bubbleEls.current.delete(entity.id); }}
            className="absolute will-change-transform"
            style={{ left: 0, top: 0, zIndex: isTarget ? 50 : 10 }}
          >
            {isComment ? (
              /* ═══ COMMENT: plain floating text, no bubble ═══ */
              <div
                className="absolute flex items-center gap-2 whitespace-nowrap cursor-default hover:brightness-150 transition-all duration-300"
                style={{
                  width: bubbleW,
                  height: bubbleH,
                  marginLeft: -bubbleW / 2,
                  marginTop: -bubbleH / 2,
                  ...(isZooming
                    ? {
                        opacity: opacity * si,
                        transform: `scale(${scale})`,
                        transition: `
                          opacity 520ms cubic-bezier(.4,0,.2,1) ${delay}ms,
                          transform 520ms cubic-bezier(.16,1,.3,1) ${delay}ms
                        `,
                      }
                    : {
                        opacity: dimmed ? 0.1 : si,
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
                {entity.author && (
                  <span
                    className="text-[11px] font-bold shrink-0"
                    style={{ color: `${sentimentHue(entity.metrics.sentiment)}` }}
                  >
                    {entity.author}
                  </span>
                )}
                <span className="text-[11px] font-medium truncate" style={{ color: 'var(--text-secondary)' }}>
                  {entity.content || entity.name}
                </span>
              </div>
            ) : (
              /* ═══ NON-COMMENT: blob bubble ═══ */
              <>
                {/* visual bubble */}
                <div
                  className={clsx(
                    'heap-blob group',
                    hasKids && 'cursor-grab active:cursor-grabbing',
                    spotlightedId && spotlightedId === entity.id && 'spotlight-active',
                    spotlightedId && spotlightedId !== entity.id && 'spotlight-dimmed',
                  )}
                  style={{
                    width:  bubbleW,
                    height: bubbleH,
                    marginLeft: -bubbleW / 2,
                    marginTop:  -bubbleH / 2,
                    animationDuration: `${blobDur(i)}s`,

                    background: `
                      radial-gradient(circle at 30% 25%, var(--bubble-highlight) 0%, transparent 45%),
                      radial-gradient(circle at 50% 50%, ${sentHue}${Math.round(0x30 + weight * 0x45).toString(16).padStart(2, '0')} 0%, ${sentHue}${Math.round(0x18 + weight * 0x20).toString(16).padStart(2, '0')} 70%, transparent 100%),
                      ${typeHue}${Math.round(0x10 + weight * 0x12).toString(16).padStart(2, '0')}
                    `,
                    border: `${1.5 + weight * 1.5}px solid ${sentHue}${Math.round(0x50 + weight * 0x50).toString(16).padStart(2, '0')}`,

                    boxShadow: `
                      0 ${2 + weight * 8}px ${radius * 0.4 + weight * 16}px ${sentHue}${Math.round(0x10 + weight * 0x28).toString(16).padStart(2, '0')},
                      0 ${weight * 3}px ${4 + weight * 6}px rgba(0,0,0,${(0.04 + weight * 0.08).toFixed(2)}),
                      inset 0 1px 2px rgba(255,255,255,${(0.25 + weight * 0.25).toFixed(2)})
                      ${weight > 0.5
                        ? `, inset 0 0 ${radius * 0.4 * weight}px ${sentHue}18`
                        : ''
                      }
                    `,

                    ...(isZooming
                      ? {
                          opacity: blobOpacity,
                          transform: `scale(${scale})`,
                          transition: `
                            opacity 520ms cubic-bezier(.4,0,.2,1) ${delay}ms,
                            transform 520ms cubic-bezier(.16,1,.3,1) ${delay}ms
                          `,
                        }
                      : {
                          opacity: dimmed ? 0.08 : blobOpacity,
                          transition: 'opacity 500ms ease, transform 200ms ease, box-shadow 200ms ease',
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
                />

                {/* SVG overlay: sentiment ring, pulse, sparkline, trend, crisis */}
                <BubbleSVGOverlay
                  node={entity}
                  radius={radius}
                  hidden={isZooming || dimmed}
                />

                {/* content label — metric-first adaptive layout */}
                {(() => {
                  const tier = getBubbleContentTier(radius);
                  const maxChars = getLabelMaxChars(tier);
                  const shortLabel = maxChars > 0 ? truncateBubbleLabel(entity.name, maxChars) : '';
                  const metricVal = entity.metrics.mentions ?? entity.metrics.engagement;
                  const metricStr = metricVal != null ? fmt(metricVal) : '';
                  const metricFontPx = getMetricFontSize(tier);
                  const sentColor = getSentimentColor(entity.metrics.sentiment);
                  const showSparkline = tier !== 'sm' && entity.trendData && entity.trendData.length >= 2;
                  const sparkW = radius * 0.7;
                  const sparkH = tier === 'md' ? 10 : 14;

                  return (
                    <div
                      className="absolute flex flex-col items-center justify-center text-center pointer-events-none"
                      style={{
                        width:  bubbleW,
                        height: bubbleH,
                        left: -bubbleW / 2,
                        top:  -bubbleH / 2,
                        zIndex: 11,
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
                    >
                      {/* Short label — XL + LG only */}
                      {shortLabel && (
                        <span
                          className="font-medium leading-tight truncate max-w-[90%]"
                          style={{ color: 'var(--bubble-text-secondary)', fontSize: tier === 'xl' ? 11 : 10 }}
                        >
                          {shortLabel}
                        </span>
                      )}

                      {/* Metric hero — always visible */}
                      {metricStr && (
                        <span
                          className="font-bold tabular-nums leading-none"
                          style={{
                            fontSize: metricFontPx,
                            marginTop: shortLabel ? 2 : 0,
                            color: tier === 'sm' ? sentColor : 'var(--bubble-text)',
                          }}
                        >
                          {metricStr}
                        </span>
                      )}

                      {/* Sparkline — XL, LG, MD — area fill + bold stroke */}
                      {showSparkline && (() => {
                        const pts = sparklinePoints(entity.trendData!, sparkW / 2, sparkH / 2, sparkW, sparkH);
                        // Build closed path for area fill
                        const areaPath = `M0,${sparkH} L${pts} L${sparkW},${sparkH} Z`;
                        return (
                          <svg
                            width={sparkW}
                            height={sparkH}
                            className="mt-0.5"
                            style={{ overflow: 'visible' }}
                          >
                            <path
                              d={areaPath}
                              fill={sentColor}
                              opacity={0.12}
                            />
                            <polyline
                              points={pts}
                              fill="none"
                              stroke={sentColor}
                              strokeWidth={tier === 'xl' ? 2.5 : 2}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              opacity={0.7}
                            />
                          </svg>
                        );
                      })()}

                      {/* Sentiment badge with shape indicator — XL + LG */}
                      {(tier === 'xl' || tier === 'lg') && entity.metrics.sentiment != null && (
                        <span
                          className="mt-1 px-2 py-[2px] rounded-full font-semibold tabular-nums flex items-center gap-0.5"
                          style={{
                            fontSize: tier === 'xl' ? 9 : 8,
                            background: `${sentColor}20`,
                            color: sentColor,
                            border: `1px solid ${sentColor}25`,
                          }}
                        >
                          {entity.trendDirection === 'up' ? '▲' : entity.trendDirection === 'down' ? '▼' : '●'}
                          {' '}{entity.metrics.sentiment}%
                        </span>
                      )}
                    </div>
                  );
                })()}
              </>
            )}

            {/* child count badge — anchored inside bubble bottom */}
            {hasKids && !isComment && (
              <div
                className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1 px-1.5 py-[2px] rounded-full text-[8px] font-bold tabular-nums pointer-events-none"
                style={{
                  top: bubbleH / 2 - 14,
                  background: `${sentHue}18`,
                  color: sentHue,
                  whiteSpace: 'nowrap',
                }}
              >
                <span>{entity.children!.length}</span>
                <span className="text-[7px] font-medium opacity-60">
                  {entity.children![0].type === 'comment' ? 'cmt' : 'sub'}
                </span>
              </div>
            )}
          </div>
        );
      })}

      {/* ═══ SATELLITES ═══ */}
      {showSats && satellites.map((sat, si) => {
        const r = 20 + ((si * 3571) % 7);
        const color = COLORS[sat.type];
        const isExiting = phase !== 'idle';
        const hasKidsSat = (sat.children?.length ?? 0) > 0;
        const isComment = sat.type === 'comment';
        const intensity = sentimentIntensity(sat.metrics.sentiment);

        // Comment satellites: just floating text, no bubble
        const satW = isComment ? r * 4 : r * 2;
        const satH = isComment ? r * 1 : r * 2;
        const baseOpacity = 0.7 * intensity;

        return (
          <div
            key={`sat-${sat.id}`}
            ref={el => { if (el) satEls.current.set(sat.id, el); else satEls.current.delete(sat.id); }}
            className="absolute will-change-transform"
            style={{ left: 0, top: 0, zIndex: 8 }}
          >
            {isComment ? (
              /* Comment satellite: plain floating text */
              <div
                className="flex items-center gap-1 whitespace-nowrap cursor-default hover:brightness-150 transition-all duration-300"
                style={{
                  width: satW, height: satH,
                  marginLeft: -satW / 2, marginTop: -satH / 2,
                  opacity: isExiting ? (phase === 'enter' && entered ? baseOpacity : 0) : (matchIds ? 0.1 : baseOpacity),
                  transform: `scale(${isExiting && !(phase === 'enter' && entered) ? 0.1 : 1})`,
                  transition: isExiting
                    ? 'all 450ms cubic-bezier(.16,1,.3,1) 400ms'
                    : 'opacity 500ms ease',
                }}
                onPointerDown={e => handleSatPointerDown(e, sat.id)}
                onMouseEnter={e => {
                  if (phase === 'idle' && !dragRef.current?.moved)
                    handleHover(sat, e.currentTarget.parentElement as HTMLDivElement);
                }}
                onMouseLeave={() => { if (!dragRef.current) handleHover(null); }}
              >
                <span className="text-[9px] font-medium truncate" style={{ color: 'var(--text-muted)' }}>
                  {sat.content ? (sat.content.length > 25 ? sat.content.slice(0, 23) + '…' : sat.content) : sat.name}
                </span>
              </div>
            ) : (
              /* Non-comment satellite: blob */
              <div
                className={clsx('heap-blob-sm group/sat', hasKidsSat && 'cursor-grab active:cursor-grabbing')}
                style={{
                  width: satW, height: satH,
                  marginLeft: -satW / 2, marginTop: -satH / 2,
                  animationDuration: `${8 + si * 1.3}s`,
                  background: `radial-gradient(circle at 30% 30%, ${color.primary}${Math.round(intensity * 0x40).toString(16).padStart(2, '0')}, var(--bg-surface))`,
                  border: `1px solid ${color.primary}${Math.round(intensity * 0x35).toString(16).padStart(2, '0')}`,
                  boxShadow: `0 2px 8px ${color.glow}, 0 1px 3px rgba(0,0,0,0.04)`,
                  opacity: isExiting ? (phase === 'enter' && entered ? baseOpacity : 0) : (matchIds ? 0.1 : baseOpacity),
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
                <span className="absolute inset-0 flex items-center justify-center text-[8px] font-medium truncate px-1 text-center transition-colors duration-300" style={{ color: 'var(--bubble-text-secondary)' }}>
                  {sat.name.length > 10 ? sat.name.slice(0, 8) + '…' : sat.name}
                </span>
              </div>
            )}
          </div>
        );
      })}

      {/* ═══ AUTO-SPOTLIGHT TOOLTIP ═══ */}
      {spotlight && !hovered && phase === 'idle' && (() => {
        const spotEntity = entities.find(e => e.id === spotlight.entityId);
        const spotPos = bubblePosMap.current.get(spotlight.entityId);
        const spotIdx = entities.findIndex(e => e.id === spotlight.entityId);
        if (!spotEntity || !spotPos || spotIdx < 0) return null;
        const spotR = calcRadius(spotEntity, spotIdx);
        const cRect = containerRef.current?.getBoundingClientRect();
        const cw = cRect?.width ?? 800;
        const ch = cRect?.height ?? 600;
        return (
          <AutoSpotlightTooltip
            event={spotlight.event}
            entity={spotEntity}
            bubblePos={spotPos}
            bubbleRadius={spotR}
            containerSize={{ width: cw, height: ch }}
            onDismiss={dismissSpotlight}
          />
        );
      })()}

      {/* ═══ TOOLTIP (hoverable) ═══ */}
      {hovered && phase === 'idle' && (
        <div
          data-tooltip
          className="absolute heap-tooltip-enter"
          style={{ left: hovered.x, top: hovered.y, transform: 'translate(-50%, -100%)', zIndex: 60, pointerEvents: 'auto' }}
          onMouseEnter={handleTooltipEnter}
          onMouseLeave={handleTooltipLeave}
          onClick={e => e.stopPropagation()}
          onPointerDown={e => e.stopPropagation()}
        >
          {/* Platform-native tooltip for posts */}
          {hovered.node.type === 'post' && (() => {
            const postData = enrichPostData(hovered.node);
            if (postData) return (
              <div style={{
                boxShadow: `0 8px 32px rgba(0,0,0,0.08), 0 0 0 1px ${COLORS[hovered.node.type].primary}15`,
                borderRadius: 10,
              }}>
                <PostTooltip post={postData} />
              </div>
            );
            return null;
          })()}

          {/* Generic tooltip for non-posts */}
          {hovered.node.type !== 'post' && (
            <>
              <div
                className="px-4 py-3 rounded-2xl min-w-[210px] max-w-[290px]"
                style={{
                  background: 'var(--bg-elevated)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: `1px solid ${COLORS[hovered.node.type].primary}20`,
                  boxShadow: 'var(--shadow-lg)',
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="text-[9px] px-2 py-[3px] rounded-md font-bold uppercase tracking-wider"
                    style={{
                      background: `${COLORS[hovered.node.type].primary}12`,
                      color: COLORS[hovered.node.type].primary,
                    }}
                  >
                    {TYPE_LABEL[hovered.node.type]}
                  </span>
                  {hovered.node.platform && (
                    <span
                      className="text-[9px] font-bold px-1.5 py-[2px] rounded"
                      style={{
                        color: PLATFORM_COLOR[hovered.node.platform],
                        background: `${PLATFORM_COLOR[hovered.node.platform]}10`,
                      }}
                    >
                      {PLATFORM_ABBR[hovered.node.platform]}
                    </span>
                  )}
                </div>

                <h3 className="text-[13px] font-semibold leading-snug" style={{ color: 'var(--text-primary)' }}>{hovered.node.name}</h3>

                {hovered.node.author && (
                  <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>@{hovered.node.author}</p>
                )}

                {(hovered.node.description || hovered.node.content) && (
                  <p className="text-[11px] mt-1.5 leading-relaxed line-clamp-2" style={{ color: 'var(--text-muted)' }}>
                    {hovered.node.description || hovered.node.content}
                  </p>
                )}

                <div className="flex gap-4 mt-2.5 text-[10px]">
                  {hovered.node.metrics.mentions != null && (
                    <div>
                      <span className="block mb-0.5" style={{ color: 'var(--text-faint)' }}>Mentions</span>
                      <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{fmt(hovered.node.metrics.mentions)}</span>
                    </div>
                  )}
                  {hovered.node.metrics.engagement != null && (
                    <div>
                      <span className="block mb-0.5" style={{ color: 'var(--text-faint)' }}>Engagement</span>
                      <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{fmt(hovered.node.metrics.engagement)}</span>
                    </div>
                  )}
                  {hovered.node.metrics.sentiment != null && (
                    <div>
                      <span className="block mb-0.5" style={{ color: 'var(--text-faint)' }}>Sentiment</span>
                      <span className="font-semibold" style={{ color: sentimentHue(hovered.node.metrics.sentiment) }}>
                        {hovered.node.metrics.sentiment}%
                      </span>
                    </div>
                  )}
                </div>

                {/* Mini charts row */}
                <div className="flex items-center gap-3 mt-3 pt-2.5" style={{ borderTop: '1px solid var(--border)' }}>
                  {hovered.node.metrics.sentiment != null && (
                    <div className="flex flex-col items-center gap-0.5">
                      <SentimentDonut value={hovered.node.metrics.sentiment} size={34} />
                      <span className="text-[7px]" style={{ color: 'var(--text-faint)' }}>sentiment</span>
                    </div>
                  )}
                  {hovered.node.trendData && hovered.node.trendData.length >= 2 && (
                    <div className="flex flex-col gap-0.5 flex-1">
                      <MiniArea data={hovered.node.trendData} width={70} height={22} color={COLORS[hovered.node.type].primary} />
                      <span className="text-[7px]" style={{ color: 'var(--text-faint)' }}>7-day trend</span>
                    </div>
                  )}
                  {hovered.node.trendData && hovered.node.trendData.length >= 2 && (
                    <div className="flex flex-col gap-0.5">
                      <SparkBars data={hovered.node.trendData} width={46} height={22} color={COLORS[hovered.node.type].secondary} />
                      <span className="text-[7px]" style={{ color: 'var(--text-faint)' }}>activity</span>
                    </div>
                  )}
                </div>

                {/* Action bar: Expand button */}
                <div className="mt-2 pt-2 flex items-center gap-2" style={{ borderTop: '1px solid var(--border)' }}>
                  <button
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all duration-200"
                    style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)' }}
                    onClick={() => openDetail(hovered.node)}
                  >
                    <ExternalLink className="w-3 h-3" />
                    Expand
                  </button>

                  {(hovered.node.children?.length ?? 0) > 0 && (
                    <span className="text-[9px] tracking-wide flex items-center gap-1 ml-auto" style={{ color: 'var(--text-faint)' }}>
                      <span className="font-semibold" style={{ color: 'var(--text-muted)' }}>{hovered.node.children!.length}</span>
                      <span>{TYPE_LABEL[hovered.node.children![0].type].toLowerCase()}s</span>
                      <span className="opacity-50">→</span>
                    </span>
                  )}
                </div>
              </div>

              {/* arrow */}
              <div
                className="absolute left-1/2 -translate-x-1/2 -bottom-[5px] w-2.5 h-2.5 rotate-45"
                style={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  borderRight: `1px solid ${COLORS[hovered.node.type].primary}20`,
                  borderBottom: `1px solid ${COLORS[hovered.node.type].primary}20`,
                }}
              />
            </>
          )}
        </div>
      )}

      {/* ═══ DETAIL MODAL ═══ */}
      {detailNode && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ zIndex: 70 }}
          onClick={() => setDetailNode(null)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />

          {/* Content */}
          <div
            className="relative z-10 w-full max-w-[480px] mx-4 rounded-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--bg-elevated)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: `1px solid ${COLORS[detailNode.type].primary}18`,
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            {/* Header */}
            <div className="px-5 pt-4 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="text-[9px] px-2 py-[3px] rounded-md font-bold uppercase tracking-wider"
                    style={{ background: `${COLORS[detailNode.type].primary}12`, color: COLORS[detailNode.type].primary }}
                  >
                    {TYPE_LABEL[detailNode.type]}
                  </span>
                  {detailNode.platform && (
                    <span
                      className="text-[9px] font-bold px-1.5 py-[2px] rounded"
                      style={{ color: PLATFORM_COLOR[detailNode.platform], background: `${PLATFORM_COLOR[detailNode.platform]}10` }}
                    >
                      {PLATFORM_ABBR[detailNode.platform]}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setDetailNode(null)}
                  className="p-1 rounded-lg transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <h2 className="text-[15px] font-semibold mt-2" style={{ color: 'var(--text-primary)' }}>{detailNode.name}</h2>
              {detailNode.author && <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>@{detailNode.author}</p>}
            </div>

            {/* Body */}
            <div className="px-5 py-4">
              {(detailNode.description || detailNode.content) && (
                <p className="text-[13px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {detailNode.description || detailNode.content}
                </p>
              )}

              {/* Metrics */}
              <div className="flex gap-6 mt-4">
                {detailNode.metrics.mentions != null && (
                  <div>
                    <span className="text-[10px] block mb-1" style={{ color: 'var(--text-faint)' }}>Mentions</span>
                    <span className="font-semibold text-[15px]" style={{ color: 'var(--text-primary)' }}>{fmt(detailNode.metrics.mentions)}</span>
                  </div>
                )}
                {detailNode.metrics.engagement != null && (
                  <div>
                    <span className="text-[10px] block mb-1" style={{ color: 'var(--text-faint)' }}>Engagement</span>
                    <span className="font-semibold text-[15px]" style={{ color: 'var(--text-primary)' }}>{fmt(detailNode.metrics.engagement)}</span>
                  </div>
                )}
                {detailNode.metrics.sentiment != null && (
                  <div>
                    <span className="text-[10px] block mb-1" style={{ color: 'var(--text-faint)' }}>Sentiment</span>
                    <span className="font-semibold text-[15px]" style={{ color: sentimentHue(detailNode.metrics.sentiment) }}>
                      {detailNode.metrics.sentiment}%
                    </span>
                  </div>
                )}
                {detailNode.metrics.childCount != null && (
                  <div>
                    <span className="text-[10px] block mb-1" style={{ color: 'var(--text-faint)' }}>Children</span>
                    <span className="font-semibold text-[15px]" style={{ color: 'var(--text-primary)' }}>{detailNode.metrics.childCount}</span>
                  </div>
                )}
              </div>

              {/* Children preview */}
              {(detailNode.children?.length ?? 0) > 0 && (
                <div className="mt-4 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                  <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: 'var(--text-faint)' }}>
                    {detailNode.children!.length} {TYPE_LABEL[detailNode.children![0].type].toLowerCase()}s
                  </p>
                  <div className="space-y-1 max-h-[200px] overflow-y-auto pr-1">
                    {detailNode.children!.slice(0, 10).map(child => (
                      <div
                        key={child.id}
                        className="flex items-center gap-2 px-2.5 py-2 rounded-lg transition-colors cursor-pointer"
                        style={{ background: 'var(--bg-hover)' }}
                        onClick={() => setDetailNode(child)}
                      >
                        <span className="text-[10px] font-bold shrink-0" style={{ color: COLORS[child.type].primary }}>
                          {ICONS[child.type]}
                        </span>
                        <span className="text-[11px] truncate flex-1" style={{ color: 'var(--text-secondary)' }}>{child.name}</span>
                        {child.metrics.mentions != null && (
                          <span className="text-[9px] tabular-nums shrink-0" style={{ color: 'var(--text-faint)' }}>{fmt(child.metrics.mentions)}</span>
                        )}
                        {child.metrics.sentiment != null && (
                          <span
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ background: sentimentHue(child.metrics.sentiment) }}
                          />
                        )}
                      </div>
                    ))}
                    {detailNode.children!.length > 10 && (
                      <p className="text-[9px] text-center py-1" style={{ color: 'var(--text-faint)' }}>
                        +{detailNode.children!.length - 10} more
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ BREADCRUMB ═══ */}
      <div className="absolute top-3 left-4 z-30 flex items-center gap-0.5">
        <button
          onClick={() => navigateTo(0)}
          className={clsx(
            'px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all duration-300',
            navStack.length === 0
              ? 'bg-white/80 text-slate-600 shadow-sm'
              : 'text-slate-300 hover:text-slate-500 hover:bg-white/60',
          )}
        >
          ⬡ All
        </button>
        {navStack.map((node, i) => (
          <div key={node.id} className="flex items-center gap-0.5">
            <span className="text-slate-200 text-[9px] mx-0.5">›</span>
            <button
              onClick={() => navigateTo(i + 1)}
              className={clsx(
                'px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all duration-300 max-w-[140px] truncate',
                i === navStack.length - 1
                  ? 'bg-white/80 text-slate-600 shadow-sm'
                  : 'text-slate-300 hover:text-slate-500 hover:bg-white/60',
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
          className="p-2 rounded-xl text-slate-300 hover:text-slate-500 hover:bg-white/60 transition-all"
          title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
        >
          {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>
        {searchOpen ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/80 backdrop-blur-2xl border border-slate-200/60 shadow-sm">
            <Search className="w-3.5 h-3.5 text-slate-300 shrink-0" />
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => { if (e.key === 'Escape') { setSearchOpen(false); setSearch(''); } }}
              placeholder="Search…"
              className="bg-transparent text-[12px] text-slate-700 placeholder:text-slate-300 outline-none w-40"
            />
            {search && (
              <span className="text-[8px] text-slate-300 tabular-nums shrink-0">
                {matchIds?.size ?? 0}/{entities.length}
              </span>
            )}
            <button onClick={() => { setSearchOpen(false); setSearch(''); }}>
              <X className="w-3 h-3 text-slate-300 hover:text-slate-500 transition-colors" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setSearchOpen(true)}
            className="p-2 rounded-xl text-slate-300 hover:text-slate-500 hover:bg-white/60 transition-all"
          >
            <Search className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* ═══ LEVEL INFO + LEGEND ═══ */}
      <div className="absolute bottom-3 left-4 z-30 pointer-events-none">
        <p className="text-[9px] text-slate-400 uppercase tracking-[0.2em] font-semibold mb-0.5">
          {entities.length} {currentType}{entities.length !== 1 ? 's' : ''}
        </p>
        <h2 className="text-sm font-semibold text-slate-500 tracking-tight">
          {navStack.length === 0 ? 'All Campaigns' : navStack[navStack.length - 1].name}
        </h2>
        {/* Legend — explains visual encoding */}
        <div className="flex items-center gap-3 mt-2 text-[8px] text-slate-500">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full border" style={{ borderColor: '#059669', background: '#05966915' }} />
            ▲ positive
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full border" style={{ borderColor: '#d97706', background: '#d9770615' }} />
            ● neutral
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full border" style={{ borderColor: '#dc2626', background: '#dc262615' }} />
            ▼ negative
          </span>
          <span className="flex items-center gap-1 ml-1 pl-1" style={{ borderLeft: '1px solid rgba(0,0,0,0.06)' }}>
            <span className="w-3 h-3 rounded-full" style={{ background: `${COLORS[currentType].primary}30` }} />
            <span className="w-4 h-4 rounded-full" style={{ background: `${COLORS[currentType].primary}50` }} />
            size = volume
          </span>
        </div>
      </div>

      {/* ═══ INTERACTION HINT ═══ */}
      {navStack.length === 0 && phase === 'idle' && !hovered && (
        <div
          className="absolute bottom-3 right-4 z-30 text-[10px] text-slate-400 tracking-wide pointer-events-none px-3 py-1.5 rounded-lg"
          style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(0,0,0,0.04)' }}
        >
          click to explore · drag to rearrange
        </div>
      )}
    </div>
  );
}
