
import { useState, useEffect } from 'react';
import { Languages } from 'lucide-react';

interface LanguageInfo {
  code: string;
  name: string;
  voices: SpeechSynthesisVoice[];
}

export const useVoiceManagement = () => {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [languageOptions, setLanguageOptions] = useState<LanguageInfo[]>([]);

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      if (availableVoices.length > 0) {
        setVoices(availableVoices);
        
        // Group voices by language
        const languageMap = new Map<string, LanguageInfo>();
        
        availableVoices.forEach(voice => {
          const langCode = voice.lang;
          if (!languageMap.has(langCode)) {
            try {
              const name = new Intl.DisplayNames([navigator.language], { type: 'language' })
                .of(langCode.split('-')[0]) || langCode;
              languageMap.set(langCode, {
                code: langCode,
                name: name,
                voices: []
              });
            } catch {
              languageMap.set(langCode, {
                code: langCode,
                name: langCode,
                voices: []
              });
            }
          }
          languageMap.get(langCode)?.voices.push(voice);
        });

        // Convert map to sorted array
        const sortedLanguages = Array.from(languageMap.values())
          .sort((a, b) => a.name.localeCompare(b.name));

        setLanguageOptions(sortedLanguages);

        // Set default language and voice
        const defaultLang = sortedLanguages.find(lang => 
          lang.code.startsWith(navigator.language) ||
          lang.code.startsWith('en')
        );

        if (defaultLang) {
          setSelectedLanguage(defaultLang.code);
          const defaultVoice = defaultLang.voices.find(v => v.default) || defaultLang.voices[0];
          setSelectedVoice(defaultVoice.name);
        } else if (sortedLanguages.length > 0) {
          setSelectedLanguage(sortedLanguages[0].code);
          setSelectedVoice(sortedLanguages[0].voices[0].name);
        }
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  return {
    voices,
    selectedVoice,
    setSelectedVoice,
    selectedLanguage,
    setSelectedLanguage,
    languageOptions
  };
};
