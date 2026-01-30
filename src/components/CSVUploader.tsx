import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, X, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Papa from "papaparse";
import type { VideoTopic } from "@/types/video";

interface CSVUploaderProps {
  onTopicsLoaded: (topics: VideoTopic[]) => void;
}

export function CSVUploader({ onTopicsLoaded }: CSVUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

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

        setFile(file);
        onTopicsLoaded(topics);
      },
      error: (err) => {
        setIsProcessing(false);
        setError(`Failed to parse CSV: ${err.message}`);
        setFile(null);
      },
    });
  }, [onTopicsLoaded]);

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
    onTopicsLoaded(sampleTopics);
    setFile(new File(["sample"], "sample-topics.csv", { type: "text/csv" }));
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
    </motion.div>
  );
}
