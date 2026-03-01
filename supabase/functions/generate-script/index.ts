import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function getWordCountForDuration(durationSeconds: number): { min: number; max: number } {
  // Average speaking pace: ~150 words per minute
  const wordsPerSecond = 2.5;
  const targetWords = Math.round(durationSeconds * wordsPerSecond);
  const margin = Math.max(20, Math.round(targetWords * 0.1));
  return { min: targetWords - margin, max: targetWords + margin };
}

function getSystemPrompt(durationSeconds: number): string {
  const { min, max } = getWordCountForDuration(durationSeconds);
  const durationLabel = durationSeconds <= 60 
    ? `${durationSeconds}-second YouTube Short`
    : `${Math.round(durationSeconds / 60)}-minute YouTube video`;

  const isShort = durationSeconds <= 60;

  return `You are an expert YouTube script writer specializing in engaging ${isShort ? 'short-form' : 'long-form'} video content. Your task is to write scripts that are:

1. **Engaging**: Hook viewers in the first ${isShort ? '2-3' : '5-10'} seconds with a compelling opening
2. **Clear**: Use simple, conversational language suitable for voiceover narration
3. **Structured**: ${isShort ? 'Get straight to the point with maximum impact' : 'Follow a clear flow: Hook → Main Content → Call-to-Action'}
4. **Length**: Exactly ${min}-${max} words (optimal for a ${durationLabel} at natural speaking pace)

RULES:
- NO emojis
- NO stage directions (like [pause], [cut to], etc.)
- NO markdown formatting
- Write in a natural, conversational tone
${isShort ? '- Keep it punchy and fast-paced for Shorts format' : '- End with a clear call-to-action (subscribe, like, comment, etc.)'}
- Make every word count

Output ONLY the script text, nothing else.`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topic, durationSeconds = 300 } = await req.json();
    
    if (!topic || typeof topic !== "string") {
      return new Response(
        JSON.stringify({ error: "Topic is required and must be a string" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { min, max } = getWordCountForDuration(durationSeconds);
    const isShort = durationSeconds <= 60;
    const durationLabel = isShort ? `${durationSeconds}-second Short` : `${Math.round(durationSeconds / 60)}-minute video`;

    console.log(`Generating script for topic: "${topic}", duration: ${durationSeconds}s (${min}-${max} words)`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: getSystemPrompt(durationSeconds) },
          { 
            role: "user", 
            content: `Write an engaging exact ${durationLabel} YouTube script about: "${topic}"\n\nRemember: ${min}-${max} words, no emojis, no stage directions, conversational tone.` 
          },
        ],
        temperature: 0.8,
        max_tokens: Math.max(1000, Math.round(max * 3)),
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to generate script. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const script = data.choices?.[0]?.message?.content?.trim();

    if (!script) {
      return new Response(
        JSON.stringify({ error: "No script generated. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const wordCount = script.split(/\s+/).filter(Boolean).length;
    console.log("Generated script with", wordCount, "words for", durationLabel);

    return new Response(
      JSON.stringify({ script, wordCount, topic, durationSeconds }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Script generation error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
