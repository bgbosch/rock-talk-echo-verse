
import React from 'react';

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

  return (
    <div className="flex flex-wrap gap-4">
      <div className="w-full max-w-xs">
        <label className="block text-sm font-medium mb-1">Language</label>
        <select
          className="w-full rounded-md border border-gray-300 p-2"
          value={selectedLanguage}
          onChange={(e) => onLanguageChange(e.target.value)}
        >
          {availableLanguages.map((lang) => (
            <option key={lang} value={lang}>
              {lang}
            </option>
          ))}
        </select>
      </div>
      <div className="w-full max-w-xs">
        <label className="block text-sm font-medium mb-1">Voice</label>
        <select
          className="w-full rounded-md border border-gray-300 p-2"
          value={selectedVoice}
          onChange={(e) => onVoiceChange(e.target.value)}
        >
          {voices
            .filter(voice => voice.lang === selectedLanguage)
            .map((voice) => (
              <option key={voice.name} value={voice.name}>
                {voice.name}
              </option>
            ))}
        </select>
      </div>
    </div>
  );
};

export default VoiceSettings;
