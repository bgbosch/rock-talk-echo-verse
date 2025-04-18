
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

// Enhanced playAudio function with error handling
export const playAudio = (audioBlob: Blob): Promise<void> => {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(audioBlob);
    const audio = new Audio(url);
    
    audio.onended = () => {
      URL.revokeObjectURL(url);
      resolve();
    };
    
    audio.onerror = (e) => {
      URL.revokeObjectURL(url);
      console.error("Error playing audio:", e);
      reject(new Error("Failed to play audio"));
    };
    
    // Ensure audio is ready before playing
    audio.oncanplaythrough = () => {
      audio.play()
        .catch(err => {
          console.error("Error playing audio:", err);
          reject(err);
        });
    };
    
    // Fallback if oncanplaythrough doesn't fire
    setTimeout(() => {
      if (audio.readyState >= 3 && !audio.paused) {
        resolve(); // audio is already playing
      } else if (audio.readyState >= 3) {
        audio.play()
          .catch(err => {
            console.error("Error playing audio:", err);
            reject(err);
          });
      }
    }, 1000);
  });
};

/**
 * Checks if a file is a valid audio file
 */
export const isValidAudioFile = (file: File): boolean => {
  const validTypes = ['audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/mp4', 'audio/aac'];
  
  // Check if the file type is in our list or starts with audio/
  if (validTypes.includes(file.type) || file.type.startsWith('audio/')) {
    return true;
  }
  
  // Check file extension as a fallback
  const extension = file.name.split('.').pop()?.toLowerCase();
  const validExtensions = ['mp3', 'wav', 'ogg', 'webm', 'mp4', 'aac', 'm4a'];
  return validExtensions.includes(extension || '');
};

/**
 * Creates an MP3 recorder
 * This is a utility function to create a MediaRecorder with MP3 support if available
 */
export const createAudioRecorder = (stream: MediaStream): MediaRecorder => {
  // Try to use MP3 format if supported
  let mimeType = 'audio/mpeg';
  
  if (!MediaRecorder.isTypeSupported(mimeType)) {
    // Fallback options in order of preference
    const fallbackTypes = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm'];
    for (const type of fallbackTypes) {
      if (MediaRecorder.isTypeSupported(type)) {
        mimeType = type;
        break;
      }
    }
  }
  
  console.log(`Using audio recorder format: ${mimeType}`);
  
  // Create recorder with selected format and high bitrate for better quality
  const options = {
    mimeType,
    audioBitsPerSecond: 128000
  };
  
  return new MediaRecorder(stream, options);
};
