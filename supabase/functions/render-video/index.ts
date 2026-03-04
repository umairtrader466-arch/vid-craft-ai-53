import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface VisualAsset {
  id: string;
  type: 'video' | 'image';
  source: 'pixabay' | 'pexels';
  url: string;
  previewUrl: string;
}

interface RenderRequest {
  topic: string;
  audioBase64: string;
  visuals: VisualAsset[];
  audioDuration?: number;
  durationSeconds?: number;
}

async function uploadAudioToStorage(audioBase64: string): Promise<string> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !supabaseServiceKey) throw new Error('Supabase configuration is missing');

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const binaryString = atob(audioBase64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const fileName = `audio-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.mp3`;
  console.log(`Uploading audio file: ${fileName} (${bytes.length} bytes)`);

  const { error } = await supabase.storage.from('audio-files').upload(fileName, bytes, {
    contentType: 'audio/mpeg',
    upsert: false,
  });

  if (error) throw new Error(`Failed to upload audio: ${error.message}`);

  const { data: urlData } = supabase.storage.from('audio-files').getPublicUrl(fileName);
  console.log(`Audio uploaded successfully: ${urlData.publicUrl}`);
  return urlData.publicUrl;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topic, audioBase64, visuals, audioDuration, durationSeconds }: RenderRequest = await req.json();

    if (!audioBase64 || !visuals || visuals.length === 0) {
      throw new Error('Audio and visuals are required');
    }

    const CREATOMATE_API_KEY = Deno.env.get('CREATOMATE_API_KEY');
    if (!CREATOMATE_API_KEY) throw new Error('CREATOMATE_API_KEY is not configured');

    // Determine if this is a Short (≤60s = vertical 1080x1920)
    const targetDuration = audioDuration || durationSeconds || 60;
    const isShort = targetDuration <= 60;
    const width = isShort ? 1080 : 1920;
    const height = isShort ? 1920 : 1080;

    console.log(`Rendering ${isShort ? 'SHORT' : 'LANDSCAPE'} video (${width}x${height}) for: "${topic}" (${targetDuration}s)`);

    const audioUrl = await uploadAudioToStorage(audioBase64);

    // Limit visuals so each one shows for at least 4 seconds (shorts) or 5 seconds (standard)
    const minSegmentDuration = isShort ? 4 : 5;
    const maxVisuals = Math.max(1, Math.floor(targetDuration / minSegmentDuration));
    const usedVisuals = visuals.slice(0, maxVisuals);
    const visualCount = usedVisuals.length;
    const segmentDuration = targetDuration / visualCount;
    console.log(`Using ${visualCount} of ${visuals.length} visuals, ${segmentDuration.toFixed(1)}s per segment`);

    const elements: any[] = [];

    // Audio track
    elements.push({
      type: 'audio',
      track: 1,
      time: 0,
      source: audioUrl,
      audio_fade_out: 1,
    });

    // Visual elements
    usedVisuals.forEach((visual, index) => {
      const startTime = index * segmentDuration;
      const crossfade = isShort ? 0.3 : 0.5;
      const element: any = {
        type: visual.type === 'video' ? 'video' : 'image',
        track: 2,
        time: startTime,
        duration: segmentDuration + crossfade,
        source: visual.url,
        fit: 'cover',
        x: '50%',
        y: '50%',
        width: '100%',
        height: '100%',
        animations: [{ type: 'fade', duration: crossfade }],
      };

      // Add subtle Ken Burns effect for images to avoid static feel
      if (visual.type === 'image') {
        element.animations.push({
          type: 'scale',
          start_scale: '100%',
          end_scale: '110%',
          duration: segmentDuration,
          easing: 'linear',
        });
      }

      if (visual.type === 'video') {
        element.audio_volume = '0%';
      }

      elements.push(element);
    });

    const renderScript = {
      output_format: 'mp4',
      width,
      height,
      frame_rate: 30,
      duration: targetDuration,
      elements,
    };

    console.log('Submitting render job to Creatomate...');
    const renderResponse = await fetch('https://api.creatomate.com/v1/renders', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CREATOMATE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ source: renderScript }),
    });

    if (!renderResponse.ok) {
      const errorText = await renderResponse.text();
      console.error('Creatomate API error:', errorText);
      throw new Error(`Creatomate API error: ${renderResponse.status} - ${errorText}`);
    }

    const renderData = await renderResponse.json();
    const render = Array.isArray(renderData) ? renderData[0] : renderData;

    return new Response(
      JSON.stringify({
        renderId: render.id,
        status: render.status,
        url: render.url,
        estimatedDuration: targetDuration,
        isShort,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error rendering video:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
