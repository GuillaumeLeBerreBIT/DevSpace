import React, { createContext, useContext, useState } from 'react';
import api from '../lib/api';
import { setToken, clearToken } from '../lib/token';
import queryClient from '../lib/queryClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // isLoggedIn drives whether the app renders or the login screen renders.
  // It starts as false — every page load requires a fresh login.
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginError, setLoginError] = useState(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const login = async (username, password) => {
    setIsLoggingIn(true);
    setLoginError(null);
    try {
      const res = await api.post('/token/', { username, password });
      // Store the access token in memory via the token module
      setToken(res.data.access);
      setIsLoggedIn(true);
    } catch (err) {
      setLoginError('Invalid username or password.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const logout = () => {
    clearToken();
    // Wipe the entire query cache so stale data isn't shown after re-login
    queryClient.clear();
    setIsLoggedIn(false);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, login, logout, loginError, isLoggingIn }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook — any component can call useAuth() to get login state/actions
export const useAuth = () => useContext(AuthContext);
