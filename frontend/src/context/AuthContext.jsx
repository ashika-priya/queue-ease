import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

const API_BASE = import.meta.env.VITE_BACKEND_URL || '';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('queue_ease_token') || null);
  const [loading, setLoading] = useState(true);

  // Configure axios default authorization header
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('queue_ease_token', token);
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('queue_ease_token');
    }
  }, [token]);

  // Check current session on mount
  useEffect(() => {
    const fetchMe = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await axios.get(`${API_BASE}/api/auth/me`);
        if (res.data.success) {
          setUser(res.data.user);
        }
      } catch (err) {
        console.warn('Session expired or invalid, logging out.');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchMe();
  }, [token]);

  const login = async (email, password) => {
    const res = await axios.post(`${API_BASE}/api/auth/login`, { email, password });
    if (res.data.success) {
      setToken(res.data.token);
      setUser(res.data.user);
      return res.data;
    }
    throw new Error(res.data.message || 'Login failed');
  };

  const register = async (formData) => {
    const res = await axios.post(`${API_BASE}/api/auth/register`, formData);
    if (res.data.success) {
      setToken(res.data.token);
      setUser(res.data.user);
      return res.data;
    }
    throw new Error(res.data.message || 'Registration failed');
  };

  const quickDemoLogin = async (role) => {
    const res = await axios.post(`${API_BASE}/api/auth/quick-demo-login`, { role });
    if (res.data.success) {
      setToken(res.data.token);
      setUser(res.data.user);
      return res.data;
    }
    throw new Error(res.data.message || 'Quick demo login failed');
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('queue_ease_token');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        quickDemoLogin,
        logout,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
