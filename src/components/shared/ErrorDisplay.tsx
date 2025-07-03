import React, { useState } from 'react';
import { AlertCircle, AlertTriangle, ExternalLink, Copy, CheckCircle } from 'lucide-react';
import { EnhancedSupabaseError } from '../../utils/errorHandler';

interface ErrorDisplayProps {
  error: EnhancedSupabaseError;
  onDismiss?: () => void;
  showActions?: boolean;
  className?: string;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  onDismiss,
  showActions = true,
  className = ''
}) => {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [copied, setCopied] = useState(false);

  const getSeverityConfig = () => {
    switch (error.analysis.severity) {
      case 'critical':
        return {
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-600',
          iconColor: 'text-red-500'
        };
      case 'high':
        return {
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          textColor: 'text-orange-600',
          iconColor: 'text-orange-500'
        };
      case 'medium':
        return {
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          textColor: 'text-yellow-600',
          iconColor: 'text-yellow-500'
        };
      case 'low':
        return {
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-600',
          iconColor: 'text-blue-500'
        };
    }
  };

  const config = getSeverityConfig();

  const copyTechnicalDetails = async () => {
    const details = {
      message: error.getTechnicalMessage(),
      operation: error.context.operation,
      timestamp: new Date(error.context.timestamp).toISOString(),
      severity: error.analysis.severity,
      userAgent: error.context.userAgent,
      url: error.context.url,
      originalError: error.originalError
    };

    try {
      await navigator.clipboard.writeText(JSON.stringify(details, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className={`p-3 rounded-xl border ${config.bgColor} ${config.borderColor} ${config.textColor} text-sm`}>
        <div className="flex items-start gap-2">
          <AlertCircle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${config.iconColor}`} />
          <div className="flex-1">
            <span>{error.getUserMessage()}</span>
            
            {showActions && (
              <div className="mt-2 space-y-2">
                {error.getSuggestedActions().length > 0 && (
                  <div>
                    <p className="font-medium text-xs">Suggested actions:</p>
                    <ul className="text-xs list-disc list-inside space-y-1 mt-1">
                      {error.getSuggestedActions().map((action, index) => (
                        <li key={index}>{action}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {error.requiresSupabaseUpdate() && (
                  <div className="p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-yellow-700">
                        <p className="font-medium">Backend Update Required</p>
                        <p>This error may require database or configuration changes in Supabase. Please contact support with the technical details.</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                  >
                    {showTechnicalDetails ? 'Hide' : 'Show'} technical details
                    <ExternalLink className="w-3 h-3" />
                  </button>

                  {showTechnicalDetails && (
                    <button
                      onClick={copyTechnicalDetails}
                      className="text-xs text-gray-600 hover:text-gray-700 font-medium flex items-center gap-1"
                    >
                      {copied ? (
                        <>
                          <CheckCircle className="w-3 h-3" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          Copy details
                        </>
                      )}
                    </button>
                  )}
                </div>

                {showTechnicalDetails && (
                  <div className="p-2 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-xs text-gray-600 font-mono break-all mb-2">
                      {error.getTechnicalMessage()}
                    </p>
                    <div className="text-xs text-gray-500 space-y-1">
                      <p><span className="font-medium">Operation:</span> {error.context.operation}</p>
                      <p><span className="font-medium">Timestamp:</span> {new Date(error.context.timestamp).toISOString()}</p>
                      <p><span className="font-medium">Severity:</span> {error.analysis.severity}</p>
                      <p><span className="font-medium">Network Error:</span> {error.analysis.isNetworkError ? 'Yes' : 'No'}</p>
                      <p><span className="font-medium">Supabase Down:</span> {error.analysis.isSupabaseDown ? 'Yes' : 'No'}</p>
                      <p><span className="font-medium">Config Error:</span> {error.analysis.isConfigurationError ? 'Yes' : 'No'}</p>
                      <p><span className="font-medium">RLS Error:</span> {error.analysis.isRLSError ? 'Yes' : 'No'}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              ×
            </button>
          )}
        </div>
      </div>
    </div>
  );
};