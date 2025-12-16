import { useEffect, useState } from 'react';
import { trpc } from '@/lib/trpc';

export interface User {
  id: string;
  username: string;
  email?: string;
  name?: string;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

export function useAuth(): AuthState & { logout: () => void } {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
    isAuthenticated: false,
  });

  // Use tRPC to check auth status
  const { data: user, isLoading, error } = trpc.auth.getUser.useQuery();
  const logoutMutation = trpc.auth.logout.useMutation();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        setAuthState({
          user: {
            id: user.id || user.openId || '',
            username: user.name || 'User',
            email: user.email || undefined,
            name: user.name || undefined,
          },
          loading: false,
          error: null,
          isAuthenticated: true,
        });
      } else {
        setAuthState({
          user: null,
          loading: false,
          error: error ? error.message : null,
          isAuthenticated: false,
        });
      }
    }
  }, [user, isLoading, error]);

  const logout = async () => {
    try {
      await logoutMutation.mutateAsync();
      setAuthState({
        user: null,
        loading: false,
        error: null,
        isAuthenticated: false,
      });
      // Redirect to login
      window.location.href = '/login';
    } catch (err) {
      setAuthState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Logout failed',
      }));
    }
  };

  return {
    ...authState,
    logout,
  };
}
