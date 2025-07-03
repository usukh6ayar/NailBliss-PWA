import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useRobustAuth } from "./hooks/useRobustAuth";
import { AuthForm } from "./components/auth/AuthForm";
import { CustomerDashboard } from "./components/customer/CustomerDashboard";
import { StaffDashboard } from "./components/staff/StaffDashboard";
import { RobustLoader } from "./components/shared/RobustLoader";
import { ErrorBoundary } from "./components/shared/ErrorBoundary";

function App() {
  const {
    user,
    loading,
    error,
    retryCount,
    isInitialized,
    initializeAuth,
    retry,
    reset,
  } = useRobustAuth();

  const handleAuthError = async (error: Error, currentRetryCount: number) => {
    console.error("Auth initialization failed:", error);

    // If this is the second failure (currentRetryCount >= 1), trigger reset
    if (currentRetryCount >= 1) {
      console.log("Multiple auth failures detected, resetting auth...");
      await reset();
    }
  };

  const handleMaxRetriesExceeded = async () => {
    console.log("Max retries exceeded, resetting auth...");
    await reset();
  };

  // Show robust loader while authentication is initializing
  if (loading || !isInitialized) {
    return (
      <RobustLoader
        loadingFunction={initializeAuth}
        timeout={10000}
        loadingMessage="Loading NailBliss..."
        errorMessage="Failed to initialize authentication"
        showErrorDetails={false}
        onSuccess={() => console.log("Auth initialized successfully")}
        onError={handleAuthError}
        onMaxRetriesExceeded={handleMaxRetriesExceeded}
        maxRetries={1}
        retryCount={retryCount}
        error={error}
      />
    );
  }

  // Show auth form if no user
  if (!user) {
    return (
      <ErrorBoundary>
        <AuthForm />
      </ErrorBoundary>
    );
  }

  // Show appropriate dashboard based on user role
  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route
            path="/"
            element={
              user.role === "customer" ? (
                <CustomerDashboard />
              ) : (
                <StaffDashboard />
              )
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
