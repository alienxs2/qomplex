import { lazy, Suspense } from 'react';
import {
  createBrowserRouter,
  Navigate,
  Outlet,
  RouterProvider,
} from 'react-router-dom';

// Lazy load the main app for code splitting
const MainApp = lazy(() => import('./pages/MainApp'));

// Import auth pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Loading fallback for lazy-loaded components
function LoadingFallback() {
  return (
    <div className="h-full flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

/**
 * ProtectedRoute component
 * Redirects to /login if user is not authenticated
 *
 * Note: Authentication logic will be implemented in useAuthStore (task 4.2).
 * For now, this checks for a token in localStorage as a placeholder.
 */
interface ProtectedRouteProps {
  children?: React.ReactNode;
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
  // Placeholder auth check - will be replaced with useAuthStore in task 4.2
  const isAuthenticated = (): boolean => {
    // Check for token in localStorage (this will be handled by Zustand persist middleware)
    const authStorage = localStorage.getItem('qomplex-auth');
    if (authStorage) {
      try {
        const parsed = JSON.parse(authStorage);
        return !!parsed?.state?.token;
      } catch {
        return false;
      }
    }
    return false;
  };

  if (!isAuthenticated()) {
    // Redirect to login page if not authenticated
    return <Navigate to="/login" replace />;
  }

  // Render child routes if authenticated
  return children ? <>{children}</> : <Outlet />;
}

/**
 * PublicRoute component
 * Redirects to main app if user is already authenticated
 */
function PublicRoute({ children }: { children: React.ReactNode }) {
  // Placeholder auth check - will be replaced with useAuthStore in task 4.2
  const isAuthenticated = (): boolean => {
    const authStorage = localStorage.getItem('qomplex-auth');
    if (authStorage) {
      try {
        const parsed = JSON.parse(authStorage);
        return !!parsed?.state?.token;
      } catch {
        return false;
      }
    }
    return false;
  };

  if (isAuthenticated()) {
    // Redirect to main app if already authenticated
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

// Router configuration using React Router v6 patterns
const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <PublicRoute>
        <LoginPage />
      </PublicRoute>
    ),
  },
  {
    path: '/register',
    element: (
      <PublicRoute>
        <RegisterPage />
      </PublicRoute>
    ),
  },
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <MainApp />
          </Suspense>
        ),
      },
    ],
  },
  {
    // Catch-all route - redirect to main app (which will redirect to login if not authenticated)
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);

/**
 * AppRouter component
 * Provides the router context to the application
 */
export function AppRouter() {
  return <RouterProvider router={router} />;
}

export { ProtectedRoute, PublicRoute };
