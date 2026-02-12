import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import App from './App';
import { logger } from '@/lib/logger';
import {
  initObservability,
  captureFrontendException,
  captureFrontendMessage,
} from '@/lib/observability';
import './index.css';

initObservability();

// Initialize queue debug utilities in development
if (import.meta.env.DEV) {
  import('./lib/queue-debug').then((mod) => {
    mod.queueDebug.bindToWindow();
  });
}

const EXTENSION_CHANNEL_ERROR = 'A listener indicated an asynchronous response by returning true';
let lastRuntimeToastAt = 0;
const runtimeErrorCache = new Set<string>();

function normalizeErrorMessage(input: unknown): string {
  if (input instanceof Error) return input.message;
  if (typeof input === 'string') return input;
  if (typeof input === 'object' && input !== null && 'message' in input) {
    return String((input as { message?: unknown }).message || 'Unknown error');
  }
  return 'Unknown error';
}

function shouldIgnoreRuntimeNoise(message: string): boolean {
  return message.includes(EXTENSION_CHANNEL_ERROR);
}

function notifyRuntimeFailure(message: string) {
  const now = Date.now();
  if (now - lastRuntimeToastAt > 8000) {
    toast.error('Encontramos um erro inesperado. Sua sessão foi preservada.', { duration: 3500 });
    lastRuntimeToastAt = now;
  }

  if (runtimeErrorCache.size > 250) {
    runtimeErrorCache.clear();
  }
  runtimeErrorCache.add(message);
}

window.addEventListener('error', (event) => {
  const message = normalizeErrorMessage(event.error ?? event.message);
  if (!message) return;

  if (shouldIgnoreRuntimeNoise(message)) {
    event.preventDefault();
    return;
  }

  if (!runtimeErrorCache.has(message)) {
    logger.error('Erro global não tratado (window.error)', {
      message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
    captureFrontendException(event.error ?? message, {
      source: 'window.error',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  }

  notifyRuntimeFailure(message);
});

window.addEventListener('unhandledrejection', (event) => {
  const message = normalizeErrorMessage(event.reason);
  if (!message) return;

  if (shouldIgnoreRuntimeNoise(message)) {
    event.preventDefault();
    return;
  }

  if (!runtimeErrorCache.has(message)) {
    logger.error('Promise rejeitada sem tratamento (unhandledrejection)', {
      message,
      reason: event.reason,
    });
    captureFrontendException(event.reason ?? message, {
      source: 'unhandledrejection',
    });
    captureFrontendMessage('error', 'Unhandled promise rejection', {
      message,
    });
  }

  notifyRuntimeFailure(message);
});

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <App />
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 3500,
            style: {
              background: 'hsl(var(--card))',
              color: 'hsl(var(--card-foreground))',
              border: '1px solid hsl(var(--border))',
            },
            success: {
              duration: 3500,
              iconTheme: {
                primary: '#10B981',
                secondary: 'white',
              },
            },
            error: {
              iconTheme: {
                primary: '#EF4444',
                secondary: 'white',
              },
            },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
