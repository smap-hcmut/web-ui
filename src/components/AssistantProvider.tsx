'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';

export type AssistantMode = 'floating' | 'docked';

interface AssistantContextValue {
  open: boolean;
  mode: AssistantMode;
  setOpen: (v: boolean) => void;
  toggleOpen: () => void;
  setMode: (m: AssistantMode) => void;
  toggleMode: () => void;
}

const AssistantContext = createContext<AssistantContextValue | null>(null);

const MODE_KEY = 'smap:assistant:mode';
const OPEN_KEY = 'smap:assistant:open';

export function AssistantProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpenState] = useState(false);
  const [mode, setModeState] = useState<AssistantMode>('floating');

  useEffect(() => {
    try {
      const savedMode = localStorage.getItem(MODE_KEY);
      if (savedMode === 'docked' || savedMode === 'floating') setModeState(savedMode);
      if (localStorage.getItem(OPEN_KEY) === '1') setOpenState(true);
    } catch {}
  }, []);

  const setOpen = useCallback((v: boolean) => {
    setOpenState(v);
    try { localStorage.setItem(OPEN_KEY, v ? '1' : '0'); } catch {}
  }, []);

  const toggleOpen = useCallback(() => {
    setOpenState((prev) => {
      const next = !prev;
      try { localStorage.setItem(OPEN_KEY, next ? '1' : '0'); } catch {}
      return next;
    });
  }, []);

  const setMode = useCallback((m: AssistantMode) => {
    setModeState(m);
    try { localStorage.setItem(MODE_KEY, m); } catch {}
  }, []);

  const toggleMode = useCallback(() => {
    setModeState((prev) => {
      const next: AssistantMode = prev === 'docked' ? 'floating' : 'docked';
      try { localStorage.setItem(MODE_KEY, next); } catch {}
      return next;
    });
  }, []);

  return (
    <AssistantContext.Provider value={{ open, mode, setOpen, toggleOpen, setMode, toggleMode }}>
      {children}
    </AssistantContext.Provider>
  );
}

export function useAssistant() {
  const ctx = useContext(AssistantContext);
  if (!ctx) throw new Error('useAssistant must be used within AssistantProvider');
  return ctx;
}
