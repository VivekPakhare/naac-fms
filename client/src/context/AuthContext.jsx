import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

/**
 * AuthProvider — wraps the app and provides global auth state.
 *
 * State: { user, token, loading, isAuthenticated }
 * Methods: login, register, logout, updateProfile, refreshUser
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('naac_token'));
  const [loading, setLoading] = useState(true);

  const isAuthenticated = !!user && !!token;

  // ── Load user from stored token on mount ─────────────────
  const refreshUser = useCallback(async () => {
    const storedToken = localStorage.getItem('naac_token');
    if (!storedToken) {
      setUser(null);
      setToken(null);
      setLoading(false);
      return;
    }

    try {
      const res = await api.get('/auth/me');
      setUser(res.data.data.user);
      setToken(storedToken);
    } catch {
      // Token expired or invalid
      localStorage.removeItem('naac_token');
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // ── Login ────────────────────────────────────────────────
  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { user: userData, token: newToken } = res.data.data;

    localStorage.setItem('naac_token', newToken);
    setUser(userData);
    setToken(newToken);

    return userData;
  };

  // ── Register ─────────────────────────────────────────────
  // Now returns { requiresVerification, email } instead of setting auth state.
  const register = async (formData) => {
    const res = await api.post('/auth/register', formData);
    const data = res.data.data;

    // New flow: registration requires email verification
    if (data.requiresVerification) {
      return { requiresVerification: true, email: data.email };
    }

    // Fallback for already-verified users (shouldn't happen in normal flow)
    if (data.token) {
      localStorage.setItem('naac_token', data.token);
      setUser(data.user);
      setToken(data.token);
      return data.user;
    }

    return data;
  };

  // ── Logout ───────────────────────────────────────────────
  const logout = () => {
    localStorage.removeItem('naac_token');
    setUser(null);
    setToken(null);
  };

  // ── Update Profile ───────────────────────────────────────
  const updateProfile = async (profileData) => {
    const res = await api.put('/auth/profile', profileData);
    setUser(res.data.data.user);
    return res.data.data.user;
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    updateProfile,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook: useAuth()
 * Access auth context from any component.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
