import { motion, AnimatePresence } from "framer-motion";
import { Inbox, Play, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TopicCard } from "./TopicCard";
import type { VideoTopic } from "@/types/video";

interface TopicListProps {
  topics: VideoTopic[];
  onProcess: (id: string) => void;
  onRegenerate: (id: string, step: string) => void;
  onProcessAll: () => void;
  onUploadComplete: (id: string, youtubeUrl: string) => void;
  privacyStatus: 'public' | 'unlisted';
}

export function TopicList({ topics, onProcess, onRegenerate, onProcessAll, onUploadComplete, privacyStatus }: TopicListProps) {
  const pendingCount = topics.filter(t => t.status === 'pending').length;
  const completedCount = topics.filter(t => t.status === 'uploaded' || t.status === 'video_complete').length;

  if (topics.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="glass rounded-xl p-12 text-center"
      >
        <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
          <Inbox className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No Topics Yet</h3>
        <p className="text-sm text-muted-foreground">
          Upload a CSV file with your video topics to get started
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Video Topics</h2>
          <p className="text-sm text-muted-foreground">
            {topics.length} topics • {completedCount} completed • {pendingCount} pending
          </p>
        </div>
        
        {pendingCount > 0 && (
          <Button onClick={onProcessAll} className="bg-gradient-primary hover:opacity-90">
            <Sparkles className="w-4 h-4 mr-2" />
            Process All ({pendingCount})
          </Button>
        )}
      </div>
      
      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {topics.map((topic, index) => (
            <TopicCard
              key={topic.id}
              topic={topic}
              index={index}
              onProcess={onProcess}
              onRegenerate={onRegenerate}
              onUploadComplete={onUploadComplete}
              privacyStatus={privacyStatus}
            />
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
