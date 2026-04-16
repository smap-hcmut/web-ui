'use client';

import clsx from 'clsx';
import { Tooltip } from './Tooltip';

interface IconButtonProps {
  icon: React.ReactNode;
  label: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'ghost' | 'outline' | 'solid';
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

const sizeMap = {
  sm: 'w-7 h-7 [&>svg]:w-3.5 [&>svg]:h-3.5',
  md: 'w-9 h-9 [&>svg]:w-4 [&>svg]:h-4',
  lg: 'w-11 h-11 [&>svg]:w-5 [&>svg]:h-5',
};

export function IconButton({ icon, label, size = 'md', variant = 'ghost', onClick, disabled, className }: IconButtonProps) {
  const btn = (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={clsx(
        'inline-flex items-center justify-center rounded-xl transition-all duration-200',
        sizeMap[size],
        disabled && 'opacity-40 cursor-not-allowed',
        className,
      )}
      style={{
        color: 'var(--text-muted)',
        background: variant === 'solid' ? 'var(--accent)' : variant === 'outline' ? 'transparent' : 'transparent',
        border: variant === 'outline' ? '1px solid var(--border)' : '1px solid transparent',
        ...(variant === 'solid' ? { color: '#fff' } : {}),
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.background = variant === 'solid' ? 'var(--accent-hover)' : 'var(--bg-hover)';
          if (variant !== 'solid') e.currentTarget.style.color = 'var(--text-primary)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = variant === 'solid' ? 'var(--accent)' : 'transparent';
        if (variant !== 'solid') e.currentTarget.style.color = 'var(--text-muted)';
      }}
    >
      {icon}
    </button>
  );

  return <Tooltip content={label}>{btn}</Tooltip>;
}
