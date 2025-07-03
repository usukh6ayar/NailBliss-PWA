/*
  # Fix RLS policies for users table

  1. Problem
    - Infinite recursion in existing RLS policies
    - RLS policy violations preventing user profile creation
    - Incorrect JSON operator usage

  2. Solution
    - Drop all existing problematic policies
    - Create simplified policies that avoid recursion
    - Use correct PostgreSQL JSON operators
    - Allow proper signup flow for both authenticated and anonymous users

  3. Changes
    - Remove recursive policies
    - Add policies that check user role from JWT metadata correctly
    - Enable proper INSERT, SELECT, and UPDATE permissions
*/

-- Drop all existing policies to start fresh
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

-- Create new, simplified policies that avoid recursion

-- Allow users to insert their own profile (for signup)
-- This needs to work for both authenticated and anonymous users during signup
CREATE POLICY "Enable insert for users on their own profile"
  ON users
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (auth.uid() = id);

-- Allow users to view their own profile
CREATE POLICY "Enable select for users on their own profile"
  ON users
  FOR SELECT
  TO authenticated, anon
  USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Enable update for users on their own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow staff to view all profiles (without recursion)
-- This policy checks the role directly from auth metadata
CREATE POLICY "Enable select for staff on all profiles"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id OR 
    COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'staff' OR
    COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'staff'
  );

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;