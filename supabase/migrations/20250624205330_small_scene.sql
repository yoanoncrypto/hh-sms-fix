/*
  # Create message templates table

  1. New Tables
    - `message_templates`
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `type` (text, not null, check constraint for 'sms' or 'email')
      - `subject` (text, nullable - for email templates)
      - `content` (text, not null)
      - `variables` (text array, default empty array)
      - `created_at` (timestamptz, not null, default now())

  2. Security
    - Enable RLS on `message_templates` table
    - Add policy for authenticated users to manage templates

  3. Constraints
    - Type must be either 'sms' or 'email'
    - Name must be unique
*/

CREATE TABLE IF NOT EXISTS message_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  type text NOT NULL CHECK (type IN ('sms', 'email')),
  subject text,
  content text NOT NULL,
  variables text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Message templates can be managed by authenticated users"
  ON message_templates
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_message_templates_type ON message_templates(type);
CREATE INDEX IF NOT EXISTS idx_message_templates_name ON message_templates(name);
CREATE INDEX IF NOT EXISTS idx_message_templates_created_at ON message_templates(created_at DESC);