/*
  # Create bulk messages table

  1. New Tables
    - `bulk_messages`
      - `id` (uuid, primary key)
      - `type` (text, not null, check constraint for 'sms' or 'email')
      - `template_id` (uuid, nullable, foreign key to message_templates)
      - `subject` (text, nullable)
      - `content` (text, not null)
      - `recipient_count` (integer, not null, default 0)
      - `sent_count` (integer, not null, default 0)
      - `status` (text, not null, check constraint for valid statuses)
      - `created_at` (timestamptz, not null, default now())
      - `completed_at` (timestamptz, nullable)

  2. Security
    - Enable RLS on `bulk_messages` table
    - Add policy for authenticated users to manage bulk messages

  3. Constraints
    - Type must be either 'sms' or 'email'
    - Status must be one of: 'pending', 'sending', 'completed', 'failed'
    - Foreign key relationship with message_templates
*/

CREATE TABLE IF NOT EXISTS bulk_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('sms', 'email')),
  template_id uuid REFERENCES message_templates(id) ON DELETE SET NULL,
  subject text,
  content text NOT NULL,
  recipient_count integer NOT NULL DEFAULT 0,
  sent_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sending', 'completed', 'failed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE bulk_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Bulk messages can be managed by authenticated users"
  ON bulk_messages
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_bulk_messages_type ON bulk_messages(type);
CREATE INDEX IF NOT EXISTS idx_bulk_messages_status ON bulk_messages(status);
CREATE INDEX IF NOT EXISTS idx_bulk_messages_template_id ON bulk_messages(template_id);
CREATE INDEX IF NOT EXISTS idx_bulk_messages_created_at ON bulk_messages(created_at DESC);