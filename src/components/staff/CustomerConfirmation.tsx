import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { User, CheckCircle, XCircle, Plus } from 'lucide-react';

interface CustomerConfirmationProps {
  customer: any;
  onConfirm: () => void;
  onCancel: () => void;
}

export const CustomerConfirmation: React.FC<CustomerConfirmationProps> = ({
  customer,
  onConfirm,
  onCancel,
}) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { user: staffUser } = useAuth();

  const handleAddPoint = async () => {
    if (!staffUser) return;
    
    setLoading(true);
    try {
      // Add visit record
      const { error: visitError } = await supabase
        .from('visits')
        .insert({
          user_id: customer.id,
          staff_id: staffUser.id,
          qr_code_used: customer.qrSignature,
        });

      if (visitError) throw visitError;

      // Update user points
      const newPoints = customer.current_points + 1;
      const newTotalVisits = customer.total_visits + 1;

      const { error: updateError } = await supabase
        .from('users')
        .update({
          current_points: newPoints,
          total_visits: newTotalVisits,
        })
        .eq('id', customer.id);

      if (updateError) throw updateError;

      setSuccess(true);
      setTimeout(() => {
        onConfirm();
      }, 2000);

    } catch (error) {
      console.error('Error adding point:', error);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-white rounded-3xl p-8 shadow-2xl border border-pink-100">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full mb-6">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Point Added!</h2>
          <p className="text-gray-600">
            {customer.full_name} now has {customer.current_points + 1} points
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-8 shadow-2xl border border-pink-100">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full mb-6">
          <User className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Confirm Customer</h2>
        <p className="text-gray-600">Verify this matches the customer</p>
      </div>

      <div className="bg-gray-50 rounded-2xl p-6 mb-8">
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-500">Customer Name</p>
            <p className="text-xl font-semibold text-gray-800">{customer.full_name}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Current Points</p>
              <p className="text-2xl font-bold text-pink-600">{customer.current_points}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Visits</p>
              <p className="text-2xl font-bold text-gray-800">{customer.total_visits}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={onCancel}
          className="py-3 px-6 border-2 border-gray-200 text-gray-600 rounded-xl font-semibold hover:border-gray-300 hover:text-gray-700 transition-all"
        >
          <XCircle className="w-5 h-5 inline mr-2" />
          Cancel
        </button>
        <button
          onClick={handleAddPoint}
          disabled={loading}
          className="py-3 px-6 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold hover:from-green-600 hover:to-emerald-600 transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
        >
          <Plus className="w-5 h-5 inline mr-2" />
          {loading ? 'Adding...' : 'Add Point'}
        </button>
      </div>
    </div>
  );
};