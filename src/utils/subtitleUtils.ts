export interface SubtitleEntry {
  startTime: string;
  endTime: string;
  text: string;
}

export const parseSubtitles = (content: string): SubtitleEntry[] => {
  // Basic SRT parsing (can be extended for other formats)
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

export const generateWebVTT = (subtitles: SubtitleEntry[]): string => {
  let vttContent = 'WEBVTT\n\n';
  
  subtitles.forEach((subtitle, index) => {
    // Convert comma-separated times to period-separated times
    const startTime = subtitle.startTime.replace(',', '.');
    const endTime = subtitle.endTime.replace(',', '.');

    vttContent += `${index + 1}\n`;
    vttContent += `${startTime} --> ${endTime}\n`;
    vttContent += `${subtitle.text}\n\n`;
  });

  return vttContent;
};

export const timeToSeconds = (timeStr: string): number => {
  const [hours, minutes, seconds] = timeStr.split(':').map(parseFloat);
  return hours * 3600 + minutes * 60 + seconds;
};

export const generateAudioClip = async (
  audioBuffer: AudioBuffer,
  startTime: number,
  endTime: number
): Promise<Blob> => {
  const audioContext = new AudioContext();
  const sampleRate = audioBuffer.sampleRate;
  const channels = audioBuffer.numberOfChannels;
  const startSample = Math.floor(startTime * sampleRate);
  const endSample = Math.floor(endTime * sampleRate);
  const length = endSample - startSample;

  const newBuffer = audioContext.createBuffer(channels, length, sampleRate);

  for (let channel = 0; channel < channels; channel++) {
    const newChannelData = newBuffer.getChannelData(channel);
    const originalChannelData = audioBuffer.getChannelData(channel);
    for (let i = 0; i < length; i++) {
      newChannelData[i] = originalChannelData[startSample + i];
    }
  }

  // Convert AudioBuffer to WAV blob
  const offlineContext = new OfflineAudioContext(channels, length, sampleRate);
  const source = offlineContext.createBufferSource();
  source.buffer = newBuffer;
  source.connect(offlineContext.destination);
  source.start();

  const renderedBuffer = await offlineContext.startRendering();
  const wavBlob = await audioBufferToWav(renderedBuffer);
  return wavBlob;
};

const audioBufferToWav = async (audioBuffer: AudioBuffer): Promise<Blob> => {
  const numberOfChannels = audioBuffer.numberOfChannels;
  const length = audioBuffer.length * numberOfChannels * 2;
  const buffer = new ArrayBuffer(44 + length);
  const view = new DataView(buffer);

  // Write WAV header
  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + length, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numberOfChannels, true);
  view.setUint32(24, audioBuffer.sampleRate, true);
  view.setUint32(28, audioBuffer.sampleRate * 2 * numberOfChannels, true);
  view.setUint16(32, numberOfChannels * 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, 'data');
  view.setUint32(40, length, true);

  const channels = [];
  for (let i = 0; i < numberOfChannels; i++) {
    channels.push(audioBuffer.getChannelData(i));
  }

  let offset = 44;
  for (let i = 0; i < audioBuffer.length; i++) {
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const sample = channels[channel][i];
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }
  }

  return new Blob([buffer], { type: 'audio/wav' });
};
