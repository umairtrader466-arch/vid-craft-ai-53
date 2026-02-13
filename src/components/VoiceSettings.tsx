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
import { Switch } from "@/components/ui/switch";

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

export interface TtsmpVoiceOption {
  value: string;
  label: string;
}

export const TTSMP3_VOICE_OPTIONS: TtsmpVoiceOption[] = [
  { value: "Joanna", label: "Joanna (English - US, Female)" },
  { value: "Ivy", label: "Ivy (English - US, Female)" },
  { value: "Kendra", label: "Kendra (English - US, Female)" },
  { value: "Kimberly", label: "Kimberly (English - US, Female)" },
  { value: "Salli", label: "Salli (English - US, Female)" },
  { value: "Joey", label: "Joey (English - US, Male)" },
  { value: "Justin", label: "Justin (English - US, Male)" },
  { value: "Kevin", label: "Kevin (English - US, Male)" },
  { value: "Matthew", label: "Matthew (English - US, Male)" },
  { value: "Ruth", label: "Ruth (English - US, Female)" },
  { value: "Stephen", label: "Stephen (English - US, Male)" },
  { value: "Brian", label: "Brian (English - UK, Male)" },
  { value: "Amy", label: "Amy (English - UK, Female)" },
  { value: "Emma", label: "Emma (English - UK, Female)" },
  { value: "Arthur", label: "Arthur (English - UK, Male)" },
  { value: "Raveena", label: "Raveena (English - IN, Female)" },
  { value: "Kajal", label: "Kajal (English - IN, Female)" },
  { value: "Niamh", label: "Niamh (English - IE, Female)" },
  { value: "Aria", label: "Aria (English - NZ, Female)" },
  { value: "Ayanda", label: "Ayanda (English - ZA, Female)" },
  { value: "Olivia", label: "Olivia (English - AU, Female)" },
  { value: "Zhiyu", label: "Zhiyu (Chinese, Female)" },
  { value: "Hiujin", label: "Hiujin (Chinese - Cantonese, Female)" },
  { value: "Léa", label: "Léa (French, Female)" },
  { value: "Rémi", label: "Rémi (French, Male)" },
  { value: "Vicki", label: "Vicki (German, Female)" },
  { value: "Daniel", label: "Daniel (German, Male)" },
  { value: "Hans", label: "Hans (German, Male)" },
  { value: "Marlene", label: "Marlene (German, Female)" },
  { value: "Aditi", label: "Aditi (Hindi, Female)" },
  { value: "Kajal_hi", label: "Kajal (Hindi, Female)" },
  { value: "Carla", label: "Carla (Italian, Female)" },
  { value: "Bianca", label: "Bianca (Italian, Female)" },
  { value: "Adriano", label: "Adriano (Italian, Male)" },
  { value: "Takumi", label: "Takumi (Japanese, Male)" },
  { value: "Kazuha", label: "Kazuha (Japanese, Female)" },
  { value: "Tomoko", label: "Tomoko (Japanese, Female)" },
  { value: "Seoyeon", label: "Seoyeon (Korean, Female)" },
  { value: "Lúcia", label: "Lúcia (Portuguese - BR, Female)" },
  { value: "Camila", label: "Camila (Portuguese - BR, Female)" },
  { value: "Vitória", label: "Vitória (Portuguese - BR, Female)" },
  { value: "Inês", label: "Inês (Portuguese - PT, Female)" },
  { value: "Conchita", label: "Conchita (Spanish - ES, Female)" },
  { value: "Lucia", label: "Lucia (Spanish - ES, Female)" },
  { value: "Sergio", label: "Sergio (Spanish - ES, Male)" },
  { value: "Mia", label: "Mia (Spanish - MX, Female)" },
  { value: "Andrés", label: "Andrés (Spanish - MX, Male)" },
  { value: "Lupe", label: "Lupe (Spanish - US, Female)" },
  { value: "Penélope", label: "Penélope (Spanish - US, Female)" },
  { value: "Miguel", label: "Miguel (Spanish - US, Male)" },
  { value: "Pedro", label: "Pedro (Spanish - US, Male)" },
  { value: "Elin", label: "Elin (Swedish, Female)" },
  { value: "Filiz", label: "Filiz (Turkish, Female)" },
  { value: "Burcu", label: "Burcu (Turkish, Female)" },
  { value: "Gwyneth", label: "Gwyneth (Welsh, Female)" },
  { value: "Sofie", label: "Sofie (Danish, Female)" },
  { value: "Suvi", label: "Suvi (Finnish, Female)" },
  { value: "Liv", label: "Liv (Norwegian, Female)" },
  { value: "Ewa", label: "Ewa (Polish, Female)" },
  { value: "Maja", label: "Maja (Polish, Female)" },
  { value: "Jacek", label: "Jacek (Polish, Male)" },
  { value: "Jan", label: "Jan (Polish, Male)" },
  { value: "Ola", label: "Ola (Polish, Female)" },
  { value: "Ruben", label: "Ruben (Dutch, Male)" },
  { value: "Lotte", label: "Lotte (Dutch, Female)" },
  { value: "Laura_nl", label: "Laura (Dutch, Female)" },
  { value: "Carmen", label: "Carmen (Romanian, Female)" },
  { value: "Tatyana", label: "Tatyana (Russian, Female)" },
  { value: "Maxim", label: "Maxim (Russian, Male)" },
  { value: "Astrid", label: "Astrid (Swedish, Female)" },
  { value: "Celine", label: "Céline (French, Female)" },
  { value: "Mathieu", label: "Mathieu (French, Male)" },
  { value: "Chantal", label: "Chantal (French - CA, Female)" },
  { value: "Gabrielle", label: "Gabrielle (French - CA, Female)" },
  { value: "Liam_fr", label: "Liam (French - CA, Male)" },
];

