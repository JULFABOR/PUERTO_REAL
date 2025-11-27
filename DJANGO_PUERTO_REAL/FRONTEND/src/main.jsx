import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import {AuthProvider} from '@/auth/AuthProvider';
import App from './App.jsx';
import { Toaster } from 'react-hot-toast';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';
import './styles/shared.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
        <Toaster 
          position="top-right"
          toastOptions={{
            style: {
              background: '#1F2937',
              color: '#D1D5DB',
              border: '1px solid #4B5563',
              borderRadius: '0.5rem',
              padding: '1rem',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
              fontWeight: '500',
            },
            success: {
              style: {
                background: '#1F2937',
                color: '#FFC700',
                border: '2px solid #FFC700',
                boxShadow: '0 10px 15px -3px rgba(255, 199, 0, 0.3)',
              },
              iconTheme: {
                primary: '#FFC700',
                secondary: '#1F2937',
              },
            },
            error: {
              style: {
                background: '#1F2937',
                color: '#FCA5A5',
                border: '2px solid #FCA5A5',
                boxShadow: '0 10px 15px -3px rgba(252, 165, 165, 0.3)',
              },
              iconTheme: {
                primary: '#FCA5A5',
                secondary: '#1F2937',
              },
            },
            loading: {
              style: {
                background: '#1F2937',
                color: '#FFC700',
                border: '2px solid #FFC700',
              },
              iconTheme: {
                primary: '#FFC700',
                secondary: '#1F2937',
              },
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);