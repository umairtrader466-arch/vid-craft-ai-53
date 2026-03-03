import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Find topics that are scheduled and due for processing
    const { data: topics, error } = await supabase
      .from('video_topics')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true })
      .limit(3); // Process up to 3 at a time

    if (error) throw error;
    if (!topics || topics.length === 0) {
      return new Response(JSON.stringify({ message: 'No scheduled topics to process' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Processing ${topics.length} scheduled topics`);

    const results: any[] = [];

    for (const topic of topics) {
      try {
        console.log(`Processing topic: "${topic.topic}" (id: ${topic.id})`);

        // Update status
        await supabase.from('video_topics').update({ status: 'script_generating' }).eq('id', topic.id);

        const durationSeconds = (topic.script_duration_minutes || 5) * 60;
        const topicVoiceProvider = topic.voice_provider || 'ttsmp3';
        const topicVoiceId = topic.voice_id || 'Kimberly';
        const topicPrivacy = topic.privacy_status || 'unlisted';

        // Step 1: Generate Script
        const scriptRes = await fetch(`${supabaseUrl}/functions/v1/generate-script`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseServiceKey}` },
          body: JSON.stringify({ topic: topic.topic, durationSeconds }),
        });
        if (!scriptRes.ok) throw new Error(`Script generation failed: ${await scriptRes.text()}`);
        const scriptData = await scriptRes.json();

        await supabase.from('video_topics').update({ 
          status: 'voice_generating', 
          script: scriptData.script 
        }).eq('id', topic.id);

        // Step 2: Generate Voice using per-topic settings
        let voiceData: any;
        if (topicVoiceProvider === 'elevenlabs') {
          const voiceRes = await fetch(`${supabaseUrl}/functions/v1/generate-voice`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseServiceKey}` },
            body: JSON.stringify({ script: scriptData.script, voiceId: topicVoiceId }),
          });
          if (!voiceRes.ok) throw new Error(`Voice generation failed: ${await voiceRes.text()}`);
          voiceData = await voiceRes.json();
        } else {
          const voiceRes = await fetch(`${supabaseUrl}/functions/v1/generate-voice-ttsmp3`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseServiceKey}` },
            body: JSON.stringify({ script: scriptData.script, lang: topicVoiceId }),
          });
          if (!voiceRes.ok) throw new Error(`Voice generation failed: ${await voiceRes.text()}`);
          voiceData = await voiceRes.json();
        }

        await supabase.from('video_topics').update({ status: 'visuals_fetching' }).eq('id', topic.id);

        // Step 3: Fetch Visuals
        const visualsRes = await fetch(`${supabaseUrl}/functions/v1/fetch-visuals`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseServiceKey}` },
          body: JSON.stringify({ script: scriptData.script, topic: topic.topic }),
        });
        if (!visualsRes.ok) throw new Error(`Visuals fetch failed: ${await visualsRes.text()}`);
        const visualsData = await visualsRes.json();

        await supabase.from('video_topics').update({ 
          status: 'video_rendering',
          visuals: visualsData.visuals 
        }).eq('id', topic.id);

        // Step 4: Render Video
        const renderRes = await fetch(`${supabaseUrl}/functions/v1/render-video`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseServiceKey}` },
          body: JSON.stringify({
            topic: topic.topic,
            audioBase64: voiceData.audioBase64,
            visuals: visualsData.visuals,
            audioDuration: voiceData.duration,
            durationSeconds,
          }),
        });
        if (!renderRes.ok) throw new Error(`Render failed: ${await renderRes.text()}`);
        const renderData = await renderRes.json();

        // Poll for render completion (max 10 minutes)
        let status = renderData.status;
        let videoUrl = renderData.url;
        const maxPolls = 120; // 10 min at 5s intervals
        let polls = 0;

        while (status !== 'succeeded' && status !== 'failed' && polls < maxPolls) {
          await new Promise(resolve => setTimeout(resolve, 5000));
          polls++;

          const checkRes = await fetch(`${supabaseUrl}/functions/v1/check-render-status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseServiceKey}` },
            body: JSON.stringify({ renderId: renderData.renderId }),
          });

          if (checkRes.ok) {
            const checkData = await checkRes.json();
            status = checkData.status;
            if (checkData.url) videoUrl = checkData.url;
          }
        }

        if (status !== 'succeeded' || !videoUrl) {
          throw new Error('Render timed out or failed');
        }

        await supabase.from('video_topics').update({ 
          status: 'video_complete',
          video_url: videoUrl 
        }).eq('id', topic.id);

        // Step 5: Auto-upload to YouTube if user has tokens
        const { data: ytTokens } = await supabase
          .from('youtube_tokens')
          .select('access_token, refresh_token, expires_at')
          .eq('user_id', topic.user_id)
          .maybeSingle();

        if (ytTokens) {
          let accessToken = ytTokens.access_token;
          
          // Refresh if expired
          if (new Date(ytTokens.expires_at) <= new Date()) {
            const YOUTUBE_CLIENT_ID = Deno.env.get('YOUTUBE_CLIENT_ID');
            const YOUTUBE_CLIENT_SECRET = Deno.env.get('YOUTUBE_CLIENT_SECRET');
            
            if (YOUTUBE_CLIENT_ID && YOUTUBE_CLIENT_SECRET) {
              const refreshRes = await fetch('https://oauth2.googleapis.com/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                  client_id: YOUTUBE_CLIENT_ID,
                  client_secret: YOUTUBE_CLIENT_SECRET,
                  refresh_token: ytTokens.refresh_token,
                  grant_type: 'refresh_token',
                }),
              });

              if (refreshRes.ok) {
                const refreshData = await refreshRes.json();
                accessToken = refreshData.access_token;
                
                // Update stored token
                await supabase.from('youtube_tokens').update({
                  access_token: accessToken,
                  expires_at: new Date(Date.now() + refreshData.expires_in * 1000).toISOString(),
                  updated_at: new Date().toISOString(),
                }).eq('user_id', topic.user_id);
              }
            }
          }

          // Upload to YouTube
          await supabase.from('video_topics').update({ status: 'uploading' }).eq('id', topic.id);

          const uploadRes = await fetch(`${supabaseUrl}/functions/v1/youtube-upload`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseServiceKey}` },
            body: JSON.stringify({
              videoUrl,
              topic: topic.topic,
              script: scriptData.script,
              accessToken,
              privacyStatus: topicPrivacy,
            }),
          });

          if (uploadRes.ok) {
            const uploadData = await uploadRes.json();
            if (uploadData.success) {
              await supabase.from('video_topics').update({ 
                status: 'uploaded',
                youtube_url: uploadData.youtubeUrl 
              }).eq('id', topic.id);
              
              results.push({ id: topic.id, status: 'uploaded', youtubeUrl: uploadData.youtubeUrl });
              continue;
            }
          }
        }

        results.push({ id: topic.id, status: 'video_complete', videoUrl });

      } catch (err) {
        console.error(`Error processing topic ${topic.id}:`, err);
        await supabase.from('video_topics').update({ 
          status: 'error' 
        }).eq('id', topic.id);
        results.push({ id: topic.id, status: 'error', error: err instanceof Error ? err.message : 'Unknown error' });
      }
    }

    return new Response(
      JSON.stringify({ processed: results.length, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Cron job error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
