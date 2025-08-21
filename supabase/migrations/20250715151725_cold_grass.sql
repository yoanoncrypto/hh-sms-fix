/*
  # Campaign Management Schema

  1. New Tables
    - `campaigns` - Stores campaign/invitation information
    - `campaign_recipients` - Links users to campaigns and tracks RSVP status
  
  2. Changes
    - Add columns to `users` table: name, password, role
    - Add campaign_id to `bulk_messages` table
  
  3. Security
    - Enable RLS on new tables
    - Add policies for authenticated users
*/

-- 1. Add columns to the 'users' table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS password TEXT,
ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user';

-- Add a CHECK constraint for the 'role' column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_role_check'
  ) THEN
    ALTER TABLE public.users
    ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'user'));
  END IF;
END $$;

-- 2. Create the 'campaigns' table
CREATE TABLE IF NOT EXISTS public.campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    image_url TEXT,
    date TIMESTAMP WITH TIME ZONE,
    location TEXT,
    rsvp_enabled BOOLEAN DEFAULT FALSE,
    type TEXT NOT NULL CHECK (type IN ('event', 'promotion')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on campaigns table
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

-- Create policies for campaigns table
CREATE POLICY "Enable full access for authenticated users on campaigns"
ON public.campaigns
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role full access on campaigns"
ON public.campaigns
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 3. Create the 'campaign_recipients' table
CREATE TABLE IF NOT EXISTS public.campaign_recipients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'accepted', 'declined', 'viewed')),
    viewed_at TIMESTAMP WITH TIME ZONE,
    responded_at TIMESTAMP WITH TIME ZONE,
    unique_token TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on campaign_recipients table
ALTER TABLE public.campaign_recipients ENABLE ROW LEVEL SECURITY;

-- Create policies for campaign_recipients table
CREATE POLICY "Enable full access for authenticated users on campaign_recipients"
ON public.campaign_recipients
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role full access on campaign_recipients"
ON public.campaign_recipients
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 4. Add 'campaign_id' to the 'bulk_messages' table
ALTER TABLE public.bulk_messages
ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON public.campaigns(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_campaigns_type ON public.campaigns(type);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_campaign_id ON public.campaign_recipients(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_user_id ON public.campaign_recipients(user_id);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_status ON public.campaign_recipients(status);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_unique_token ON public.campaign_recipients(unique_token);
CREATE INDEX IF NOT EXISTS idx_bulk_messages_campaign_id ON public.bulk_messages(campaign_id);