import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/auth/AuthProvider';
import { StoreProvider } from '@/contexts/StoreContext'; // <--- IMPORTADO
import App from './App.jsx';
import { Toaster } from 'react-hot-toast';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';
import './styles/shared.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <StoreProvider> {/* <--- ENVUELVE A APP */}
          <ErrorBoundary>
            <App />
          </ErrorBoundary>
        </StoreProvider>
        <Toaster 
          position="top-right"
          toastOptions={{
            style: {
              background: '#1F2937',
              color: '#D1D5DB',
              border: '1px solid #4B5563',
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);