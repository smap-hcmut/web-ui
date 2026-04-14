'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { Checkbox } from '@/components/ui/Checkbox';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    // Mock login — simulate API call
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
    router.push('/campaigns');
  };

  return (
    <div
      className="rounded-2xl p-8 animate-[fadeIn_400ms_ease]"
      style={{
        background: 'var(--bg-surface-solid)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-lg)',
      }}
    >
      <div className="text-center mb-6">
        <h2
          className="text-[15px] font-semibold"
          style={{ color: 'var(--text-primary)' }}
        >
          Welcome back
        </h2>
        <p className="text-[12px] mt-1" style={{ color: 'var(--text-muted)' }}>
          Sign in to your account to continue
        </p>
      </div>

      {/* Google OAuth */}
      <button
        type="button"
        className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl text-[13px] font-medium transition-all duration-200"
        style={{
          background: 'var(--bg-hover)',
          border: '1px solid var(--border)',
          color: 'var(--text-primary)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--bg-elevated)';
          e.currentTarget.style.borderColor = 'var(--accent)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'var(--bg-hover)';
          e.currentTarget.style.borderColor = 'var(--border)';
        }}
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        Continue with Google
      </button>

      {/* Divider */}
      <div className="flex items-center gap-3 my-6">
        <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
        <span className="text-[11px]" style={{ color: 'var(--text-faint)' }}>
          or sign in with email
        </span>
        <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
      </div>

      {/* Error */}
      {error && (
        <div
          className="rounded-xl px-4 py-2.5 mb-4 text-[12px]"
          style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div>
          <label
            className="block text-[11px] font-medium mb-1.5"
            style={{ color: 'var(--text-secondary)' }}
          >
            Email
          </label>
          <div className="relative">
            <Mail
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
              style={{ color: 'var(--text-faint)' }}
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-[13px] outline-none transition-all duration-200"
              style={{
                background: 'var(--input-bg)',
                border: '1px solid var(--input-border)',
                color: 'var(--text-primary)',
              }}
              onFocus={(e) => {
                e.currentTarget.style.boxShadow = 'var(--ring)';
                e.currentTarget.style.borderColor = 'var(--accent)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = 'var(--input-border)';
              }}
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label
            className="block text-[11px] font-medium mb-1.5"
            style={{ color: 'var(--text-secondary)' }}
          >
            Password
          </label>
          <div className="relative">
            <Lock
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
              style={{ color: 'var(--text-faint)' }}
            />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full pl-10 pr-10 py-2.5 rounded-xl text-[13px] outline-none transition-all duration-200"
              style={{
                background: 'var(--input-bg)',
                border: '1px solid var(--input-border)',
                color: 'var(--text-primary)',
              }}
              onFocus={(e) => {
                e.currentTarget.style.boxShadow = 'var(--ring)';
                e.currentTarget.style.borderColor = 'var(--accent)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = 'var(--input-border)';
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5"
              style={{ color: 'var(--text-faint)' }}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Remember + Forgot */}
        <div className="flex items-center justify-between">
          <Checkbox
            checked={remember}
            onChange={setRemember}
            label="Remember me"
          />
          <Link
            href="/auth/forgot-password"
            className="text-[12px] font-medium transition-colors duration-200"
            style={{ color: 'var(--accent)' }}
          >
            Forgot password?
          </Link>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-xl text-[13px] font-semibold text-white transition-all duration-300 disabled:opacity-50"
          style={{
            background: loading ? 'var(--accent-hover)' : 'var(--accent)',
          }}
          onMouseEnter={(e) => {
            if (!loading) e.currentTarget.style.background = 'var(--accent-hover)';
          }}
          onMouseLeave={(e) => {
            if (!loading) e.currentTarget.style.background = 'var(--accent)';
          }}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Signing in...
            </span>
          ) : (
            'Sign in'
          )}
        </button>
      </form>

      {/* Sign up link */}
      <p className="text-center text-[12px] mt-6" style={{ color: 'var(--text-muted)' }}>
        Don&apos;t have an account?{' '}
        <Link
          href="/auth/signup"
          className="font-semibold transition-colors duration-200"
          style={{ color: 'var(--accent)' }}
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}
