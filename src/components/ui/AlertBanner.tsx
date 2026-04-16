'use client';

import { useState } from 'react';
import { AlertTriangle, Info, AlertCircle, X } from 'lucide-react';
import clsx from 'clsx';

type AlertType = 'info' | 'warning' | 'danger';

interface AlertBannerProps {
  type?: AlertType;
  title: string;
  message?: string;
  dismissable?: boolean;
  className?: string;
}

const iconMap = { info: Info, warning: AlertTriangle, danger: AlertCircle };
const colorMap: Record<AlertType, { bg: string; color: string; border: string }> = {
  info: { bg: 'var(--info-bg)', color: 'var(--info)', border: 'var(--info)' },
  warning: { bg: 'var(--warning-bg)', color: 'var(--warning)', border: 'var(--warning)' },
  danger: { bg: 'var(--danger-bg)', color: 'var(--danger)', border: 'var(--danger)' },
};

export function AlertBanner({ type = 'info', title, message, dismissable, className }: AlertBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  const Icon = iconMap[type];
  const c = colorMap[type];

  return (
    <div
      className={clsx('flex items-start gap-3 px-4 py-3 rounded-xl', className)}
      style={{
        background: c.bg,
        borderLeft: `3px solid ${c.border}`,
      }}
    >
      <Icon className="w-4 h-4 shrink-0 mt-0.5" style={{ color: c.color }} />
      <div className="flex-1">
        <p className="text-[12px] font-semibold" style={{ color: c.color }}>{title}</p>
        {message && <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>{message}</p>}
      </div>
      {dismissable && (
        <button onClick={() => setDismissed(true)} className="p-0.5 rounded shrink-0" style={{ color: c.color }}>
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}
