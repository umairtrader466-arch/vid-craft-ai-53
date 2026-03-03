import { motion } from "framer-motion";
import { PipelineProgress } from "@/components/PipelineProgress";
import { CSVUploader } from "@/components/CSVUploader";
import { StatsBar } from "@/components/StatsBar";
import { TopicList } from "@/components/TopicList";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import type { VideoTopic, PipelineStep } from "@/types/video";

interface CreateVideoTabProps {
  topics: VideoTopic[];
  pipelineSteps: PipelineStep[];
  canCreateVideo: boolean;
  videosRemaining: number;
  monthlyVideoLimit: number;
  isBanned: boolean;
  youtubePrivacy: 'public' | 'unlisted';
  videoDuration: number;
  onDurationChange: (d: number) => void;
  minDuration: number;
  maxDuration: number;
  onTopicsLoaded: (topics: VideoTopic[], duration: number) => void;
  onProcess: (id: string) => void;
  onRegenerate: (id: string, step: string) => void;
  onProcessAll: () => void;
  onUploadComplete: (id: string, youtubeUrl: string) => void;
  elevenlabsEnabled?: boolean;
  defaultVoiceProvider?: 'elevenlabs' | 'ttsmp3';
  defaultVoiceId?: string;
  defaultTtsmp3Voice?: string;
}

export function CreateVideoTab({
  topics,
  pipelineSteps,
  canCreateVideo,
  videosRemaining,
  monthlyVideoLimit,
  isBanned,
  youtubePrivacy,
  videoDuration,
  onDurationChange,
  minDuration,
  maxDuration,
  onTopicsLoaded,
  onProcess,
  onRegenerate,
  onProcessAll,
  onUploadComplete,
  elevenlabsEnabled,
  defaultVoiceProvider,
  defaultVoiceId,
  defaultTtsmp3Voice,
}: CreateVideoTabProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {isBanned && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Your account has been suspended. Contact admin for assistance.</AlertDescription>
        </Alert>
      )}

      {!isBanned && !canCreateVideo && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>You've reached your monthly limit of {monthlyVideoLimit} videos. Contact admin for more.</AlertDescription>
        </Alert>
      )}

      {canCreateVideo && (
        <div className="text-xs text-muted-foreground text-right">
          {videosRemaining} of {monthlyVideoLimit} videos remaining this month
        </div>
      )}

      <PipelineProgress steps={pipelineSteps} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <CSVUploader
            onTopicsLoaded={onTopicsLoaded}
            minDuration={minDuration}
            maxDuration={maxDuration}
            defaultDuration={videoDuration}
            elevenlabsEnabled={elevenlabsEnabled}
            defaultVoiceProvider={defaultVoiceProvider}
            defaultVoiceId={defaultVoiceId}
            defaultTtsmp3Voice={defaultTtsmp3Voice}
            defaultPrivacy={youtubePrivacy}
          />
        </div>
        <div className="lg:col-span-2">
          <StatsBar topics={topics} />
        </div>
      </div>

      <TopicList
        topics={topics}
        onProcess={onProcess}
        onRegenerate={onRegenerate}
        onProcessAll={onProcessAll}
        onUploadComplete={onUploadComplete}
        privacyStatus={youtubePrivacy}
        canCreateVideo={canCreateVideo}
      />
    </motion.div>
  );
}
