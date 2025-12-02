/**
 * API Utility Module
 *
 * Provides a typed fetch wrapper with automatic authorization headers,
 * error handling, and 401 redirect logic.
 */

import { getAuthToken, useAuthStore } from '../store/authStore';

/**
 * Base URL for API requests
 * Uses API_URL environment variable or defaults to localhost:3001
 */
const API_BASE_URL =
  import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3001/api`;

/**
 * Structured API error response from backend
 */
interface ApiErrorResponse {
  error: {
    message: string;
    code?: string;
  };
}

/**
 * Custom API Error class with additional context
 */
export class ApiError extends Error {
  public readonly status: number;
  public readonly code: string | undefined;
  public readonly isNetworkError: boolean;

  constructor(
    message: string,
    status: number,
    code?: string,
    isNetworkError = false
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.isNetworkError = isNetworkError;
  }
}

/**
 * Request options for API calls
 */
interface RequestOptions extends Omit<RequestInit, 'method' | 'body'> {
  /**
   * Skip automatic Authorization header injection
   * Useful for public endpoints like login/register
   */
  skipAuth?: boolean;
}

/**
 * Handle 401 Unauthorized response
 * Clears auth state and redirects to login page
 */
function handleUnauthorized(): void {
  // Clear auth state using Zustand store
  useAuthStore.getState().logout();

  // Redirect to login page
  // Using window.location to ensure full navigation
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
}

/**
 * Parse error response from API
 */
async function parseErrorResponse(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as ApiErrorResponse;
    return data.error?.message || `Request failed with status ${response.status}`;
  } catch {
    // If JSON parsing fails, return generic error
    return `Request failed with status ${response.status}`;
  }
}

/**
 * Build request headers with optional authorization
 */
function buildHeaders(skipAuth: boolean, customHeaders?: HeadersInit): Headers {
  const headers = new Headers(customHeaders);

  // Always set Content-Type for JSON APIs
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  // Add Authorization header if not skipped and token exists
  if (!skipAuth) {
    const token = getAuthToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  return headers;
}

/**
 * Core fetch wrapper with error handling
 */
async function request<T>(
  endpoint: string,
  method: string,
  body?: unknown,
  options: RequestOptions = {}
): Promise<T> {
  const { skipAuth = false, headers: customHeaders, ...fetchOptions } = options;

  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers = buildHeaders(skipAuth, customHeaders);

  const config: RequestInit = {
    method,
    headers,
    ...fetchOptions,
  };

  // Add body for methods that support it
  if (body !== undefined && method !== 'GET' && method !== 'HEAD') {
    config.body = JSON.stringify(body);
  }

  let response: Response;

  try {
    response = await fetch(url, config);
  } catch (error) {
    // Network error (no connection, DNS failure, etc.)
    const message =
      error instanceof Error ? error.message : 'Network request failed';
    throw new ApiError(
      `Network error: ${message}. Please check your connection.`,
      0,
      'NETWORK_ERROR',
      true
    );
  }

  // Handle 401 Unauthorized
  if (response.status === 401) {
    handleUnauthorized();
    throw new ApiError('Session expired. Please log in again.', 401, 'UNAUTHORIZED');
  }

  // Handle other error responses
  if (!response.ok) {
    const errorMessage = await parseErrorResponse(response);
    throw new ApiError(errorMessage, response.status);
  }

  // Handle empty responses (204 No Content)
  if (response.status === 204) {
    return undefined as T;
  }

  // Parse JSON response
  try {
    const data = await response.json();
    return data as T;
  } catch {
    // Response is not JSON but was successful
    return undefined as T;
  }
}

/**
 * HTTP GET request
 *
 * @param endpoint - API endpoint (relative to base URL or absolute)
 * @param options - Optional request configuration
 * @returns Promise resolving to typed response data
 *
 * @example
 * const user = await api.get<User>('/auth/me');
 */
export async function get<T>(
  endpoint: string,
  options?: RequestOptions
): Promise<T> {
  return request<T>(endpoint, 'GET', undefined, options);
}

/**
 * HTTP POST request
 *
 * @param endpoint - API endpoint (relative to base URL or absolute)
 * @param body - Request body (will be JSON serialized)
 * @param options - Optional request configuration
 * @returns Promise resolving to typed response data
 *
 * @example
 * const project = await api.post<Project>('/projects', { working_directory: '/home/dev/myproject' });
 */
export async function post<T>(
  endpoint: string,
  body?: unknown,
  options?: RequestOptions
): Promise<T> {
  return request<T>(endpoint, 'POST', body, options);
}

/**
 * HTTP PUT request
 *
 * @param endpoint - API endpoint (relative to base URL or absolute)
 * @param body - Request body (will be JSON serialized)
 * @param options - Optional request configuration
 * @returns Promise resolving to typed response data
 *
 * @example
 * const agent = await api.put<Agent>('/agents/123', { name: 'Updated Agent' });
 */
export async function put<T>(
  endpoint: string,
  body?: unknown,
  options?: RequestOptions
): Promise<T> {
  return request<T>(endpoint, 'PUT', body, options);
}

/**
 * HTTP DELETE request
 *
 * @param endpoint - API endpoint (relative to base URL or absolute)
 * @param options - Optional request configuration
 * @returns Promise resolving to typed response data
 *
 * @example
 * await api.del('/projects/123');
 */
export async function del<T>(
  endpoint: string,
  options?: RequestOptions
): Promise<T> {
  return request<T>(endpoint, 'DELETE', undefined, options);
}

/**
 * HTTP PATCH request
 *
 * @param endpoint - API endpoint (relative to base URL or absolute)
 * @param body - Request body (will be JSON serialized)
 * @param options - Optional request configuration
 * @returns Promise resolving to typed response data
 *
 * @example
 * const agent = await api.patch<Agent>('/agents/123', { system_prompt: 'Updated prompt' });
 */
export async function patch<T>(
  endpoint: string,
  body?: unknown,
  options?: RequestOptions
): Promise<T> {
  return request<T>(endpoint, 'PATCH', body, options);
}

/**
 * API utility namespace for convenient imports
 */
export const api = {
  get,
  post,
  put,
  del,
  patch,
  /**
   * Alias for delete (since 'delete' is a reserved word)
   */
  delete: del,
};

export default api;
