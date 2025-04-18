
import React from 'react';
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
  availableLanguages: string[];
  onVoiceChange: (voice: string) => void;
  onLanguageChange: (language: string) => void;
}

const VoiceSettings = ({
  voices,
  selectedVoice,
  selectedLanguage,
  availableLanguages,
  onVoiceChange,
  onLanguageChange,
}: VoiceSettingsProps) => {
  if (voices.length === 0) return null;

  // Group voices by language
  const voicesByLanguage = voices.reduce((acc: { [key: string]: SpeechSynthesisVoice[] }, voice) => {
    const lang = voice.lang;
    if (!acc[lang]) {
      acc[lang] = [];
    }
    acc[lang].push(voice);
    return acc;
  }, {});

  const getLanguageLabel = (langCode: string) => {
    try {
      return new Intl.DisplayNames([navigator.language], { type: 'language' }).of(langCode.split('-')[0]) || langCode;
    } catch {
      return langCode;
    }
  };

  return (
    <div className="flex flex-wrap gap-4">
      <div className="w-full max-w-xs">
        <label className="block text-sm font-medium mb-1">Language</label>
        <Select value={selectedLanguage} onValueChange={onLanguageChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select language" />
          </SelectTrigger>
          <SelectContent>
            {availableLanguages.map((lang) => {
              const label = getLanguageLabel(lang);
              const voicesCount = voicesByLanguage[lang]?.length || 0;
              return (
                <SelectItem key={lang} value={lang}>
                  {`${label} (${voicesCount} ${voicesCount === 1 ? 'voice' : 'voices'})`}
                </SelectItem>
              );
            })}
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
            {voices
              .filter(voice => voice.lang === selectedLanguage)
              .map((voice) => (
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
