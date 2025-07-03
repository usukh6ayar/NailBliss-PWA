/*
  # Create users table for NailBliss loyalty system

  1. New Tables
    - `users`
      - `id` (uuid, primary key, references auth.users)
      - `email` (text, unique, not null)
      - `full_name` (text)
      - `role` (text, default 'customer')
      - `current_points` (integer, default 0)
      - `total_visits` (integer, default 0)
      - `created_at` (timestamp with time zone, default now())

  2. Security
    - Enable RLS on `users` table
    - Add policies for users to manage their own profiles
    - Add policy for staff to view customer profiles

  3. Additional Tables
    - `visits` table for tracking customer visits
    - Enable RLS and appropriate policies for visits
*/

-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL PRIMARY KEY,
  email text NOT NULL UNIQUE,
  full_name text,
  role text DEFAULT 'customer'::text NOT NULL CHECK (role IN ('customer', 'staff')),
  current_points integer DEFAULT 0 NOT NULL,
  total_visits integer DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can view their own profile" 
  ON public.users 
  FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
  ON public.users 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON public.users 
  FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Staff can view customer profiles" 
  ON public.users 
  FOR SELECT 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.users staff_user 
      WHERE staff_user.id = auth.uid() 
      AND staff_user.role = 'staff'
    )
  );

-- Create visits table for tracking customer visits
CREATE TABLE IF NOT EXISTS public.visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  staff_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  qr_code_used text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS on visits table
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;

-- Create policies for visits table
CREATE POLICY "Users can view their own visits" 
  ON public.visits 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Staff can view all visits" 
  ON public.visits 
  FOR SELECT 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.users staff_user 
      WHERE staff_user.id = auth.uid() 
      AND staff_user.role = 'staff'
    )
  );

CREATE POLICY "Staff can insert visits" 
  ON public.visits 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users staff_user 
      WHERE staff_user.id = auth.uid() 
      AND staff_user.role = 'staff'
    )
    AND auth.uid() = staff_id
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_visits_user_id ON public.visits(user_id);
CREATE INDEX IF NOT EXISTS idx_visits_staff_id ON public.visits(staff_id);
CREATE INDEX IF NOT EXISTS idx_visits_created_at ON public.visits(created_at);