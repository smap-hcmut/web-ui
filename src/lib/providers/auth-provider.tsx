/**
 * Auth Provider
 *
 * Wraps the app with authentication context.
 * Handles initial auth check and provides auth state to children.
 */

'use client';

import { useEffect, type ReactNode } from 'react';
import { useAuthStore } from '../stores/auth';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const fetchCurrentUser = useAuthStore((state) => state.fetchCurrentUser);
  const isLoading = useAuthStore((state) => state.isLoading);

  // Check auth status on mount
  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  // Optionally show loading state during initial auth check
  // For now, we render children immediately to avoid flash
  return <>{children}</>;
}
