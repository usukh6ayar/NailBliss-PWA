/*
  # Fix User Signup RLS Policies

  1. Policy Updates
    - Update INSERT policy to allow authenticated users to create profiles during signup
    - Ensure proper RLS policies for user profile creation
    - Fix policy conditions to handle both signup and profile creation scenarios

  2. Security
    - Maintain security while allowing proper user registration flow
    - Ensure users can only create their own profiles
    - Keep existing read/update policies intact
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can insert their own profile during signup" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can view their own profile" ON users;

-- Create updated policies that work for both authenticated and public contexts during signup
CREATE POLICY "Allow users to insert their own profile"
  ON users
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow users to view their own profile"
  ON users
  FOR SELECT
  TO authenticated, anon
  USING (auth.uid() = id);

CREATE POLICY "Allow users to update their own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Keep the staff policy for viewing all profiles
-- (This should already exist from the schema, but ensuring it's correct)
CREATE POLICY "Staff can view all profiles" ON users
  FOR SELECT
  TO authenticated
  USING (
    (COALESCE(((jwt() -> 'user_metadata'::text) ->> 'role'::text), ''::text) = 'staff'::text) 
    OR (auth.uid() = id)
  );