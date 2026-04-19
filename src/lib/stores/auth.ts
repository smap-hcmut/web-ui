/**
 * Auth Store
 *
 * Zustand store for authentication state management.
 * Handles OAuth2 flow, user session, and token management.
 * 
 * OAuth flow:
 * 1. User clicks login → redirect to smap-api.tantai.dev/identity/v1/authentication/login
 * 2. identity-srv redirects to OAuth provider (Google/Azure/Okta)
 * 3. After auth, redirects back to app with auth cookie set
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { apiClient, ApiError } from '../api/client';
import { API_CONFIG } from '../api/config';

// Types matching identity-srv responses
export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  role?: string;
  is_active?: boolean;
}

export interface AuthState {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (provider?: 'google' | 'azure' | 'okta') => void;
  logout: () => Promise<void>;
  fetchCurrentUser: () => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      ...initialState,

      /**
       * Initiate OAuth login by redirecting to identity-srv
       * Browser will be redirected to: smap-api.tantai.dev/identity/v1/authentication/login
       */
      login: (provider: 'google' | 'azure' | 'okta' = 'google') => {
        if (typeof window === 'undefined') return;

        // OAuth login goes through the proxy so Set-Cookie gets rewritten
        // to the frontend's domain (critical for localhost dev).
        const loginPath = `/api/proxy${API_CONFIG.ENDPOINTS.identity.login}`;
        const loginUrl = new URL(loginPath, window.location.origin);

        // After OAuth, backend redirects here — the callback page will
        // verify the session and redirect to /campaigns on success.
        loginUrl.searchParams.set('redirect', `${window.location.origin}/auth/callback`);

        window.location.href = loginUrl.toString();
      },

      /**
       * Logout current user
       */
      logout: async () => {
        set({ isLoading: true, error: null });

        try {
          await apiClient.post(API_CONFIG.ENDPOINTS.identity.logout);
        } catch (err) {
          // Ignore errors during logout (cookie might already be expired)
          console.warn('Logout request failed:', err);
        } finally {
          set({ ...initialState });
          // Redirect to login page
          if (typeof window !== 'undefined') {
            window.location.href = '/auth/login';
          }
        }
      },

      /**
       * Fetch current authenticated user
       */
      fetchCurrentUser: async () => {
        set({ isLoading: true, error: null });

        try {
          const user = await apiClient.get<User>(API_CONFIG.ENDPOINTS.identity.me);
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (err) {
          const apiError = err as ApiError;

          // 401 means not authenticated (expected when not logged in)
          if (apiError.status === 401) {
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              error: null,
            });
          } else {
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              error: apiError.message || 'Failed to fetch user',
            });
          }
        }
      },

      /**
       * Clear error state
       */
      clearError: () => set({ error: null }),

      /**
       * Reset store to initial state
       */
      reset: () => set(initialState),
    }),
    {
      name: 'smap-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist user data, not loading/error states
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Listen for unauthorized events from API client
if (typeof window !== 'undefined') {
  window.addEventListener('auth:unauthorized', () => {
    const { reset } = useAuthStore.getState();
    reset();
    // Optionally redirect to login
    if (!window.location.pathname.startsWith('/auth')) {
      window.location.href = '/auth/login';
    }
  });
}