export type VoiceProvider = 'elevenlabs' | 'ttsmp3';

interface VoiceSettingsProps {
  selectedVoice: string;
  onVoiceChange: (voiceId: string) => void;
  voiceProvider: VoiceProvider;
  onProviderChange: (provider: VoiceProvider) => void;
  selectedTtsmp3Voice: string;
  onTtsmp3VoiceChange: (voice: string) => void;
}

export function VoiceSettings({ 
  selectedVoice, 
  onVoiceChange, 
  voiceProvider, 
  onProviderChange,
  selectedTtsmp3Voice,
  onTtsmp3VoiceChange,
}: VoiceSettingsProps) {
  const selectedVoiceOption = VOICE_OPTIONS.find(v => v.id === selectedVoice);
  const useElevenLabs = voiceProvider === 'elevenlabs';

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
        {/* Provider Toggle */}
        <div className="flex items-center justify-between">
          <Label htmlFor="elevenlabs-toggle" className="text-xs text-muted-foreground">
            Use ElevenLabs
          </Label>
          <Switch 
            id="elevenlabs-toggle" 
            checked={useElevenLabs}
            onCheckedChange={(checked) => onProviderChange(checked ? 'elevenlabs' : 'ttsmp3')}
          />
        </div>

        {useElevenLabs ? (
          /* ElevenLabs voice selector */
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
        ) : (
          /* TTSMP3 voice selector */
          <div className="space-y-2">
            <Label htmlFor="ttsmp3-voice-select" className="text-xs text-muted-foreground">
              TTSMP3 Narrator Voice
            </Label>
            <Select value={selectedTtsmp3Voice} onValueChange={onTtsmp3VoiceChange}>
              <SelectTrigger id="ttsmp3-voice-select" className="w-full bg-background/50">
                <SelectValue placeholder="Select a voice" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {TTSMP3_VOICE_OPTIONS.map((voice) => (
                  <SelectItem key={voice.value} value={voice.value}>
                    {voice.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[10px] text-muted-foreground">Free TTS via ttsmp3.com — no API key needed</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
