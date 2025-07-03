import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '../types';

const REMEMBER_ME_KEY = 'nailbliss_remember_me';

interface AuthError extends Error {
  status?: number;
  code?: string;
}

interface RobustAuthState {
  user: User | null;
  loading: boolean;
  error: AuthError | null;
  retryCount: number;
  isInitialized: boolean;
}

export const useRobustAuth = () => {
  const [state, setState] = useState<RobustAuthState>({
    user: null,
    loading: true,
    error: null,
    retryCount: 0,
    isInitialized: false,
  });

  const mountedRef = useRef(true);
  const initializationPromiseRef = useRef<Promise<void> | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const updateState = useCallback((updates: Partial<RobustAuthState>) => {
    if (mountedRef.current) {
      setState(prev => ({ ...prev, ...updates }));
    }
  }, []);

  const createAuthError = useCallback((error: any, context: string): AuthError => {
    let authError: AuthError;
    
    // Handle specific Supabase auth errors
    if (error?.message?.includes('Invalid login credentials') || error?.code === 'invalid_credentials') {
      if (context === 'signing in') {
        authError = new Error('Invalid email or password. Please check your credentials and try again.') as AuthError;
      } else {
        authError = new Error('Invalid credentials provided.') as AuthError;
      }
      authError.status = 400;
      authError.code = 'invalid_credentials';
    } else if (error?.message?.includes('Email not confirmed') || error?.code === 'email_not_confirmed') {
      authError = new Error('Please check your email and click the confirmation link before signing in.') as AuthError;
      authError.status = 400;
      authError.code = 'email_not_confirmed';
    } else if (error?.message?.includes('User already registered') || error?.code === 'user_already_exists') {
      authError = new Error('An account with this email already exists. Please sign in instead.') as AuthError;
      authError.status = 400;
      authError.code = 'user_already_exists';
    } else if (error?.message?.includes('Signup not allowed') || error?.code === 'signup_disabled') {
      authError = new Error('Account registration is currently disabled. Please contact support.') as AuthError;
      authError.status = 403;
      authError.code = 'signup_disabled';
    } else if (error?.message?.includes('fetch')) {
      // Network errors
      authError = new Error('Network connection failed. Please check your internet connection.') as AuthError;
      authError.status = 0;
    } else if (error?.status === 403 || error?.message?.includes('403')) {
      // Forbidden - expired or invalid tokens
      authError = new Error('Your session has expired. Please log in again.') as AuthError;
      authError.status = 403;
    } else if (error?.status === 404 || error?.message?.includes('404')) {
      // Not found - API endpoints misconfigured
      authError = new Error('Service temporarily unavailable. Please try again later.') as AuthError;
      authError.status = 404;
    } else if (error?.status === 500 || error?.message?.includes('500')) {
      // Server errors
      authError = new Error('Server error occurred. Please try again later.') as AuthError;
      authError.status = 500;
    } else if (error?.message?.includes('timeout') || error?.message?.includes('timed out')) {
      // Timeout errors
      authError = new Error('Connection timed out. Please check your internet connection.') as AuthError;
      authError.status = 408;
    } else {
      // Generic error
      authError = new Error(error?.message || `Authentication failed: ${context}`) as AuthError;
      authError.status = error?.status || 500;
    }
    
    authError.code = error?.code;
    console.error(`Auth Error [${context}]:`, error);
    return authError;
  }, []);

  const fetchUserProfile = useCallback(async (userId: string): Promise<User> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // User doesn't exist in our users table
          throw new Error('User profile not found. Please contact support.') as AuthError;
        }
        throw error;
      }

      if (!data) {
        throw new Error('User profile data is empty') as AuthError;
      }

      return data;
    } catch (error) {
      throw createAuthError(error, 'fetching user profile');
    }
  }, [createAuthError]);

  const clearAuthData = useCallback(async () => {
    try {
      // Clear remember me preference
      localStorage.removeItem(REMEMBER_ME_KEY);
      
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      updateState({
        user: null,
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error('Error clearing auth data:', error);
      // Force clear state even if signOut fails
      updateState({
        user: null,
        loading: false,
        error: null,
      });
    }
  }, [updateState]);

  const initializeAuth = useCallback(async (): Promise<void> => {
    // If already initializing, return the existing promise
    if (initializationPromiseRef.current) {
      return initializationPromiseRef.current;
    }

    const initPromise = (async () => {
      try {
        updateState({ loading: true, error: null });

        // Check if user chose "Remember me" in their last login
        const rememberMe = localStorage.getItem(REMEMBER_ME_KEY) === 'true';
        
        // If they didn't choose "Remember me", clear any existing session
        if (!rememberMe) {
          console.log('Remember me not set, clearing session...');
          await supabase.auth.signOut();
          updateState({
            user: null,
            loading: false,
            isInitialized: true,
          });
          return;
        }

        console.log('Remember me is set, checking existing session...');

        // Check for existing session with timeout
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Session check timed out')), 8000);
        });

        const { data: { session }, error: sessionError } = await Promise.race([
          sessionPromise,
          timeoutPromise
        ]) as any;

        if (sessionError) {
          throw createAuthError(sessionError, 'getting session');
        }

        if (!session?.user) {
          console.log('No valid session found, clearing remember me...');
          localStorage.removeItem(REMEMBER_ME_KEY);
          updateState({
            user: null,
            loading: false,
            isInitialized: true,
          });
          return;
        }

        console.log('Valid session found, fetching user profile...');

        // Fetch user profile with timeout
        const profilePromise = fetchUserProfile(session.user.id);
        const profileTimeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Profile fetch timed out')), 5000);
        });

        const userData = await Promise.race([
          profilePromise,
          profileTimeoutPromise
        ]) as User;

        updateState({
          user: userData,
          loading: false,
          error: null,
          isInitialized: true,
        });

      } catch (error) {
        const authError = createAuthError(error, 'initializing auth');
        updateState({
          user: null,
          loading: false,
          error: authError,
          isInitialized: true,
        });
        throw authError;
      }
    })();

    initializationPromiseRef.current = initPromise;
    
    try {
      await initPromise;
    } finally {
      initializationPromiseRef.current = null;
    }
  }, [updateState, createAuthError, fetchUserProfile]);

  const signIn = useCallback(async (email: string, password: string, rememberMe: boolean = false) => {
    try {
      updateState({ loading: true, error: null });

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        throw createAuthError(error, 'signing in');
      }

      // Set remember me preference
      if (rememberMe) {
        localStorage.setItem(REMEMBER_ME_KEY, 'true');
      } else {
        localStorage.removeItem(REMEMBER_ME_KEY);
      }

      // The auth state change listener will handle updating the user
      updateState({ loading: false });

    } catch (error) {
      const authError = createAuthError(error, 'signing in');
      updateState({
        loading: false,
        error: authError,
      });
      throw authError;
    }
  }, [updateState, createAuthError]);

  const signUp = useCallback(async (
    email: string, 
    password: string, 
    fullName: string, 
    role: 'customer' | 'staff' = 'customer', 
    rememberMe: boolean = false
  ) => {
    try {
      updateState({ loading: true, error: null });

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { role }
        }
      });

      if (error) {
        throw createAuthError(error, 'signing up');
      }

      if (data.user) {
        // Create user profile
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email: email.trim(),
            full_name: fullName.trim(),
            role,
            current_points: 0,
            total_visits: 0,
          });

        if (profileError) {
          throw createAuthError(profileError, 'creating user profile');
        }

        // Set remember me preference
        if (rememberMe) {
          localStorage.setItem(REMEMBER_ME_KEY, 'true');
        } else {
          localStorage.removeItem(REMEMBER_ME_KEY);
        }
      }

      updateState({ loading: false });

    } catch (error) {
      const authError = createAuthError(error, 'signing up');
      updateState({
        loading: false,
        error: authError,
      });
      throw authError;
    }
  }, [updateState, createAuthError]);

  const signOut = useCallback(async () => {
    try {
      updateState({ loading: true, error: null });
      await clearAuthData();
    } catch (error) {
      const authError = createAuthError(error, 'signing out');
      updateState({
        loading: false,
        error: authError,
      });
      throw authError;
    }
  }, [updateState, createAuthError, clearAuthData]);

  const retry = useCallback(async () => {
    const newRetryCount = state.retryCount + 1;
    updateState({ 
      retryCount: newRetryCount,
      error: null 
    });

    try {
      await initializeAuth();
    } catch (error) {
      // Error is already handled in initializeAuth
      if (newRetryCount >= 1) {
        // After second failure, log out and reset
        console.log('Max retries reached, logging out...');
        await clearAuthData();
      }
    }
  }, [state.retryCount, updateState, initializeAuth, clearAuthData]);

  const reset = useCallback(async () => {
    try {
      await clearAuthData();
      updateState({
        retryCount: 0,
        error: null,
        isInitialized: false,
      });
      
      // Force page reload to completely reset state
      setTimeout(() => {
        window.location.href = '/';
      }, 100);
    } catch (error) {
      console.error('Error during reset:', error);
      window.location.href = '/';
    }
  }, [clearAuthData, updateState]);

  // Set up auth state listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mountedRef.current || !state.isInitialized) return;

      try {
        if (event === 'SIGNED_OUT') {
          updateState({
            user: null,
            loading: false,
            error: null,
          });
          return;
        }

        if (session?.user && event === 'SIGNED_IN') {
          updateState({ loading: true });
          const userData = await fetchUserProfile(session.user.id);
          updateState({
            user: userData,
            loading: false,
            error: null,
          });
        }
      } catch (error) {
        const authError = createAuthError(error, 'auth state change');
        updateState({
          user: null,
          loading: false,
          error: authError,
        });
      }
    });

    return () => subscription.unsubscribe();
  }, [state.isInitialized, updateState, fetchUserProfile, createAuthError]);

  return {
    user: state.user,
    loading: state.loading,
    error: state.error,
    retryCount: state.retryCount,
    isInitialized: state.isInitialized,
    signIn,
    signUp,
    signOut,
    initializeAuth,
    retry,
    reset,
  };
};