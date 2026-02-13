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
  // Arabic
  { value: "Zeina", label: "🌍 Zeina (Arabic)" },
  // Australian English
  { value: "Nicole", label: "🇦🇺 Nicole (Australian English, Female)" },
  { value: "Russell", label: "🇦🇺 Russell (Australian English, Male)" },
  // Brazilian Portuguese
  { value: "Ricardo", label: "🇧🇷 Ricardo (Brazilian Portuguese, Male)" },
  { value: "Camila", label: "🇧🇷 Camila (Brazilian Portuguese, Female)" },
  { value: "Vitória", label: "🇧🇷 Vitória (Brazilian Portuguese, Female)" },
  // British English
  { value: "Brian", label: "🇬🇧 Brian (British English, Male)" },
  { value: "Amy", label: "🇬🇧 Amy (British English, Female)" },
  { value: "Emma", label: "🇬🇧 Emma (British English, Female)" },
  // Canadian French
  { value: "Chantal", label: "🇨🇦 Chantal (Canadian French, Female)" },
  // Castilian Spanish
  { value: "Enrique", label: "🇪🇸 Enrique (Castilian Spanish, Male)" },
  { value: "Lucia", label: "🇪🇸 Lucia (Castilian Spanish, Female)" },
  { value: "Conchita", label: "🇪🇸 Conchita (Castilian Spanish, Female)" },
  // Chinese Mandarin
  { value: "Zhiyu", label: "🇨🇳 Zhiyu (Chinese Mandarin, Female)" },
  // Danish
  { value: "Naja", label: "🇩🇰 Naja (Danish, Female)" },
  { value: "Mads", label: "🇩🇰 Mads (Danish, Male)" },
  // Dutch
  { value: "Ruben", label: "🇳🇱 Ruben (Dutch, Male)" },
  { value: "Lotte", label: "🇳🇱 Lotte (Dutch, Female)" },
  // French
  { value: "Mathieu", label: "🇫🇷 Mathieu (French, Male)" },
  { value: "Celine", label: "🇫🇷 Céline (French, Female)" },
  { value: "Léa", label: "🇫🇷 Léa (French, Female)" },
  // German
  { value: "Vicki", label: "🇩🇪 Vicki (German, Female)" },
  { value: "Marlene", label: "🇩🇪 Marlene (German, Female)" },
  { value: "Hans", label: "🇩🇪 Hans (German, Male)" },
  // Icelandic
  { value: "Karl", label: "🇮🇸 Karl (Icelandic, Male)" },
  { value: "Dóra", label: "🇮🇸 Dóra (Icelandic, Female)" },
  // Indian English
  { value: "Aditi", label: "🇮🇳 Aditi (Indian English, Female)" },
  { value: "Raveena", label: "🇮🇳 Raveena (Indian English, Female)" },
  // Italian
  { value: "Giorgio", label: "🇮🇹 Giorgio (Italian, Male)" },
  { value: "Carla", label: "🇮🇹 Carla (Italian, Female)" },
  { value: "Bianca", label: "🇮🇹 Bianca (Italian, Female)" },
  // Japanese
  { value: "Takumi", label: "🇯🇵 Takumi (Japanese, Male)" },
  { value: "Mizuki", label: "🇯🇵 Mizuki (Japanese, Female)" },
  // Korean
  { value: "Seoyeon", label: "🇰🇷 Seoyeon (Korean, Female)" },
  // Mexican Spanish
  { value: "Mia", label: "🇲🇽 Mia (Mexican Spanish, Female)" },
  // Norwegian
  { value: "Liv", label: "🇳🇴 Liv (Norwegian, Female)" },
  // Polish
  { value: "Jan", label: "🇵🇱 Jan (Polish, Male)" },
  { value: "Maja", label: "🇵🇱 Maja (Polish, Female)" },
  { value: "Ewa", label: "🇵🇱 Ewa (Polish, Female)" },
  { value: "Jacek", label: "🇵🇱 Jacek (Polish, Male)" },
  // Portuguese
  { value: "Cristiano", label: "🇵🇹 Cristiano (Portuguese, Male)" },
  { value: "Inês", label: "🇵🇹 Inês (Portuguese, Female)" },
  // Romanian
  { value: "Carmen", label: "🇷🇴 Carmen (Romanian, Female)" },
  // Russian
  { value: "Tatyana", label: "🇷🇺 Tatyana (Russian, Female)" },
  { value: "Maxim", label: "🇷🇺 Maxim (Russian, Male)" },
  // Swedish
  { value: "Astrid", label: "🇸🇪 Astrid (Swedish, Female)" },
  // Turkish
  { value: "Filiz", label: "🇹🇷 Filiz (Turkish, Female)" },
  // US English
  { value: "Kimberly", label: "🇺🇸 Kimberly (US English, Female)" },
  { value: "Ivy", label: "🇺🇸 Ivy (US English, Female)" },
  { value: "Kendra", label: "🇺🇸 Kendra (US English, Female)" },
  { value: "Justin", label: "🇺🇸 Justin (US English, Male)" },
  { value: "Joey", label: "🇺🇸 Joey (US English, Male)" },
  { value: "Matthew", label: "🇺🇸 Matthew (US English, Male)" },
  { value: "Salli", label: "🇺🇸 Salli (US English, Female)" },
  { value: "Joanna", label: "🇺🇸 Joanna (US English, Female)" },
  // US Spanish
  { value: "Penélope", label: "🇺🇸 Penélope (US Spanish, Female)" },
  { value: "Lupe", label: "🇺🇸 Lupe (US Spanish, Female)" },
  { value: "Miguel", label: "🇺🇸 Miguel (US Spanish, Male)" },
  // Welsh
  { value: "Gwyneth", label: "🏴 Gwyneth (Welsh, Female)" },
  // Welsh English
  { value: "Geraint", label: "🏴 Geraint (Welsh English, Male)" },
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
