/**
 * OAuth Callback Page
 *
 * Handles the redirect after OAuth authentication completes.
 * The backend's callback endpoint sets a cookie and redirects here.
 *
 * Tries multiple strategies to establish a session:
 *
 * 1. Token in URL — backend passed ?token=xxx in the redirect URL.
 *    Exchange it for a frontend cookie via /api/auth/session.
 *
 * 2. Proxy cookie — the OAuth callback was routed through the Next.js
 *    proxy (backend config points callback to /api/proxy/identity/...),
 *    so the cookie was rewritten to the frontend domain automatically.
 *    Just call /me through the proxy to verify.
 *
 * 3. Neither — show an error explaining which config change is needed.
 */

'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth';

type Status = 'loading' | 'success' | 'error';

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fetchCurrentUser = useAuthStore((s) => s.fetchCurrentUser);
  const [status, setStatus] = useState<Status>('loading');
  const [detail, setDetail] = useState('Completing login...');

  useEffect(() => {
    let cancelled = false;

    async function handle() {
      // ── Strategy 1: Token in URL ──────────────────────────────────
      const token =
        searchParams.get('token') || searchParams.get('access_token');

      if (token) {
        setDetail('Exchanging token...');
        try {
          const res = await fetch('/api/auth/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token }),
            credentials: 'include',
          });
          if (res.ok) {
            // Cookie is now set on frontend domain.
            // Sync Zustand store.
            await fetchCurrentUser();
            if (!cancelled) router.replace('/campaigns');
            return;
          }
        } catch (e) {
          console.error('[auth/callback] Token exchange failed:', e);
        }
      }

      // ── Strategy 2: Cookie already on frontend domain ─────────────
      // This works when the OAuth callback was routed through the
      // proxy (backend config change), so Set-Cookie was rewritten.
      setDetail('Verifying session...');
      try {
        await fetchCurrentUser();
        const { isAuthenticated } = useAuthStore.getState();
        if (isAuthenticated) {
          if (!cancelled) router.replace('/campaigns');
          return;
        }
      } catch {
        // Expected if cookie is on wrong domain
      }

      // ── Strategy 3: Check for error param from backend ────────────
      const errorParam = searchParams.get('error');
      if (errorParam) {
        const messages: Record<string, string> = {
          unauthorized: 'Your account is not authorized.',
          domain_not_allowed: 'Your email domain is not allowed.',
          account_blocked: 'Your account has been blocked.',
          invalid_state: 'Authentication state mismatch. Please try again.',
        };
        if (!cancelled) {
          setDetail(messages[errorParam] || `Authentication error: ${errorParam}`);
          setStatus('error');
        }
        return;
      }

      // ── Nothing worked ────────────────────────────────────────────
      if (!cancelled) {
        setDetail(
          'Session could not be established. The OAuth callback must be ' +
            'routed through the frontend proxy so the auth cookie is set ' +
            'on the correct domain.',
        );
        setStatus('error');
      }
    }

    handle();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Error state ─────────────────────────────────────────────────────
  if (status === 'error') {
    return (
      <div
        className="rounded-2xl p-8 animate-[fadeIn_400ms_ease] max-w-md mx-auto"
        style={{
          background: 'var(--bg-surface-solid)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <div className="text-center">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: 'var(--danger-bg)' }}
          >
            <svg
              className="w-6 h-6"
              style={{ color: 'var(--danger)' }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
              />
            </svg>
          </div>

          <h2
            className="text-[15px] font-semibold mb-2"
            style={{ color: 'var(--text-primary)' }}
          >
            Authentication Failed
          </h2>

          <p
            className="text-[12px] leading-relaxed mb-6"
            style={{ color: 'var(--text-muted)' }}
          >
            {detail}
          </p>

          <a
            href="/auth/login"
            className="inline-flex items-center justify-center py-2 px-6 rounded-xl text-[13px] font-medium transition-all"
            style={{
              background: 'var(--accent)',
              color: 'white',
            }}
          >
            Back to Login
          </a>
        </div>
      </div>
    );
  }

  // ── Loading state ───────────────────────────────────────────────────
  return (
    <div
      className="rounded-2xl p-8 animate-[fadeIn_400ms_ease]"
      style={{
        background: 'var(--bg-surface-solid)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-lg)',
      }}
    >
      <div className="flex flex-col items-center justify-center py-8 gap-4">
        <div className="w-6 h-6 border-2 border-[var(--accent)]/30 border-t-[var(--accent)] rounded-full animate-spin" />
        <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
          {detail}
        </p>
      </div>
    </div>
  );
}

function CallbackLoading() {
  return (
    <div
      className="rounded-2xl p-8 animate-[fadeIn_400ms_ease]"
      style={{
        background: 'var(--bg-surface-solid)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-lg)',
      }}
    >
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-[var(--accent)]/30 border-t-[var(--accent)] rounded-full animate-spin" />
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<CallbackLoading />}>
      <CallbackHandler />
    </Suspense>
  );
}
