import { supabase } from "@/integrations/supabase/client";
import type { VideoTopic } from "@/types/video";

interface GenerateScriptResult {
  script: string;
  wordCount: number;
  topic: string;
}

export async function generateScript(topic: string): Promise<GenerateScriptResult> {
  const { data, error } = await supabase.functions.invoke<GenerateScriptResult>('generate-script', {
    body: { topic }
  });

  if (error) {
    console.error('Error generating script:', error);
    throw new Error(error.message || 'Failed to generate script');
  }

  if (!data) {
    throw new Error('No response from script generation');
  }

  return data;
}

export async function processVideoTopic(
  topicId: string,
  topicText: string,
  onUpdate: (id: string, updates: Partial<VideoTopic>) => void
): Promise<void> {
  try {
    // Step 1: Generate script
    onUpdate(topicId, { status: 'script_generating' });
    
    const result = await generateScript(topicText);
    
    onUpdate(topicId, { 
      status: 'script_complete',
      script: result.script 
    });

  } catch (error) {
    console.error('Error processing topic:', error);
    onUpdate(topicId, { 
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}
