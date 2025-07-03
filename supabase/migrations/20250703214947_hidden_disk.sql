/*
  # Fix RLS policies for user signup and authentication

  1. Problem
    - RLS policies were preventing new users from creating profiles during signup
    - JWT function reference was incorrect

  2. Solution
    - Update INSERT policy to allow both authenticated and anonymous users during signup
    - Fix JWT function reference to use auth.jwt()
    - Ensure proper security while allowing signup flow

  3. Changes
    - Drop existing problematic policies
    - Create new policies with correct permissions
    - Use correct auth.jwt() function for staff role checking
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can insert their own profile during signup" ON users;
DROP POLICY IF EXISTS "Allow users to insert their own profile during signup" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Staff can view all profiles" ON users;

-- Create updated policies that work for both authenticated and public contexts during signup
CREATE POLICY "Users can insert their own profile during signup"
  ON users
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view their own profile"
  ON users
  FOR SELECT
  TO authenticated, anon
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create staff policy for viewing all profiles using correct JWT function
CREATE POLICY "Staff can view all profiles"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    (COALESCE(((auth.jwt() -> 'user_metadata'::text) ->> 'role'::text), ''::text) = 'staff'::text) 
    OR (auth.uid() = id)
  );