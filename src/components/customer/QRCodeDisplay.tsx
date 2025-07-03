import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useQRCode } from '../../hooks/useQRCode';
import { Clock, RefreshCw } from 'lucide-react';

interface QRCodeDisplayProps {
  userId: string;
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({ userId }) => {
  const { qrData, timeRemaining } = useQRCode(userId);

  if (!qrData) {
    return (
      <div className="bg-white rounded-3xl p-8 shadow-2xl border border-pink-100">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
        </div>
      </div>
    );
  }

  const qrString = JSON.stringify(qrData);

  return (
    <div className="bg-white rounded-3xl p-8 shadow-2xl border border-pink-100">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-gray-800 mb-2">Your Visit QR Code</h3>
        <p className="text-gray-600">Show this to staff to earn a point</p>
      </div>

      <div className="flex justify-center mb-6">
        <div className="p-6 bg-gray-50 rounded-3xl">
          <QRCodeSVG
            value={qrString}
            size={200}
            level="M"
            includeMargin={true}
            bgColor="#ffffff"
            fgColor="#000000"
          />
        </div>
      </div>

      <div className="flex items-center justify-center space-x-2 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl">
        <Clock className="w-5 h-5 text-blue-600" />
        <p className="text-blue-800 font-medium">
          Expires in {timeRemaining} seconds
        </p>
      </div>

      <div className="mt-4 text-center">
        <p className="text-sm text-gray-500">
          QR code refreshes automatically every minute for security
        </p>
      </div>
    </div>
  );
};