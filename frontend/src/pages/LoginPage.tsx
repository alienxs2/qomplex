import { useState, FormEvent, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

/**
 * Email validation regex pattern
 * Validates basic email format: something@something.something
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * LoginPage - User authentication page
 *
 * Features:
 * - Email/password form with client-side validation
 * - Loading spinner during submission
 * - Clear error message display
 * - Link to register page
 * - Mobile-friendly with 44px touch targets
 *
 * Requirements: REQ-1 (User Authentication)
 */
export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError, user } = useAuthStore();

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Clear auth store error on mount and when inputs change
  useEffect(() => {
    clearError();
  }, [clearError]);

  // Redirect to main app if already authenticated
  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  /**
   * Validate email format
   */
  const validateEmail = (value: string): boolean => {
    if (!value.trim()) {
      setEmailError('Email is required');
      return false;
    }
    if (!EMAIL_REGEX.test(value)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError(null);
    return true;
  };

  /**
   * Validate password (minimum 8 characters)
   */
  const validatePassword = (value: string): boolean => {
    if (!value) {
      setPasswordError('Password is required');
      return false;
    }
    if (value.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return false;
    }
    setPasswordError(null);
    return true;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Clear previous errors
    clearError();

    // Validate both fields
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (!isEmailValid || !isPasswordValid) {
      return;
    }

    // Attempt login
    await login(email, password);
  };

  /**
   * Handle email input change with live validation feedback
   */
  const handleEmailChange = (value: string) => {
    setEmail(value);
    // Clear error when user starts typing again
    if (emailError) {
      setEmailError(null);
    }
    // Clear backend error when user makes changes
    if (error) {
      clearError();
    }
  };

  /**
   * Handle password input change with live validation feedback
   */
  const handlePasswordChange = (value: string) => {
    setPassword(value);
    // Clear error when user starts typing again
    if (passwordError) {
      setPasswordError(null);
    }
    // Clear backend error when user makes changes
    if (error) {
      clearError();
    }
  };

  return (
    <div className="min-h-full flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome Back
          </h1>
          <p className="text-gray-600">
            Sign in to your Qomplex account
          </p>
        </div>

        {/* Login Form Card */}
        <div className="card p-6 sm:p-8">
          <form onSubmit={handleSubmit} noValidate>
            {/* Backend Error Message */}
            {error && (
              <div
                className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
                role="alert"
                aria-live="polite"
              >
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>{error}</span>
                </div>
              </div>
            )}

            {/* Email Field */}
            <div className="mb-4">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                autoComplete="email"
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                onBlur={() => email && validateEmail(email)}
                disabled={isLoading}
                className={`input-touch w-full ${
                  emailError
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : ''
                }`}
                placeholder="you@example.com"
                aria-invalid={!!emailError}
                aria-describedby={emailError ? 'email-error' : undefined}
              />
              {emailError && (
                <p
                  id="email-error"
                  className="mt-1 text-sm text-red-600"
                  role="alert"
                >
                  {emailError}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="mb-6">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                onBlur={() => password && validatePassword(password)}
                disabled={isLoading}
                className={`input-touch w-full ${
                  passwordError
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : ''
                }`}
                placeholder="Enter your password"
                aria-invalid={!!passwordError}
                aria-describedby={passwordError ? 'password-error' : undefined}
              />
              {passwordError && (
                <p
                  id="password-error"
                  className="mt-1 text-sm text-red-600"
                  role="alert"
                >
                  {passwordError}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full min-h-touch flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  {/* Loading Spinner */}
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>Signing in...</span>
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don&apos;t have an account?{' '}
              <Link
                to="/register"
                className="text-primary-600 hover:text-primary-700 font-medium hover:underline focus:outline-none focus:underline min-h-touch inline-flex items-center"
              >
                Create one
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-sm text-gray-500">
          Qomplex - Web interface for Claude Code CLI
        </p>
      </div>
    </div>
  );
}
