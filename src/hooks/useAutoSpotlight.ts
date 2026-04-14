'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { HeapNode } from '@/components/heap/types';

/* ═══════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════ */

export interface AutoSpotlightConfig {
  idleThreshold: number;
  spotlightDuration: number;
  eventDuration: number;
  crisisDuration: number;
  cooldownDuration: number;
}

export interface SpotlightEvent {
  type: 'spotlight' | 'spike' | 'milestone' | 'crisis';
  entityId: string;
  title: string;
  description: string;
  priority: 1 | 2 | 3;
  timestamp: Date;
}

type SpotlightState = 'idle' | 'showing' | 'cooldown' | 'paused';

export interface ActiveTooltip {
  entityId: string;
  event: SpotlightEvent;
}

export interface UseAutoSpotlightReturn {
  activeTooltip: ActiveTooltip | null;
  spotlightedId: string | null;
  pause: () => void;
  resume: () => void;
  pushEvent: (event: SpotlightEvent) => void;
  dismiss: () => void;
}

/* ═══════════════════════════════════════════
   DEFAULTS
   ═══════════════════════════════════════════ */

export const AUTO_SPOTLIGHT_DEFAULTS: AutoSpotlightConfig = {
  idleThreshold: 10_000,
  spotlightDuration: 4_500,
  eventDuration: 7_000,
  crisisDuration: 9_000,
  cooldownDuration: 4_000,
};

/* ═══════════════════════════════════════════
   WEIGHTED RANDOM SELECTION
   ═══════════════════════════════════════════ */

const lastSpotlightMap = new Map<string, number>();
let lastPickedId: string | null = null;

function pickRandomSpotlight(entities: HeapNode[]): HeapNode | null {
  // Filter out comments — they have no bubble shape
  const candidates = entities.filter(e => e.type !== 'comment');
  if (candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0];

  // Weighted: higher engagement → more likely, but prefer entities not recently shown
  const weights = candidates
    .filter(e => e.id !== lastPickedId) // never same twice in a row
    .map(e => {
      const engagement = e.metrics.mentions ?? e.metrics.engagement ?? 100;
      const lastShown = lastSpotlightMap.get(e.id) ?? 0;
      const timeSince = lastShown ? Math.min((Date.now() - lastShown) / 60000, 10) : 10;
      return {
        entity: e,
        weight: Math.sqrt(engagement) * timeSince,
      };
    });

  if (weights.length === 0) return candidates[0];

  const total = weights.reduce((s, w) => s + w.weight, 0);
  let r = Math.random() * total;

  for (const w of weights) {
    r -= w.weight;
    if (r <= 0) {
      lastPickedId = w.entity.id;
      lastSpotlightMap.set(w.entity.id, Date.now());
      return w.entity;
    }
  }

  const fallback = weights[0].entity;
  lastPickedId = fallback.id;
  lastSpotlightMap.set(fallback.id, Date.now());
  return fallback;
}

/* ═══════════════════════════════════════════
   HOOK
   ═══════════════════════════════════════════ */

