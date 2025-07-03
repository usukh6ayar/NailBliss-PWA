import { useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from './useAuth';

export const useTimeoutAuth = () => {
  const { user, loading, signIn, signUp, signOut } = useAuth();
  const [authError, setAuthError] = useState<Error | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const loadingRef = useRef(loading);

  // Keep the ref updated with the current loading state
  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  const initializeAuth = useCallback(async () => {
    setAuthError(null);
    
    // If currently resetting, wait for it to complete
    if (isResetting) {
      return new Promise<void>((resolve) => {
        const checkReset = () => {
          if (!isResetting) {
            resolve();
          } else {
            setTimeout(checkReset, 100);
          }
        };
        checkReset();
      });
    }
    
    // If already loaded, resolve immediately
    if (!loadingRef.current) {
      return Promise.resolve();
    }

    // Wait for auth to complete
    return new Promise<void>((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 100; // 10 seconds at 100ms intervals
      
      const checkAuth = () => {
        attempts++;
        
        if (!loadingRef.current) {
          resolve();
        } else if (attempts >= maxAttempts) {
          reject(new Error('Authentication initialization timed out'));
        } else {
          // Check again in 100ms
          setTimeout(checkAuth, 100);
        }
      };
      
      checkAuth();
    });
  }, [isResetting]);

  const resetAuth = useCallback(async () => {
    setIsResetting(true);
    setAuthError(null);
    
    try {
      // Clear remember me preference and any session data
      localStorage.removeItem('nailbliss_remember_me');
      localStorage.clear();
      sessionStorage.clear();
      
      // Sign out from Supabase
      await signOut();
      
      // Force a page reload to completely reset the app state
      setTimeout(() => {
        window.location.href = '/';
      }, 100);
    } catch (error) {
      console.error('Error during auth reset:', error);
      // Force reload even if there's an error
      window.location.href = '/';
    } finally {
      setIsResetting(false);
    }
  }, [signOut]);

  return {
    user,
    loading: loading || isResetting,
    signIn,
    signUp,
    signOut,
    initializeAuth,
    resetAuth,
    authError,
  };
};