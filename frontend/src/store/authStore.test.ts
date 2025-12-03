/**
 * AuthStore Tests
 *
 * Tests for the authentication Zustand store including:
 * - Login action and state transitions
 * - Register action and state transitions
 * - Logout action
 * - checkAuth action
 * - Error handling
 * - State persistence
 *
 * Requirements: REQ-1 (User Authentication)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useAuthStore, getAuthToken, isAuthenticated } from './authStore';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('authStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    useAuthStore.setState({
      user: null,
      token: null,
      isLoading: false,
      error: null,
    });
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('has correct initial state', () => {
      const state = useAuthStore.getState();

      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('login', () => {
    it('sets isLoading to true when login starts', async () => {
      mockFetch.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            // Don't resolve yet - we want to check loading state
            setTimeout(() => {
              resolve({
                ok: true,
                json: () =>
                  Promise.resolve({
                    user: { id: '1', email: 'test@example.com' },
                    token: 'test-token',
                  }),
              });
            }, 100);
          })
      );

      const loginPromise = useAuthStore.getState().login('test@example.com', 'password123');

      // Check loading state immediately
      expect(useAuthStore.getState().isLoading).toBe(true);

      await loginPromise;
    });

    it('sets user and token on successful login', async () => {
      const mockUser = { id: '1', email: 'test@example.com', created_at: new Date() };
      const mockToken = 'jwt-token-123';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ user: mockUser, token: mockToken }),
      });

      await useAuthStore.getState().login('test@example.com', 'password123');

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.token).toBe(mockToken);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('sets error on 401 unauthorized', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: 'Invalid email or password' }),
      });

      await useAuthStore.getState().login('test@example.com', 'wrongpassword');

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe('Invalid email or password');
    });

    it('sets error on network failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await useAuthStore.getState().login('test@example.com', 'password123');

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe('Network error');
    });

    it('sets error on other HTTP errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Internal server error' }),
      });

      await useAuthStore.getState().login('test@example.com', 'password123');

      const state = useAuthStore.getState();
      expect(state.error).toBe('Internal server error');
    });

    it('sends correct request body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            user: { id: '1', email: 'test@example.com' },
            token: 'token',
          }),
      });

      await useAuthStore.getState().login('test@example.com', 'password123');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/login'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
        })
      );
    });

    it('clears previous error before login attempt', async () => {
      // Set an initial error
      useAuthStore.setState({ error: 'Previous error' });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            user: { id: '1', email: 'test@example.com' },
            token: 'token',
          }),
      });

      await useAuthStore.getState().login('test@example.com', 'password123');

      expect(useAuthStore.getState().error).toBeNull();
    });
  });

  describe('register', () => {
    it('sets user and token on successful registration', async () => {
      const mockUser = { id: '1', email: 'new@example.com', created_at: new Date() };
      const mockToken = 'jwt-token-456';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ user: mockUser, token: mockToken }),
      });

      await useAuthStore.getState().register('new@example.com', 'password123');

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.token).toBe(mockToken);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('sets error on 409 conflict (email already registered)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: () => Promise.resolve({ error: 'Email already exists' }),
      });

      await useAuthStore.getState().register('existing@example.com', 'password123');

      const state = useAuthStore.getState();
      expect(state.error).toBe('Email already registered');
      expect(state.isLoading).toBe(false);
    });

    it('sets error on other registration failures', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: 'Invalid email format' }),
      });

      await useAuthStore.getState().register('invalid', 'password123');

      const state = useAuthStore.getState();
      expect(state.error).toBe('Invalid email format');
    });

    it('sends correct request body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            user: { id: '1', email: 'new@example.com' },
            token: 'token',
          }),
      });

      await useAuthStore.getState().register('new@example.com', 'password123');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/register'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'new@example.com', password: 'password123' }),
        })
      );
    });

    it('sets isLoading during registration', async () => {
      mockFetch.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                ok: true,
                json: () =>
                  Promise.resolve({
                    user: { id: '1', email: 'new@example.com' },
                    token: 'token',
                  }),
              });
            }, 100);
          })
      );

      const registerPromise = useAuthStore.getState().register('new@example.com', 'password123');

      expect(useAuthStore.getState().isLoading).toBe(true);

      await registerPromise;
    });
  });

  describe('logout', () => {
    it('clears user and token on logout', () => {
      // Set initial authenticated state
      useAuthStore.setState({
        user: { id: '1', email: 'test@example.com', created_at: new Date() },
        token: 'some-token',
        isLoading: false,
        error: null,
      });

      useAuthStore.getState().logout();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.error).toBeNull();
      expect(state.isLoading).toBe(false);
    });

    it('clears error on logout', () => {
      useAuthStore.setState({
        user: null,
        token: null,
        isLoading: false,
        error: 'Some error',
      });

      useAuthStore.getState().logout();

      expect(useAuthStore.getState().error).toBeNull();
    });
  });

  describe('checkAuth', () => {
    it('does nothing when no token is stored', async () => {
      useAuthStore.setState({ token: null });

      await useAuthStore.getState().checkAuth();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('validates stored token successfully', async () => {
      const mockUser = { id: '1', email: 'test@example.com', created_at: new Date() };

      useAuthStore.setState({ token: 'valid-token', user: null });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ user: mockUser }),
      });

      await useAuthStore.getState().checkAuth();

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('clears token on 401 response', async () => {
      useAuthStore.setState({
        token: 'invalid-token',
        user: { id: '1', email: 'test@example.com', created_at: new Date() },
      });

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: 'Invalid token' }),
      });

      await useAuthStore.getState().checkAuth();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.error).toBeNull(); // 401 doesn't set error
      expect(state.isLoading).toBe(false);
    });

    it('clears auth state on network error', async () => {
      useAuthStore.setState({
        token: 'some-token',
        user: { id: '1', email: 'test@example.com', created_at: new Date() },
      });

      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await useAuthStore.getState().checkAuth();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.error).toBe('Network error');
    });

    it('sends Authorization header with token', async () => {
      useAuthStore.setState({ token: 'my-token' });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ user: { id: '1', email: 'test@example.com' } }),
      });

      await useAuthStore.getState().checkAuth();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/me'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer my-token',
          }),
        })
      );
    });
  });

  describe('clearError', () => {
    it('clears error state', () => {
      useAuthStore.setState({ error: 'Some error' });

      useAuthStore.getState().clearError();

      expect(useAuthStore.getState().error).toBeNull();
    });

    it('does not affect other state', () => {
      const mockUser = { id: '1', email: 'test@example.com', created_at: new Date() };
      useAuthStore.setState({
        user: mockUser,
        token: 'some-token',
        error: 'Some error',
      });

      useAuthStore.getState().clearError();

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.token).toBe('some-token');
      expect(state.error).toBeNull();
    });
  });

  describe('Helper Functions', () => {
    describe('getAuthToken', () => {
      it('returns token when set', () => {
        useAuthStore.setState({ token: 'my-auth-token' });

        expect(getAuthToken()).toBe('my-auth-token');
      });

      it('returns null when no token', () => {
        useAuthStore.setState({ token: null });

        expect(getAuthToken()).toBeNull();
      });
    });

    describe('isAuthenticated', () => {
      it('returns true when token exists', () => {
        useAuthStore.setState({ token: 'some-token' });

        expect(isAuthenticated()).toBe(true);
      });

      it('returns false when no token', () => {
        useAuthStore.setState({ token: null });

        expect(isAuthenticated()).toBe(false);
      });

      it('returns false for empty string token', () => {
        useAuthStore.setState({ token: '' });

        expect(isAuthenticated()).toBe(false);
      });
    });
  });

  describe('State Transitions', () => {
    it('transitions through loading state during login', async () => {
      const states: boolean[] = [];

      // Subscribe to state changes
      const unsubscribe = useAuthStore.subscribe((state) => {
        states.push(state.isLoading);
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            user: { id: '1', email: 'test@example.com' },
            token: 'token',
          }),
      });

      await useAuthStore.getState().login('test@example.com', 'password');

      unsubscribe();

      // Should have gone through: false -> true -> false
      expect(states).toContain(true);
      expect(states[states.length - 1]).toBe(false);
    });

    it('handles rapid successive login attempts', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ error: 'Invalid credentials' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              user: { id: '1', email: 'test@example.com' },
              token: 'valid-token',
            }),
        });

      // First login fails
      await useAuthStore.getState().login('test@example.com', 'wrong');

      expect(useAuthStore.getState().error).toBe('Invalid credentials');

      // Second login succeeds
      await useAuthStore.getState().login('test@example.com', 'correct');

      const state = useAuthStore.getState();
      expect(state.error).toBeNull();
      expect(state.token).toBe('valid-token');
    });
  });
});
