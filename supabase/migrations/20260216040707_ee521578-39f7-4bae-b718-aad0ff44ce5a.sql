
-- Add is_banned column to user_limits
ALTER TABLE public.user_limits ADD COLUMN IF NOT EXISTS is_banned boolean NOT NULL DEFAULT false;
