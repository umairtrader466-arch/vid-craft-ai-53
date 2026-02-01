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
}

interface CreatomateElement {
  type: string;
  track?: number;
  time?: number | string;
  duration?: number | string;
  source?: string;
  fit?: string;
  x?: string;
  y?: string;
  width?: string;
  height?: string;
  audio_fade_out?: number;
  audio_volume?: string;
  animations?: Array<{ type: string; duration?: number }>;
}

// Helper function to upload audio to Supabase Storage
async function uploadAudioToStorage(audioBase64: string): Promise<string> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase configuration is missing');
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  // Decode base64 to binary
  const binaryString = atob(audioBase64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // Generate unique filename
  const fileName = `audio-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.mp3`;
  
  console.log(`Uploading audio file: ${fileName} (${bytes.length} bytes)`);

  // Upload to storage
  const { data, error } = await supabase.storage
    .from('audio-files')
    .upload(fileName, bytes, {
      contentType: 'audio/mpeg',
      upsert: false,
    });

  if (error) {
    console.error('Storage upload error:', error);
    throw new Error(`Failed to upload audio: ${error.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('audio-files')
    .getPublicUrl(fileName);

  console.log(`Audio uploaded successfully, public URL: ${urlData.publicUrl}`);
  return urlData.publicUrl;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topic, audioBase64, visuals, audioDuration }: RenderRequest = await req.json();

    if (!audioBase64 || !visuals || visuals.length === 0) {
      throw new Error('Audio and visuals are required');
    }

    const CREATOMATE_API_KEY = Deno.env.get('CREATOMATE_API_KEY');
    if (!CREATOMATE_API_KEY) {
      throw new Error('CREATOMATE_API_KEY is not configured');
    }

    console.log(`Rendering video for topic: "${topic}" with ${visuals.length} visuals`);

    // Upload audio to storage and get public URL
    const audioUrl = await uploadAudioToStorage(audioBase64);

    // Calculate timing - aim for ~60 seconds or match audio duration
    const targetDuration = audioDuration || 60;
    const visualCount = visuals.length;
    const segmentDuration = targetDuration / visualCount;

    // Build Creatomate composition
    const elements: CreatomateElement[] = [];

    // Add audio track using the uploaded URL
    elements.push({
      type: 'audio',
      track: 1,
      time: 0,
      source: audioUrl,
      audio_fade_out: 1,
    });

    // Add visual elements sequentially
    visuals.forEach((visual, index) => {
      const startTime = index * segmentDuration;
      const element: CreatomateElement = {
        type: visual.type === 'video' ? 'video' : 'image',
        track: 2,
        time: startTime,
        duration: segmentDuration + 0.5, // Slight overlap for smooth transitions
        source: visual.url, // Creatomate expects a string URL, not an object
        fit: 'cover',
        x: '50%',
        y: '50%',
        width: '100%',
        height: '100%',
        animations: [
          { type: 'fade', duration: 0.5 },
        ],
      };

      // For videos, mute the original audio
      if (visual.type === 'video') {
        element.audio_volume = '0%';
      }

      elements.push(element);
    });
    // Build the render script (source)
    const renderScript = {
      output_format: 'mp4',
      width: 1920,
      height: 1080,
      frame_rate: 30,
      duration: targetDuration,
      elements,
    };

    console.log('Submitting render job to Creatomate...');
    // Create render job via Creatomate API
    // Note: source must be a stringified JSON for render script mode
    const renderResponse = await fetch('https://api.creatomate.com/v1/renders', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CREATOMATE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source: renderScript,
      }),
    });

    if (!renderResponse.ok) {
      const errorText = await renderResponse.text();
      console.error('Creatomate API error:', errorText);
      throw new Error(`Creatomate API error: ${renderResponse.status} - ${errorText}`);
    }

    const renderData = await renderResponse.json();
    
    console.log('Render job created:', renderData);

    // Creatomate returns an array of renders
    const render = Array.isArray(renderData) ? renderData[0] : renderData;

    return new Response(
      JSON.stringify({
        renderId: render.id,
        status: render.status,
        url: render.url, // Will be null until rendering completes
        estimatedDuration: targetDuration,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: unknown) {
    console.error('Error rendering video:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
