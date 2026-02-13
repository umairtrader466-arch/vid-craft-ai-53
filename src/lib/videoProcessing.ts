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

interface RenderVideoResult {
  renderId: string;
  status: string;
  url?: string;
  estimatedDuration: number;
}

interface CheckRenderStatusResult {
  renderId: string;
  status: 'planned' | 'rendering' | 'succeeded' | 'failed';
  url?: string;
  progress?: number;
  error?: string;
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

export async function generateVoice(script: string, voiceName: string, provider: 'elevenlabs' | 'ttsmp3' = 'elevenlabs', ttsmp3Voice?: string): Promise<GenerateVoiceResult> {
  if (provider === 'ttsmp3') {
    const { data, error } = await supabase.functions.invoke<GenerateVoiceResult>('generate-voice-ttsmp3', {
      body: { script, lang: ttsmp3Voice || 'Joanna' }
    });

    if (error) {
      console.error('Error generating TTSMP3 voice:', error);
      throw new Error(error.message || 'Failed to generate voice via TTSMP3');
    }

    if (!data) {
      throw new Error('No response from TTSMP3 voice generation');
    }

    return data;
  }

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

export async function renderVideo(
  topic: string,
  audioBase64: string,
  visuals: VisualAsset[],
  audioDuration?: number
): Promise<RenderVideoResult> {
  const { data, error } = await supabase.functions.invoke<RenderVideoResult>('render-video', {
    body: { topic, audioBase64, visuals, audioDuration }
  });

  if (error) {
    console.error('Error rendering video:', error);
    throw new Error(error.message || 'Failed to render video');
  }

  if (!data) {
    throw new Error('No response from video rendering');
  }

  return data;
}

export async function checkRenderStatus(renderId: string): Promise<CheckRenderStatusResult> {
  const { data, error } = await supabase.functions.invoke<CheckRenderStatusResult>('check-render-status', {
    body: { renderId }
  });

  if (error) {
    console.error('Error checking render status:', error);
    throw new Error(error.message || 'Failed to check render status');
  }

  if (!data) {
    throw new Error('No response from render status check');
  }

  return data;
}

export async function processVideoTopic(
  topicId: string,
  topicText: string,
  voiceName: string,
  onUpdate: (id: string, updates: Partial<VideoTopic>) => void,
  voiceProvider: 'elevenlabs' | 'ttsmp3' = 'elevenlabs',
  ttsmp3Voice?: string
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
    
    const voiceResult = await generateVoice(scriptResult.script, voiceName, voiceProvider, ttsmp3Voice);
    
    onUpdate(topicId, { 
      status: 'voice_complete',
      voiceBase64: voiceResult.audioBase64
    });

    // Step 3: Fetch visuals
    onUpdate(topicId, { status: 'visuals_fetching' });
    
    const visualsResult = await fetchVisuals(scriptResult.script, topicText);
    
    const mappedVisuals = visualsResult.visuals.map(v => ({
      id: v.id,
      type: v.type,
      source: v.source,
      url: v.url,
      previewUrl: v.previewUrl,
    }));

    onUpdate(topicId, { 
      status: 'visuals_complete',
      visuals: mappedVisuals
    });

    // Step 4: Render video
    onUpdate(topicId, { status: 'video_rendering' });
    
    const renderResult = await renderVideo(
      topicText,
      voiceResult.audioBase64,
      mappedVisuals,
      voiceResult.duration
    );

    onUpdate(topicId, { 
      renderId: renderResult.renderId,
      renderProgress: 0
    });

    // Poll for render completion
    let renderStatus = renderResult.status;
    while (renderStatus !== 'succeeded' && renderStatus !== 'failed') {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Poll every 5 seconds
      
      const statusResult = await checkRenderStatus(renderResult.renderId);
      renderStatus = statusResult.status;
      
      if (statusResult.progress !== undefined) {
        onUpdate(topicId, { renderProgress: statusResult.progress * 100 });
      }
      
      if (statusResult.status === 'succeeded' && statusResult.url) {
        onUpdate(topicId, { 
          status: 'video_complete',
          videoUrl: statusResult.url,
          renderProgress: 100
        });
        break;
      }
      
      if (statusResult.status === 'failed') {
        throw new Error(statusResult.error || 'Video rendering failed');
      }
    }

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
