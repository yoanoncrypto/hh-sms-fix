/*
  # Fix Users Table RLS Policy

  1. Security Changes
    - Drop the existing overly restrictive policy on users table
    - Create separate policies for different operations:
      - Allow INSERT for service role (for user creation/import)
      - Allow SELECT for authenticated users
      - Allow UPDATE for authenticated users
      - Allow DELETE for authenticated users
    
  This allows the application to create users while maintaining security for other operations.
*/

-- Drop the existing overly restrictive policy
DROP POLICY IF EXISTS "Users can be managed by authenticated users" ON users;

-- Create separate policies for different operations

-- Allow service role to insert new users (for bulk import and user creation)
CREATE POLICY "Service role can insert users"
  ON users
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Allow authenticated users to read all users
CREATE POLICY "Authenticated users can read users"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to update users
CREATE POLICY "Authenticated users can update users"
  ON users
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to delete users
CREATE POLICY "Authenticated users can delete users"
  ON users
  FOR DELETE
  TO authenticated
  USING (true);

-- Also allow anon users to insert (for public user registration if needed)
CREATE POLICY "Allow user creation"
  ON users
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);