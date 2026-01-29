import { motion } from "framer-motion";
import { Mic, Volume2 } from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export interface VoiceOption {
  id: string;
  name: string;
  description: string;
  gender: 'male' | 'female';
}

export const VOICE_OPTIONS: VoiceOption[] = [
  { id: 'george', name: 'George', description: 'Deep, authoritative male', gender: 'male' },
  { id: 'brian', name: 'Brian', description: 'Warm, friendly male', gender: 'male' },
  { id: 'daniel', name: 'Daniel', description: 'Clear, professional male', gender: 'male' },
  { id: 'liam', name: 'Liam', description: 'Energetic, youthful male', gender: 'male' },
  { id: 'chris', name: 'Chris', description: 'Casual, conversational male', gender: 'male' },
  { id: 'eric', name: 'Eric', description: 'Smooth, confident male', gender: 'male' },
  { id: 'will', name: 'Will', description: 'Engaging narrator male', gender: 'male' },
  { id: 'charlie', name: 'Charlie', description: 'Versatile, expressive male', gender: 'male' },
  { id: 'sarah', name: 'Sarah', description: 'Natural, warm female', gender: 'female' },
  { id: 'laura', name: 'Laura', description: 'Professional, clear female', gender: 'female' },
  { id: 'alice', name: 'Alice', description: 'Friendly, approachable female', gender: 'female' },
  { id: 'matilda', name: 'Matilda', description: 'Sophisticated, elegant female', gender: 'female' },
  { id: 'jessica', name: 'Jessica', description: 'Energetic, vibrant female', gender: 'female' },
  { id: 'lily', name: 'Lily', description: 'Soft, soothing female', gender: 'female' },
  { id: 'river', name: 'River', description: 'Modern, dynamic neutral', gender: 'female' },
];

interface VoiceSettingsProps {
  selectedVoice: string;
  onVoiceChange: (voiceId: string) => void;
}

export function VoiceSettings({ selectedVoice, onVoiceChange }: VoiceSettingsProps) {
  const selectedVoiceOption = VOICE_OPTIONS.find(v => v.id === selectedVoice);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-xl p-4"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <Mic className="w-4 h-4 text-primary" />
        </div>
        <h3 className="font-semibold text-sm">Voice Settings</h3>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="voice-select" className="text-xs text-muted-foreground">
            Narrator Voice
          </Label>
          <Select value={selectedVoice} onValueChange={onVoiceChange}>
            <SelectTrigger id="voice-select" className="w-full bg-background/50">
              <SelectValue placeholder="Select a voice" />
            </SelectTrigger>
            <SelectContent>
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                Male Voices
              </div>
              {VOICE_OPTIONS.filter(v => v.gender === 'male').map((voice) => (
                <SelectItem key={voice.id} value={voice.id}>
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-3 h-3 text-muted-foreground" />
                    <span>{voice.name}</span>
                    <span className="text-xs text-muted-foreground">
                      – {voice.description}
                    </span>
                  </div>
                </SelectItem>
              ))}
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground mt-1">
                Female Voices
              </div>
              {VOICE_OPTIONS.filter(v => v.gender === 'female').map((voice) => (
                <SelectItem key={voice.id} value={voice.id}>
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-3 h-3 text-muted-foreground" />
                    <span>{voice.name}</span>
                    <span className="text-xs text-muted-foreground">
                      – {voice.description}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedVoiceOption && (
          <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center">
                <span className="text-xs font-bold text-primary-foreground">
                  {selectedVoiceOption.name.charAt(0)}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium">{selectedVoiceOption.name}</p>
                <p className="text-xs text-muted-foreground">{selectedVoiceOption.description}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
