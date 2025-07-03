/*
  # Fix authentication policies for proper signup and signin flow

  1. Problem
    - JWT function doesn't exist in the current context
    - RLS policies are preventing proper user signup and profile creation
    - Need to fix policies to work with Supabase's auth system

  2. Solution
    - Use auth.uid() instead of jwt() function
    - Create proper policies for signup flow
    - Ensure staff can view customer profiles using role from users table
    - Fix INSERT, SELECT, and UPDATE policies

  3. Changes
    - Drop all existing problematic policies
    - Create new policies that work with Supabase auth
    - Use proper role checking from users table for staff permissions
*/

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can insert their own profile during signup" ON users;
DROP POLICY IF EXISTS "Allow users to insert their own profile during signup" ON users;
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Staff can view all profiles" ON users;

-- Create INSERT policy for user signup (allows both anon and authenticated)
CREATE POLICY "Users can insert their own profile during signup"
  ON users
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (auth.uid() = id);

-- Create SELECT policy for users to view their own profile
CREATE POLICY "Users can view their own profile"
  ON users
  FOR SELECT
  TO anon, authenticated
  USING (auth.uid() = id);

-- Create UPDATE policy for users to update their own profile
CREATE POLICY "Users can update their own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create SELECT policy for staff to view all profiles
-- This uses a subquery to check if the current user has staff role
CREATE POLICY "Staff can view all profiles"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    -- Allow if user is viewing their own profile
    auth.uid() = id
    OR
    -- Allow if current user has staff role (check from users table)
    EXISTS (
      SELECT 1 FROM users staff_user 
      WHERE staff_user.id = auth.uid() 
      AND staff_user.role = 'staff'
    )
  );

-- Update visits table policies to ensure they work properly
DROP POLICY IF EXISTS "Users can view their own visits" ON visits;
DROP POLICY IF EXISTS "Staff can view all visits" ON visits;
DROP POLICY IF EXISTS "Staff can insert visits" ON visits;

-- Recreate visits policies
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