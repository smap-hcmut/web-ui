'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
    setSent(true);
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
      {sent ? (
        /* Success state */
        <div className="text-center py-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'var(--success-bg)' }}
          >
            <CheckCircle className="w-6 h-6" style={{ color: 'var(--success)' }} />
          </div>
          <h2
            className="text-[15px] font-semibold mb-2"
            style={{ color: 'var(--text-primary)' }}
          >
            Check your email
          </h2>
          <p className="text-[12px] mb-6 max-w-[280px] mx-auto" style={{ color: 'var(--text-muted)' }}>
            We sent a password reset link to{' '}
            <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>
              {email}
            </span>
            . Please check your inbox.
          </p>
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-1.5 text-[13px] font-medium transition-colors duration-200"
            style={{ color: 'var(--accent)' }}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to sign in
          </Link>
        </div>
      ) : (
        /* Form state */
        <>
          <div className="text-center mb-6">
            <h2
              className="text-[15px] font-semibold"
              style={{ color: 'var(--text-primary)' }}
            >
              Forgot your password?
            </h2>
            <p className="text-[12px] mt-1 max-w-[280px] mx-auto" style={{ color: 'var(--text-muted)' }}>
              Enter your email and we&apos;ll send you a link to reset your password.
            </p>
          </div>

          {error && (
            <div
              className="rounded-xl px-4 py-2.5 mb-4 text-[12px]"
              style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl text-[13px] font-semibold text-white transition-all duration-300 disabled:opacity-50"
              style={{ background: loading ? 'var(--accent-hover)' : 'var(--accent)' }}
              onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = 'var(--accent-hover)'; }}
              onMouseLeave={(e) => { if (!loading) e.currentTarget.style.background = 'var(--accent)'; }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sending...
                </span>
              ) : (
                'Send reset link'
              )}
            </button>
          </form>

          <p className="text-center text-[12px] mt-6">
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-1.5 font-medium transition-colors duration-200"
              style={{ color: 'var(--text-muted)' }}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to sign in
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
