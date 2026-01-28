import { useState, useCallback } from "react";
import { Header } from "@/components/Header";
import { PipelineProgress } from "@/components/PipelineProgress";
import { CSVUploader } from "@/components/CSVUploader";
import { TopicList } from "@/components/TopicList";
import { StatsBar } from "@/components/StatsBar";
import { PIPELINE_STEPS } from "@/types/video";
import { processVideoTopic } from "@/lib/videoProcessing";
import { toast } from "@/hooks/use-toast";
import type { VideoTopic, PipelineStep } from "@/types/video";

const Index = () => {
  const [topics, setTopics] = useState<VideoTopic[]>([]);
  const [pipelineSteps, setPipelineSteps] = useState<PipelineStep[]>(
    PIPELINE_STEPS.map(step => ({ ...step, status: 'pending' as const }))
  );

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
      
      // Check if any topic has completed a step
      const hasScriptComplete = updatedTopics.some(t => 
        ['script_complete', 'voice_generating', 'voice_complete', 'visuals_fetching', 
         'visuals_complete', 'video_rendering', 'video_complete', 'uploading', 'uploaded'].includes(t.status)
      );
      
      if (hasScriptComplete) {
        setPipelineSteps(prev => 
          prev.map(step => 
            step.id === 'script' ? { ...step, status: 'completed' } : step
          )
        );
      }

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
    const topic = topics.find(t => t.id === id);
    if (!topic) return;

    // Update pipeline to show script is processing
    setPipelineSteps(prev => 
      prev.map(step => 
        step.id === 'script' ? { ...step, status: 'processing' } : step
      )
    );

    await processVideoTopic(id, topic.topic, updateTopic);
  }, [topics, updateTopic]);

  const handleProcessAll = useCallback(async () => {
    const pendingTopics = topics.filter(t => t.status === 'pending');
    
    toast({
      title: "Processing started",
      description: `Generating scripts for ${pendingTopics.length} topics...`,
    });

    // Process sequentially to avoid rate limits
    for (const topic of pendingTopics) {
      await handleProcess(topic.id);
      // Small delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }, [topics, handleProcess]);

  const handleRegenerate = useCallback(async (id: string, step: string) => {
    updateTopic(id, { status: 'pending', error: undefined, script: undefined });
    await handleProcess(id);
  }, [updateTopic, handleProcess]);

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
          <PipelineProgress steps={pipelineSteps} />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <CSVUploader onTopicsLoaded={handleTopicsLoaded} />
            </div>
            <div className="lg:col-span-2">
              <StatsBar topics={topics} />
            </div>
          </div>

          <TopicList 
            topics={topics} 
            onProcess={handleProcess}
            onRegenerate={handleRegenerate}
            onProcessAll={handleProcessAll}
          />
        </main>
      </div>
    </div>
  );
};

export default Index;
