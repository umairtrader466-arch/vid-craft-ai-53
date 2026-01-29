import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface VisualResult {
  id: string;
  type: 'video' | 'image';
  source: 'pixabay' | 'pexels';
  url: string;
  previewUrl: string;
  width: number;
  height: number;
  duration?: number;
}

async function fetchPixabayVideos(query: string, apiKey: string): Promise<VisualResult[]> {
  try {
    const url = `https://pixabay.com/api/videos/?key=${apiKey}&q=${encodeURIComponent(query)}&per_page=5&min_width=1920&min_height=1080`;
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error('Pixabay API error:', response.status);
      return [];
    }
    
    const data = await response.json();
    
    return (data.hits || []).map((hit: any) => ({
      id: `pixabay-video-${hit.id}`,
      type: 'video' as const,
      source: 'pixabay' as const,
      url: hit.videos?.large?.url || hit.videos?.medium?.url || hit.videos?.small?.url,
      previewUrl: hit.videos?.tiny?.url || hit.videos?.small?.thumbnail,
      width: hit.videos?.large?.width || 1920,
      height: hit.videos?.large?.height || 1080,
      duration: hit.duration,
    })).filter((v: VisualResult) => v.url);
  } catch (error) {
    console.error('Pixabay fetch error:', error);
    return [];
  }
}

async function fetchPixabayImages(query: string, apiKey: string): Promise<VisualResult[]> {
  try {
    const url = `https://pixabay.com/api/?key=${apiKey}&q=${encodeURIComponent(query)}&per_page=5&min_width=1920&min_height=1080&image_type=photo`;
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error('Pixabay Images API error:', response.status);
      return [];
    }
    
    const data = await response.json();
    
    return (data.hits || []).map((hit: any) => ({
      id: `pixabay-image-${hit.id}`,
      type: 'image' as const,
      source: 'pixabay' as const,
      url: hit.largeImageURL || hit.webformatURL,
      previewUrl: hit.previewURL || hit.webformatURL,
      width: hit.imageWidth,
      height: hit.imageHeight,
    })).filter((v: VisualResult) => v.url);
  } catch (error) {
    console.error('Pixabay images fetch error:', error);
    return [];
  }
}

async function fetchPexelsVideos(query: string, apiKey: string): Promise<VisualResult[]> {
  try {
    const url = `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=5&size=large`;
    const response = await fetch(url, {
      headers: { 'Authorization': apiKey },
    });
    
    if (!response.ok) {
      console.error('Pexels API error:', response.status);
      return [];
    }
    
    const data = await response.json();
    
    return (data.videos || []).map((video: any) => {
      const hdFile = video.video_files?.find((f: any) => f.quality === 'hd' && f.width >= 1920) 
        || video.video_files?.find((f: any) => f.quality === 'hd')
        || video.video_files?.[0];
      
      return {
        id: `pexels-video-${video.id}`,
        type: 'video' as const,
        source: 'pexels' as const,
        url: hdFile?.link || video.video_files?.[0]?.link,
        previewUrl: video.image,
        width: hdFile?.width || 1920,
        height: hdFile?.height || 1080,
        duration: video.duration,
      };
    }).filter((v: VisualResult) => v.url);
  } catch (error) {
    console.error('Pexels fetch error:', error);
    return [];
  }
}

