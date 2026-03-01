import { useState, useCallback, useEffect } from "react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { CreateVideoTab } from "@/components/dashboard/CreateVideoTab";
import { MyVideosTab } from "@/components/dashboard/MyVideosTab";
import { HistoryTab } from "@/components/dashboard/HistoryTab";
import { SettingsTab } from "@/components/dashboard/SettingsTab";
import { ProfileTab } from "@/components/dashboard/ProfileTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PIPELINE_STEPS } from "@/types/video";
import { processVideoTopic } from "@/lib/videoProcessing";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAppSettings } from "@/hooks/useAppSettings";
import { Video, Film, Clock, Settings, User } from "lucide-react";
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
  const [videoDuration, setVideoDuration] = useState<number>(300);
  const [pipelineSteps, setPipelineSteps] = useState<PipelineStep[]>(
    PIPELINE_STEPS.map(step => ({ ...step, status: 'pending' as const }))
  );

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
          durationSeconds: row.script_duration_minutes ? row.script_duration_minutes * 60 : undefined,
        }));

        setTopics(loadedTopics);
        if (loadedTopics.length > 0) {
          setPipelineSteps(prev => prev.map(step => step.id === 'csv' ? { ...step, status: 'completed' } : step));
        }
      } catch (err) {
        console.error('Error loading topics:', err);
        toast({ title: "Error loading topics", description: "Could not load your saved topics", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    loadTopics();
  }, [user]);

  const updateTopic = useCallback((id: string, updates: Partial<VideoTopic>) => {
    setTopics(prev => prev.map(topic => topic.id === id ? { ...topic, ...updates } : topic));

    setTopics(currentTopics => {
      const updatedTopics = currentTopics.map(t => t.id === id ? { ...t, ...updates } : t);
      const hasScriptComplete = updatedTopics.some(t =>
        ['script_complete', 'voice_generating', 'voice_complete', 'visuals_fetching',
         'visuals_complete', 'video_rendering', 'video_complete', 'uploading', 'uploaded'].includes(t.status)
      );
      const hasVoiceComplete = updatedTopics.some(t =>
        ['voice_complete', 'visuals_fetching', 'visuals_complete', 'video_rendering', 'video_complete', 'uploading', 'uploaded'].includes(t.status)
      );
      const hasVisualsComplete = updatedTopics.some(t =>
        ['visuals_complete', 'video_rendering', 'video_complete', 'uploading', 'uploaded'].includes(t.status)
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
    setPipelineSteps(prev => prev.map(step => step.id === 'csv' ? { ...step, status: 'completed' } : step));
    toast({ title: "Topics loaded!", description: `${newTopics.length} topics ready for processing` });
  }, []);

  const handleProcess = useCallback(async (id: string) => {
    if (!canCreateVideo) {
      toast({ title: "Monthly limit reached", description: `You've used all ${userLimits.monthlyVideoLimit} videos this month.`, variant: "destructive" });
      return;
    }
    const topic = topics.find(t => t.id === id);
    if (!topic) return;

    // Save duration to DB
    const durationMinutes = Math.round(videoDuration / 60);
    await supabase.from('video_topics').update({ script_duration_minutes: durationMinutes }).eq('id', id);

    setPipelineSteps(prev => prev.map(step => step.id === 'script' ? { ...step, status: 'processing' } : step));
    const effectiveProvider = settings.elevenlabsEnabled ? voiceProvider : 'ttsmp3';
    await processVideoTopic(id, topic.topic, selectedVoice, updateTopic, effectiveProvider, selectedTtsmp3Voice, videoDuration);
  }, [topics, selectedVoice, updateTopic, voiceProvider, selectedTtsmp3Voice, canCreateVideo, userLimits, settings, videoDuration]);

  const handleProcessAll = useCallback(async () => {
    const pendingTopics = topics.filter(t => t.status === 'pending');
    toast({ title: "Processing started", description: `Generating content for ${pendingTopics.length} topics...` });
    for (const topic of pendingTopics) {
      await handleProcess(topic.id);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }, [topics, handleProcess]);

  const handleRegenerate = useCallback(async (id: string, step: string) => {
    updateTopic(id, { status: 'pending', error: undefined, script: undefined, voiceBase64: undefined, visuals: undefined });
    await handleProcess(id);
  }, [updateTopic, handleProcess]);

  const handleUploadComplete = useCallback(async (id: string, youtubeUrl: string) => {
    updateTopic(id, { status: 'uploaded', youtubeUrl });
    await supabase.from('video_topics').update({ youtube_url: youtubeUrl, status: 'uploaded' }).eq('id', id);
  }, [updateTopic]);

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6">
        <DashboardHeader />

        <main className="pb-12">
          <Tabs defaultValue="create" className="space-y-6">
            <TabsList className="w-full justify-start bg-secondary/50 border border-border/50 p-1 h-auto flex-wrap">
              <TabsTrigger value="create" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Video className="w-4 h-4" /><span className="hidden sm:inline">Create Video</span>
              </TabsTrigger>
              <TabsTrigger value="videos" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Film className="w-4 h-4" /><span className="hidden sm:inline">My Videos</span>
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Clock className="w-4 h-4" /><span className="hidden sm:inline">History</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Settings className="w-4 h-4" /><span className="hidden sm:inline">Settings</span>
              </TabsTrigger>
              <TabsTrigger value="profile" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <User className="w-4 h-4" /><span className="hidden sm:inline">Profile</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="create">
              <CreateVideoTab
                topics={topics}
                pipelineSteps={pipelineSteps}
                canCreateVideo={canCreateVideo}
                videosRemaining={videosRemaining}
                monthlyVideoLimit={userLimits.monthlyVideoLimit}
                isBanned={userLimits.isBanned}
                youtubePrivacy={youtubePrivacy}
                videoDuration={videoDuration}
                onDurationChange={setVideoDuration}
                minDuration={settings.minVideoDurationSeconds}
                maxDuration={settings.maxVideoDurationSeconds}
                onTopicsLoaded={handleTopicsLoaded}
                onProcess={handleProcess}
                onRegenerate={handleRegenerate}
                onProcessAll={handleProcessAll}
                onUploadComplete={handleUploadComplete}
              />
            </TabsContent>

            <TabsContent value="videos"><MyVideosTab /></TabsContent>
            <TabsContent value="history"><HistoryTab /></TabsContent>
            <TabsContent value="settings">
              <SettingsTab
                selectedVoice={selectedVoice}
                onVoiceChange={setSelectedVoice}
                voiceProvider={voiceProvider}
                onProviderChange={setVoiceProvider}
                selectedTtsmp3Voice={selectedTtsmp3Voice}
                onTtsmp3VoiceChange={setSelectedTtsmp3Voice}
                youtubePrivacy={youtubePrivacy}
                onPrivacyChange={setYoutubePrivacy}
              />
            </TabsContent>
            <TabsContent value="profile"><ProfileTab /></TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
};

export default Index;
