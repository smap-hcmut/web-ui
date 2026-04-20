'use client';

import { useMemo } from 'react';
import { AlertOctagon, X } from 'lucide-react';
import { useNotificationStore } from '@/lib/stores';

export function NotificationBanner({ rightOffset }: { rightOffset?: string }) {
  const notifications = useNotificationStore((s) => s.notifications);
  const dismissBanner = useNotificationStore((s) => s.dismissBanner);

  const active = useMemo(
    () =>
      notifications.find(
        (n) => n.severity === 'critical' && !n.bannerDismissed,
      ),
    [notifications],
  );

  if (!active) return null;

  return (
    <div
      className="fixed top-0 left-0 z-[80] animate-[fadeIn_240ms_ease] transition-[right] duration-300 ease-out"
      style={{
        right: rightOffset ?? 0,
        background: 'var(--danger-bg)',
        borderBottom: '1px solid var(--danger)',
        backdropFilter: 'blur(12px)',
      }}
      role="alert"
    >
      <div className="flex items-center gap-3 px-4 py-2.5 max-w-[1600px] mx-auto">
        <AlertOctagon
          className="w-4 h-4 shrink-0"
          style={{ color: 'var(--danger)' }}
        />
        <div className="flex-1 min-w-0">
          {active.title && (
            <span
              className="text-[12px] font-semibold mr-2"
              style={{ color: 'var(--danger)' }}
            >
              {active.title}
            </span>
          )}
          <span
            className="text-[12px]"
            style={{ color: 'var(--text-primary)' }}
          >
            {active.content}
          </span>
        </div>
        <button
          onClick={() => dismissBanner(active.id)}
          className="p-1 rounded transition-colors shrink-0"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          aria-label="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
