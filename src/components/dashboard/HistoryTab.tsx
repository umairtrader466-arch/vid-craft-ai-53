import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Clock, FileText, Mic, Image, Film, Youtube, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import type { VideoStatus } from "@/types/video";

interface HistoryItem {
  id: string;
  topic: string;
  status: string;
  created_at: string;
  updated_at: string;
  youtube_url: string | null;
  video_url: string | null;
}

const STATUS_DISPLAY: Record<string, { label: string; icon: React.ElementType; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pending", icon: Clock, variant: "secondary" },
  script_generating: { label: "Writing Script", icon: FileText, variant: "outline" },
  script_complete: { label: "Script Done", icon: FileText, variant: "default" },
  voice_generating: { label: "Generating Voice", icon: Mic, variant: "outline" },
  voice_complete: { label: "Voice Done", icon: Mic, variant: "default" },
  visuals_fetching: { label: "Fetching Visuals", icon: Image, variant: "outline" },
  visuals_complete: { label: "Visuals Done", icon: Image, variant: "default" },
  video_rendering: { label: "Rendering", icon: Film, variant: "outline" },
  video_complete: { label: "Video Ready", icon: Film, variant: "default" },
  uploading: { label: "Uploading", icon: Youtube, variant: "outline" },
  uploaded: { label: "Uploaded", icon: CheckCircle, variant: "default" },
  error: { label: "Error", icon: AlertCircle, variant: "destructive" },
};

export function HistoryTab() {
  const { user } = useAuth();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchHistory = async () => {
      const { data } = await supabase
        .from('video_topics')
        .select('id, topic, status, created_at, updated_at, youtube_url, video_url')
        .order('updated_at', { ascending: false });

      setItems(data || []);
      setLoading(false);
    };
    fetchHistory();
  }, [user]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="flex items-center gap-2 mb-2">
        <Clock className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">Activity History</h2>
        <Badge variant="secondary" className="ml-auto">{items.length} total</Badge>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="glass rounded-xl p-4 shimmer h-16" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center">
          <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-semibold mb-1">No activity yet</h3>
          <p className="text-sm text-muted-foreground">Your processing history will appear here</p>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-5 top-6 bottom-6 w-px bg-border" />

          <div className="space-y-3">
            {items.map((item, i) => {
              const display = STATUS_DISPLAY[item.status] || STATUS_DISPLAY.pending;
              const Icon = display.icon;
              const isActive = item.status.includes('generating') || item.status.includes('fetching') || item.status === 'video_rendering' || item.status === 'uploading';

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-start gap-4 pl-2"
                >
                  <div className="relative z-10 w-7 h-7 rounded-full bg-secondary flex items-center justify-center border border-border shrink-0 mt-1">
                    {isActive ? (
                      <Loader2 className="w-3 h-3 text-warning animate-spin" />
                    ) : (
                      <Icon className="w-3 h-3 text-muted-foreground" />
                    )}
                  </div>
                  <div className="glass rounded-xl p-3 flex-1 card-hover">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-medium text-sm truncate flex-1">{item.topic}</h4>
                      <Badge variant={display.variant} className="text-[10px] shrink-0">
                        {display.label}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {format(new Date(item.updated_at), 'MMM d, yyyy · h:mm a')}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
}
