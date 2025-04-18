
import { useState } from 'react';
import { toast } from 'sonner';

export const useRecording = (sourceFileName: string) => {
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);

  const startRecording = async (index: number) => {
    try {
      // Request user media (microphone)
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          // Use advanced constraints for better audio quality
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          channelCount: 2,
          sampleRate: 44100
        }
      });
      
      // Check if we have audio tracks in the stream
      if (stream.getAudioTracks().length === 0) {
        toast.error("No audio track found in the stream");
        stream.getTracks().forEach(track => track.stop());
        return;
      }
      
      // Define MIME types in order of preference
      const preferredTypes = [
        'audio/mpeg', // MP3
        'audio/mp3',  // Alternative MP3 MIME
        'audio/wav',  // WAV format
        'audio/webm', // WebM format
        'audio/webm;codecs=opus', // WebM with Opus (but we'll handle conversion)
        'audio/mp4'   // MP4 format (last resort)
      ];
      
      // Find the first supported MIME type
      let mimeType = '';
      for (const type of preferredTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType = type;
          break;
        }
      }
      
      // If no preferred types are supported, use default
      if (!mimeType) {
        mimeType = '';
        console.warn("None of the preferred audio formats are supported, using browser default");
      }
      
      // Log selected format for debugging
      console.log(`Using audio format: ${mimeType || 'browser default'}`);
      
      // Create recorder with options
      const options: MediaRecorderOptions = {};
      if (mimeType) {
        options.mimeType = mimeType;
        options.audioBitsPerSecond = 128000; // 128 kbps for good quality
      }
      
      const recorder = new MediaRecorder(stream, options);
      const chunks: BlobPart[] = [];

      // Collect data as it becomes available
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      // Handle recording completion
      recorder.onstop = () => {
        // Determine appropriate file extension based on actual MIME type used
        let fileExtension = 'mp3'; // Default to mp3
        let finalMimeType = 'audio/mpeg';
        
        if (recorder.mimeType) {
          if (recorder.mimeType.includes('mp4')) {
            fileExtension = 'mp3'; // Force mp3 extension even for mp4 mime type
            finalMimeType = 'audio/mpeg';
          } else if (recorder.mimeType.includes('webm')) {
            fileExtension = 'mp3'; // We'll convert webm to mp3 equivalent
            finalMimeType = 'audio/mpeg';
          } else if (recorder.mimeType.includes('wav')) {
            fileExtension = 'wav';
            finalMimeType = 'audio/wav';
          } else if (recorder.mimeType.includes('mpeg') || recorder.mimeType.includes('mp3')) {
            fileExtension = 'mp3';
            finalMimeType = 'audio/mpeg';
          }
        }
        
        if (chunks.length === 0) {
          toast.error("No audio data was recorded");
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        console.log(`Recording complete. Using format: ${finalMimeType} with extension .${fileExtension}`);
        
        // Create blob with the determined MIME type
        const blob = new Blob(chunks, { type: finalMimeType });
        
        // Create and trigger download
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${sourceFileName}_${index + 1}.${fileExtension}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // Clean up resources
        URL.revokeObjectURL(url);
        stream.getTracks().forEach(track => track.stop());
        
        toast.success(`Recording saved as ${fileExtension} file`);
        setIsRecording(false);
      };

      // Set up event handlers for recording state
      recorder.onstart = () => {
        setIsRecording(true);
        toast.success("Recording started - speak now");
      };

      recorder.onerror = (event) => {
        console.error("Recording error:", event);
        toast.error("Recording error occurred");
        setIsRecording(false);
        stream.getTracks().forEach(track => track.stop());
      };

      // Store the recorder
      setMediaRecorder(recorder);
      
      // Start recording with frequent data collection for more reliable results
      recorder.start(100);
      
      // Show tooltip about microphone access
      toast.info("Recording from your microphone. Please speak clearly.");
      
      // Listen for when a user stops the track
      stream.getAudioTracks()[0].onended = () => {
        if (isRecording) {
          toast.error("Audio recording was stopped");
          setIsRecording(false);
          if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
          }
        }
      };
      
    } catch (error) {
      console.error('Error starting recording:', error);
      if ((error as Error)?.name === 'NotAllowedError') {
        toast.error("Permission to record audio was denied");
      } else if ((error as Error)?.name === 'NotFoundError') {
        toast.error("No microphone found. Please connect a microphone.");
      } else if ((error as Error)?.name === 'NotReadableError') {
        toast.error("Your microphone is busy or not functioning properly");
      } else {
        toast.error("Failed to start recording: " + (error as Error)?.message || "Unknown error");
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      toast.success("Recording stopped. Processing audio...");
    }
  };

  return {
    isRecording,
    startRecording,
    stopRecording
  };
};
