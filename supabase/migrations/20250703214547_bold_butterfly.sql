/*
  # Fix RLS policies for user signup

  1. Policy Updates
    - Update the INSERT policy to allow public users to insert their own profile during signup
    - Ensure the policy works for both authenticated and public users during the signup process
    - Keep existing SELECT and UPDATE policies intact
    - Fix JWT function reference

  2. Security
    - Maintain security by ensuring users can only insert their own profile (auth.uid() = id)
    - Allow public access for INSERT only during the signup process
*/

-- Drop the existing INSERT policy
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile during signup" ON users;

-- Create a new INSERT policy that allows both public and authenticated users
-- to insert their own profile (needed for signup flow)
CREATE POLICY "Users can insert their own profile during signup"
  ON users
  FOR INSERT
  TO public
  WITH CHECK (auth.uid() = id);

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Staff can view all profiles" ON users;
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;

-- Create SELECT policy for staff to view all profiles and users to view their own
CREATE POLICY "Staff can view all profiles"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    (COALESCE(((auth.jwt() -> 'user_metadata'::text) ->> 'role'::text), ''::text) = 'staff'::text) 
    OR (auth.uid() = id)
  );

-- Create SELECT policy for public users to view their own profile
CREATE POLICY "Users can view their own profile"
  ON users
  FOR SELECT
  TO public
  USING (auth.uid() = id);

-- Create UPDATE policy for users to update their own profile
CREATE POLICY "Users can update their own profile"
  ON users
  FOR UPDATE
  TO public
  USING (auth.uid() = id);