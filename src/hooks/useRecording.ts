
import { useState } from 'react';
import { toast } from 'sonner';

export const useRecording = (sourceFileName: string) => {
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);

  const startRecording = async (index: number) => {
    try {
      // Request user media (microphone) instead of display media
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
      
      // Log selected format for debugging
      console.log(`Using audio format: ${mimeType}`);
      
      // Create recorder with selected format and high bitrate for better quality
      const options = {
        mimeType,
        audioBitsPerSecond: 128000
      };
      
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
        // Create appropriate audio blob based on selected MIME type
        const blob = new Blob(chunks, { type: mimeType });
        
        if (chunks.length === 0 || blob.size === 0) {
          toast.error("No audio data was recorded");
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        console.log(`Recording complete. Blob size: ${blob.size} bytes`);
        
        // Get appropriate file extension based on MIME type
        const fileExtension = mimeType.includes('mp4') ? 'mp4' : 
                              mimeType.includes('mpeg') ? 'mp3' : 'webm';
        
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
        
        toast.success(`Recording saved as ${fileExtension}`);
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
