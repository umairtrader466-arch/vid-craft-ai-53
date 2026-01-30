import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

    // Calculate timing - aim for ~60 seconds or match audio duration
    const targetDuration = audioDuration || 60;
    const visualCount = visuals.length;
    const segmentDuration = targetDuration / visualCount;

    // Build Creatomate composition
    const elements: CreatomateElement[] = [];

    // Add audio track from base64
    const audioDataUri = `data:audio/mpeg;base64,${audioBase64}`;
    elements.push({
      type: 'audio',
      track: 1,
      time: 0,
      source: {
        type: 'data',
        data: audioBase64,
      },
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
        source: {
          type: 'url',
          src: visual.url,
        },
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
console.log(
  'FINAL PAYLOAD:',
  JSON.stringify({ source: renderScript }, null, 2)
);

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
