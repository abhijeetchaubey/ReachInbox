import React, { useState, useEffect } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';

const DEFAULT_DUMMY_CLIENT_ID = '1047120349812-reachinboxdummyclientid.apps.googleusercontent.com';

const AppContent: React.FC<{
  currentClientId: string;
  onUpdateClientId: (newId: string) => void;
}> = ({ currentClientId, onUpdateClientId }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center text-slate-100">
        <div className="w-12 h-12 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4" />
        <p className="text-xs font-semibold tracking-wide text-zinc-400">Initializing ReachInbox Engine...</p>
      </div>
    );
  }

  return user ? (
    <Dashboard />
  ) : (
    <Login
      currentClientId={currentClientId}
      onUpdateClientId={onUpdateClientId}
    />
  );
};

export const App: React.FC = () => {
  const [clientId, setClientId] = useState<string>(() => {
    return (
      localStorage.getItem('reachinbox_custom_google_client_id') ||
      import.meta.env.VITE_GOOGLE_CLIENT_ID ||
      DEFAULT_DUMMY_CLIENT_ID
    );
  });

  const handleUpdateClientId = (newId: string) => {
    if (newId.trim()) {
      localStorage.setItem('reachinbox_custom_google_client_id', newId.trim());
      setClientId(newId.trim());
    } else {
      localStorage.removeItem('reachinbox_custom_google_client_id');
      setClientId(import.meta.env.VITE_GOOGLE_CLIENT_ID || DEFAULT_DUMMY_CLIENT_ID);
    }
  };

  return (
    <GoogleOAuthProvider clientId={clientId || DEFAULT_DUMMY_CLIENT_ID}>
      <AuthProvider>
        <AppContent
          currentClientId={clientId}
          onUpdateClientId={handleUpdateClientId}
        />
      </AuthProvider>
    </GoogleOAuthProvider>
  );
};

