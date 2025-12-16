import { useEffect, useState } from 'react';

export interface User {
  id: string;
  username: string;
  email?: string;
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

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/trpc/auth.getUser', {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          if (data.result?.data) {
            setAuthState({
              user: data.result.data,
              loading: false,
              error: null,
              isAuthenticated: true,
            });
          } else {
            setAuthState({
              user: null,
              loading: false,
              error: null,
              isAuthenticated: false,
            });
          }
        } else {
          setAuthState({
            user: null,
            loading: false,
            error: null,
            isAuthenticated: false,
          });
        }
      } catch (err) {
        setAuthState({
          user: null,
          loading: false,
          error: err instanceof Error ? err.message : 'Failed to check auth',
          isAuthenticated: false,
        });
      }
    };

    checkAuth();
  }, []);

  const logout = async () => {
    try {
      await fetch('/api/trpc/auth.logout', {
        method: 'POST',
        credentials: 'include',
      });
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
