import { motion } from "framer-motion";
import { PipelineProgress } from "@/components/PipelineProgress";
import { CSVUploader } from "@/components/CSVUploader";
import { StatsBar } from "@/components/StatsBar";
import { TopicList } from "@/components/TopicList";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Timer } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  onTopicsLoaded: (topics: VideoTopic[]) => void;
  onProcess: (id: string) => void;
  onRegenerate: (id: string, step: string) => void;
  onProcessAll: () => void;
  onUploadComplete: (id: string, youtubeUrl: string) => void;
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
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
}: CreateVideoTabProps) {
  const isShort = videoDuration <= 60;

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

      {/* Duration Selector */}
      <div className="glass rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Timer className="w-4 h-4 text-primary" />
          <Label className="font-semibold text-sm">Video Duration</Label>
          <Badge variant={isShort ? "secondary" : "default"} className="ml-auto text-xs">
            {isShort ? '🎬 YouTube Short' : '📺 Standard Video'}
          </Badge>
        </div>
        <div className="space-y-2">
          <Slider
            value={[videoDuration]}
            onValueChange={([v]) => onDurationChange(v)}
            min={minDuration}
            max={maxDuration}
            step={30}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatDuration(minDuration)}</span>
            <span className="font-medium text-foreground">{formatDuration(videoDuration)}</span>
            <span>{formatDuration(maxDuration)}</span>
          </div>
          {isShort && (
            <p className="text-[10px] text-muted-foreground">
              Videos ≤ 1 minute will be rendered in vertical 9:16 format for YouTube Shorts
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <CSVUploader onTopicsLoaded={onTopicsLoaded} />
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
