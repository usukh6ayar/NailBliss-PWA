import React, { useState, useEffect, useCallback } from 'react';
import { Sparkles, AlertTriangle, RefreshCw, LogOut } from 'lucide-react';

interface TimeoutLoaderProps {
  /** Function that returns a promise for the async operation */
  loadingFunction: () => Promise<void>;
  /** Timeout duration in milliseconds (default: 10000ms = 10 seconds) */
  timeout?: number;
  /** Loading message to display */
  loadingMessage?: string;
  /** Error message to display on timeout */
  errorMessage?: string;
  /** Custom loading spinner component */
  loadingSpinner?: React.ReactNode;
  /** Callback when loading completes successfully */
  onSuccess?: () => void;
  /** Callback when loading fails or times out */
  onError?: (error: Error, retryCount: number) => void;
  /** Whether to show detailed error information */
  showErrorDetails?: boolean;
  /** Maximum number of retries before giving up (default: 0) */
  maxRetries?: number;
}

type LoadingState = 'loading' | 'timeout' | 'error' | 'success' | 'failed';

export const TimeoutLoader: React.FC<TimeoutLoaderProps> = ({
  loadingFunction,
  timeout = 10000,
  loadingMessage = 'Loading...',
  errorMessage = 'Something went wrong',
  loadingSpinner,
  onSuccess,
  onError,
  showErrorDetails = false,
  maxRetries = 0,
}) => {
  const [state, setState] = useState<LoadingState>('loading');
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(timeout / 1000);

  const executeLoading = useCallback(async () => {
    setState('loading');
    setError(null);
    setTimeRemaining(timeout / 1000);

    let timeoutId: NodeJS.Timeout;
    let countdownId: NodeJS.Timeout;
    let isCompleted = false;

    try {
      // Start countdown timer
      countdownId = setInterval(() => {
        setTimeRemaining((prev) => {
          const newTime = prev - 1;
          return newTime <= 0 ? 0 : newTime;
        });
      }, 1000);

      // Set timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          if (!isCompleted) {
            reject(new Error('Operation timed out'));
          }
        }, timeout);
      });

      // Race between loading function and timeout
      await Promise.race([
        loadingFunction(),
        timeoutPromise
      ]);

      isCompleted = true;
      setState('success');
      onSuccess?.();

    } catch (err) {
      isCompleted = true;
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      setError(error);
      
      if (error.message === 'Operation timed out') {
        setState('timeout');
      } else {
        setState('error');
      }
      
      onError?.(error, retryCount);
    } finally {
      clearTimeout(timeoutId);
      clearInterval(countdownId);
    }
  }, [loadingFunction, timeout, onSuccess, onError, retryCount]);

  const handleRetry = () => {
    const newRetryCount = retryCount + 1;
    setRetryCount(newRetryCount);
    
    // If we've exceeded max retries, mark as failed
    if (newRetryCount > maxRetries) {
      setState('failed');
      return;
    }
    
    executeLoading();
  };

  // Initial load
  useEffect(() => {
    executeLoading();
  }, [executeLoading]);

  // Don't render anything if loading completed successfully
  if (state === 'success') {
    return null;
  }

  // Loading state
  if (state === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50 flex items-center justify-center p-4">
        <div className="text-center">
          {loadingSpinner || (
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full mb-4 animate-pulse">
              <Sparkles className="w-8 h-8 text-white animate-spin" />
            </div>
          )}
          <p className="text-gray-600 font-medium mb-2">{loadingMessage}</p>
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
            <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse"></div>
            <span>Timeout in {timeRemaining}s</span>
          </div>
          {retryCount > 0 && (
            <div className="mt-2 text-xs text-gray-400">
              Retry attempt #{retryCount}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Failed state (exceeded max retries)
  if (state === 'failed') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-rose-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-2xl p-8 border border-red-100 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-red-400 to-rose-400 rounded-full mb-4">
              <LogOut className="w-8 h-8 text-white" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Unable to Load
            </h1>
            
            <p className="text-gray-600 mb-6">
              We've tried multiple times but couldn't load the application. You've been logged out for security.
            </p>

            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-600 transition-all transform hover:scale-[1.02] flex items-center justify-center space-x-2"
            >
              <RefreshCw className="w-5 h-5" />
              <span>Start Fresh</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Error/Timeout state
  const canRetry = retryCount < maxRetries;
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-rose-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-2xl p-8 border border-red-100 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-red-400 to-rose-400 rounded-full mb-4">
            <AlertTriangle className="w-8 h-8 text-white" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            {state === 'timeout' ? 'Loading Timeout' : 'Something went wrong'}
          </h1>
          
          <p className="text-gray-600 mb-4">
            {state === 'timeout' 
              ? `The app didn't load within ${timeout / 1000} seconds.`
              : errorMessage
            }
          </p>

          {showErrorDetails && error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-left">
              <p className="text-sm text-red-600 font-mono break-words">
                {error.message}
              </p>
            </div>
          )}

          {retryCount > 0 && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
              <p className="text-sm text-yellow-700">
                Retry attempt #{retryCount} of {maxRetries}
              </p>
            </div>
          )}

          <div className="space-y-3">
            {canRetry ? (
              <button
                onClick={handleRetry}
                className="w-full py-3 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-xl font-semibold hover:from-red-600 hover:to-rose-600 transition-all transform hover:scale-[1.02] flex items-center justify-center space-x-2"
              >
                <RefreshCw className="w-5 h-5" />
                <span>Try Again</span>
              </button>
            ) : (
              <div className="text-sm text-gray-500 mb-3">
                Maximum retries reached. Logging out for security.
              </div>
            )}

            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 border-2 border-gray-200 text-gray-600 rounded-xl font-semibold hover:border-gray-300 hover:text-gray-700 transition-all"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};