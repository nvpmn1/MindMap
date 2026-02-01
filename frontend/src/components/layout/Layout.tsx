import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore, useUIStore } from '@/stores';
import { Sidebar } from './Sidebar';
import { cn } from '@/lib/utils';
import { Spinner } from '@/components/ui';

interface MainLayoutProps {
  children?: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { sidebarOpen } = useUIStore();

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main
        className={cn(
          'min-h-screen transition-all duration-300',
          sidebarOpen ? 'ml-64' : 'ml-16'
        )}
      >
        {children || <Outlet />}
      </main>
    </div>
  );
}

export function AuthLayout({ children }: { children?: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {children || <Outlet />}
      </div>
    </div>
  );
}

export function EditorLayout({ children }: { children?: React.ReactNode }) {
  return (
    <div className="h-screen bg-background overflow-hidden">
      {children || <Outlet />}
    </div>
  );
}

// Route Guard Components
export function ProtectedRoute({ children }: { children?: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children || <Outlet />}</>;
}

export function PublicRoute({ children }: { children?: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    const from = (location.state as any)?.from?.pathname || '/dashboard';
    return <Navigate to={from} replace />;
  }

  return <>{children || <Outlet />}</>;
}

// AppLayout - Main layout with sidebar for dashboard/settings
export function AppLayout({ children }: { children?: React.ReactNode }) {
  const { sidebarOpen } = useUIStore();

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main
        className={cn(
          'min-h-screen transition-all duration-300',
          sidebarOpen ? 'ml-64' : 'ml-16'
        )}
      >
        <div className="p-6">
          {children || <Outlet />}
        </div>
      </main>
    </div>
  );
}

// MinimalLayout - Minimal layout for editor (no sidebar padding)
export function MinimalLayout({ children }: { children?: React.ReactNode }) {
  return (
    <div className="h-screen bg-background overflow-hidden">
      {children || <Outlet />}
    </div>
  );
}
