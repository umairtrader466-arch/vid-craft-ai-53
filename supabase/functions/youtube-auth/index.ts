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
    const { action, code, redirectUri } = await req.json();

    const YOUTUBE_CLIENT_ID = Deno.env.get('YOUTUBE_CLIENT_ID');
    const YOUTUBE_CLIENT_SECRET = Deno.env.get('YOUTUBE_CLIENT_SECRET');

    if (!YOUTUBE_CLIENT_ID || !YOUTUBE_CLIENT_SECRET) {
      throw new Error('YouTube OAuth credentials are not configured');
    }

    if (action === 'get-auth-url') {
      // Generate OAuth URL for user authorization
      const scope = encodeURIComponent('https://www.googleapis.com/auth/youtube.upload');
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${YOUTUBE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`;

      return new Response(
        JSON.stringify({ authUrl }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'exchange-code') {
      // Exchange authorization code for tokens
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: YOUTUBE_CLIENT_ID,
          client_secret: YOUTUBE_CLIENT_SECRET,
          code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
        }),
      });

      if (!tokenResponse.ok) {
        const error = await tokenResponse.text();
        console.error('Token exchange error:', error);
        throw new Error('Failed to exchange authorization code');
      }

      const tokens = await tokenResponse.json();
      
      return new Response(
        JSON.stringify({
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresIn: tokens.expires_in,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'refresh-token') {
      const { refreshToken } = await req.json();
      
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: YOUTUBE_CLIENT_ID,
          client_secret: YOUTUBE_CLIENT_SECRET,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
      });

      if (!tokenResponse.ok) {
        throw new Error('Failed to refresh token');
      }

      const tokens = await tokenResponse.json();
      
      return new Response(
        JSON.stringify({
          accessToken: tokens.access_token,
          expiresIn: tokens.expires_in,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Invalid action');
  } catch (error: unknown) {
    console.error('YouTube auth error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
