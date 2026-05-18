import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import ErrorBoundary from './components/common/ErrorBoundary.jsx';
import AppRoutes from './routes/AppRoutes.jsx';
import './styles.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 60_000,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AppRoutes />
        <Toaster position="top-right" toastOptions={{ className: 'toast-surface' }} />
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
