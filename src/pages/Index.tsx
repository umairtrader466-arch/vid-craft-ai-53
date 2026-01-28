import { useState, useCallback } from "react";
import { Header } from "@/components/Header";
import { PipelineProgress } from "@/components/PipelineProgress";
import { CSVUploader } from "@/components/CSVUploader";
import { TopicList } from "@/components/TopicList";
import { StatsBar } from "@/components/StatsBar";
import { PIPELINE_STEPS } from "@/types/video";
import type { VideoTopic, PipelineStep } from "@/types/video";

const Index = () => {
  const [topics, setTopics] = useState<VideoTopic[]>([]);
  const [pipelineSteps, setPipelineSteps] = useState<PipelineStep[]>(
    PIPELINE_STEPS.map(step => ({ ...step, status: 'pending' as const }))
  );

  const handleTopicsLoaded = useCallback((newTopics: VideoTopic[]) => {
    setTopics(newTopics);
    // Mark CSV step as complete
    setPipelineSteps(prev => 
      prev.map(step => 
        step.id === 'csv' ? { ...step, status: 'completed' } : step
      )
    );
  }, []);

  const handleProcess = useCallback((id: string) => {
    // Simulate processing - this would trigger actual API calls
    setTopics(prev => 
      prev.map(topic => 
        topic.id === id 
          ? { ...topic, status: 'script_generating' } 
          : topic
      )
    );

    // Simulate pipeline progress
    setPipelineSteps(prev => 
      prev.map(step => 
        step.id === 'script' ? { ...step, status: 'processing' } : step
      )
    );

    // Simulate step completion (demo purposes)
    setTimeout(() => {
      setTopics(prev => 
        prev.map(topic => 
          topic.id === id 
            ? { ...topic, status: 'script_complete', script: 'Generated script...' } 
            : topic
        )
      );
    }, 2000);
  }, []);

  const handleProcessAll = useCallback(() => {
    const pendingTopics = topics.filter(t => t.status === 'pending');
    pendingTopics.forEach((topic, index) => {
      setTimeout(() => handleProcess(topic.id), index * 500);
    });
  }, [topics, handleProcess]);

  const handleRegenerate = useCallback((id: string, step: string) => {
    setTopics(prev => 
      prev.map(topic => 
        topic.id === id 
          ? { ...topic, status: 'pending', error: undefined } 
          : topic
      )
    );
  }, []);

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
