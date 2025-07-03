/**
 * Enhanced error handling utilities for Supabase authentication and database operations
 */

export interface SupabaseError extends Error {
  status?: number;
  code?: string;
  details?: string;
  hint?: string;
}

export interface ErrorContext {
  operation: string;
  timestamp: number;
  userAgent: string;
  url: string;
}

export interface ErrorAnalysis {
  isNetworkError: boolean;
  isSupabaseDown: boolean;
  isConfigurationError: boolean;
  isUserError: boolean;
  isRLSError: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  userMessage: string;
  technicalMessage: string;
  suggestedActions: string[];
  requiresSupabaseUpdate: boolean;
}

/**
 * Analyzes errors to determine their type and provide appropriate user messages
 */
export const analyzeError = (error: any, context: ErrorContext): ErrorAnalysis => {
  const analysis: ErrorAnalysis = {
    isNetworkError: false,
    isSupabaseDown: false,
    isConfigurationError: false,
    isUserError: false,
    isRLSError: false,
    severity: 'medium',
    userMessage: '',
    technicalMessage: '',
    suggestedActions: [],
    requiresSupabaseUpdate: false,
  };

  // Extract error details
  const message = error?.message || '';
  const status = error?.status || error?.code;
  const details = error?.details || '';
  const hint = error?.hint || '';

  // Network and connectivity errors
  if (
    message.includes('fetch') ||
    message.includes('network') ||
    message.includes('Failed to fetch') ||
    message.includes('NetworkError') ||
    status === 0 ||
    !status
  ) {
    analysis.isNetworkError = true;
    analysis.severity = 'high';
    analysis.userMessage = "We're having trouble connecting to our servers. Please check your internet connection and try again.";
    analysis.technicalMessage = `Network error during ${context.operation}: ${message}`;
    analysis.suggestedActions = [
      'Check your internet connection',
      'Try refreshing the page',
      'Wait a moment and try again',
      'Contact support if the issue persists'
    ];
    return analysis;
  }

  // Supabase server errors (500, 502, 503, 504)
  if ([500, 502, 503, 504].includes(status)) {
    analysis.isSupabaseDown = true;
    analysis.severity = 'critical';
    analysis.userMessage = "Our servers are temporarily unavailable. We're working to fix this issue. Please try again in a few minutes.";
    analysis.technicalMessage = `Supabase server error ${status} during ${context.operation}: ${message}`;
    analysis.suggestedActions = [
      'Wait a few minutes and try again',
      'Check our status page for updates',
      'Contact support if the issue persists'
    ];
    return analysis;
  }

  // Configuration and authentication errors
  if (
    [401, 403].includes(status) ||
    message.includes('Invalid API key') ||
    message.includes('Project not found') ||
    message.includes('Invalid JWT') ||
    message.includes('JWT expired')
  ) {
    analysis.isConfigurationError = true;
    analysis.severity = 'critical';
    analysis.userMessage = "We're experiencing a configuration issue. Please contact support for assistance.";
    analysis.technicalMessage = `Configuration error ${status} during ${context.operation}: ${message}`;
    analysis.suggestedActions = [
      'Contact support immediately',
      'Provide error details to support team'
    ];
    analysis.requiresSupabaseUpdate = true;
    return analysis;
  }

  // Row Level Security (RLS) policy violations
  if (
    message.includes('row-level security policy') ||
    message.includes('RLS') ||
    error?.code === '42501' ||
    status === 406
  ) {
    analysis.isRLSError = true;
    analysis.severity = 'high';
    analysis.userMessage = "We're having trouble with your account permissions. This may be due to a recent system update. Please contact support.";
    analysis.technicalMessage = `RLS policy violation during ${context.operation}: ${message}`;
    analysis.suggestedActions = [
      'Contact support with error details',
      'Mention that this may be related to database permissions'
    ];
    analysis.requiresSupabaseUpdate = true;
    return analysis;
  }

  // User authentication errors
  if (
    message.includes('Invalid login credentials') ||
    message.includes('Email not confirmed') ||
    message.includes('User not found') ||
    error?.code === 'invalid_credentials' ||
    error?.code === 'email_not_confirmed'
  ) {
    analysis.isUserError = true;
    analysis.severity = 'low';
    
    if (message.includes('Invalid login credentials')) {
      analysis.userMessage = "Invalid email or password. Please check your credentials and try again.";
      analysis.suggestedActions = [
        'Double-check your email and password',
        'Use "Forgot Password" if needed',
        'Try creating an account if you\'re new'
      ];
    } else if (message.includes('Email not confirmed')) {
      analysis.userMessage = "Please check your email and click the confirmation link before signing in.";
      analysis.suggestedActions = [
        'Check your email inbox and spam folder',
        'Click the confirmation link in the email',
        'Request a new confirmation email if needed'
      ];
    } else {
      analysis.userMessage = message;
      analysis.suggestedActions = ['Please try again or contact support'];
    }
    
    analysis.technicalMessage = `User authentication error during ${context.operation}: ${message}`;
    return analysis;
  }

  // Database connection and timeout errors
  if (
    message.includes('timeout') ||
    message.includes('connection') ||
    message.includes('ECONNREFUSED') ||
    message.includes('ETIMEDOUT')
  ) {
    analysis.isNetworkError = true;
    analysis.severity = 'high';
    analysis.userMessage = "Connection timed out. Please check your internet connection and try again.";
    analysis.technicalMessage = `Connection timeout during ${context.operation}: ${message}`;
    analysis.suggestedActions = [
      'Check your internet connection',
      'Try again in a moment',
      'Contact support if the issue persists'
    ];
    return analysis;
  }

  // Rate limiting errors
  if (status === 429 || message.includes('rate limit')) {
    analysis.severity = 'medium';
    analysis.userMessage = "Too many requests. Please wait a moment before trying again.";
    analysis.technicalMessage = `Rate limit exceeded during ${context.operation}: ${message}`;
    analysis.suggestedActions = [
      'Wait 30 seconds before trying again',
      'Avoid rapid repeated attempts'
    ];
    return analysis;
  }

  // Generic errors
  analysis.severity = 'medium';
  analysis.userMessage = "An unexpected error occurred. Please try again or contact support if the issue persists.";
  analysis.technicalMessage = `Unknown error during ${context.operation}: ${message}`;
  analysis.suggestedActions = [
    'Try again in a moment',
    'Refresh the page',
    'Contact support with error details'
  ];

  return analysis;
};

