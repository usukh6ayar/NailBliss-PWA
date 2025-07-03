import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const generateQRSignature = (userId: string, timestamp: number): string => {
  // Simple signature generation - in production, use proper encryption
  const data = `${userId}-${timestamp}`;
  return btoa(data).slice(0, 16);
};

export const validateQRCode = (userId: string, timestamp: number, signature: string): boolean => {
  const now = Date.now();
  const timeDiff = now - timestamp;
  
  // Check if QR code is expired (60 seconds)
  if (timeDiff > 60000) return false;
  
  // Validate signature
  const expectedSignature = generateQRSignature(userId, timestamp);
  return signature === expectedSignature;
};