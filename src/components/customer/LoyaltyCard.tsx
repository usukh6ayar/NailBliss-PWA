import React from 'react';
import { Sparkles, Gift } from 'lucide-react';

interface LoyaltyCardProps {
  currentPoints: number;
  totalVisits: number;
}

export const LoyaltyCard: React.FC<LoyaltyCardProps> = ({ currentPoints, totalVisits }) => {
  const progress = currentPoints % 5;
  const isRewardReady = currentPoints > 0 && currentPoints % 5 === 0;

  const bubbles = Array.from({ length: 5 }, (_, index) => (
    <div
      key={index}
      className={`w-12 h-12 rounded-full border-4 transition-all duration-500 transform ${
        index < progress
          ? 'bg-gradient-to-br from-pink-400 to-rose-500 border-pink-300 scale-110 shadow-lg'
          : 'bg-white border-gray-200 hover:border-pink-200'
      }`}
      style={{
        animationDelay: `${index * 100}ms`,
      }}
    >
      {index < progress && (
        <div className="w-full h-full flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-white animate-pulse" />
        </div>
      )}
    </div>
  ));

  return (
    <div className="bg-white rounded-3xl p-8 shadow-2xl border border-pink-100">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full mb-4">
          <Gift className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Loyalty Card</h2>
        <p className="text-gray-600">Collect 5 visits for a special reward!</p>
      </div>

      {isRewardReady && (
        <div className="mb-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-2xl">
          <div className="flex items-center justify-center text-center">
            <Gift className="w-6 h-6 text-yellow-600 mr-2" />
            <div>
              <p className="font-semibold text-yellow-800">Reward Ready!</p>
              <p className="text-sm text-yellow-600">Show this to staff for 50% off</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-center items-center space-x-4 mb-8">
        {bubbles}
      </div>

      <div className="bg-gray-50 rounded-2xl p-6">
        <div className="grid grid-cols-2 gap-6 text-center">
          <div>
            <p className="text-3xl font-bold text-pink-600">{progress}</p>
            <p className="text-sm text-gray-600">Current Progress</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-gray-800">{totalVisits}</p>
            <p className="text-sm text-gray-600">Total Visits</p>
          </div>
        </div>
      </div>
    </div>
  );
};