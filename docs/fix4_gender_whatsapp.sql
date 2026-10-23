-- Fix 4: Gender + WhatsApp fields on profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS gender text
    CHECK (gender IN ('male', 'female')),
  ADD COLUMN IF NOT EXISTS whatsapp_number text;
