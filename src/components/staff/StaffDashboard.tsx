import React, { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { QRScanner } from "./QRScanner";
import { CustomerConfirmation } from "./CustomerConfirmation";
import { LogOut, Users } from "lucide-react";

export const StaffDashboard: React.FC = () => {
  // const { user, signOut } = useAuth();
  const [scannedCustomer, setScannedCustomer] = useState<any>(null);

  const handleScanSuccess = (customerData: any) => {
    setScannedCustomer(customerData);
  };

  const handleConfirm = () => {
    setScannedCustomer(null);
  };

  const handleCancel = () => {
    setScannedCustomer(null);
  };

  // if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <header className="bg-white shadow-lg border-b border-blue-100">
        <div className="max-w-lg mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">
                  Staff Portal
                </h1>
                <p className="text-sm text-gray-600">
                  Welcome, {user.full_name}
                </p>
              </div>
            </div>
            <button
              onClick={signOut}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8">
        {scannedCustomer ? (
          <CustomerConfirmation
            customer={scannedCustomer}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
          />
        ) : (
          <QRScanner onScanSuccess={handleScanSuccess} />
        )}
      </main>
    </div>
  );
};
