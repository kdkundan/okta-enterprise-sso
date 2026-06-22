/**
 * AuthContext — application-wide authentication state.
 *
 * On mount, fetches /auth/me to restore session from the HttpOnly cookie.
 * Exposes: user, loading, error, logout
 */

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from './api.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true); // true until first /auth/me resolves
  const [error, setError]     = useState(null);

  // Attempt to restore session on app load
  const fetchCurrentUser = useCallback(async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data.user);
    } catch (err) {
      // 401 = not logged in; anything else = real error
      if (err.response?.status !== 401) {
        setError(err.response?.data?.error || 'Failed to load session');
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch (_) {
      // Best effort
    } finally {
      setUser(null);
      window.location.href = '/login';
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, error, logout, refetch: fetchCurrentUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
