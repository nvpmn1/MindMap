import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './index.css';

// Initialize queue debug utilities in development
if (import.meta.env.DEV) {
  import('./lib/queue-debug').then((mod) => {
    mod.queueDebug.bindToWindow();
  });
}

// Suppress browser extension message channel errors
window.addEventListener('error', (event) => {
  if (
    event.message &&
    event.message.includes('A listener indicated an asynchronous response by returning true')
  ) {
    event.preventDefault();
  }
});

// Also handle promise rejections from message channel
window.addEventListener('unhandledrejection', (event) => {
  if (
    event.reason &&
    (event.reason.message || '').includes('A listener indicated an asynchronous response by returning true')
  ) {
    event.preventDefault();
  }
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
