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
    const { renderId } = await req.json();

    if (!renderId) {
      throw new Error('Render ID is required');
    }

    const CREATOMATE_API_KEY = Deno.env.get('CREATOMATE_API_KEY');
    if (!CREATOMATE_API_KEY) {
      throw new Error('CREATOMATE_API_KEY is not configured');
    }

    console.log(`Checking render status for: ${renderId}`);

    const response = await fetch(`https://api.creatomate.com/v1/renders/${renderId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CREATOMATE_API_KEY}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Creatomate API error:', errorText);
      throw new Error(`Creatomate API error: ${response.status} - ${errorText}`);
    }

    const renderData = await response.json();
    
    console.log('Render status:', renderData.status);

    return new Response(
      JSON.stringify({
        renderId: renderData.id,
        status: renderData.status, // 'planned', 'rendering', 'succeeded', 'failed'
        url: renderData.url, // Available when status is 'succeeded'
        progress: renderData.progress, // 0-1 during rendering
        error: renderData.error_message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: unknown) {
    console.error('Error checking render status:', error);
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
