import { useEffect, useState } from 'react';

export interface User {
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

  useEffect(() => {
    // Check if user is authenticated in localStorage
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    const userJson = localStorage.getItem('user');

    if (isAuthenticated && userJson) {
      try {
        const user = JSON.parse(userJson);
        setAuthState({
          user,
          loading: false,
          error: null,
          isAuthenticated: true,
        });
      } catch (error) {
        setAuthState({
          user: null,
          loading: false,
          error: 'Failed to parse user data',
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
  }, []);

  const logout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
    setAuthState({
      user: null,
      loading: false,
      error: null,
      isAuthenticated: false,
    });
    // Redirect to login
    window.location.href = '/login';
  };

  return {
    ...authState,
    logout,
  };
}
