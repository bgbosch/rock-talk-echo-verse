
import { SubtitleEntry, SubtitleFormat } from './types';

export const generateSubtitleFile = (subtitles: SubtitleEntry[], format: SubtitleFormat): string => {
  switch (format) {
    case 'srt':
      return generateSRT(subtitles);
    case 'vtt':
      return generateWebVTT(subtitles);
    case 'txt':
      return generateTXT(subtitles);
    default:
      throw new Error('Unsupported subtitle format');
  }
};

const generateSRT = (subtitles: SubtitleEntry[]): string => {
  return subtitles.map((subtitle, index) => {
    return `${index + 1}\n${subtitle.startTime} --> ${subtitle.endTime}\n${subtitle.text}\n`;
  }).join('\n');
};

export const generateWebVTT = (subtitles: SubtitleEntry[]): string => {
  let vttContent = 'WEBVTT\n\n';
  
  subtitles.forEach((subtitle, index) => {
    const startTime = subtitle.startTime.replace(',', '.');
    const endTime = subtitle.endTime.replace(',', '.');

    vttContent += `${index + 1}\n`;
    vttContent += `${startTime} --> ${endTime}\n`;
    vttContent += `${subtitle.text}\n\n`;
  });

  return vttContent;
};

const generateTXT = (subtitles: SubtitleEntry[]): string => {
  return subtitles.map(subtitle => subtitle.text).join('\n');
};
