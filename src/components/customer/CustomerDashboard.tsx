import React from "react";
import { useAuth } from "../../hooks/useAuth";
import { DigitalLoyaltyCard } from "./DigitalLoyaltyCard";
import { LogOut, User, Menu } from "lucide-react";

export const CustomerDashboard: React.FC = () => {
  // const { user, signOut } = useAuth();

  // if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg shadow-sm border-b border-gray-200/50 sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-800">
                  Welcome back!
                </h1>
                <p className="text-sm text-gray-600">{user.full_name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                <Menu className="w-5 h-5" />
              </button>
              <button
                onClick={signOut}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-lg mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Welcome Message */}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Your Digital Loyalty Card
            </h2>
            <p className="text-gray-600">
              Collect visits and earn rewards at NailBliss
            </p>
          </div>

          {/* Digital Loyalty Card */}
          <DigitalLoyaltyCard user={user} />

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-white font-bold text-lg">
                    {user.current_points}
                  </span>
                </div>
                <p className="text-gray-800 font-semibold">Current Points</p>
                <p className="text-gray-500 text-sm">
                  {5 - (user.current_points % 5)} more for reward
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-white font-bold text-lg">
                    {Math.floor(user.current_points / 5)}
                  </span>
                </div>
                <p className="text-gray-800 font-semibold">Rewards Earned</p>
                <p className="text-gray-500 text-sm">Lifetime total</p>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Recent Activity
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-gray-800 font-medium">
                    Visit #{user.total_visits}
                  </p>
                  <p className="text-gray-500 text-sm">Most recent visit</p>
                </div>
                <div className="text-right">
                  <p className="text-pink-600 font-semibold">+1 Point</p>
                  <p className="text-gray-500 text-sm">Today</p>
                </div>
              </div>

              {user.total_visits > 1 && (
                <div className="flex items-center justify-between py-2 opacity-60">
                  <div>
                    <p className="text-gray-800 font-medium">
                      Visit #{user.total_visits - 1}
                    </p>
                    <p className="text-gray-500 text-sm">Previous visit</p>
                  </div>
                  <div className="text-right">
                    <p className="text-pink-600 font-semibold">+1 Point</p>
                    <p className="text-gray-500 text-sm">Last week</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* App Info */}
          <div className="text-center text-gray-500 text-sm space-y-2">
            <p>💎 NailBliss Loyalty • Secure Digital Card</p>
            <p>Add to home screen for quick access</p>
          </div>
        </div>
      </main>
    </div>
  );
};
