-- Add latitude and longitude columns to campaigns table for map functionality

ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10,8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11,8);

-- Add indexes for location-based queries
CREATE INDEX IF NOT EXISTS idx_campaigns_location ON public.campaigns(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.campaigns.latitude IS 'Latitude coordinate for campaign location';
COMMENT ON COLUMN public.campaigns.longitude IS 'Longitude coordinate for campaign location';