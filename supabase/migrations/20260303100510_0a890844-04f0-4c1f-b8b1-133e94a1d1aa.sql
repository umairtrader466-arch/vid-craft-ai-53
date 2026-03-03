
-- Add voice and privacy columns to video_topics
ALTER TABLE public.video_topics 
  ADD COLUMN voice_provider text DEFAULT 'ttsmp3',
  ADD COLUMN voice_id text DEFAULT 'Kimberly',
  ADD COLUMN privacy_status text DEFAULT 'unlisted';
