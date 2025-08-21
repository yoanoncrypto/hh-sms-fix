/*
  # Create users table

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `phone_number` (text, unique, not null)
      - `email` (text, nullable)
      - `first_name` (text, nullable)
      - `last_name` (text, nullable)
      - `country` (text, nullable)
      - `status` (text, not null, check constraint for valid values)
      - `created_at` (timestamptz, not null, default now())
      - `last_contacted_at` (timestamptz, nullable)

  2. Security
    - Enable RLS on `users` table
    - Add policy for authenticated users to manage user data

  3. Constraints
    - Phone number must be unique
    - Status must be one of: 'active', 'inactive', 'blocked'
*/

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number text UNIQUE NOT NULL,
  email text,
  first_name text,
  last_name text,
  country text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blocked')),
  created_at timestamptz NOT NULL DEFAULT now(),
  last_contacted_at timestamptz
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can be managed by authenticated users"
  ON users
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_users_phone_number ON users(phone_number);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);