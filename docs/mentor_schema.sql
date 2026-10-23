-- 1. Update profiles table with new fields
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS role text DEFAULT 'student' CHECK (role IN ('student', 'mentor', 'admin')),
ADD COLUMN IF NOT EXISTS country text,
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS latitude numeric,
ADD COLUMN IF NOT EXISTS longitude numeric,
ADD COLUMN IF NOT EXISTS whatsapp_number text;

-- 2. Create mentor_requests table
CREATE TABLE IF NOT EXISTS mentor_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  mentor_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined')),
  question_text text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on the new table
ALTER TABLE mentor_requests ENABLE ROW LEVEL SECURITY;

-- 3. Row Level Security (RLS) Policies

-- Policies for profiles table (assuming RLS is already enabled)
-- Allow students to see mentors in their same country
CREATE POLICY "Students can see mentors in their country"
ON profiles FOR SELECT
USING (
  role = 'mentor' AND country = (SELECT country FROM profiles WHERE id = auth.uid())
);

-- Allow admins to see everyone
CREATE POLICY "Admins can see all profiles"
ON profiles FOR SELECT
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Allow users to see their own profile
CREATE POLICY "Users can see own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- Allow admins to update any profile
CREATE POLICY "Admins can update all profiles"
ON profiles FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Allow users to update their own profile (for location matching)
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

-- Policies for mentor_requests table

-- Students can insert requests
CREATE POLICY "Students can create requests"
ON mentor_requests FOR INSERT
WITH CHECK (auth.uid() = student_id);

-- Students can view their own requests
CREATE POLICY "Students can view own requests"
ON mentor_requests FOR SELECT
USING (auth.uid() = student_id);

-- Mentors can view requests assigned to them
CREATE POLICY "Mentors can view their requests"
ON mentor_requests FOR SELECT
USING (auth.uid() = mentor_id);

-- Mentors can update the status of their requests
CREATE POLICY "Mentors can update their requests"
ON mentor_requests FOR UPDATE
USING (auth.uid() = mentor_id);

-- Function to safely fetch mentor's WhatsApp number only if request is approved
CREATE OR REPLACE FUNCTION get_mentor_whatsapp(mentor_uuid uuid, student_uuid uuid)
RETURNS text AS $$
DECLARE
  wa_number text;
  is_approved boolean;
BEGIN
  -- Check if there is an approved request
  SELECT EXISTS (
    SELECT 1 FROM mentor_requests 
    WHERE mentor_id = mentor_uuid 
    AND student_id = student_uuid 
    AND status = 'approved'
  ) INTO is_approved;

  IF is_approved THEN
    SELECT whatsapp_number INTO wa_number FROM profiles WHERE id = mentor_uuid;
    RETURN wa_number;
  ELSE
    RETURN NULL;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
