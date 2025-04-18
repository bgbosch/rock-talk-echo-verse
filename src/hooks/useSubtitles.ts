
import { useState } from 'react';
import { SubtitleEntry, SubtitleFormat } from '@/utils/subtitleUtils';

export const useSubtitles = () => {
  const [subtitles, setSubtitles] = useState<SubtitleEntry[]>([]);
  const [sourceFileName, setSourceFileName] = useState<string>('');
  const [currentFormat, setCurrentFormat] = useState<SubtitleFormat>('srt');

  const handleSubtitlesLoaded = (entries: SubtitleEntry[], fileName: string, format: SubtitleFormat) => {
    setSubtitles(entries);
    setSourceFileName(fileName);
    setCurrentFormat(format);
  };

  const handleFormatChange = (format: SubtitleFormat) => {
    setCurrentFormat(format);
  };

  const updateSubtitle = (index: number, updatedSubtitle: SubtitleEntry) => {
    const newSubtitles = [...subtitles];
    newSubtitles[index] = updatedSubtitle;
    setSubtitles(newSubtitles);
  };

  return {
    subtitles,
    sourceFileName,
    currentFormat,
    handleSubtitlesLoaded,
    handleFormatChange,
    updateSubtitle
  };
};
