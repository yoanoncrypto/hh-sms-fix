/*
  # Consolidate name columns

  1. Changes
    - Add `name` column to users table
    - Migrate existing first_name and last_name data to name column
    - Drop first_name and last_name columns
    - Update indexes and constraints as needed

  2. Data Migration
    - Combines first_name and last_name into single name field
    - Handles cases where only one name is present
    - Preserves existing data during migration
*/

-- Add name column
ALTER TABLE users ADD COLUMN IF NOT EXISTS name text;

-- Migrate existing data: combine first_name and last_name into name
UPDATE users 
SET name = CASE 
  WHEN first_name IS NOT NULL AND last_name IS NOT NULL THEN 
    CONCAT(first_name, ' ', last_name)
  WHEN first_name IS NOT NULL THEN 
    first_name
  WHEN last_name IS NOT NULL THEN 
    last_name
  ELSE 
    NULL
END
WHERE name IS NULL;

-- Drop the old columns
ALTER TABLE users DROP COLUMN IF EXISTS first_name;
ALTER TABLE users DROP COLUMN IF EXISTS last_name;