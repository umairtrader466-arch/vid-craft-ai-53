import { supabase } from "@/integrations/supabase/client";
import type { VideoTopic, VisualAsset } from "@/types/video";

interface GenerateScriptResult {
  script: string;
  wordCount: number;
  topic: string;
}

interface GenerateVoiceResult {
  audioBase64: string;
  contentType: string;
  voiceId: string;
  duration: number;
}

interface FetchVisualsResult {
  visuals: VisualAsset[];
  keywords: string[];
  totalFound: number;
}

export async function generateScript(topic: string): Promise<GenerateScriptResult> {
  const { data, error } = await supabase.functions.invoke<GenerateScriptResult>('generate-script', {
    body: { topic }
  });

  if (error) {
    console.error('Error generating script:', error);
    throw new Error(error.message || 'Failed to generate script');
  }

  if (!data) {
    throw new Error('No response from script generation');
  }

  return data;
}

export async function generateVoice(script: string, voiceName: string): Promise<GenerateVoiceResult> {
  const { data, error } = await supabase.functions.invoke<GenerateVoiceResult>('generate-voice', {
    body: { script, voiceName }
  });

  if (error) {
    console.error('Error generating voice:', error);
    throw new Error(error.message || 'Failed to generate voice');
  }

  if (!data) {
    throw new Error('No response from voice generation');
  }

  return data;
}

export async function fetchVisuals(script: string, topic: string): Promise<FetchVisualsResult> {
  const { data, error } = await supabase.functions.invoke<FetchVisualsResult>('fetch-visuals', {
    body: { script, topic }
  });

  if (error) {
    console.error('Error fetching visuals:', error);
    throw new Error(error.message || 'Failed to fetch visuals');
  }

  if (!data) {
    throw new Error('No response from visual fetching');
  }

  return data;
}

export async function processVideoTopic(
  topicId: string,
  topicText: string,
  voiceName: string,
  onUpdate: (id: string, updates: Partial<VideoTopic>) => void
): Promise<void> {
  try {
    // Step 1: Generate script
    onUpdate(topicId, { status: 'script_generating' });
    
    const scriptResult = await generateScript(topicText);
    
    onUpdate(topicId, { 
      status: 'script_complete',
      script: scriptResult.script 
    });

    // Step 2: Generate voice
    onUpdate(topicId, { status: 'voice_generating' });
    
    const voiceResult = await generateVoice(scriptResult.script, voiceName);
    
    onUpdate(topicId, { 
      status: 'voice_complete',
      voiceBase64: voiceResult.audioBase64
    });

    // Step 3: Fetch visuals
    onUpdate(topicId, { status: 'visuals_fetching' });
    
    const visualsResult = await fetchVisuals(scriptResult.script, topicText);
    
    onUpdate(topicId, { 
      status: 'visuals_complete',
      visuals: visualsResult.visuals.map(v => ({
        id: v.id,
        type: v.type,
        source: v.source,
        url: v.url,
        previewUrl: v.previewUrl,
      }))
    });

    // Future steps: Video rendering and YouTube upload would go here
    // For now, mark as visuals complete

  } catch (error) {
    console.error('Error processing topic:', error);
    onUpdate(topicId, { 
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}

// Helper to play voice audio from base64
export function playVoiceAudio(base64Audio: string): HTMLAudioElement {
  const audioUrl = `data:audio/mpeg;base64,${base64Audio}`;
  const audio = new Audio(audioUrl);
  audio.play();
  return audio;
}
