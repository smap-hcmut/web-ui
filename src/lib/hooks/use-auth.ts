/**
 * Auth Hooks
 *
 * React Query hooks for authentication-related API calls.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, ApiError } from '../api/client';
import { API_CONFIG } from '../api/config';
import { useAuthStore, User } from '../stores/auth';

// Query keys for cache management
export const authKeys = {
  all: ['auth'] as const,
  me: () => [...authKeys.all, 'me'] as const,
};

/**
 * Hook to fetch and sync current user with Zustand store
 */
export function useCurrentUser() {
  const { user, isAuthenticated } = useAuthStore();

  const query = useQuery({
    queryKey: authKeys.me(),
    queryFn: async () => {
      const data = await apiClient.get<User>(API_CONFIG.ENDPOINTS.identity.me);
      return data;
    },
    // Don't retry on auth errors (401)
    retry: false,
    // Enable only when we think user might be authenticated
    // (e.g., on initial load or after OAuth callback)
    enabled: true,
    // Sync with Zustand store on success
    select: (data) => {
      // Update Zustand store when React Query fetches user
      const store = useAuthStore.getState();
      if (data && (!store.user || store.user.id !== data.id)) {
        useAuthStore.setState({
          user: data,
          isAuthenticated: true,
          isLoading: false,
        });
      }
      return data;
    },
  });

  return {
    user: query.data || user,
    isAuthenticated: !!query.data || isAuthenticated,
    isLoading: query.isLoading,
    error: query.error as ApiError | null,
    refetch: query.refetch,
  };
}

/**
 * Hook to handle logout
 */
export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await apiClient.post(API_CONFIG.ENDPOINTS.identity.logout);
    },
    onSuccess: () => {
      // Clear all cached data
      queryClient.clear();
      // Reset auth store
      useAuthStore.getState().reset();
      // Redirect to login
      window.location.href = '/auth/login';
    },
    onError: () => {
      // Even on error, clear state and redirect
      queryClient.clear();
      useAuthStore.getState().reset();
      window.location.href = '/auth/login';
    },
  });
}

/**
 * Hook to initiate OAuth login
 */
export function useLogin() {
  const login = useAuthStore((state) => state.login);

  return {
    login,
    loginWithGoogle: () => login('google'),
    loginWithAzure: () => login('azure'),
    loginWithOkta: () => login('okta'),
  };
}
