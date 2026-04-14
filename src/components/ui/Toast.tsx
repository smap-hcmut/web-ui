'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import clsx from 'clsx';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
}

const iconMap = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
};

const colorMap: Record<ToastType, string> = {
  success: 'var(--success)',
  error: 'var(--danger)',
  info: 'var(--info)',
  warning: 'var(--warning)',
};

export function Toast({ message, type = 'info', duration = 3000, onClose }: ToastProps) {
  const [exiting, setExiting] = useState(false);
  const Icon = iconMap[type];

  useEffect(() => {
    const t = setTimeout(() => setExiting(true), duration - 300);
    const t2 = setTimeout(onClose, duration);
    return () => { clearTimeout(t); clearTimeout(t2); };
  }, [duration, onClose]);

  return (
    <div
      className={clsx(
        'flex items-center gap-3 px-4 py-3 rounded-xl min-w-[280px] transition-all duration-300',
        exiting ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0',
      )}
      style={{
        background: 'var(--bg-surface-solid)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-lg)',
      }}
    >
      <Icon className="w-4 h-4 shrink-0" style={{ color: colorMap[type] }} />
      <span className="text-[12px] font-medium flex-1" style={{ color: 'var(--text-primary)' }}>{message}</span>
      <button onClick={onClose} className="p-0.5 rounded" style={{ color: 'var(--text-muted)' }}>
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

/* ── Toast Container (used in showcase) ── */

interface ToastItem { id: number; message: string; type: ToastType }

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  let counter = 0;

  const push = (message: string, type: ToastType = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const remove = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const ToastContainer = () => (
    <div className="fixed bottom-20 right-4 z-[300] flex flex-col gap-2">
      {toasts.map(t => (
        <Toast key={t.id} message={t.message} type={t.type} onClose={() => remove(t.id)} />
      ))}
    </div>
  );

  return { push, ToastContainer };
}
