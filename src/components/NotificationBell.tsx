'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bell,
  Info,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  X,
  Check,
  Trash2,
} from 'lucide-react';
import {
  useNotificationStore,
  type Notification,
  type NotificationSeverity,
} from '@/lib/stores';

const severityConfig: Record<
  NotificationSeverity,
  { icon: typeof Info; color: string; bg: string; label: string }
> = {
  info:     { icon: Info,          color: 'var(--info)',    bg: 'var(--info-bg)',    label: 'Info' },
  success:  { icon: CheckCircle2,  color: 'var(--success)', bg: 'var(--success-bg)', label: 'Success' },
  warning:  { icon: AlertTriangle, color: 'var(--warning)', bg: 'var(--warning-bg)', label: 'Warning' },
  critical: { icon: AlertOctagon,  color: 'var(--danger)',  bg: 'var(--danger-bg)',  label: 'Critical' },
};

function formatRelative(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const notifications = useNotificationStore((s) => s.notifications);
  const markRead = useNotificationStore((s) => s.markRead);
  const markAllRead = useNotificationStore((s) => s.markAllRead);
  const remove = useNotificationStore((s) => s.remove);
  const clear = useNotificationStore((s) => s.clear);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('pointerdown', handleClick);
    return () => document.removeEventListener('pointerdown', handleClick);
  }, [open]);

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="p-2 rounded-xl transition-all relative"
        style={{ color: open ? 'var(--text-primary)' : 'var(--text-muted)' }}
        title="Notifications"
        aria-label="Notifications"
      >
        <Bell className="w-3.5 h-3.5" />
        {unreadCount > 0 && (
          <span
            className="absolute top-0.5 right-0.5 min-w-[14px] h-[14px] px-1 rounded-full flex items-center justify-center text-[9px] font-bold"
            style={{ background: 'var(--danger)', color: '#fff' }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute top-full right-0 mt-2 w-[360px] rounded-xl backdrop-blur-2xl animate-[fadeIn_150ms_ease] overflow-hidden flex flex-col"
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-lg)',
            maxHeight: 'min(70vh, 520px)',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 shrink-0"
            style={{ borderBottom: '1px solid var(--border)' }}
          >
            <div
              className="text-[13px] font-semibold"
              style={{ color: 'var(--text-primary)' }}
            >
              Notifications
              {unreadCount > 0 && (
                <span
                  className="ml-2 text-[11px] font-normal"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {unreadCount} unread
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="px-2 py-1 rounded text-[11px] transition-colors flex items-center gap-1"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--bg-hover)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--text-muted)';
                  }}
                  title="Mark all as read"
                >
                  <Check className="w-3 h-3" />
                  Read all
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clear}
                  className="p-1.5 rounded transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--bg-hover)';
                    e.currentTarget.style.color = 'var(--danger)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--text-muted)';
                  }}
                  title="Clear all"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto" style={{ overscrollBehavior: 'contain' }}>
            {notifications.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center py-10 gap-2"
                style={{ color: 'var(--text-muted)' }}
              >
                <Bell className="w-8 h-8 opacity-40" />
                <div className="text-[12px]">No notifications yet</div>
              </div>
            ) : (
              notifications.map((n) => (
                <NotificationRow
                  key={n.id}
                  notification={n}
                  onClick={() => !n.read && markRead(n.id)}
                  onRemove={() => remove(n.id)}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function NotificationRow({
  notification: n,
  onClick,
  onRemove,
}: {
  notification: Notification;
  onClick: () => void;
  onRemove: () => void;
}) {
  const cfg = severityConfig[n.severity];
  const Icon = cfg.icon;

  return (
    <div
      className="group flex items-start gap-3 px-4 py-3 transition-colors cursor-pointer relative"
      style={{
        borderBottom: '1px solid var(--border-subtle)',
        background: n.read ? 'transparent' : 'var(--bg-inset)',
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--bg-hover)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = n.read ? 'transparent' : 'var(--bg-inset)';
      }}
    >
      {!n.read && (
        <span
          className="absolute left-1.5 top-4 w-1.5 h-1.5 rounded-full"
          style={{ background: cfg.color }}
        />
      )}
      <div
        className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center"
        style={{ background: cfg.bg, color: cfg.color }}
      >
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        {n.title && (
          <div
            className="text-[12px] font-semibold mb-0.5"
            style={{ color: 'var(--text-primary)' }}
          >
            {n.title}
          </div>
        )}
        <div
          className="text-[12px] leading-snug break-words"
          style={{ color: 'var(--text-secondary)' }}
        >
          {n.content}
        </div>
        <div
          className="text-[10px] mt-1 uppercase tracking-wide font-medium"
          style={{ color: 'var(--text-muted)' }}
        >
          {cfg.label} · {formatRelative(n.timestamp)}
        </div>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
        style={{ color: 'var(--text-muted)' }}
        aria-label="Remove"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}
