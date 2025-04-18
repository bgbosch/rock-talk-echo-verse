
export interface SubtitleEntry {
  startTime: string;
  endTime: string;
  text: string;
}

export type SubtitleFormat = 'srt' | 'vtt' | 'txt';
