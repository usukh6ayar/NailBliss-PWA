import React from 'react';
import { Wifi, WifiOff, AlertTriangle, RefreshCw } from 'lucide-react';

interface ConnectionStatusProps {
  status: 'connected' | 'disconnected' | 'checking';
  onRetry?: () => void;
  className?: string;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  status,
  onRetry,
  className = ''
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return {
          icon: Wifi,
          text: 'Connected',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-700',
          iconColor: 'text-green-500'
        };
      case 'disconnected':
        return {
          icon: WifiOff,
          text: 'Connection issues',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-700',
          iconColor: 'text-red-500'
        };
      case 'checking':
        return {
          icon: RefreshCw,
          text: 'Checking connection...',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-700',
          iconColor: 'text-blue-500'
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className={`flex items-center justify-between p-3 rounded-lg border ${config.bgColor} ${config.borderColor} ${className}`}>
      <div className="flex items-center space-x-2">
        <Icon className={`w-4 h-4 ${config.iconColor} ${status === 'checking' ? 'animate-spin' : ''}`} />
        <span className={`text-sm font-medium ${config.textColor}`}>
          {config.text}
        </span>
      </div>
      
      {status === 'disconnected' && onRetry && (
        <button
          onClick={onRetry}
          className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
        >
          Retry
        </button>
      )}
    </div>
  );
};