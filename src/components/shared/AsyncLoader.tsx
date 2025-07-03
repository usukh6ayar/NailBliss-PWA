import React from 'react';
import { TimeoutLoader } from './TimeoutLoader';

interface AsyncLoaderProps<T> {
  /** Function that returns a promise with data */
  loadFunction: () => Promise<T>;
  /** Function to render the loaded data */
  children: (data: T) => React.ReactNode;
  /** Loading message */
  loadingMessage?: string;
  /** Error message */
  errorMessage?: string;
  /** Timeout in milliseconds */
  timeout?: number;
  /** Show error details */
  showErrorDetails?: boolean;
}

interface AsyncLoaderState<T> {
  data: T | null;
  isLoaded: boolean;
}

export function AsyncLoader<T>({
  loadFunction,
  children,
  loadingMessage = 'Loading data...',
  errorMessage = 'Failed to load data',
  timeout = 10000,
  showErrorDetails = false,
}: AsyncLoaderProps<T>) {
  const [state, setState] = React.useState<AsyncLoaderState<T>>({
    data: null,
    isLoaded: false,
  });

  const handleLoad = React.useCallback(async () => {
    const data = await loadFunction();
    setState({ data, isLoaded: true });
  }, [loadFunction]);

  const handleSuccess = React.useCallback(() => {
    // Data is already set in handleLoad
  }, []);

  const handleError = React.useCallback((error: Error) => {
    console.error('AsyncLoader error:', error);
    setState({ data: null, isLoaded: false });
  }, []);

  if (!state.isLoaded || state.data === null) {
    return (
      <TimeoutLoader
        loadingFunction={handleLoad}
        timeout={timeout}
        loadingMessage={loadingMessage}
        errorMessage={errorMessage}
        showErrorDetails={showErrorDetails}
        onSuccess={handleSuccess}
        onError={handleError}
      />
    );
  }

  return <>{children(state.data)}</>;
}