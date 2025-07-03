export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'customer' | 'staff';
  current_points: number;
  total_visits: number;
  created_at: string;
}

export interface Visit {
  id: string;
  user_id: string;
  staff_id: string;
  created_at: string;
  qr_code_used: string;
}

export interface QRCodeData {
  userId: string;
  timestamp: number;
  signature: string;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, role?: 'customer' | 'staff', rememberMe?: boolean) => Promise<void>;
  signOut: () => Promise<void>;
}

export interface AuthError extends Error {
  status?: number;
  code?: string;
}