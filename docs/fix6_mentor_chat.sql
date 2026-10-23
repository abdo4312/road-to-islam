-- ════════════════════════════════════════════════════════
-- Mentor Chat System - Real-time messaging without WhatsApp
-- Created: 2026-03-20
-- ════════════════════════════════════════════════════════

-- ════════════════════════════════════════════════════════
-- 1. جدول الرسائل بين الطالب والمنتور
-- ════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.mentor_messages (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id    uuid NOT NULL REFERENCES mentor_requests(id) ON DELETE CASCADE,
  sender_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body          text NOT NULL CHECK (char_length(body) > 0 AND char_length(body) <= 2000),
  is_read       boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Index لتسريع جلب الرسائل بالـ request
CREATE INDEX IF NOT EXISTS idx_mentor_messages_request
  ON mentor_messages(request_id, created_at);

-- RLS
ALTER TABLE public.mentor_messages ENABLE ROW LEVEL SECURITY;

-- الطالب والمنتور اللي على الطلب يقدروا يشوفوا الرسائل
CREATE POLICY "Participants can view messages"
ON mentor_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM mentor_requests mr
    WHERE mr.id = request_id
      AND (mr.student_id = auth.uid() OR mr.mentor_id = auth.uid())
  )
);

-- الطالب والمنتور يقدروا يبعتوا رسائل (لكن بس لو الطلب approved)
CREATE POLICY "Participants can send messages"
ON mentor_messages FOR INSERT
WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (
    SELECT 1 FROM mentor_requests mr
    WHERE mr.id = request_id
      AND (mr.student_id = auth.uid() OR mr.mentor_id = auth.uid())
      AND mr.status = 'approved'
  )
);

-- تحديث is_read
CREATE POLICY "Participants can mark messages read"
ON mentor_messages FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM mentor_requests mr
    WHERE mr.id = request_id
      AND (mr.student_id = auth.uid() OR mr.mentor_id = auth.uid())
  )
);


-- ════════════════════════════════════════════════════════
-- 2. إضافة action_url و metadata للـ notifications
--    عشان لما المنتور يضغط على الـ notification
--    يروح على الـ chat مباشرة
-- ════════════════════════════════════════════════════════
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS action_type text,   -- 'open_chat' | 'open_request'
  ADD COLUMN IF NOT EXISTS action_id   text;   -- request_id أو message_id


-- ════════════════════════════════════════════════════════
-- 3. Function — لما الطالب يبعت طلب جديد
--    بتعمل notification للمنتور تلقائياً
-- ════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION notify_mentor_on_new_request()
RETURNS TRIGGER AS $$
DECLARE
  student_name text;
BEGIN
  -- اجيب اسم الطالب
  SELECT full_name INTO student_name
  FROM profiles WHERE id = NEW.student_id;

  -- اعمل notification للمنتور
  INSERT INTO notifications (user_id, title, body, type, action_type, action_id)
  VALUES (
    NEW.mentor_id,
    'New Student Request',
    COALESCE(student_name, 'A student') || ' sent you a question: "' ||
      LEFT(NEW.question_text, 80) || CASE WHEN char_length(NEW.question_text) > 80 THEN '..."' ELSE '"' END,
    'info',
    'open_request',
    NEW.id::text
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_mentor_request ON mentor_requests;
CREATE TRIGGER on_new_mentor_request
  AFTER INSERT ON mentor_requests
  FOR EACH ROW EXECUTE FUNCTION notify_mentor_on_new_request();


-- ════════════════════════════════════════════════════════
-- 4. Function — لما المنتور يرد برسالة
--    بتعمل notification للطالب تلقائياً
-- ════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION notify_on_new_message()
RETURNS TRIGGER AS $$
DECLARE
  sender_name   text;
  request_row   mentor_requests%ROWTYPE;
  receiver_id   uuid;
BEGIN
  -- اجيب بيانات الطلب
  SELECT * INTO request_row FROM mentor_requests WHERE id = NEW.request_id;

  -- اجيب اسم المرسل
  SELECT full_name INTO sender_name FROM profiles WHERE id = NEW.sender_id;

  -- المستقبل هو الشخص التاني على الطلب
  IF NEW.sender_id = request_row.mentor_id THEN
    receiver_id := request_row.student_id;
  ELSE
    receiver_id := request_row.mentor_id;
  END IF;

  -- اعمل notification للمستقبل
  INSERT INTO notifications (user_id, title, body, type, action_type, action_id)
  VALUES (
    receiver_id,
    'New message from ' || COALESCE(sender_name, 'your mentor'),
    LEFT(NEW.body, 100) || CASE WHEN char_length(NEW.body) > 100 THEN '...' ELSE '' END,
    'info',
    'open_chat',
    NEW.request_id::text
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_mentor_message ON mentor_messages;
CREATE TRIGGER on_new_mentor_message
  AFTER INSERT ON mentor_messages
  FOR EACH ROW EXECUTE FUNCTION notify_on_new_message();


-- ════════════════════════════════════════════════════════
-- 5. Function — لما المنتور يقبل / يرفض
--    بتعمل notification للطالب تلقائياً
-- ════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION notify_student_on_status_change()
RETURNS TRIGGER AS $$
DECLARE
  mentor_name text;
BEGIN
  IF OLD.status = NEW.status THEN RETURN NEW; END IF;

  SELECT full_name INTO mentor_name FROM profiles WHERE id = NEW.mentor_id;

  IF NEW.status = 'approved' THEN
    INSERT INTO notifications (user_id, title, body, type, action_type, action_id)
    VALUES (
      NEW.student_id,
      'Request Accepted!',
      COALESCE(mentor_name, 'Your mentor') || ' accepted your request. You can now chat!',
      'success',
      'open_chat',
      NEW.id::text
    );
  ELSIF NEW.status = 'declined' THEN
    INSERT INTO notifications (user_id, title, body, type, action_type, action_id)
    VALUES (
      NEW.student_id,
      'Request Declined',
      COALESCE(mentor_name, 'Your mentor') || ' could not accept your request at this time.',
      'warning',
      NULL,
      NULL
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_request_status_change ON mentor_requests;
CREATE TRIGGER on_request_status_change
  AFTER UPDATE ON mentor_requests
  FOR EACH ROW EXECUTE FUNCTION notify_student_on_status_change();
