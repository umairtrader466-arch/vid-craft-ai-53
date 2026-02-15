import { useState, useCallback, useEffect } from "react";
import { Header } from "@/components/Header";
import { PipelineProgress } from "@/components/PipelineProgress";
import { CSVUploader } from "@/components/CSVUploader";
import { TopicList } from "@/components/TopicList";
import { StatsBar } from "@/components/StatsBar";
import { VoiceSettings } from "@/components/VoiceSettings";
import { YouTubeConnect } from "@/components/YouTubeConnect";
import { PIPELINE_STEPS } from "@/types/video";
import { processVideoTopic } from "@/lib/videoProcessing";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAppSettings } from "@/hooks/useAppSettings";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import type { VideoTopic, PipelineStep } from "@/types/video";

const Index = () => {
  const { user } = useAuth();
  const { settings, userLimits, canCreateVideo, videosRemaining, loading: settingsLoading } = useAppSettings();
  const [topics, setTopics] = useState<VideoTopic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVoice, setSelectedVoice] = useState<string>('george');
  const [voiceProvider, setVoiceProvider] = useState<'elevenlabs' | 'ttsmp3'>('elevenlabs');
  const [selectedTtsmp3Voice, setSelectedTtsmp3Voice] = useState<string>('Kimberly');
  const [youtubePrivacy, setYoutubePrivacy] = useState<'public' | 'unlisted'>('unlisted');
  const [pipelineSteps, setPipelineSteps] = useState<PipelineStep[]>(
    PIPELINE_STEPS.map(step => ({ ...step, status: 'pending' as const }))
  );

  // Load topics from database on mount
  useEffect(() => {
    const loadTopics = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('video_topics')
          .select('*')
          .order('scheduled_at', { ascending: true });

        if (error) throw error;

        const loadedTopics: VideoTopic[] = (data || []).map((row) => ({
          id: row.id,
          topic: row.topic,
          status: row.status as VideoTopic['status'],
          script: row.script || undefined,
          voiceUrl: row.voice_url || undefined,
          videoUrl: row.video_url || undefined,
          youtubeUrl: row.youtube_url || undefined,
          createdAt: new Date(row.created_at),
          scheduledAt: row.scheduled_at ? new Date(row.scheduled_at) : undefined,
        }));

        setTopics(loadedTopics);
        
        // Update pipeline status if topics exist
        if (loadedTopics.length > 0) {
          setPipelineSteps(prev => 
            prev.map(step => 
              step.id === 'csv' ? { ...step, status: 'completed' } : step
            )
          );
        }
      } catch (err) {
        console.error('Error loading topics:', err);
        toast({
          title: "Error loading topics",
          description: "Could not load your saved topics",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadTopics();
  }, [user]);

  const updateTopic = useCallback((id: string, updates: Partial<VideoTopic>) => {
    setTopics(prev => 
      prev.map(topic => 
        topic.id === id ? { ...topic, ...updates } : topic
      )
    );

    // Update pipeline status based on topic statuses
    setTopics(currentTopics => {
      const updatedTopics = currentTopics.map(t => 
        t.id === id ? { ...t, ...updates } : t
      );
      
      // Check completion status for each step
      const hasScriptComplete = updatedTopics.some(t => 
        ['script_complete', 'voice_generating', 'voice_complete', 'visuals_fetching', 
         'visuals_complete', 'video_rendering', 'video_complete', 'uploading', 'uploaded'].includes(t.status)
      );
      
      const hasVoiceComplete = updatedTopics.some(t => 
        ['voice_complete', 'visuals_fetching', 'visuals_complete', 
         'video_rendering', 'video_complete', 'uploading', 'uploaded'].includes(t.status)
      );

      const hasVisualsComplete = updatedTopics.some(t => 
        ['visuals_complete', 'video_rendering', 'video_complete', 
         'uploading', 'uploaded'].includes(t.status)
      );

      setPipelineSteps(prev => 
        prev.map(step => {
          if (step.id === 'script' && hasScriptComplete) return { ...step, status: 'completed' };
          if (step.id === 'voice' && hasVoiceComplete) return { ...step, status: 'completed' };
          if (step.id === 'visuals' && hasVisualsComplete) return { ...step, status: 'completed' };
          return step;
        })
      );

      return updatedTopics;
    });
  }, []);

  const handleTopicsLoaded = useCallback((newTopics: VideoTopic[]) => {
    setTopics(newTopics);
    setPipelineSteps(prev => 
      prev.map(step => 
        step.id === 'csv' ? { ...step, status: 'completed' } : step
      )
    );
    toast({
      title: "Topics loaded!",
      description: `${newTopics.length} topics ready for processing`,
    });
  }, []);

  const handleProcess = useCallback(async (id: string) => {
    if (!canCreateVideo) {
      toast({
        title: "Monthly limit reached",
        description: `You've used all ${userLimits.monthlyVideoLimit} videos this month.`,
        variant: "destructive",
      });
      return;
    }

    const topic = topics.find(t => t.id === id);
    if (!topic) return;

    // Update pipeline to show script is processing
    setPipelineSteps(prev => 
      prev.map(step => 
        step.id === 'script' ? { ...step, status: 'processing' } : step
      )
    );

    // Force TTSMP3 if ElevenLabs is disabled by admin
    const effectiveProvider = settings.elevenlabsEnabled ? voiceProvider : 'ttsmp3';

    await processVideoTopic(id, topic.topic, selectedVoice, updateTopic, effectiveProvider, selectedTtsmp3Voice);
  }, [topics, selectedVoice, updateTopic, voiceProvider, selectedTtsmp3Voice, canCreateVideo, userLimits, settings]);

  const handleProcessAll = useCallback(async () => {
    const pendingTopics = topics.filter(t => t.status === 'pending');
    
    toast({
      title: "Processing started",
      description: `Generating content for ${pendingTopics.length} topics...`,
    });

    // Process sequentially to avoid rate limits
    for (const topic of pendingTopics) {
      await handleProcess(topic.id);
      // Small delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }, [topics, handleProcess]);

  const handleRegenerate = useCallback(async (id: string, step: string) => {
    updateTopic(id, { 
      status: 'pending', 
      error: undefined, 
      script: undefined,
      voiceBase64: undefined,
      visuals: undefined
    });
    await handleProcess(id);
  }, [updateTopic, handleProcess]);

  const handleUploadComplete = useCallback((id: string, youtubeUrl: string) => {
    updateTopic(id, { 
      status: 'uploaded', 
      youtubeUrl 
    });
  }, [updateTopic]);

  return (
    <div className="min-h-screen bg-background">
      {/* Background gradient effect */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6">
        <Header />
        
        <main className="pb-12 space-y-6">
          {!canCreateVideo && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You've reached your monthly limit of {userLimits.monthlyVideoLimit} videos. Contact admin for more.
              </AlertDescription>
            </Alert>
          )}

          {canCreateVideo && (
            <div className="text-xs text-muted-foreground text-right">
              {videosRemaining} of {userLimits.monthlyVideoLimit} videos remaining this month
            </div>
          )}

          <PipelineProgress steps={pipelineSteps} />
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1">
              <CSVUploader onTopicsLoaded={handleTopicsLoaded} />
            </div>
            <div className="lg:col-span-1">
            <VoiceSettings 
                selectedVoice={selectedVoice} 
                onVoiceChange={setSelectedVoice}
                voiceProvider={settings.elevenlabsEnabled ? voiceProvider : 'ttsmp3'}
                onProviderChange={setVoiceProvider}
                selectedTtsmp3Voice={selectedTtsmp3Voice}
                onTtsmp3VoiceChange={setSelectedTtsmp3Voice}
                elevenlabsEnabled={settings.elevenlabsEnabled}
              />
            </div>
            <div className="lg:col-span-1">
              <YouTubeConnect 
                privacyStatus={youtubePrivacy}
                onPrivacyChange={setYoutubePrivacy}
              />
            </div>
            <div className="lg:col-span-1">
              <StatsBar topics={topics} />
            </div>
          </div>

          <TopicList 
            topics={topics} 
            onProcess={handleProcess}
            onRegenerate={handleRegenerate}
            onProcessAll={handleProcessAll}
            onUploadComplete={handleUploadComplete}
            privacyStatus={youtubePrivacy}
            canCreateVideo={canCreateVideo}
          />
        </main>
      </div>
    </div>
  );
};

export default Index;
