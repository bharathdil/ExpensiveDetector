import React, { createContext, useState, useContext, useEffect } from 'react';

import { db, isSupabaseConfigured, supabase, supabaseConfigErrorMessage, normalizeUser } from '@/api/supabaseClient';

const AuthContext = createContext();
const getAuthError = (error) => {
  if (error?.code === 'anonymous_provider_disabled') {
    return {
      type: 'setup_required',
      message: 'Enable Anonymous Sign-Ins in your Supabase dashboard, then refresh the app.',
    };
  }

  if (error?.code === 'AUTH_REQUIRED' || error?.status === 401) {
    return {
      type: 'auth_required',
      message: 'Authentication required',
    };
  }

  if (error?.code === 'SUPABASE_CONFIG_MISSING') {
    return {
      type: 'config_error',
      message: supabaseConfigErrorMessage,
    };
  }

  return {
    type: 'unknown',
    message: error?.message || 'Failed to connect to Supabase',
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
    let mounted = true;

    const bootstrap = async () => {
      await checkAppState();
    };

    bootstrap();

    if (!supabase) {
      return () => {
        mounted = false;
      };
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) {
        return;
      }

      const nextUser = normalizeUser(session?.user ?? null);
      setUser(nextUser);
      setIsAuthenticated(Boolean(nextUser));
      setAuthChecked(true);
      setIsLoadingAuth(false);
      setIsLoadingPublicSettings(false);
      if (nextUser) {
        setAuthError(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const checkAppState = async () => {
    try {
      setIsLoadingPublicSettings(true);
      setIsLoadingAuth(true);
      setAuthError(null);

      if (!isSupabaseConfigured) {
        throw Object.assign(new Error(supabaseConfigErrorMessage), {
          code: 'SUPABASE_CONFIG_MISSING',
          status: 500,
        });
      }

      const currentUser = await db.auth.me();
      setUser(normalizeUser(currentUser));
      setIsAuthenticated(Boolean(currentUser));
      setAuthChecked(true);
      setAppPublicSettings({
        provider: 'supabase',
        auth_mode: 'anonymous',
      });
    } catch (error) {
      console.error('Supabase app state check failed:', error);
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
      console.error('Supabase auth check failed:', error);
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
