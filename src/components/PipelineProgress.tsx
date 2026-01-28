import { motion } from "framer-motion";
import { Check, Loader2, Circle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PipelineStep } from "@/types/video";

interface PipelineProgressProps {
  steps: PipelineStep[];
}

export function PipelineProgress({ steps }: PipelineProgressProps) {
  const getStepIcon = (status: PipelineStep['status']) => {
    switch (status) {
      case 'completed':
        return <Check className="w-4 h-4" />;
      case 'processing':
        return <Loader2 className="w-4 h-4 animate-spin" />;
      case 'error':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Circle className="w-4 h-4" />;
    }
  };

  const getStepStyles = (status: PipelineStep['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-success text-success-foreground';
      case 'processing':
        return 'bg-warning text-warning-foreground animate-pulse';
      case 'error':
        return 'bg-destructive text-destructive-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="glass rounded-xl p-6"
    >
      <h2 className="text-lg font-semibold mb-6">Pipeline Progress</h2>
      
      <div className="flex items-center justify-between relative">
        {/* Connection line */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-border -z-10" />
        
        {steps.map((step, index) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="flex flex-col items-center gap-2 relative z-10"
          >
            <div
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                getStepStyles(step.status)
              )}
            >
              {getStepIcon(step.status)}
            </div>
            <div className="text-center max-w-20">
              <p className="text-xs font-medium truncate">{step.label}</p>
              <p className="text-[10px] text-muted-foreground truncate">{step.description}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
