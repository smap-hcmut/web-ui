'use client';

import { Modal } from './Modal';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'default' | 'danger' | 'warning';
  confirmLabel?: string;
  cancelLabel?: string;
}

const variantConfig = {
  default: {
    icon: Info,
    iconBg: 'var(--accent-subtle)',
    iconColor: 'var(--accent)',
    buttonBg: 'var(--accent)',
    buttonHoverBg: 'var(--accent-hover)',
  },
  danger: {
    icon: AlertCircle,
    iconBg: 'var(--danger-bg)',
    iconColor: 'var(--danger)',
    buttonBg: 'var(--danger)',
    buttonHoverBg: '#dc2626',
  },
  warning: {
    icon: AlertTriangle,
    iconBg: 'var(--warning-bg)',
    iconColor: 'var(--warning)',
    buttonBg: 'var(--warning)',
    buttonHoverBg: '#d97706',
  },
};

export function ConfirmDialog({
  open, title, message, onConfirm, onCancel,
  variant = 'default', confirmLabel = 'Confirm', cancelLabel = 'Cancel',
}: ConfirmDialogProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <Modal open={open} onClose={onCancel} size="sm">
      <div className="flex flex-col items-center text-center">
        {/* Icon */}
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
          style={{
            background: config.iconBg,
          }}
        >
          <Icon className="w-7 h-7" style={{ color: config.iconColor }} />
        </div>

        {/* Title */}
        <h3 className="text-[15px] font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
          {title}
        </h3>

        {/* Message */}
        <p className="text-[12px] leading-relaxed mb-6" style={{ color: 'var(--text-secondary)' }}>
          {message}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-2 w-full">
          <button
            onClick={onCancel}
            className="flex-1 text-[12px] font-semibold px-4 py-2.5 rounded-xl transition-all duration-200"
            style={{
              background: 'var(--bg-hover)',
              color: 'var(--text-primary)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bg-surface)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--bg-hover)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 text-[12px] font-semibold px-4 py-2.5 rounded-xl transition-all duration-200 text-white"
            style={{
              background: config.buttonBg,
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = config.buttonHoverBg;
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = config.buttonBg;
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
