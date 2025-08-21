/*
  # Add short_id column to campaigns table

  1. Schema Changes
    - Add `short_id` column to `campaigns` table
    - Set as unique and not null
    - Add length constraint to ensure 5 characters
    - Add index for performance

  2. Data Migration
    - Generate short_id for existing campaigns
    - Ensure uniqueness across all records

  3. Security
    - No RLS changes needed as short_id inherits existing policies
*/

-- Add short_id column to campaigns table
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS short_id text;

-- Create a function to generate random 5-character alphanumeric string
CREATE OR REPLACE FUNCTION generate_short_id()
RETURNS text AS $$
DECLARE
    chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    result text := '';
    i integer;
BEGIN
    FOR i IN 1..5 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Generate short_id for existing campaigns that don't have one
DO $$
DECLARE
    campaign_record RECORD;
    new_short_id text;
    max_attempts integer := 100;
    attempt_count integer;
BEGIN
    FOR campaign_record IN SELECT id FROM campaigns WHERE short_id IS NULL LOOP
        attempt_count := 0;
        LOOP
            new_short_id := generate_short_id();
            
            -- Check if this short_id already exists
            IF NOT EXISTS (SELECT 1 FROM campaigns WHERE short_id = new_short_id) THEN
                UPDATE campaigns SET short_id = new_short_id WHERE id = campaign_record.id;
                EXIT;
            END IF;
            
            attempt_count := attempt_count + 1;
            IF attempt_count >= max_attempts THEN
                RAISE EXCEPTION 'Could not generate unique short_id after % attempts', max_attempts;
            END IF;
        END LOOP;
    END LOOP;
END $$;

-- Add constraints after populating existing data
ALTER TABLE campaigns ALTER COLUMN short_id SET NOT NULL;
ALTER TABLE campaigns ADD CONSTRAINT campaigns_short_id_unique UNIQUE (short_id);
ALTER TABLE campaigns ADD CONSTRAINT campaigns_short_id_length CHECK (LENGTH(short_id) = 5);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_campaigns_short_id ON campaigns (short_id);