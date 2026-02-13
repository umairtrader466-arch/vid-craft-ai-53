import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { script, lang } = await req.json();

    if (!script) {
      throw new Error('Script is required');
    }
    if (!lang) {
      throw new Error('Voice language/name is required');
    }

    console.log(`TTSMP3: Generating voice for script (${script.length} chars) with lang: ${lang}`);

    const response = await fetch('https://ttsmp3.com/makemp3_new.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        msg: script,
        lang: lang,
        source: 'ttsmp3',
      }),
    });

    if (!response.ok) {
      throw new Error(`TTSMP3 HTTP error: ${response.status}`);
    }

    const data = await response.json();

    if (data.Error !== 0) {
      throw new Error(`TTSMP3 generation failed: ${JSON.stringify(data)}`);
    }

    console.log('TTSMP3 generation successful, URL:', data.URL);

    // Fetch the MP3 and convert to base64 so the frontend handles it the same way
    const audioResponse = await fetch(data.URL);
    if (!audioResponse.ok) {
      throw new Error(`Failed to download TTSMP3 audio: ${audioResponse.status}`);
    }

    const audioBuffer = await audioResponse.arrayBuffer();

    // Use Deno's built-in base64 encoding
    const { encode: base64Encode } = await import("https://deno.land/std@0.168.0/encoding/base64.ts");
    const base64Audio = base64Encode(audioBuffer);

    return new Response(
      JSON.stringify({
        audioBase64: base64Audio,
        contentType: 'audio/mpeg',
        voiceId: lang,
        duration: Math.round(audioBuffer.byteLength / 16000),
        mp3Url: data.URL,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: unknown) {
    console.error('Error generating TTSMP3 voice:', error);
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
