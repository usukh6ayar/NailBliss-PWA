import React, { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { Mail, Lock, User, AlertCircle, Info, CheckCircle, ArrowLeft, Wifi, WifiOff, RefreshCw } from "lucide-react";
import nailblissLogo from "../../assets/logo.png";

type AuthMode = 'signin' | 'signup' | 'forgot-password' | 'reset-password';

export const AuthForm: React.FC = () => {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"customer" | "staff">("customer");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showHelp, setShowHelp] = useState(false);

  const { 
    signIn, 
    signUp, 
    resetPassword, 
    updatePassword, 
    isResettingPassword, 
    connectionStatus,
    lastError 
  } = useAuth();

  // Check if we're in password reset mode
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const accessToken = urlParams.get('access_token');
    const type = urlParams.get('type');
    
    if (accessToken && type === 'recovery') {
      setMode('reset-password');
    }
  }, []);

  const validateForm = () => {
    if (!email.trim()) {
      setError("Email is required");
      return false;
    }

    if (!email.includes('@')) {
      setError("Please enter a valid email address");
      return false;
    }

    if (mode === 'forgot-password') {
      return true;
    }

    if (!password) {
      setError("Password is required");
      return false;
    }

    if (mode === 'signup') {
      if (!fullName.trim()) {
        setError("Full name is required");
        return false;
      }

      if (password.length < 6) {
        setError("Password must be at least 6 characters long");
        return false;
      }

      if (password !== confirmPassword) {
        setError("Passwords do not match");
        return false;
      }
    }

    if (mode === 'reset-password') {
      if (password.length < 6) {
        setError("Password must be at least 6 characters long");
        return false;
      }

      if (password !== confirmPassword) {
        setError("Passwords do not match");
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setError("");
    setSuccess("");
    setShowHelp(false);

    try {
      switch (mode) {
        case 'signin':
          await signIn(email, password, rememberMe);
          break;
        
        case 'signup':
          await signUp(email, password, fullName, role, rememberMe);
          setSuccess("Account created successfully! Welcome to NailBliss!");
          break;
        
        case 'forgot-password':
          await resetPassword(email);
          setSuccess("Password reset email sent! Please check your inbox and follow the instructions.");
          break;
        
        case 'reset-password':
          await updatePassword(password);
          setSuccess("Password updated successfully! You can now sign in with your new password.");
          setTimeout(() => {
            setMode('signin');
            setPassword("");
            setConfirmPassword("");
          }, 2000);
          break;
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
      
      // Show help for user errors
      if (err.message?.includes('Invalid email or password') && mode === 'signin') {
        setShowHelp(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setFullName("");
    setRole("customer");
    setRememberMe(false);
    setError("");
    setSuccess("");
    setShowHelp(false);
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    resetForm();
  };

  const getTitle = () => {
    switch (mode) {
      case 'signin': return "Welcome back";
      case 'signup': return "Join our loyalty program";
      case 'forgot-password': return "Reset your password";
      case 'reset-password': return "Set new password";
      default: return "Welcome";
    }
  };

  const getButtonText = () => {
    if (loading) return "Please wait...";
    
    switch (mode) {
      case 'signin': return "Sign In";
      case 'signup': return "Create Account";
      case 'forgot-password': return isResettingPassword ? "Sending..." : "Send Reset Email";
      case 'reset-password': return "Update Password";
      default: return "Submit";
    }
  };

  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Wifi className="w-4 h-4 text-green-500" />;
      case 'disconnected':
        return <WifiOff className="w-4 h-4 text-red-500" />;
      case 'checking':
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return "Connected";
      case 'disconnected':
        return "Connection issues detected";
      case 'checking':
        return "Checking connection...";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-2xl p-8 border border-pink-100">
          {/* Connection Status */}
          <div className="flex items-center justify-between mb-4 p-2 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2 text-sm">
              {getConnectionStatusIcon()}
              <span className={`font-medium ${
                connectionStatus === 'connected' ? 'text-green-700' :
                connectionStatus === 'disconnected' ? 'text-red-700' :
                'text-gray-700'
              }`}>
                {getConnectionStatusText()}
              </span>
            </div>
            {connectionStatus === 'disconnected' && (
              <button
                onClick={() => window.location.reload()}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                Retry
              </button>
            )}
          </div>

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-28 h-28 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full mb-4">
              <img
                src={nailblissLogo}
                alt="Nail Bliss Logo"
                className="w-26 h-26 object-contain rounded-full bg-white"
              />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
              NailBliss
            </h1>
            <p className="text-gray-600 mt-2">{getTitle()}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {mode === 'forgot-password' && (
              <button
                type="button"
                onClick={() => switchMode('signin')}
                className="flex items-center text-pink-600 hover:text-pink-700 font-medium transition-colors mb-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Sign In
              </button>
            )}

            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                    placeholder="Enter your full name"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            {mode !== 'forgot-password' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {mode === 'reset-password' ? 'New Password' : 'Password'}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                    placeholder={mode === 'reset-password' ? 'Enter new password' : 'Enter your password'}
                    required
                    minLength={6}
                  />
                </div>
              </div>
            )}

            {(mode === 'signup' || mode === 'reset-password') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                    placeholder="Confirm your password"
                    required
                    minLength={6}
                  />
                </div>
              </div>
            )}

            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole("customer")}
                    className={`p-3 rounded-xl border-2 transition-all ${
                      role === "customer"
                        ? "border-pink-500 bg-pink-50 text-pink-700"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    Customer
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("staff")}
                    className={`p-3 rounded-xl border-2 transition-all ${
                      role === "staff"
                        ? "border-pink-500 bg-pink-50 text-pink-700"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    Staff
                  </button>
                </div>
              </div>
            )}

            {(mode === 'signin' || mode === 'signup') && (
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-pink-600 bg-gray-100 border-gray-300 rounded focus:ring-pink-500 focus:ring-2"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 text-sm text-gray-700"
                >
                  Remember me (stay logged in across browser sessions)
                </label>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-green-600 text-sm flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{success}</span>
              </div>
            )}

            {showHelp && mode === 'signin' && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-700 text-sm">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium mb-1">Need help signing in?</p>
                    <ul className="text-xs space-y-1">
                      <li>• Double-check your email and password for typos</li>
                      <li>• If you're new, try creating an account instead</li>
                      <li>• Use "Forgot Password" if you can't remember your password</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || isResettingPassword || connectionStatus === 'disconnected'}
              className="w-full py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl font-semibold hover:from-pink-600 hover:to-rose-600 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:transform-none flex items-center justify-center"
            >
              {(loading || isResettingPassword) && (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              )}
              {connectionStatus === 'disconnected' ? 'Connection Required' : getButtonText()}
            </button>
          </form>

          <div className="mt-6 text-center space-y-3">
            {mode === 'signin' && (
              <>
                <button
                  onClick={() => switchMode('forgot-password')}
                  className="text-pink-600 hover:text-pink-700 font-medium transition-colors text-sm"
                >
                  Forgot your password?
                </button>
                <div>
                  <button
                    onClick={() => switchMode('signup')}
                    className="text-pink-600 hover:text-pink-700 font-medium transition-colors"
                  >
                    Don't have an account? Sign up
                  </button>
                </div>
              </>
            )}

            {mode === 'signup' && (
              <button
                onClick={() => switchMode('signin')}
                className="text-pink-600 hover:text-pink-700 font-medium transition-colors"
              >
                Already have an account? Sign in
              </button>
            )}

            {mode === 'forgot-password' && !success && (
              <button
                onClick={() => switchMode('signin')}
                className="text-pink-600 hover:text-pink-700 font-medium transition-colors"
              >
                Remember your password? Sign in
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};