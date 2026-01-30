import { useState } from "react";
import { motion } from "framer-motion";
import { 
  FileText, 
  Mic, 
  Image, 
  Film, 
  Youtube, 
  Play, 
  RotateCcw,
  Download,
  ExternalLink,
  Loader2,
  Check,
  AlertCircle,
  Eye,
  Pause,
  Volume2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { playVoiceAudio } from "@/lib/videoProcessing";
import type { VideoTopic, VideoStatus } from "@/types/video";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface TopicCardProps {
  topic: VideoTopic;
  index: number;
  onProcess: (id: string) => void;
  onRegenerate: (id: string, step: string) => void;
}

const STATUS_CONFIG: Record<VideoStatus, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: 'Pending', color: 'text-muted-foreground', icon: FileText },
  script_generating: { label: 'Writing Script...', color: 'text-warning', icon: FileText },
  script_complete: { label: 'Script Ready', color: 'text-success', icon: FileText },
  voice_generating: { label: 'Generating Voice...', color: 'text-warning', icon: Mic },
  voice_complete: { label: 'Voice Ready', color: 'text-success', icon: Mic },
  visuals_fetching: { label: 'Fetching Visuals...', color: 'text-warning', icon: Image },
  visuals_complete: { label: 'Visuals Ready', color: 'text-success', icon: Image },
  video_rendering: { label: 'Rendering...', color: 'text-warning', icon: Film },
  video_complete: { label: 'Video Ready', color: 'text-success', icon: Film },
  uploading: { label: 'Uploading...', color: 'text-warning', icon: Youtube },
  uploaded: { label: 'Uploaded!', color: 'text-success', icon: Youtube },
  error: { label: 'Error', color: 'text-destructive', icon: AlertCircle },
};

const STEPS = [
  { key: 'script', icon: FileText, label: 'Script' },
  { key: 'voice', icon: Mic, label: 'Voice' },
  { key: 'visuals', icon: Image, label: 'Visuals' },
  { key: 'video', icon: Film, label: 'Video' },
  { key: 'youtube', icon: Youtube, label: 'YouTube' },
];

