
import { useState } from 'react';
import { SubtitleEntry } from '@/utils/subtitleUtils';

export const useSubtitles = () => {
  const [subtitles, setSubtitles] = useState<SubtitleEntry[]>([]);
  const [sourceFileName, setSourceFileName] = useState<string>('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);

  const handleSubtitlesLoaded = (entries: SubtitleEntry[], fileName: string) => {
    setSubtitles(entries);
    setSourceFileName(fileName);
  };

  const handleAudioLoaded = (buffer: AudioBuffer, file: File) => {
    setAudioBuffer(buffer);
    setAudioFile(file);
  };

  const updateSubtitle = (index: number, updatedSubtitle: SubtitleEntry) => {
    const newSubtitles = [...subtitles];
    newSubtitles[index] = updatedSubtitle;
    setSubtitles(newSubtitles);
  };

  return {
    subtitles,
    sourceFileName,
    audioFile,
    audioBuffer,
    handleSubtitlesLoaded,
    handleAudioLoaded,
    updateSubtitle
  };
};
