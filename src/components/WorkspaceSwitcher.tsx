'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Plus, Building2 } from 'lucide-react';
import { Badge } from './ui/Badge';
import Link from 'next/link';

interface Workspace {
  id: string;
  name: string;
  role: 'admin' | 'editor' | 'viewer';
}

const mockWorkspaces: Workspace[] = [
  { id: 'ws-1', name: 'SMAP Team', role: 'admin' },
  { id: 'ws-2', name: 'Client — VinGroup', role: 'editor' },
  { id: 'ws-3', name: 'Agency Partners', role: 'viewer' },
];

export function WorkspaceSwitcher() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(mockWorkspaces[0]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', handle);
    return () => document.removeEventListener('pointerdown', handle);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-colors duration-200"
        style={{ color: 'var(--text-secondary)' }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
      >
        <Building2 className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
        <span className="text-[12px] font-medium">{active.name}</span>
        <ChevronDown className="w-3 h-3" style={{ color: 'var(--text-faint)' }} />
      </button>

      {open && (
        <div
          className="absolute top-full left-0 mt-1.5 w-64 rounded-xl p-1.5 animate-[fadeIn_150ms_ease] z-50"
          style={{
            background: 'var(--bg-surface-solid)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          <p
            className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-2"
            style={{ color: 'var(--text-faint)' }}
          >
            Workspaces
          </p>

          {mockWorkspaces.map((ws) => (
            <button
              key={ws.id}
              onClick={() => { setActive(ws); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-colors duration-150"
              style={{
                background: active.id === ws.id ? 'var(--bg-hover)' : 'transparent',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = active.id === ws.id ? 'var(--bg-hover)' : 'transparent';
              }}
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-[11px] font-bold"
                style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}
              >
                {ws.name.charAt(0)}
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-[12px] font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                  {ws.name}
                </p>
                <Badge variant="neutral" size="sm" className="mt-0.5">
                  {ws.role}
                </Badge>
              </div>
              {active.id === ws.id && (
                <Check className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--accent)' }} />
              )}
            </button>
          ))}

          <div className="h-px my-1.5" style={{ background: 'var(--border)' }} />

          <Link
            href="/settings?tab=workspace"
            onClick={() => setOpen(false)}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-colors duration-150"
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'var(--bg-hover)' }}
            >
              <Plus className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
            </div>
            <span className="text-[12px] font-medium" style={{ color: 'var(--text-muted)' }}>
              Create workspace
            </span>
          </Link>
        </div>
      )}
    </div>
  );
}