export function useAutoSpotlight(
  entities: HeapNode[],
  containerEl: HTMLDivElement | null,
  /** External "should pause" signal — true when user hover, drag, zoom, search, detail open */
  externalPause: boolean,
  config: AutoSpotlightConfig = AUTO_SPOTLIGHT_DEFAULTS,
): UseAutoSpotlightReturn {

  const [activeTooltip, setActiveTooltip] = useState<ActiveTooltip | null>(null);
  const stateRef = useRef<SpotlightState>('idle');
  const idleTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined as unknown as ReturnType<typeof setTimeout>);
  const tooltipTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined as unknown as ReturnType<typeof setTimeout>);
  const cooldownTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined as unknown as ReturnType<typeof setTimeout>);
  const eventQueueRef = useRef<SpotlightEvent[]>([]);
  const entitiesRef = useRef(entities);
  entitiesRef.current = entities;
  const configRef = useRef(config);
  configRef.current = config;

  // ── clear all timers ──
  const clearAllTimers = useCallback(() => {
    clearTimeout(idleTimerRef.current);
    clearTimeout(tooltipTimerRef.current);
    clearTimeout(cooldownTimerRef.current);
  }, []);

  // ── show tooltip ──
  const showTooltip = useCallback((event: SpotlightEvent) => {
    stateRef.current = 'showing';
    setActiveTooltip({ entityId: event.entityId, event });

    const duration = event.priority === 1
      ? configRef.current.crisisDuration
      : event.priority === 2
        ? configRef.current.eventDuration
        : configRef.current.spotlightDuration;

    clearTimeout(tooltipTimerRef.current);
    tooltipTimerRef.current = setTimeout(() => {
      // dismiss → cooldown → schedule next
      setActiveTooltip(null);
      stateRef.current = 'cooldown';

      clearTimeout(cooldownTimerRef.current);
      cooldownTimerRef.current = setTimeout(() => {
        if (stateRef.current === 'cooldown') {
          stateRef.current = 'idle';
          scheduleNext();
        }
      }, configRef.current.cooldownDuration);
    }, duration);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── schedule next ──
  const scheduleNext = useCallback(() => {
    if (stateRef.current === 'paused') return;

    // Check event queue first (priority-sorted)
    const queue = eventQueueRef.current;
    // Drop stale events (>2 minutes old)
    const now = Date.now();
    eventQueueRef.current = queue.filter(e => now - e.timestamp.getTime() < 120_000);

    if (eventQueueRef.current.length > 0) {
      eventQueueRef.current.sort((a, b) => a.priority - b.priority);
      const next = eventQueueRef.current.shift()!;
      showTooltip(next);
      return;
    }

    // Random spotlight
    const entity = pickRandomSpotlight(entitiesRef.current);
    if (entity) {
      showTooltip({
        type: 'spotlight',
        entityId: entity.id,
        title: entity.name,
        description: entity.description ?? '',
        priority: 3,
        timestamp: new Date(),
      });
    }
  }, [showTooltip]);

  // ── pause / resume ──
  const pause = useCallback(() => {
    clearAllTimers();
    stateRef.current = 'paused';
    setActiveTooltip(null);
  }, [clearAllTimers]);

  const resume = useCallback(() => {
    if (stateRef.current !== 'paused') return;
    stateRef.current = 'idle';

    // Start idle timer before first spotlight
    clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      if (stateRef.current === 'idle') {
        scheduleNext();
      }
    }, configRef.current.idleThreshold);
  }, [scheduleNext]);

  const dismiss = useCallback(() => {
    clearTimeout(tooltipTimerRef.current);
    setActiveTooltip(null);
    stateRef.current = 'cooldown';
    clearTimeout(cooldownTimerRef.current);
    cooldownTimerRef.current = setTimeout(() => {
      if (stateRef.current === 'cooldown') {
        stateRef.current = 'idle';
        scheduleNext();
      }
    }, configRef.current.cooldownDuration);
  }, [scheduleNext]);

  // ── push external event ──
  const pushEvent = useCallback((event: SpotlightEvent) => {
    if (stateRef.current === 'paused') {
      // Queue it — will show when resumed
      eventQueueRef.current.push(event);
      if (eventQueueRef.current.length > 5) eventQueueRef.current.shift();
      return;
    }

    // Crisis interrupts everything
    if (event.priority === 1) {
      clearTimeout(tooltipTimerRef.current);
      clearTimeout(cooldownTimerRef.current);
      showTooltip(event);
      return;
    }

    // Other events: queue if currently showing, else show now
    eventQueueRef.current.push(event);
    if (eventQueueRef.current.length > 5) eventQueueRef.current.shift();

    if (stateRef.current === 'idle') {
      scheduleNext();
    }
  }, [showTooltip, scheduleNext]);

  // ── respond to external pause signal ──
  useEffect(() => {
    if (externalPause) {
      pause();
    } else {
      resume();
    }
  }, [externalPause, pause, resume]);

  // ── mouse activity on container → pause + restart idle timer ──
  useEffect(() => {
    if (!containerEl) return;

    const handleActivity = () => {
      if (stateRef.current === 'showing') {
        // Dismiss current auto-tooltip on any user activity
        clearTimeout(tooltipTimerRef.current);
        setActiveTooltip(null);
      }

      stateRef.current = 'paused';

      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => {
        stateRef.current = 'idle';
        scheduleNext();
      }, configRef.current.idleThreshold);
    };

    containerEl.addEventListener('mousemove', handleActivity, { passive: true });
    containerEl.addEventListener('mousedown', handleActivity, { passive: true });
    containerEl.addEventListener('wheel', handleActivity, { passive: true });

    return () => {
      containerEl.removeEventListener('mousemove', handleActivity);
      containerEl.removeEventListener('mousedown', handleActivity);
      containerEl.removeEventListener('wheel', handleActivity);
    };
  }, [containerEl, scheduleNext]);

  // ── cleanup on unmount ──
  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, [clearAllTimers]);

  // ── initial start: begin idle timer ──
  useEffect(() => {
    if (!externalPause && containerEl) {
      stateRef.current = 'idle';
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => {
        if (stateRef.current === 'idle') {
          scheduleNext();
        }
      }, configRef.current.idleThreshold);
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerEl]);

  return {
    activeTooltip,
    spotlightedId: activeTooltip?.entityId ?? null,
    pause,
    resume,
    pushEvent,
    dismiss,
  };
}
