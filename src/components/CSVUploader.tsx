import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, X, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Papa from "papaparse";
import { addDays, addHours, setHours, setMinutes } from "date-fns";
import { ScheduleDialog, type ScheduleConfig } from "./ScheduleDialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import type { VideoTopic } from "@/types/video";

interface CSVUploaderProps {
  onTopicsLoaded: (topics: VideoTopic[], videoDuration: number) => void;
  minDuration?: number;
  maxDuration?: number;
  defaultDuration?: number;
}

export function CSVUploader({ onTopicsLoaded, minDuration, maxDuration, defaultDuration }: CSVUploaderProps) {
  const { user } = useAuth();
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [pendingTopics, setPendingTopics] = useState<VideoTopic[]>([]);

  const processCSV = useCallback((file: File) => {
    setIsProcessing(true);
    setError(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setIsProcessing(false);
        
        const data = results.data as Record<string, string>[];
        
        // Check if 'topic' column exists
        if (data.length === 0 || !data[0].hasOwnProperty('topic')) {
          setError("CSV must contain a 'topic' column");
          setFile(null);
          return;
        }

        // Validate and transform data
        const topics: VideoTopic[] = data
          .filter(row => row.topic && row.topic.trim())
          .map((row, index) => ({
            id: `topic-${Date.now()}-${index}`,
            topic: row.topic.trim(),
            status: 'pending' as const,
            createdAt: new Date(),
          }));

        if (topics.length === 0) {
          setError("No valid topics found in CSV");
          setFile(null);
          return;
        }

        // Store topics temporarily and show schedule dialog
        setPendingTopics(topics);
        setFile(file);
        setShowScheduleDialog(true);
      },
      error: (err) => {
        setIsProcessing(false);
        setError(`Failed to parse CSV: ${err.message}`);
        setFile(null);
      },
    });
  }, []);

  const handleScheduleConfirm = useCallback(async (config: ScheduleConfig) => {
    const chosenDuration = config.videoDuration;
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to save topics",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    setShowScheduleDialog(false);

    // Calculate scheduled times for each topic
    const [hours, minutes] = config.startTime.split(":").map(Number);
    const baseDate = setMinutes(setHours(config.startDate, hours), minutes);

    const topicsWithSchedule = pendingTopics.map((topic, index) => {
      const dayIndex = Math.floor(index / config.videosPerDay);
      const videoIndexInDay = index % config.videosPerDay;
      const scheduledAt = addHours(
        addDays(baseDate, dayIndex),
        videoIndexInDay * config.hoursBetweenVideos
      );

      return {
        user_id: user.id,
        topic: topic.topic,
        status: 'pending',
        scheduled_at: scheduledAt.toISOString(),
        script_duration_minutes: Math.round(chosenDuration / 60),
      };
    });

    try {
      const { data, error: insertError } = await supabase
        .from('video_topics')
        .insert(topicsWithSchedule)
        .select();

      if (insertError) throw insertError;

      // Update local state with database IDs
      const savedTopics: VideoTopic[] = (data || []).map((row) => ({
        id: row.id,
        topic: row.topic,
        status: row.status as VideoTopic['status'],
        createdAt: new Date(row.created_at),
        scheduledAt: row.scheduled_at ? new Date(row.scheduled_at) : undefined,
        durationSeconds: row.script_duration_minutes ? row.script_duration_minutes * 60 : chosenDuration,
      }));

      onTopicsLoaded(savedTopics, chosenDuration);
      toast({
        title: "Topics saved!",
        description: `${savedTopics.length} topics scheduled for publishing`,
      });
    } catch (err) {
      console.error('Error saving topics:', err);
      toast({
        title: "Error saving topics",
        description: err instanceof Error ? err.message : "Please try again",
        variant: "destructive",
      });
      setFile(null);
    } finally {
      setIsSaving(false);
      setPendingTopics([]);
    }
  }, [user, pendingTopics, onTopicsLoaded]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile?.type === 'text/csv' || droppedFile?.name.endsWith('.csv')) {
      processCSV(droppedFile);
    } else {
      setError("Please upload a CSV file");
    }
  }, [processCSV]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processCSV(selectedFile);
    }
  }, [processCSV]);

  const clearFile = () => {
    setFile(null);
    setError(null);
  };

  const loadSampleTopics = () => {
    const sampleTopics: VideoTopic[] = [
      {
        id: `sample-${Date.now()}-1`,
        topic: "5 Tips for Better Sleep",
        status: 'pending',
        createdAt: new Date(),
      }
    ];
    setPendingTopics(sampleTopics);
    setFile(new File(["sample"], "sample-topics.csv", { type: "text/csv" }));
    setShowScheduleDialog(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="glass rounded-xl p-6"
    >
      <h2 className="text-lg font-semibold mb-4">Upload Topics</h2>
      
      <AnimatePresence mode="wait">
        {!file ? (
          <motion.div
            key="uploader"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <label
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={cn(
                "upload-zone flex flex-col items-center justify-center p-8 rounded-lg cursor-pointer transition-all",
                isDragging && "dragging"
              )}
            >
              <input
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              <motion.div
                animate={isProcessing ? { rotate: 360 } : { rotate: 0 }}
                transition={{ duration: 1, repeat: isProcessing ? Infinity : 0, ease: "linear" }}
                className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center mb-4"
              >
                <Upload className="w-6 h-6 text-primary" />
              </motion.div>
              
              <p className="text-sm font-medium mb-1">
                {isProcessing ? "Processing..." : "Drop your CSV file here"}
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                or click to browse
              </p>
              
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                <FileText className="w-3 h-3" />
                <span>CSV with 'topic' column required</span>
              </div>
              
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  loadSampleTopics();
                }}
                className="text-xs"
              >
                Load Sample Topic
              </Button>
            </label>
            
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 mt-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex items-center justify-between p-4 rounded-lg bg-success/10 border border-success/20"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center">
                <Check className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">File uploaded successfully</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={clearFile}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <ScheduleDialog
        open={showScheduleDialog}
        onOpenChange={(open) => {
          setShowScheduleDialog(open);
          if (!open && pendingTopics.length > 0) {
            setFile(null);
            setPendingTopics([]);
          }
        }}
        topicsCount={pendingTopics.length}
        onConfirm={handleScheduleConfirm}
        minDuration={minDuration}
        maxDuration={maxDuration}
        defaultDuration={defaultDuration}
      />

      {isSaving && (
        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
          Saving topics to database...
        </div>
      )}
    </motion.div>
  );
}
