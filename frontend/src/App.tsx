// ============================================================================
// MindMap Hub - Main Application
// ============================================================================
// Configuração de rotas, providers e estrutura principal
// ============================================================================

import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Toaster } from 'sonner'
import { useAuthStore } from '@/stores/authStore'
import { useTheme } from '@/hooks/useTheme'
import { isSupabaseConfigured } from '@/lib/supabase'
import {
  LoginPage,
  AuthCallbackPage,
  DashboardPage,
  MapEditorPage,
  SettingsPage
} from '@/pages'
import { Spinner } from '@/components/ui/loading'

// ============================================================================
// React Query Client
// ============================================================================

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false
    },
    mutations: {
      retry: 1
    }
  }
})

// ============================================================================
// Setup Required Component
// ============================================================================

function SetupRequired() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Configuração Necessária
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            O MindMap Hub precisa ser configurado antes de usar.
          </p>
        </div>

        <div className="space-y-6">
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              📝 Passo 1: Criar arquivo .env
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Edite o arquivo <code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">frontend/.env</code> com suas credenciais:
            </p>
            <pre className="bg-gray-900 text-green-400 p-3 rounded text-xs overflow-x-auto">
{`VITE_SUPABASE_URL=https://SEU_PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=sua_anon_key_aqui
VITE_API_URL=http://localhost:8000/api/v1`}
            </pre>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              🔑 Passo 2: Obter credenciais do Supabase
            </h3>
            <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-1 list-decimal list-inside">
              <li>Acesse <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">supabase.com/dashboard</a></li>
              <li>Selecione seu projeto</li>
              <li>Vá em Settings → API</li>
              <li>Copie a "Project URL" e "anon public key"</li>
            </ol>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              🔄 Passo 3: Reiniciar o servidor
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Após configurar o .env, reinicie o servidor de desenvolvimento:
            </p>
            <pre className="bg-gray-900 text-green-400 p-3 rounded text-xs mt-2">
{`# Pressione Ctrl+C para parar
# Depois execute novamente:
npm run dev`}
            </pre>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-center text-gray-500 dark:text-gray-400">
            MindMap Hub v1.0 • Plataforma Colaborativa de Mapas Mentais
          </p>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Protected Route Component
// ============================================================================

function ProtectedRoute() {
  const { user, isLoading, isInitialized } = useAuthStore()

  // Wait for auth to initialize
  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Spinner size="lg" className="mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

// ============================================================================
// Public Route Component (redirect if authenticated)
// ============================================================================

function PublicRoute() {
  const { user, isLoading, isInitialized } = useAuthStore()

  // Wait for auth to initialize
  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Spinner size="lg" className="mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  // Redirect to dashboard if already authenticated
  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}

// ============================================================================
// App Routes
// ============================================================================

function AppRoutes() {
  const { initialize, isInitialized } = useAuthStore()

  // Initialize auth on mount
  useEffect(() => {
    if (!isInitialized) {
      initialize()
    }
  }, [initialize, isInitialized])

  return (
    <Routes>
      {/* Public routes */}
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      {/* Auth callback (accessible always) */}
      <Route path="/auth/callback" element={<AuthCallbackPage />} />

      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/map/:mapId" element={<MapEditorPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      {/* Redirect root to dashboard or login */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* 404 - Redirect to dashboard */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

// ============================================================================
// Theme Provider Component
// ============================================================================

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme()

  useEffect(() => {
    const root = window.document.documentElement

    // Remove existing theme classes
    root.classList.remove('light', 'dark')

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      root.classList.add(systemTheme)
    } else {
      root.classList.add(theme)
    }
  }, [theme])

  return <>{children}</>
}

// ============================================================================
// Main App Component
// ============================================================================

export function App() {
  // Show setup screen if Supabase is not configured
  if (!isSupabaseConfigured) {
    return <SetupRequired />
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>

        {/* Toast notifications */}
        <Toaster
          position="bottom-right"
          expand={false}
          richColors
          closeButton
          toastOptions={{
            duration: 4000,
            className: 'font-sans'
          }}
        />

        {/* React Query Devtools (dev only) */}
        {import.meta.env.DEV && (
          <ReactQueryDevtools initialIsOpen={false} position="bottom" />
        )}
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App