export function TopicCard({ topic, index, onProcess, onRegenerate }: TopicCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  
  const config = STATUS_CONFIG[topic.status];
  const StatusIcon = config.icon;
  
  const isProcessing = topic.status.includes('generating') || 
                       topic.status.includes('fetching') || 
                       topic.status.includes('rendering') ||
                       topic.status === 'uploading';
  
  const getStepStatus = (stepKey: string): 'pending' | 'processing' | 'completed' => {
    const statusOrder = ['script', 'voice', 'visuals', 'video', 'youtube'];
    const currentStep = topic.status.split('_')[0];
    const stepIndex = statusOrder.indexOf(stepKey);
    const currentIndex = statusOrder.indexOf(currentStep);
    
    if (topic.status === 'uploaded' || topic.status === 'video_complete') {
      return stepKey === 'youtube' && topic.status !== 'uploaded' ? 'pending' : 'completed';
    }
    
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return isProcessing ? 'processing' : 'completed';
    return 'pending';
  };

  const handlePlayVoice = () => {
    if (!topic.voiceBase64) return;
    
    if (isPlaying && audioElement) {
      audioElement.pause();
      setIsPlaying(false);
      return;
    }
    
    const audio = playVoiceAudio(topic.voiceBase64);
    audio.onended = () => setIsPlaying(false);
    setAudioElement(audio);
    setIsPlaying(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="glass rounded-xl p-5 card-hover"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 mr-4">
          <h3 className="font-semibold text-sm mb-1 line-clamp-2">{topic.topic}</h3>
          <div className={cn("flex items-center gap-2 text-xs", config.color)}>
            {isProcessing ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <StatusIcon className="w-3 h-3" />
            )}
            <span>{config.label}</span>
          </div>
        </div>
        
        {topic.status === 'pending' && (
          <Button
            size="sm"
            onClick={() => onProcess(topic.id)}
            className="bg-gradient-primary hover:opacity-90 text-primary-foreground"
          >
            <Play className="w-3 h-3 mr-1" />
            Start
          </Button>
        )}
      </div>
      
      {/* Progress indicators */}
      <div className="flex items-center gap-1 mb-4">
        {STEPS.map((step, i) => {
          const stepStatus = getStepStatus(step.key);
          const StepIcon = step.icon;
          
          return (
            <div key={step.key} className="flex items-center">
              <div
                className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center transition-all",
                  stepStatus === 'completed' && "bg-success/20 text-success",
                  stepStatus === 'processing' && "bg-warning/20 text-warning",
                  stepStatus === 'pending' && "bg-muted text-muted-foreground"
                )}
              >
                {stepStatus === 'completed' ? (
                  <Check className="w-3 h-3" />
                ) : stepStatus === 'processing' ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <StepIcon className="w-3 h-3" />
                )}
              </div>
              {i < STEPS.length - 1 && (
                <div 
                  className={cn(
                    "w-4 h-0.5 transition-all",
                    stepStatus === 'completed' ? "bg-success" : "bg-border"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Script preview */}
      {topic.script && (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="w-full mb-2">
              <Eye className="w-3 h-3 mr-1" />
              View Script ({topic.script.split(/\s+/).filter(Boolean).length} words)
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="gradient-text">{topic.topic}</DialogTitle>
            </DialogHeader>
            <div className="mt-4 p-4 rounded-lg bg-muted/50 border border-border">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{topic.script}</p>
            </div>
            <div className="flex justify-between items-center mt-4 text-xs text-muted-foreground">
              <span>{topic.script.split(/\s+/).filter(Boolean).length} words</span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onRegenerate(topic.id, 'script')}
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                Regenerate
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Voice playback */}
      {topic.voiceBase64 && (
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full mb-2"
          onClick={handlePlayVoice}
        >
          {isPlaying ? (
            <>
              <Pause className="w-3 h-3 mr-1" />
              Pause Voice
            </>
          ) : (
            <>
              <Volume2 className="w-3 h-3 mr-1" />
              Play Voice
            </>
          )}
        </Button>
      )}

      {/* Visuals preview */}
      {topic.visuals && topic.visuals.length > 0 && (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="w-full mb-2">
              <Image className="w-3 h-3 mr-1" />
              View Visuals ({topic.visuals.length} assets)
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="gradient-text">Visual Assets</DialogTitle>
            </DialogHeader>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {topic.visuals.map((visual) => (
                <div 
                  key={visual.id} 
                  className="relative aspect-video rounded-lg overflow-hidden bg-muted border border-border group"
                >
                  <img 
                    src={visual.previewUrl} 
                    alt="Visual asset"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="text-center text-white text-xs">
                      <p className="font-medium capitalize">{visual.type}</p>
                      <p className="text-white/70">{visual.source}</p>
                    </div>
                  </div>
                  {visual.type === 'video' && (
                    <div className="absolute top-2 right-2 bg-black/70 rounded px-1.5 py-0.5">
                      <Film className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Render progress */}
      {topic.status === 'video_rendering' && topic.renderProgress !== undefined && (
        <div className="mb-2">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Rendering video...</span>
            <span>{Math.round(topic.renderProgress)}%</span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-primary transition-all duration-300"
              style={{ width: `${topic.renderProgress}%` }}
            />
          </div>
        </div>
      )}
      
      {/* Actions */}
      {topic.status === 'video_complete' && topic.videoUrl && (
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="flex-1" asChild>
            <a href={topic.videoUrl} target="_blank" rel="noopener noreferrer" download>
              <Download className="w-3 h-3 mr-1" />
              Download
            </a>
          </Button>
          <Button size="sm" className="flex-1 bg-gradient-primary hover:opacity-90">
            <Youtube className="w-3 h-3 mr-1" />
            Upload
          </Button>
        </div>
      )}
      
      {topic.status === 'uploaded' && topic.youtubeUrl && (
        <Button size="sm" variant="outline" className="w-full" asChild>
          <a href={topic.youtubeUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="w-3 h-3 mr-1" />
            View on YouTube
          </a>
        </Button>
      )}
      
      {topic.status === 'error' && (
        <div className="space-y-2">
          <p className="text-xs text-destructive">{topic.error}</p>
          <Button size="sm" variant="outline" onClick={() => onRegenerate(topic.id, 'all')}>
            <RotateCcw className="w-3 h-3 mr-1" />
            Retry
          </Button>
        </div>
      )}
    </motion.div>
  );
}