async function fetchPexelsImages(query: string, apiKey: string): Promise<VisualResult[]> {
  try {
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=5&size=large`;
    const response = await fetch(url, {
      headers: { 'Authorization': apiKey },
    });
    
    if (!response.ok) {
      console.error('Pexels Images API error:', response.status);
      return [];
    }
    
    const data = await response.json();
    
    return (data.photos || []).map((photo: any) => ({
      id: `pexels-image-${photo.id}`,
      type: 'image' as const,
      source: 'pexels' as const,
      url: photo.src?.original || photo.src?.large2x || photo.src?.large,
      previewUrl: photo.src?.medium || photo.src?.small,
      width: photo.width,
      height: photo.height,
    })).filter((v: VisualResult) => v.url);
  } catch (error) {
    console.error('Pexels images fetch error:', error);
    return [];
  }
}

function extractKeywords(script: string): string[] {
  // Remove common words and extract meaningful keywords
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
    'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
    'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these',
    'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'what', 'which',
    'who', 'when', 'where', 'why', 'how', 'all', 'each', 'every', 'both',
    'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not',
    'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'into',
    'your', 'youre', 'its', 'about', 'get', 'make', 'like', 'know', 'take',
    'come', 'think', 'see', 'look', 'want', 'give', 'use', 'find', 'tell',
    'ask', 'work', 'seem', 'feel', 'try', 'leave', 'call', 'lets', 'let',
  ]);

  const words = script
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.has(word));

  // Count word frequency
  const wordCount = new Map<string, number>();
  words.forEach(word => {
    wordCount.set(word, (wordCount.get(word) || 0) + 1);
  });

  // Sort by frequency and get top keywords
  const sortedWords = Array.from(wordCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([word]) => word);

  return sortedWords;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { script, topic, keywords: providedKeywords } = await req.json();
    
    if (!script && !topic && !providedKeywords) {
      throw new Error('Script, topic, or keywords are required');
    }

    const PIXABAY_API_KEY = Deno.env.get('PIXABAY_API_KEY');
    const PEXELS_API_KEY = Deno.env.get('PEXELS_API_KEY');

    if (!PIXABAY_API_KEY && !PEXELS_API_KEY) {
      throw new Error('At least one of PIXABAY_API_KEY or PEXELS_API_KEY must be configured');
    }

    // Extract or use provided keywords
    let keywords = providedKeywords || [];
    if (keywords.length === 0 && script) {
      keywords = extractKeywords(script);
    }
    if (keywords.length === 0 && topic) {
      keywords = topic.split(/\s+/).filter((w: string) => w.length > 3).slice(0, 5);
    }

    console.log('Fetching visuals for keywords:', keywords);

    // Create search queries from keywords
    const searchQueries = [
      keywords.slice(0, 3).join(' '),
      keywords.slice(0, 2).join(' '),
      keywords[0] || topic || 'nature',
    ];

    const allResults: VisualResult[] = [];

    // Fetch from both sources in parallel
    const fetchPromises: Promise<VisualResult[]>[] = [];

    for (const query of searchQueries) {
      if (PIXABAY_API_KEY) {
        fetchPromises.push(fetchPixabayVideos(query, PIXABAY_API_KEY));
        fetchPromises.push(fetchPixabayImages(query, PIXABAY_API_KEY));
      }
      if (PEXELS_API_KEY) {
        fetchPromises.push(fetchPexelsVideos(query, PEXELS_API_KEY));
        fetchPromises.push(fetchPexelsImages(query, PEXELS_API_KEY));
      }
    }

    const results = await Promise.all(fetchPromises);
    results.forEach(r => allResults.push(...r));

    // Remove duplicates and prioritize videos
    const seen = new Set<string>();
    const uniqueResults = allResults.filter(result => {
      if (seen.has(result.id)) return false;
      seen.add(result.id);
      return true;
    });

    // Sort: videos first, then by source diversity
    const sortedResults = uniqueResults.sort((a, b) => {
      if (a.type === 'video' && b.type !== 'video') return -1;
      if (a.type !== 'video' && b.type === 'video') return 1;
      return 0;
    });

    // Return top results (aim for 10-15 visuals for a 1-minute video)
    const finalResults = sortedResults.slice(0, 15);

    console.log(`Found ${finalResults.length} visuals (${finalResults.filter(r => r.type === 'video').length} videos, ${finalResults.filter(r => r.type === 'image').length} images)`);

    return new Response(
      JSON.stringify({
        visuals: finalResults,
        keywords,
        totalFound: uniqueResults.length,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: unknown) {
    console.error('Error fetching visuals:', error);
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
