import React, { createContext, useState, useContext, useEffect } from 'react';

import { db, normalizeUser } from '@/api/localStorageClient';

const AuthContext = createContext();
const getAuthError = (error) => {
  return {
    type: 'unknown',
    message: error?.message || 'Failed to load local app data',
  };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings, setAppPublicSettings] = useState(null); // Contains only { id, public_settings }

  useEffect(() => {
    const bootstrap = async () => {
      await checkAppState();
    };

    bootstrap();
  }, []);

  const checkAppState = async () => {
    try {
      setIsLoadingPublicSettings(true);
      setIsLoadingAuth(true);
      setAuthError(null);

      const currentUser = await db.auth.me();
      setUser(normalizeUser(currentUser));
      setIsAuthenticated(Boolean(currentUser));
      setAuthChecked(true);
      setAppPublicSettings({
        provider: 'localStorage',
        auth_mode: 'local',
      });
    } catch (error) {
      console.error('Local app state check failed:', error);
      setUser(null);
      setIsAuthenticated(false);
      setAuthChecked(true);
      setAuthError(getAuthError(error));
      setAppPublicSettings(null);
    } finally {
      setIsLoadingPublicSettings(false);
      setIsLoadingAuth(false);
    }
  };

  const checkUserAuth = async () => {
    try {
      setIsLoadingAuth(true);
      const currentUser = await db.auth.me();
      setUser(normalizeUser(currentUser));
      setIsAuthenticated(Boolean(currentUser));
      setAuthChecked(true);
    } catch (error) {
      console.error('Local auth check failed:', error);
      setUser(null);
      setIsAuthenticated(false);
      setAuthChecked(true);
      setAuthError(getAuthError(error));
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const logout = async (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);

    try {
      await db.auth.logout(shouldRedirect ? '/' : null);
    } catch (error) {
      setAuthError(getAuthError(error));
    }
  };

  const navigateToLogin = () => {
    void db.auth.redirectToLogin(window.location.href).catch((error) => {
      setAuthError(getAuthError(error));
    });
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      authChecked,
      logout,
      navigateToLogin,
      checkUserAuth,
      checkAppState
    }}>
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
