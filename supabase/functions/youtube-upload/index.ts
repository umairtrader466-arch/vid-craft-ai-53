import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface UploadRequest {
  videoUrl: string;
  topic: string;
  script: string;
  accessToken: string;
  privacyStatus?: 'public' | 'unlisted' | 'private';
}

interface VideoMetadata {
  title: string;
  description: string;
  tags: string[];
}

function generateSEOMetadata(topic: string, script: string): VideoMetadata {
  // Generate SEO-optimized title (max 100 chars)
  const baseTitle = topic.length > 70 ? topic.substring(0, 67) + '...' : topic;
  const title = `${baseTitle} | Quick Facts`;

  // Generate description with keywords from script
  const scriptPreview = script.substring(0, 300).replace(/\n/g, ' ');
  const description = `${scriptPreview}...

📚 Learn more fascinating facts in this quick video about ${topic}.

🔔 Subscribe for more educational content!

#shorts #facts #education #learning

---
This video was automatically generated with AI-powered research and narration.`;

  // Extract keywords from topic and script for tags
  const topicWords = topic.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const commonTags = ['shorts', 'facts', 'education', 'learning', 'knowledge', 'interesting facts'];
  
  // Combine and deduplicate tags (max 500 chars total)
  const allTags = [...new Set([...topicWords.slice(0, 10), ...commonTags])];
  const tags = allTags.filter(tag => tag.length > 2).slice(0, 20);

  return { title, description, tags };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { videoUrl, topic, script, accessToken, privacyStatus = 'unlisted' }: UploadRequest = await req.json();

    if (!videoUrl || !topic || !accessToken) {
      throw new Error('Video URL, topic, and access token are required');
    }

    console.log(`Uploading video to YouTube: "${topic}"`);

    // Generate SEO-optimized metadata
    const metadata = generateSEOMetadata(topic, script || topic);
    console.log('Generated metadata:', metadata);

    // Step 1: Download the video from Creatomate URL
    const videoResponse = await fetch(videoUrl);
    if (!videoResponse.ok) {
      throw new Error('Failed to download video from Creatomate');
    }
    const videoBlob = await videoResponse.blob();
    const videoSize = videoBlob.size;
    console.log(`Video downloaded, size: ${videoSize} bytes`);

    // Step 2: Initialize resumable upload
    const initResponse = await fetch(
      'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Upload-Content-Length': String(videoSize),
          'X-Upload-Content-Type': 'video/mp4',
        },
        body: JSON.stringify({
          snippet: {
            title: metadata.title,
            description: metadata.description,
            tags: metadata.tags,
            categoryId: '27', // Education category
          },
          status: {
            privacyStatus: privacyStatus,
            selfDeclaredMadeForKids: false,
          },
        }),
      }
    );

    if (!initResponse.ok) {
      const errorText = await initResponse.text();
      console.error('YouTube API init error:', errorText);
      throw new Error(`YouTube API error: ${initResponse.status} - ${errorText}`);
    }

    const uploadUrl = initResponse.headers.get('Location');
    if (!uploadUrl) {
      throw new Error('Failed to get upload URL from YouTube');
    }

    console.log('Upload URL obtained, uploading video...');

    // Step 3: Upload the video content
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'video/mp4',
        'Content-Length': String(videoSize),
      },
      body: videoBlob,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('YouTube upload error:', errorText);
      throw new Error(`Video upload failed: ${uploadResponse.status}`);
    }

    const uploadResult = await uploadResponse.json();
    console.log('Video uploaded successfully:', uploadResult.id);

    const youtubeUrl = `https://www.youtube.com/watch?v=${uploadResult.id}`;

    return new Response(
      JSON.stringify({
        success: true,
        videoId: uploadResult.id,
        youtubeUrl,
        title: metadata.title,
        privacyStatus,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('YouTube upload error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
