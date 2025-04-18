
import { useState, useEffect } from 'react';

export const useVoiceManagement = () => {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [availableLanguages, setAvailableLanguages] = useState<string[]>([]);

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      if (availableVoices.length > 0) {
        setVoices(availableVoices);
        
        // Get unique languages and sort them
        const languages = [...new Set(availableVoices.map(voice => voice.lang))].sort((a, b) => {
          try {
            return new Intl.DisplayNames([navigator.language], { type: 'language' })
              .of(a.split('-')[0])?.localeCompare(
                new Intl.DisplayNames([navigator.language], { type: 'language' }).of(b.split('-')[0]) || b
              ) || 0;
          } catch {
            return a.localeCompare(b);
          }
        });
        setAvailableLanguages(languages);

        // Set default voice and language
        const defaultVoice = availableVoices.find(voice => 
          voice.default || 
          voice.lang.startsWith(navigator.language) || 
          voice.lang.startsWith('en')
        );
        
        if (defaultVoice) {
          setSelectedVoice(defaultVoice.name);
          setSelectedLanguage(defaultVoice.lang);
        } else {
          setSelectedVoice(availableVoices[0].name);
          setSelectedLanguage(availableVoices[0].lang);
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
    availableLanguages
  };
};
