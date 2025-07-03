/*
  # Fix Authentication and RLS Policies

  1. Problem Analysis
    - Current policies are causing infinite recursion when staff tries to view profiles
    - INSERT policies are blocking user signup
    - Policies are not properly handling anonymous users during signup

  2. Solution
    - Create non-recursive policies that work for all scenarios
    - Ensure signup works for both authenticated and anonymous users
    - Fix staff access without causing recursion
    - Use proper JWT metadata access

  3. Changes
    - Drop all existing problematic policies
    - Create new policies that avoid recursion
    - Ensure proper access control for all user types
*/

-- Drop all existing policies to start completely fresh
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile during signup" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Staff can view all profiles" ON users;
DROP POLICY IF EXISTS "Allow users to insert their own profile" ON users;
DROP POLICY IF EXISTS "Allow users to view their own profile" ON users;
DROP POLICY IF EXISTS "Allow users to update their own profile" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users on their own profile" ON users;
DROP POLICY IF EXISTS "Enable select for users on their own profile" ON users;
DROP POLICY IF EXISTS "Enable update for users on their own profile" ON users;
DROP POLICY IF EXISTS "Enable select for staff on all profiles" ON users;
DROP POLICY IF EXISTS "Enable insert for users on their own profile" ON users;

-- Create INSERT policy for user signup (works for both anon and authenticated)
CREATE POLICY "Enable insert for users on their own profile"
  ON users
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (auth.uid() = id);

-- Create SELECT policy for users to view their own profile
CREATE POLICY "Enable select for users on their own profile"
  ON users
  FOR SELECT
  TO anon, authenticated
  USING (auth.uid() = id);

-- Create UPDATE policy for users to update their own profile
CREATE POLICY "Enable update for users on their own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create SELECT policy for staff to view all profiles
-- This policy checks the role from JWT metadata to avoid recursion
CREATE POLICY "Enable select for staff on all profiles"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    -- Users can always view their own profile
    (auth.uid() = id) 
    OR 
    -- Staff can view all profiles (check role from JWT metadata)
    (COALESCE((auth.jwt() -> 'user_metadata'::text) ->> 'role'::text, ''::text) = 'staff'::text)
    OR
    (COALESCE((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text, ''::text) = 'staff'::text)
  );

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Fix visits table policies as well
DROP POLICY IF EXISTS "Users can view their own visits" ON visits;
DROP POLICY IF EXISTS "Staff can view all visits" ON visits;
DROP POLICY IF EXISTS "Staff can insert visits" ON visits;

-- Recreate visits policies with proper access control
CREATE POLICY "Users can view their own visits"
  ON visits
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Staff can view all visits"
  ON visits
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users staff_user 
      WHERE staff_user.id = auth.uid() 
      AND staff_user.role = 'staff'
    )
  );

CREATE POLICY "Staff can insert visits"
  ON visits
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users staff_user 
      WHERE staff_user.id = auth.uid() 
      AND staff_user.role = 'staff'
    )
    AND auth.uid() = staff_id
  );