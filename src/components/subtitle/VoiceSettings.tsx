
import React from 'react';
import { Languages } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface VoiceSettingsProps {
  voices: SpeechSynthesisVoice[];
  selectedVoice: string;
  selectedLanguage: string;
  languageOptions: {
    code: string;
    name: string;
    voices: SpeechSynthesisVoice[];
  }[];
  onVoiceChange: (voice: string) => void;
  onLanguageChange: (language: string) => void;
}

const VoiceSettings = ({
  voices,
  selectedVoice,
  selectedLanguage,
  languageOptions,
  onVoiceChange,
  onLanguageChange,
}: VoiceSettingsProps) => {
  if (voices.length === 0) return null;

  const currentLanguage = languageOptions.find(lang => lang.code === selectedLanguage);
  const availableVoices = currentLanguage?.voices || [];

  return (
    <div className="flex flex-wrap gap-4">
      <div className="w-full max-w-xs">
        <label className="block text-sm font-medium mb-1">Language</label>
        <Select value={selectedLanguage} onValueChange={onLanguageChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select language">
              <div className="flex items-center gap-2">
                <Languages className="h-4 w-4" />
                <span>
                  {currentLanguage?.name} ({currentLanguage?.voices.length || 0} voices)
                </span>
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {languageOptions.map((lang) => (
              <SelectItem key={lang.code} value={lang.code}>
                <div className="flex items-center gap-2">
                  <Languages className="h-4 w-4" />
                  <span>{lang.name} ({lang.voices.length} voices)</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="w-full max-w-xs">
        <label className="block text-sm font-medium mb-1">Voice</label>
        <Select value={selectedVoice} onValueChange={onVoiceChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select voice" />
          </SelectTrigger>
          <SelectContent>
            {availableVoices.map((voice) => (
              <SelectItem 
                key={voice.name} 
                value={voice.name}
              >
                {`${voice.name} (${voice.localService ? 'Local' : 'Remote'})`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default VoiceSettings;
