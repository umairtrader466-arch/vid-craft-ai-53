import { motion } from "framer-motion";
import { Settings, Youtube, Mic, Video, Info } from "lucide-react";
import { VoiceSettings, VoiceProvider } from "@/components/VoiceSettings";
import { YouTubeConnect } from "@/components/YouTubeConnect";
import { useAppSettings } from "@/hooks/useAppSettings";
import { Badge } from "@/components/ui/badge";

interface SettingsTabProps {
  selectedVoice: string;
  onVoiceChange: (v: string) => void;
  voiceProvider: VoiceProvider;
  onProviderChange: (p: VoiceProvider) => void;
  selectedTtsmp3Voice: string;
  onTtsmp3VoiceChange: (v: string) => void;
  youtubePrivacy: 'public' | 'unlisted';
  onPrivacyChange: (p: 'public' | 'unlisted') => void;
}

export function SettingsTab({
  selectedVoice,
  onVoiceChange,
  voiceProvider,
  onProviderChange,
  selectedTtsmp3Voice,
  onTtsmp3VoiceChange,
  youtubePrivacy,
  onPrivacyChange,
}: SettingsTabProps) {
  const { settings, userLimits, videosRemaining } = useAppSettings();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-2xl mx-auto"
    >
      {/* Account overview */}
      <div className="glass rounded-xl p-6">
        <h3 className="font-semibold flex items-center gap-2 mb-4">
          <Info className="w-4 h-4 text-primary" />
          Account Overview
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
            <p className="text-xs text-muted-foreground mb-1">Monthly Limit</p>
            <p className="text-lg font-bold">{userLimits.monthlyVideoLimit} videos</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
            <p className="text-xs text-muted-foreground mb-1">Remaining</p>
            <p className="text-lg font-bold text-primary">{videosRemaining} videos</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
            <p className="text-xs text-muted-foreground mb-1">Status</p>
            <Badge variant={userLimits.isBanned ? "destructive" : "default"}>
              {userLimits.isBanned ? "Suspended" : "Active"}
            </Badge>
          </div>
          <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
            <p className="text-xs text-muted-foreground mb-1">ElevenLabs</p>
            <Badge variant={settings.elevenlabsEnabled ? "default" : "secondary"}>
              {settings.elevenlabsEnabled ? "Enabled" : "Disabled"}
            </Badge>
          </div>
        </div>
      </div>

      {/* Voice + YouTube side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-semibold flex items-center gap-2 mb-3">
            <Mic className="w-4 h-4 text-primary" />
            Voice Configuration
          </h3>
          <VoiceSettings
            selectedVoice={selectedVoice}
            onVoiceChange={onVoiceChange}
            voiceProvider={settings.elevenlabsEnabled ? voiceProvider : 'ttsmp3'}
            onProviderChange={onProviderChange}
            selectedTtsmp3Voice={selectedTtsmp3Voice}
            onTtsmp3VoiceChange={onTtsmp3VoiceChange}
            elevenlabsEnabled={settings.elevenlabsEnabled}
          />
        </div>
        <div>
          <h3 className="font-semibold flex items-center gap-2 mb-3">
            <Youtube className="w-4 h-4 text-red-500" />
            YouTube Connection
          </h3>
          <YouTubeConnect
            privacyStatus={youtubePrivacy}
            onPrivacyChange={onPrivacyChange}
          />
        </div>
      </div>
    </motion.div>
  );
}