/**
 * Creates error context for better error tracking
 */
export const createErrorContext = (operation: string): ErrorContext => ({
  operation,
  timestamp: Date.now(),
  userAgent: navigator.userAgent,
  url: window.location.href,
});

/**
 * Logs errors for debugging and monitoring
 */
export const logError = (error: any, context: ErrorContext, analysis: ErrorAnalysis) => {
  const errorLog = {
    timestamp: new Date(context.timestamp).toISOString(),
    operation: context.operation,
    error: {
      message: error?.message,
      status: error?.status,
      code: error?.code,
      details: error?.details,
      stack: error?.stack,
    },
    analysis,
    context,
  };

  console.error('Supabase Error:', errorLog);

  // In production, you might want to send this to an error tracking service
  // like Sentry, LogRocket, or a custom endpoint
  if (analysis.severity === 'critical') {
    console.error('CRITICAL ERROR - Immediate attention required:', errorLog);
  }
};

/**
 * Enhanced error class for Supabase operations
 */
export class EnhancedSupabaseError extends Error {
  public readonly analysis: ErrorAnalysis;
  public readonly context: ErrorContext;
  public readonly originalError: any;

  constructor(originalError: any, context: ErrorContext) {
    const analysis = analyzeError(originalError, context);
    super(analysis.userMessage);
    
    this.name = 'EnhancedSupabaseError';
    this.analysis = analysis;
    this.context = context;
    this.originalError = originalError;

    // Log the error for debugging
    logError(originalError, context, analysis);
  }

  public getUserMessage(): string {
    return this.analysis.userMessage;
  }

  public getTechnicalMessage(): string {
    return this.analysis.technicalMessage;
  }

  public getSuggestedActions(): string[] {
    return this.analysis.suggestedActions;
  }

  public requiresSupabaseUpdate(): boolean {
    return this.analysis.requiresSupabaseUpdate;
  }

  public isCritical(): boolean {
    return this.analysis.severity === 'critical';
  }
}