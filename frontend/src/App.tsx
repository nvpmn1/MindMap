import { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { useAuthStore } from '@/stores/authStore';
import { useProfileSync } from '@/hooks/useProfileSync';
import { overlayManager } from '@/lib/overlay-manager';
import { trackProductEvent } from '@/lib/productMetrics';

// Error Boundary
import { ErrorBoundary } from '@/components/ErrorBoundary';

// Layouts
import { AppLayout } from '@/components/layout/AppLayout';
import { AuthLayout } from '@/components/layout/AuthLayout';

// Pages (lazy-loaded for chunk splitting)
const LoginPage = lazy(() => import('@/pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const DashboardPage = lazy(() =>
  import('@/pages/DashboardPage').then((m) => ({ default: m.DashboardPage }))
);
const NeuralMapEditorPage = lazy(() => import('@/pages/NeuralMapEditorPage'));
const KanbanPage = lazy(() =>
  import('@/pages/KanbanPage').then((m) => ({ default: m.KanbanPage }))
);
const NotFoundPage = lazy(() =>
  import('@/pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage }))
);
const MapsPage = lazy(() => import('@/pages/MapsPage').then((m) => ({ default: m.MapsPage })));
const TasksPage = lazy(() => import('@/pages/TasksPage').then((m) => ({ default: m.TasksPage })));

function RouteLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="w-10 h-10 border-4 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
    </div>
  );
}

/**
 * Component that syncs profile data across app
 * Ensures avatar and settings persist everywhere
 */
function ProfileSyncProvider({ children }: { children: React.ReactNode }) {
  useProfileSync();
  return <>{children}</>;
}

// Protected Route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="w-10 h-10 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Public Route wrapper (redirects if already authenticated)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="w-10 h-10 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function App() {
  const initialize = useAuthStore((state) => state.initialize);
  const location = useLocation();

  // Initialize auth once on app mount
  useEffect(() => {
    initialize();
    trackProductEvent('app_opened', {
      source: 'app-bootstrap',
    });
  }, [initialize]);

  // Clean up overlays when route changes
  useEffect(() => {
    console.log(`[App] Route changed to: ${location.pathname}`);

    if (location.pathname.startsWith('/map/')) {
      const mapId = location.pathname.split('/')[2];
      trackProductEvent('map_opened', {
        mapId,
        source: 'route-change',
      });
    }

    // Give modals a moment to animate out before cleaning up
    const timer = setTimeout(() => {
      overlayManager.cleanupAllOverlays();
    }, 200);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <ErrorBoundary>
      <SpeedInsights />
      <ProfileSyncProvider>
        <Suspense fallback={<RouteLoader />}>
          <Routes>
            {/* Public routes */}
            <Route element={<AuthLayout />}>
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <LoginPage />
                  </PublicRoute>
                }
              />
            </Route>

            {/* Map Editor - Full screen sem sidebar */}
            <Route
              path="/map/:mapId"
              element={
                <ProtectedRoute>
                  <NeuralMapEditorPage />
                </ProtectedRoute>
              }
            />

            {/* Protected routes com layout */}
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/maps" element={<MapsPage />} />
              <Route path="/tasks" element={<TasksPage />} />
              <Route path="/kanban" element={<KanbanPage />} />
            </Route>

            {/* Redirects */}
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </ProfileSyncProvider>
    </ErrorBoundary>
  );
}

export default App;
