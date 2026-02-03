-- Create video_topics table to store uploaded topics with scheduling
CREATE TABLE public.video_topics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  topic TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  script TEXT,
  voice_url TEXT,
  visuals JSONB,
  video_url TEXT,
  youtube_url TEXT,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.video_topics ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own topics" 
ON public.video_topics 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own topics" 
ON public.video_topics 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own topics" 
ON public.video_topics 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own topics" 
ON public.video_topics 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_video_topics_updated_at
BEFORE UPDATE ON public.video_topics
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries by user
CREATE INDEX idx_video_topics_user_id ON public.video_topics(user_id);
CREATE INDEX idx_video_topics_scheduled_at ON public.video_topics(scheduled_at);