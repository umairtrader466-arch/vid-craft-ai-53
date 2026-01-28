import { motion } from "framer-motion";
import { Video, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { VideoTopic } from "@/types/video";

interface StatsBarProps {
  topics: VideoTopic[];
}

export function StatsBar({ topics }: StatsBarProps) {
  const total = topics.length;
  const completed = topics.filter(t => t.status === 'uploaded' || t.status === 'video_complete').length;
  const processing = topics.filter(t => 
    t.status !== 'pending' && 
    t.status !== 'uploaded' && 
    t.status !== 'video_complete' &&
    t.status !== 'error'
  ).length;
  const errors = topics.filter(t => t.status === 'error').length;

  const stats = [
    { label: 'Total Topics', value: total, icon: Video, color: 'text-primary' },
    { label: 'Processing', value: processing, icon: Clock, color: 'text-warning' },
    { label: 'Completed', value: completed, icon: CheckCircle, color: 'text-success' },
    { label: 'Errors', value: errors, icon: AlertCircle, color: 'text-destructive' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
      className="grid grid-cols-2 md:grid-cols-4 gap-4"
    >
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.15 + index * 0.05 }}
            className="glass rounded-xl p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <Icon className={cn("w-5 h-5", stat.color)} />
              <span className={cn("text-2xl font-bold", stat.color)}>{stat.value}</span>
            </div>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
