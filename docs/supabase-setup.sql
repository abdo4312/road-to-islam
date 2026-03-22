-- =====================================================
-- Lecture System Setup - Supabase SQL
-- Run this in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- الخطوة 1.1 & 1.2: إضافة الأعمدة + INDEX
-- =====================================================

-- أضف عمودين جدد لجدول lectures
ALTER TABLE lectures ADD COLUMN IF NOT EXISTS video_url text;
ALTER TABLE lectures ADD COLUMN IF NOT EXISTS day_number integer;

-- index للبحث السريع بالـ day_number
CREATE UNIQUE INDEX IF NOT EXISTS lectures_day_number_idx ON lectures(day_number)
  WHERE day_number IS NOT NULL;

-- =====================================================
-- الخطوة 1.3 & 1.4: إنشاء الـ Storage Buckets
-- =====================================================

-- إنشاء bucket للفيديوهات (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'lecture-videos',
  'lecture-videos',
  true,
  524288000,  -- 500MB
  ARRAY['video/mp4', 'video/mov', 'video/avi', 'video/webm', 'video/quicktime']
) ON CONFLICT (id) DO NOTHING;

-- إنشاء bucket للـ PDFs (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'lecture-pdfs',
  'lecture-pdfs',
  true,
  52428800,   -- 50MB
  ARRAY['application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- الخطوة 1.5: Storage Policies
-- =====================================================

-- Videos: أي شخص يقرأ، الأدمن فقط يرفع ويمسح
CREATE POLICY "Public read lecture videos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'lecture-videos');

CREATE POLICY "Admins upload lecture videos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'lecture-videos' AND
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins delete lecture videos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'lecture-videos' AND
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- PDFs: أي شخص يقرأ، الأدمن فقط يرفع ويمسح
CREATE POLICY "Public read lecture pdfs"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'lecture-pdfs');

CREATE POLICY "Admins upload lecture pdfs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'lecture-pdfs' AND
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins delete lecture pdfs"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'lecture-pdfs' AND
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- =====================================================
-- تم بنجاح!
-- الآن انتقل للخطوة التالية في الكود
-- =====================================================
