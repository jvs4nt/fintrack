import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ApiDocs from './pages/ApiDocs';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/ToastProvider';
import { ConfirmProvider } from './components/ConfirmDialog';

function isApiDocsRoute(): boolean {
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  return path === '/api-docs';
}

const root = (
  <React.StrictMode>
    {isApiDocsRoute() ? (
      <ApiDocs />
    ) : (
      <AuthProvider>
        <ToastProvider>
          <ConfirmProvider>
            <App />
          </ConfirmProvider>
        </ToastProvider>
      </AuthProvider>
    )}
  </React.StrictMode>
);

ReactDOM.createRoot(document.getElementById('root')!).render(root);
