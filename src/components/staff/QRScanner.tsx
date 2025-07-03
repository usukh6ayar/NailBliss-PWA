import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { validateQRCode, supabase } from '../../lib/supabase';
import { QRCodeData } from '../../types';
import { CheckCircle, XCircle, Camera } from 'lucide-react';

interface QRScannerProps {
  onScanSuccess: (userData: any) => void;
}

export const QRScanner: React.FC<QRScannerProps> = ({ onScanSuccess }) => {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [isScanning, setIsScanning] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');

  useEffect(() => {
    if (isScanning) {
      scannerRef.current = new Html5QrcodeScanner(
        'qr-reader',
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        false
      );

      scannerRef.current.render(
        (decodedText) => handleScanSuccess(decodedText),
        (error) => console.warn('QR scan error:', error)
      );
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear();
      }
    };
  }, [isScanning]);

  const handleScanSuccess = async (decodedText: string) => {
    try {
      const qrData: QRCodeData = JSON.parse(decodedText);
      
      // Validate QR code
      if (!validateQRCode(qrData.userId, qrData.timestamp, qrData.signature)) {
        setMessage('Invalid or expired QR code');
        setMessageType('error');
        setTimeout(() => {
          setMessage('');
          setMessageType('');
        }, 3000);
        return;
      }

      // Check if QR code was already used
      const { data: existingVisit } = await supabase
        .from('visits')
        .select('id')
        .eq('qr_code_used', qrData.signature)
        .single();

      if (existingVisit) {
        setMessage('QR code has already been used');
        setMessageType('error');
        setTimeout(() => {
          setMessage('');
          setMessageType('');
        }, 3000);
        return;
      }

      // Get user data
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', qrData.userId)
        .single();

      if (error || !userData) {
        setMessage('User not found');
        setMessageType('error');
        return;
      }

      setMessage('QR code scanned successfully!');
      setMessageType('success');
      setIsScanning(false);
      onScanSuccess({ ...userData, qrSignature: qrData.signature });

    } catch (error) {
      setMessage('Invalid QR code format');
      setMessageType('error');
      setTimeout(() => {
        setMessage('');
        setMessageType('');
      }, 3000);
    }
  };

  const resetScanner = () => {
    setIsScanning(true);
    setMessage('');
    setMessageType('');
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-2xl border border-pink-100">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full mb-4">
          <Camera className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Scan Customer QR</h2>
        <p className="text-gray-600">Point camera at customer's QR code</p>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-2xl flex items-center justify-center space-x-2 ${
          messageType === 'success' 
            ? 'bg-green-50 border-2 border-green-200 text-green-800' 
            : 'bg-red-50 border-2 border-red-200 text-red-800'
        }`}>
          {messageType === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <XCircle className="w-5 h-5" />
          )}
          <span className="font-medium">{message}</span>
        </div>
      )}

      <div className="relative">
        {isScanning ? (
          <div id="qr-reader" className="rounded-2xl overflow-hidden"></div>
        ) : (
          <div className="h-64 bg-gray-50 rounded-2xl flex items-center justify-center">
            <button
              onClick={resetScanner}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-600 transition-all transform hover:scale-105"
            >
              Scan Another QR Code
            </button>
          </div>
        )}
      </div>
    </div>
  );
};