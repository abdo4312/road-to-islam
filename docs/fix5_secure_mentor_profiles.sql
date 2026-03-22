-- Fix 5: Protect mentor list from exposing sensitive columns
-- Run this in Supabase SQL Editor.

-- Optional future flag to control WhatsApp visibility behavior.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS whatsapp_visible boolean NOT NULL DEFAULT false;

-- Safe public view for mentor discovery (no whatsapp_number).
-- security_invoker=true ensures caller RLS policies still apply on profiles.
DROP VIEW IF EXISTS public.public_mentor_profiles;
CREATE VIEW public.public_mentor_profiles
WITH (security_invoker = true) AS
SELECT
  id,
  full_name,
  country,
  city,
  gender,
  role
FROM public.profiles
WHERE role = 'mentor';

GRANT SELECT ON public.public_mentor_profiles TO authenticated;
