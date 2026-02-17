import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Youtube, ExternalLink, Film, Calendar, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";

interface UploadedVideo {
  id: string;
  topic: string;
  youtube_url: string | null;
  video_url: string | null;
  status: string;
  created_at: string;
  scheduled_at: string | null;
}

export function MyVideosTab() {
  const { user } = useAuth();
  const [videos, setVideos] = useState<UploadedVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!user) return;
    const fetchVideos = async () => {
      const { data } = await supabase
        .from('video_topics')
        .select('id, topic, youtube_url, video_url, status, created_at, scheduled_at')
        .in('status', ['uploaded', 'video_complete'])
        .order('created_at', { ascending: false });

      setVideos(data || []);
      setLoading(false);
    };
    fetchVideos();
  }, [user]);

  const filtered = videos.filter(v =>
    v.topic.toLowerCase().includes(search.toLowerCase())
  );

  const uploadedCount = videos.filter(v => v.youtube_url).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Film className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">Total Videos</span>
          </div>
          <p className="text-2xl font-bold">{videos.length}</p>
        </div>
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Youtube className="w-4 h-4 text-red-500" />
            <span className="text-xs text-muted-foreground">On YouTube</span>
          </div>
          <p className="text-2xl font-bold">{uploadedCount}</p>
        </div>
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Film className="w-4 h-4 text-success" />
            <span className="text-xs text-muted-foreground">Ready to Upload</span>
          </div>
          <p className="text-2xl font-bold">{videos.length - uploadedCount}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search videos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-secondary/50"
        />
      </div>

      {/* Video list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="glass rounded-xl p-4 shimmer h-20" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center">
          <Film className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-semibold mb-1">No videos yet</h3>
          <p className="text-sm text-muted-foreground">
            Create your first video from the Create tab
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((video, i) => (
            <motion.div
              key={video.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass rounded-xl p-4 card-hover"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0 mr-4">
                  <h4 className="font-medium text-sm truncate">{video.topic}</h4>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(video.created_at), 'MMM d, yyyy')}
                    </span>
                    <Badge variant={video.youtube_url ? "default" : "secondary"} className="text-[10px]">
                      {video.youtube_url ? "On YouTube" : "Local Only"}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  {video.video_url && (
                    <Button size="sm" variant="outline" asChild>
                      <a href={video.video_url} target="_blank" rel="noopener noreferrer">
                        <Film className="w-3 h-3" />
                      </a>
                    </Button>
                  )}
                  {video.youtube_url && (
                    <Button size="sm" variant="outline" className="text-red-500" asChild>
                      <a href={video.youtube_url} target="_blank" rel="noopener noreferrer">
                        <Youtube className="w-3 h-3 mr-1" />
                        View
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
