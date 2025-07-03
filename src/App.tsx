import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import { AuthForm } from "./components/auth/AuthForm";
import { CustomerDashboard } from "./components/customer/CustomerDashboard";
import { StaffDashboard } from "./components/staff/StaffDashboard";
import { LoadingSpinner } from "./components/shared/LoadingSpinner";
import { ErrorBoundary } from "./components/shared/ErrorBoundary";

function App() {
  const { user, loading } = useAuth();

  // Show loading spinner while authentication is initializing
  if (loading) {
    return <LoadingSpinner />;
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
          <Route
            path="/reset-password"
            element={<AuthForm />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App;