/*
  # Fix infinite recursion in users table RLS policy

  1. Problem
    - The "Staff can view customer profiles" policy was causing infinite recursion
    - It was querying the users table from within a users table policy

  2. Solution
    - Drop the problematic policy
    - Create a simplified policy that allows staff to view profiles
    - Use a direct role check without recursion

  3. Changes
    - Remove recursive policy
    - Add new staff viewing policy using role check
*/

-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Staff can view customer profiles" ON users;

-- Create a new staff policy that doesn't cause recursion
-- This policy allows staff users to view all user profiles
CREATE POLICY "Staff can view all profiles"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    -- Allow if the current user has staff role (stored in user metadata)
    COALESCE((auth.jwt() -> 'user_metadata' ->> 'role'), '') = 'staff'
    OR
    -- Also allow users to view their own profile
    auth.uid() = id
  );