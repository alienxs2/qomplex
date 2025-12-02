import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserPublic } from '@shared/types';

/**
 * Auth API base URL - uses same host with backend port
 */
const API_BASE = `http://${window.location.hostname}:3000`;

/**
 * AuthState interface following design.md specification
 */
interface AuthState {
  user: UserPublic | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

/**
 * useAuthStore - Zustand store for authentication state
 *
 * Features:
 * - Persist middleware stores token in localStorage with key 'qomplex-auth'
 * - Login/register call backend APIs
 * - Logout clears state
 * - checkAuth validates stored token via /api/auth/me
 * - Clears token on 401 responses
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,

      /**
       * Login with email and password
       * Calls POST /api/auth/login
       */
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
          const response = await fetch(`${API_BASE}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });

          const data = await response.json();

          if (!response.ok) {
            // Handle 401 specifically
            if (response.status === 401) {
              set({
                error: data.error || 'Invalid email or password',
                isLoading: false,
                token: null,
                user: null,
              });
              return;
            }
            throw new Error(data.error || 'Login failed');
          }

          set({
            user: data.user,
            token: data.token,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Login failed',
            isLoading: false,
          });
        }
      },

      /**
       * Register new user with email and password
       * Calls POST /api/auth/register
       */
      register: async (email: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
          const response = await fetch(`${API_BASE}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });

          const data = await response.json();

          if (!response.ok) {
            // Handle specific error cases
            if (response.status === 409) {
              set({
                error: 'Email already registered',
                isLoading: false,
              });
              return;
            }
            throw new Error(data.error || 'Registration failed');
          }

          set({
            user: data.user,
            token: data.token,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Registration failed',
            isLoading: false,
          });
        }
      },

      /**
       * Logout - clears all auth state
       */
      logout: () => {
        set({
          user: null,
          token: null,
          error: null,
          isLoading: false,
        });
      },

      /**
       * Check authentication status by validating stored token
       * Calls GET /api/auth/me with stored token
       * Clears token on 401 response
       */
      checkAuth: async () => {
        const { token } = get();

        // No token stored, nothing to check
        if (!token) {
          set({ user: null, isLoading: false });
          return;
        }

        set({ isLoading: true, error: null });

        try {
          const response = await fetch(`${API_BASE}/api/auth/me`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          });

          if (!response.ok) {
            // Clear token on 401 (invalid/expired token)
            if (response.status === 401) {
              set({
                user: null,
                token: null,
                isLoading: false,
                error: null,
              });
              return;
            }
            throw new Error('Failed to validate token');
          }

          const data = await response.json();

          set({
            user: data.user,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          // On any error, clear auth state
          set({
            user: null,
            token: null,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Authentication check failed',
          });
        }
      },

      /**
       * Clear error state
       */
      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'qomplex-auth',
      // Only persist token (not password, not loading state)
      partialize: (state) => ({
        token: state.token,
        user: state.user,
      }),
    }
  )
);

/**
 * Helper function to get auth token for API requests
 * Returns the current token or null
 */
export function getAuthToken(): string | null {
  return useAuthStore.getState().token;
}

/**
 * Helper function to check if user is authenticated
 * Returns true if token exists
 */
export function isAuthenticated(): boolean {
  return !!useAuthStore.getState().token;
}
