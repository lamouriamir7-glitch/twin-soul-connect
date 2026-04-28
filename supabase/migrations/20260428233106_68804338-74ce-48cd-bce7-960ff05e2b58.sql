ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS media_url text,
  ADD COLUMN IF NOT EXISTS media_type text;

ALTER TABLE public.messages ALTER COLUMN content DROP NOT NULL;
ALTER TABLE public.messages ALTER COLUMN content SET DEFAULT '';

INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-media', 'chat-media', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated can read chat media"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'chat-media');

CREATE POLICY "Users can upload their own chat media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'chat-media'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own chat media"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'chat-media'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
