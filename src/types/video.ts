export type VideoStatus = 
  | 'pending'
  | 'script_generating'
  | 'script_complete'
  | 'voice_generating'
  | 'voice_complete'
  | 'visuals_fetching'
  | 'visuals_complete'
  | 'video_rendering'
  | 'video_complete'
  | 'uploading'
  | 'uploaded'
  | 'error';

export interface VideoTopic {
  id: string;
  topic: string;
  status: VideoStatus;
  script?: string;
  voiceUrl?: string;
  voiceBase64?: string;
  visuals?: VisualAsset[];
  videoUrl?: string;
  youtubeUrl?: string;
  error?: string;
  createdAt: Date;
}

export interface VisualAsset {
  id: string;
  type: 'video' | 'image';
  source: 'pixabay' | 'pexels';
  url: string;
  previewUrl: string;
}

export interface PipelineStep {
  id: string;
  label: string;
  description: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
}

export const PIPELINE_STEPS: Omit<PipelineStep, 'status'>[] = [
  { id: 'csv', label: 'CSV Upload', description: 'Upload your topics' },
  { id: 'script', label: 'Script Generated', description: 'AI writes the script' },
  { id: 'voice', label: 'Voice Generated', description: 'Text-to-speech conversion' },
  { id: 'visuals', label: 'Visuals Downloaded', description: 'Fetching stock media' },
  { id: 'video', label: 'Video Rendered', description: 'Compiling final video' },
  { id: 'youtube', label: 'Uploaded to YouTube', description: 'Published to your channel' },
];
