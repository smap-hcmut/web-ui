'use client';

import { useEffect, useMemo } from 'react';
import { Info, CheckCircle2, AlertTriangle, AlertOctagon, X } from 'lucide-react';
import clsx from 'clsx';
import {
  useNotificationStore,
  AUTO_DISMISS_MS,
  type NotificationSeverity,
} from '@/lib/stores';

const MAX_VISIBLE = 5;

const severityConfig: Record<
  NotificationSeverity,
  { icon: typeof Info; color: string; bg: string }
> = {
  info:     { icon: Info,          color: 'var(--info)',    bg: 'var(--info-bg)' },
  success:  { icon: CheckCircle2,  color: 'var(--success)', bg: 'var(--success-bg)' },
  warning:  { icon: AlertTriangle, color: 'var(--warning)', bg: 'var(--warning-bg)' },
  critical: { icon: AlertOctagon,  color: 'var(--danger)',  bg: 'var(--danger-bg)' },
};

export function NotificationToasts({ rightOffset }: { rightOffset?: string }) {
  const notifications = useNotificationStore((s) => s.notifications);
  const dismissToast = useNotificationStore((s) => s.dismissToast);

  const visible = useMemo(
    () => notifications.filter((n) => !n.toastDismissed).slice(0, MAX_VISIBLE),
    [notifications],
  );

  return (
    <div
      className="fixed bottom-20 z-[85] flex flex-col-reverse gap-2 pointer-events-none transition-[right] duration-300 ease-out"
      style={{ right: rightOffset ?? '1.5rem' }}
    >
      {visible.map((n) => (
        <ToastItem key={n.id} notification={n} onDismiss={() => dismissToast(n.id)} />
      ))}
    </div>
  );
}

function ToastItem({
  notification: n,
  onDismiss,
}: {
  notification: ReturnType<typeof useNotificationStore.getState>['notifications'][number];
  onDismiss: () => void;
}) {
  const cfg = severityConfig[n.severity];
  const Icon = cfg.icon;
  const ttl = AUTO_DISMISS_MS[n.severity];

  useEffect(() => {
    if (ttl == null) return;
    const elapsed = Date.now() - n.timestamp;
    const remaining = ttl - elapsed;
    if (remaining <= 0) {
      onDismiss();
      return;
    }
    const t = setTimeout(onDismiss, remaining);
    return () => clearTimeout(t);
  }, [n.id, n.timestamp, ttl, onDismiss]);

  return (
    <div
      className={clsx(
        'pointer-events-auto w-[360px] max-w-[calc(100vw-3rem)] rounded-xl overflow-hidden',
        'animate-[fadeIn_240ms_ease]',
      )}
      style={{
        background: 'var(--bg-surface-solid)',
        border: '1px solid var(--border)',
        boxShadow: '0 12px 32px rgba(0,0,0,0.18)',
      }}
      role="status"
    >
      <div className="flex items-start gap-3 p-3">
        <div
          className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center"
          style={{ background: cfg.bg, color: cfg.color }}
        >
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          {n.title && (
            <div
              className="text-[13px] font-semibold mb-0.5 truncate"
              style={{ color: 'var(--text-primary)' }}
            >
              {n.title}
            </div>
          )}
          <div className="text-[12px] leading-snug" style={{ color: 'var(--text-secondary)' }}>
            {n.content}
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="p-1 rounded transition-colors shrink-0"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          aria-label="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <div
        className="h-[3px] w-full"
        style={{ background: cfg.color, opacity: 0.85 }}
      />
    </div>
  );
}
