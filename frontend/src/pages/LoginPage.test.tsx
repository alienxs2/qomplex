/**
 * LoginPage Component Tests
 *
 * Tests for the LoginPage component including:
 * - Form submission behavior
 * - Validation errors for email and password
 * - Loading states
 * - Error message display
 * - Navigation to register page
 *
 * Requirements: REQ-1 (User Authentication)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import LoginPage from './LoginPage';
import { useAuthStore } from '../store/authStore';

// Mock react-router-dom navigation
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Helper to render with router
function renderLoginPage() {
  return render(
    <BrowserRouter>
      <LoginPage />
    </BrowserRouter>
  );
}

describe('LoginPage', () => {
  beforeEach(() => {
    // Reset auth store to initial state before each test
    useAuthStore.setState({
      user: null,
      token: null,
      isLoading: false,
      error: null,
    });
    mockNavigate.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders login form with email and password fields', () => {
      renderLoginPage();

      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('renders link to register page', () => {
      renderLoginPage();

      const registerLink = screen.getByRole('link', { name: /create one/i });
      expect(registerLink).toBeInTheDocument();
      expect(registerLink).toHaveAttribute('href', '/register');
    });

    it('renders welcome message', () => {
      renderLoginPage();

      expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
      expect(screen.getByText(/sign in to your qomplex account/i)).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('shows error when email is empty on submit', async () => {
      const user = userEvent.setup();
      renderLoginPage();

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      });
    });

    it('shows error for invalid email format', async () => {
      const user = userEvent.setup();
      renderLoginPage();

      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'invalid-email');

      // Blur to trigger validation
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
      });
    });

    it('shows error when password is empty on submit', async () => {
      const user = userEvent.setup();
      renderLoginPage();

      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'test@example.com');

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      });
    });

    it('shows error when password is less than 8 characters', async () => {
      const user = userEvent.setup();
      renderLoginPage();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, '1234567'); // 7 chars

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
      });
    });

    it('clears email error when user starts typing', async () => {
      const user = userEvent.setup();
      renderLoginPage();

      // Trigger validation error
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      });

      // Start typing to clear error
      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 't');

      await waitFor(() => {
        expect(screen.queryByText(/email is required/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('calls login when form is valid', async () => {
      const user = userEvent.setup();
      const loginSpy = vi.fn().mockResolvedValue(undefined);

      useAuthStore.setState({
        user: null,
        token: null,
        isLoading: false,
        error: null,
        login: loginSpy,
      });

      renderLoginPage();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(loginSpy).toHaveBeenCalledWith('test@example.com', 'password123');
      });
    });

    it('does not submit form when validation fails', async () => {
      const user = userEvent.setup();
      const loginSpy = vi.fn();

      useAuthStore.setState({
        user: null,
        token: null,
        isLoading: false,
        error: null,
        login: loginSpy,
      });

      renderLoginPage();

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      expect(loginSpy).not.toHaveBeenCalled();
    });
  });

  describe('Loading State', () => {
    it('shows loading spinner when isLoading is true', () => {
      useAuthStore.setState({
        user: null,
        token: null,
        isLoading: true,
        error: null,
      });

      renderLoginPage();

      expect(screen.getByText(/signing in/i)).toBeInTheDocument();
    });

    it('disables inputs when loading', () => {
      useAuthStore.setState({
        user: null,
        token: null,
        isLoading: true,
        error: null,
      });

      renderLoginPage();

      expect(screen.getByLabelText(/email address/i)).toBeDisabled();
      expect(screen.getByLabelText(/password/i)).toBeDisabled();
    });

    it('disables submit button when loading', () => {
      useAuthStore.setState({
        user: null,
        token: null,
        isLoading: true,
        error: null,
      });

      renderLoginPage();

      expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled();
    });
  });

  describe('Error Display', () => {
    it('displays backend error message', async () => {
      // Need to set state before render, but the component clears error on mount
      // So we need to set the error after the component has mounted
      const { rerender } = renderLoginPage();

      // Set error after initial render
      useAuthStore.setState({
        user: null,
        token: null,
        isLoading: false,
        error: 'Invalid email or password',
      });

      // Rerender to reflect the state change
      rerender(
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
      });
    });

    it('error message has alert role for accessibility', async () => {
      const { rerender } = renderLoginPage();

      // Set error after initial render
      useAuthStore.setState({
        user: null,
        token: null,
        isLoading: false,
        error: 'Something went wrong',
      });

      rerender(
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });
  });

  describe('Redirect on Authentication', () => {
    it('redirects to home when user is authenticated', async () => {
      useAuthStore.setState({
        user: { id: '1', email: 'test@example.com', created_at: new Date() },
        token: 'valid-token',
        isLoading: false,
        error: null,
      });

      renderLoginPage();

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
      });
    });
  });
});
