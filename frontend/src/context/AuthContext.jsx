'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { setTokens, clearTokens } from '@/lib/api';
import * as authLib from '@/lib/auth';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [tokens, setTokensState] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user on mount
  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    try {
      // Check if tokens exist in sessionStorage
      const storedTokens = sessionStorage.getItem('tokens');
      if (storedTokens) {
        const parsedTokens = JSON.parse(storedTokens);
        setTokensState(parsedTokens);
        setTokens(parsedTokens);

        // Fetch user profile
        const userData = await authLib.getCurrentUser();
        setUser(userData);
      }
    } catch (error) {
      console.error('Failed to load user:', error);
      // Clear invalid tokens
      sessionStorage.removeItem('tokens');
      clearTokens();
    } finally {
      setLoading(false);
    }
  }

  async function signup(email, password, name) {
    try {
      const data = await authLib.signup(email, password, name);

      const userTokens = {
        accessToken: data.accessToken,
        idToken: data.idToken,
        refreshToken: data.refreshToken,
      };

      // Store tokens
      sessionStorage.setItem('tokens', JSON.stringify(userTokens));
      setTokensState(userTokens);
      setTokens(userTokens);

      // Set user
      setUser(data.user);

      return data;
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  }

  async function login(email, password) {
    try {
      const data = await authLib.login(email, password);

      const userTokens = {
        accessToken: data.accessToken,
        idToken: data.idToken,
        refreshToken: data.refreshToken,
      };

      // Store tokens
      sessionStorage.setItem('tokens', JSON.stringify(userTokens));
      setTokensState(userTokens);
      setTokens(userTokens);

      // Set user
      setUser(data.user);

      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  function logout() {
    // Clear tokens
    sessionStorage.removeItem('tokens');
    setTokensState(null);
    clearTokens();

    // Clear user
    setUser(null);
  }

  const value = {
    user,
    tokens,
    loading,
    signup,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
