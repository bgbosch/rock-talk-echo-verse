
import { SubtitleEntry, SubtitleFormat } from './types';
import { formatTimeString } from './timeUtils';

export const parseSubtitles = (content: string, format: SubtitleFormat): SubtitleEntry[] => {
  switch (format) {
    case 'srt':
      return parseSRT(content);
    case 'vtt':
      return parseVTT(content);
    case 'txt':
      return parseTXT(content);
    default:
      throw new Error('Unsupported subtitle format');
  }
};

const parseSRT = (content: string): SubtitleEntry[] => {
  const blocks = content.trim().split('\n\n');
  const entries: SubtitleEntry[] = [];

  blocks.forEach(block => {
    const lines = block.split('\n');
    if (lines.length >= 3) {
      const timeLine = lines[1];
      const [timeRange] = timeLine.split(' --> ');
      if (timeRange) {
        const [startTime, endTime] = timeLine.split(' --> ');
        const text = lines.slice(2).join('\n');
        entries.push({
          startTime: startTime.trim(),
          endTime: endTime.trim(),
          text: text.trim()
        });
      }
    }
  });

  return entries;
};

const parseVTT = (content: string): SubtitleEntry[] => {
  const lines = content.trim().split('\n');
  const entries: SubtitleEntry[] = [];
  let currentEntry: Partial<SubtitleEntry> = {};
  
  let startIdx = lines[0].includes('WEBVTT') ? 1 : 0;
  
  for (let i = startIdx; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line === '') continue;
    
    if (line.includes(' --> ')) {
      const [startTime, endTime] = line.split(' --> ');
      currentEntry = {
        startTime: startTime.trim(),
        endTime: endTime.trim(),
        text: ''
      };
    } else if (currentEntry.startTime) {
      currentEntry.text = (currentEntry.text ? currentEntry.text + '\n' : '') + line;
      
      if (!lines[i + 1]?.trim() || i === lines.length - 1) {
        entries.push(currentEntry as SubtitleEntry);
        currentEntry = {};
      }
    }
  }
  
  return entries;
};

const parseTXT = (content: string): SubtitleEntry[] => {
  const lines = content.trim().split('\n');
  return lines.map((line, index) => {
    const startTime = formatTimeString(index * 3);
    const endTime = formatTimeString((index + 1) * 3);
    return {
      startTime,
      endTime,
      text: line.trim()
    };
  });
};
