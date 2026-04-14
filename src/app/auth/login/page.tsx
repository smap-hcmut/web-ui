'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLogin, useCurrentUser } from '@/lib/hooks';
import { Shield, Building2 } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const { loginWithGoogle, loginWithAzure, loginWithOkta } = useLogin();
  const { isAuthenticated, isLoading: authLoading } = useCurrentUser();

  // Check for OAuth callback errors
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      const errorMessages: Record<string, string> = {
        unauthorized: 'Your account is not authorized to access this application.',
        domain_not_allowed: 'Your email domain is not allowed.',
        account_blocked: 'Your account has been blocked.',
        invalid_state: 'Authentication failed. Please try again.',
        default: 'An error occurred during sign in. Please try again.',
      };
      setError(errorMessages[errorParam] || errorMessages.default);
    }
  }, [searchParams]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const redirectTo = searchParams.get('redirect') || '/campaigns';
      router.push(redirectTo);
    }
  }, [isAuthenticated, router, searchParams]);

  const handleOAuthLogin = (provider: 'google' | 'azure' | 'okta') => {
    setError('');
    setLoading(provider);

    // Call the login function which will redirect to OAuth provider
    if (provider === 'google') {
      loginWithGoogle();
    } else if (provider === 'azure') {
      loginWithAzure();
    } else {
      loginWithOkta();
    }

    // Note: The page will redirect, so loading state is just visual feedback
  };

  // Show loading while checking auth status
  if (authLoading) {
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
          Welcome to SMAP
        </h2>
        <p className="text-[12px] mt-1" style={{ color: 'var(--text-muted)' }}>
          Sign in with your organization account
        </p>
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

      <div className="space-y-3">
        {/* Google OAuth */}
        <button
          type="button"
          disabled={loading !== null}
          onClick={() => handleOAuthLogin('google')}
          className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl text-[13px] font-medium transition-all duration-200 disabled:opacity-50"
          style={{
            background: 'var(--bg-hover)',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)',
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.background = 'var(--bg-elevated)';
              e.currentTarget.style.borderColor = 'var(--accent)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--bg-hover)';
            e.currentTarget.style.borderColor = 'var(--border)';
          }}
        >
          {loading === 'google' ? (
            <span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
          ) : (
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
          )}
          Continue with Google
        </button>

        {/* Azure AD OAuth */}
        <button
          type="button"
          disabled={loading !== null}
          onClick={() => handleOAuthLogin('azure')}
          className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl text-[13px] font-medium transition-all duration-200 disabled:opacity-50"
          style={{
            background: 'var(--bg-hover)',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)',
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.background = 'var(--bg-elevated)';
              e.currentTarget.style.borderColor = 'var(--accent)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--bg-hover)';
            e.currentTarget.style.borderColor = 'var(--border)';
          }}
        >
          {loading === 'azure' ? (
            <span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
          ) : (
            <Building2 className="w-4 h-4" style={{ color: '#0078D4' }} />
          )}
          Continue with Microsoft
        </button>

        {/* Okta OAuth */}
        <button
          type="button"
          disabled={loading !== null}
          onClick={() => handleOAuthLogin('okta')}
          className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl text-[13px] font-medium transition-all duration-200 disabled:opacity-50"
          style={{
            background: 'var(--bg-hover)',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)',
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.background = 'var(--bg-elevated)';
              e.currentTarget.style.borderColor = 'var(--accent)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--bg-hover)';
            e.currentTarget.style.borderColor = 'var(--border)';
          }}
        >
          {loading === 'okta' ? (
            <span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
          ) : (
            <Shield className="w-4 h-4" style={{ color: '#007DC1' }} />
          )}
          Continue with Okta SSO
        </button>
      </div>

      {/* Security note */}
      <p
        className="text-center text-[11px] mt-6 leading-relaxed"
        style={{ color: 'var(--text-faint)' }}
      >
        By signing in, you agree to our Terms of Service and Privacy Policy.
        <br />
        Your organization administrator manages access to this application.
      </p>
    </div>
  );
}

function LoginLoading() {
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

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLoading />}>
      <LoginForm />
    </Suspense>
  );
}
