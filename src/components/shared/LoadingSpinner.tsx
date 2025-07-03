import React from 'react';
import { Sparkles } from 'lucide-react';

export const LoadingSpinner: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full mb-4 animate-pulse">
          <Sparkles className="w-8 h-8 text-white animate-spin" />
        </div>
        <p className="text-gray-600 font-medium">Loading NailBliss...</p>
      </div>
    </div>
  );
};