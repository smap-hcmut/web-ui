'use client';

import { Modal } from './Modal';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'default' | 'danger';
  confirmLabel?: string;
  cancelLabel?: string;
}

export function ConfirmDialog({
  open, title, message, onConfirm, onCancel,
  variant = 'default', confirmLabel = 'Confirm', cancelLabel = 'Cancel',
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onCancel} title={title} size="sm">
      <p className="text-[12px] mb-6" style={{ color: 'var(--text-secondary)' }}>{message}</p>
      <div className="flex items-center justify-end gap-2">
        <button
          onClick={onCancel}
          className="text-[12px] font-medium px-4 py-2 rounded-xl transition-colors"
          style={{
            background: 'var(--bg-hover)',
            color: 'var(--text-primary)',
          }}
        >
          {cancelLabel}
        </button>
        <button
          onClick={onConfirm}
          className="text-[12px] font-medium px-4 py-2 rounded-xl transition-colors text-white"
          style={{
            background: variant === 'danger' ? 'var(--danger)' : 'var(--accent)',
          }}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
