import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginWithGoogle: (credential?: string, profile?: any) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = async () => {
    const token = localStorage.getItem('reachinbox_token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await api.get('/auth/me');
      setUser(res.data);
    } catch (err) {
      console.error('Failed to fetch user session:', err);
      localStorage.removeItem('reachinbox_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const loginWithGoogle = async (credential?: string, profile?: any) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/google', { credential, profile });
      const { token, user: userData } = res.data;
      localStorage.setItem('reachinbox_token', token);
      setUser(userData);
    } catch (err: any) {
      console.error('Login error:', err);
      throw new Error(err.response?.data?.error || 'Google login failed');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('reachinbox_token');
    setUser(null);
  };

  const refreshUser = async () => {
    await fetchCurrentUser();
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
