import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { User, AuthState } from '../types';

const REMEMBER_ME_KEY = 'nailbliss_remember_me';

interface AuthError extends Error {
  status?: number;
  code?: string;
}

export const useAuth = (): AuthState & {
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  isResettingPassword: boolean;
  resetPasswordError: string | null;
} => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resetPasswordError, setResetPasswordError] = useState<string | null>(null);

  const createAuthError = useCallback((error: any, context: string): AuthError => {
    let authError: AuthError;
    
    if (error?.message?.includes('Invalid login credentials') || error?.code === 'invalid_credentials') {
      authError = new Error('Invalid email or password. Please check your credentials and try again.') as AuthError;
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
    } else if (error?.message?.includes('row-level security policy') || error?.code === '42501') {
      authError = new Error('Permission denied. Please try again or contact support if the issue persists.') as AuthError;
      authError.status = 403;
      authError.code = 'rls_policy_violation';
    } else if (error?.message?.includes('fetch') || error?.message?.includes('network')) {
      authError = new Error('Network connection failed. Please check your internet connection.') as AuthError;
      authError.status = 0;
    } else if (error?.status === 403 || error?.message?.includes('403')) {
      authError = new Error('Your session has expired. Please log in again.') as AuthError;
      authError.status = 403;
    } else if (error?.status === 404 || error?.message?.includes('404')) {
      authError = new Error('Service temporarily unavailable. Please try again later.') as AuthError;
      authError.status = 404;
    } else if (error?.status === 500 || error?.message?.includes('500')) {
      authError = new Error('Server error occurred. Please try again later.') as AuthError;
      authError.status = 500;
    } else if (error?.message?.includes('timeout') || error?.message?.includes('timed out')) {
      authError = new Error('Connection timed out. Please check your internet connection.') as AuthError;
      authError.status = 408;
    } else {
      authError = new Error(error?.message || `Authentication failed: ${context}`) as AuthError;
      authError.status = error?.status || 500;
    }
    
    authError.code = error?.code;
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

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const rememberMe = localStorage.getItem(REMEMBER_ME_KEY) === 'true';
        
        if (!rememberMe) {
          await supabase.auth.signOut();
          if (mounted) {
            setUser(null);
            setLoading(false);
          }
          return;
        }

        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          localStorage.removeItem(REMEMBER_ME_KEY);
          if (mounted) {
            setLoading(false);
          }
          return;
        }

        if (session?.user) {
          await fetchUserProfile(session.user.id);
        } else {
          localStorage.removeItem(REMEMBER_ME_KEY);
          if (mounted) {
            setUser(null);
            setLoading(false);
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        localStorage.removeItem(REMEMBER_ME_KEY);
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      try {
        if (event === 'SIGNED_OUT') {
          setUser(null);
          setLoading(false);
          return;
        }

        if (event === 'PASSWORD_RECOVERY') {
          // Handle password recovery flow
          setLoading(false);
          return;
        }

        if (session?.user) {
          setLoading(true);
          try {
            const userData = await fetchUserProfile(session.user.id);
            setUser(userData);
          } catch (error) {
            // If profile doesn't exist yet (during signup), wait and retry
            if (error.message?.includes('User profile not found')) {
              await new Promise(resolve => setTimeout(resolve, 1000));
              try {
                const userData = await fetchUserProfile(session.user.id);
                setUser(userData);
              } catch (retryError) {
                console.error('Profile still not found after retry:', retryError);
                setUser(null);
              }
            } else {
              setUser(null);
            }
          }
          setLoading(false);
        } else {
          setUser(null);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error in auth state change:', error);
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchUserProfile]);

  const signUp = async (
    email: string, 
    password: string, 
    fullName: string, 
    role: 'customer' | 'staff' = 'customer', 
    rememberMe: boolean = false
  ) => {
    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { role }
        }
      });

      if (error) throw createAuthError(error, 'signing up');

      if (!data.user) {
        throw new Error('User creation failed - no user data returned');
      }

      // Wait for auth user to be fully created
      await new Promise(resolve => setTimeout(resolve, 100));

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

      if (rememberMe) {
        localStorage.setItem(REMEMBER_ME_KEY, 'true');
      } else {
        localStorage.removeItem(REMEMBER_ME_KEY);
      }

      setLoading(false);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signIn = async (email: string, password: string, rememberMe: boolean = false) => {
    try {
      setLoading(true);

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw createAuthError(error, 'signing in');

      if (rememberMe) {
        localStorage.setItem(REMEMBER_ME_KEY, 'true');
      } else {
        localStorage.removeItem(REMEMBER_ME_KEY);
      }

      setLoading(false);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      localStorage.removeItem(REMEMBER_ME_KEY);
      setUser(null);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      throw createAuthError(error, 'signing out');
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setIsResettingPassword(true);
      setResetPasswordError(null);

      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw createAuthError(error, 'requesting password reset');

      setIsResettingPassword(false);
    } catch (error) {
      setIsResettingPassword(false);
      setResetPasswordError(error.message);
      throw error;
    }
  };

  const updatePassword = async (password: string) => {
    try {
      setLoading(true);

      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw createAuthError(error, 'updating password');

      setLoading(false);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  return {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    isResettingPassword,
    resetPasswordError,
  };
};