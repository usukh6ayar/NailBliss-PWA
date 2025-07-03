import { useState, useEffect } from 'react';
import { generateQRSignature } from '../lib/supabase';
import { QRCodeData } from '../types';

export const useQRCode = (userId: string | undefined) => {
  const [qrData, setQrData] = useState<QRCodeData | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(60);

  useEffect(() => {
    if (!userId) return;

    const generateNewQR = () => {
      const timestamp = Date.now();
      const signature = generateQRSignature(userId, timestamp);
      
      setQrData({
        userId,
        timestamp,
        signature,
      });
      setTimeRemaining(60);
    };

    // Generate initial QR code
    generateNewQR();

    // Set up timer to regenerate QR code every 60 seconds
    const interval = setInterval(generateNewQR, 60000);

    // Set up countdown timer
    const countdownInterval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(countdownInterval);
    };
  }, [userId]);

  return { qrData, timeRemaining };
};