/*
  # Fix RLS policies for users table

  1. Security Changes
    - Drop existing problematic policies that cause infinite recursion
    - Create simplified, working RLS policies for users table
    - Ensure proper access control for both customers and staff

  2. Policy Changes
    - Allow users to insert their own profile during signup
    - Allow users to view and update their own profile
    - Allow staff to view all user profiles without recursion issues
    - Fix the infinite recursion issue in staff policies
*/

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile during signup" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Staff can view all profiles" ON users;

-- Create new, simplified policies that avoid recursion

-- Allow users to insert their own profile (for signup)
CREATE POLICY "Enable insert for authenticated users on their own profile"
  ON users
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (auth.uid() = id);

-- Allow users to view their own profile
CREATE POLICY "Enable select for users on their own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Enable update for users on their own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow staff to view all profiles (without recursion)
-- This policy checks the role directly from auth.users metadata instead of querying the users table
CREATE POLICY "Enable select for staff on all profiles"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id OR 
    (auth.jwt() ->> 'user_metadata' ->> 'role' = 'staff') OR
    (auth.jwt() ->> 'app_metadata' ->> 'role' = 'staff')
  );

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;