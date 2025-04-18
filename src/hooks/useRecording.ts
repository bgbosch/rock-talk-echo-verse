
import { useState } from 'react';
import { toast } from 'sonner';

export const useRecording = (sourceFileName: string) => {
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);

  const startRecording = async (index: number) => {
    try {
      // Request system audio stream (audio from the display/system)
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: false,
        audio: true,
        // Use advanced constraints for better audio quality
        // @ts-ignore - TypeScript doesn't recognize all constraints
        audioConstraints: {
          channelCount: 2,
          echoCancellation: false,
          autoGainControl: false,
          noiseSuppression: false,
          sampleRate: 48000,
        }
      });
      
      // Check if we have audio tracks in the stream
      if (stream.getAudioTracks().length === 0) {
        toast.error("No audio track found in the stream");
        stream.getTracks().forEach(track => track.stop());
        return;
      }
      
      // Create MediaRecorder with proper MIME type for audio recording
      // Try different MIME types in order of preference
      const mimeTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'];
      let mimeType = '';
      
      for (const type of mimeTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType = type;
          break;
        }
      }
      
      if (!mimeType) {
        toast.warning("Using default audio format - may affect quality");
      }
      
      const options = mimeType ? { mimeType } : undefined;
      const recorder = new MediaRecorder(stream, options);
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        // Create audio blob from recorded chunks using the selected MIME type
        const blob = new Blob(chunks, { type: mimeType || 'audio/webm' });
        
        if (chunks.length === 0 || blob.size === 0) {
          toast.error("No audio data was recorded");
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        
        // Create and trigger download
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${sourceFileName}_${index + 1}.${mimeType.includes('mp4') ? 'mp4' : 'webm'}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // Clean up resources
        URL.revokeObjectURL(url);
        stream.getTracks().forEach(track => track.stop());
        
        toast.success("Recording saved");
        setIsRecording(false);
      };

      // Set up event handlers for recording state
      recorder.onstart = () => {
        setIsRecording(true);
        toast.success("Recording started");
        
        // Request at least 100ms of data every 100ms to ensure we get audio
        recorder.start(100);
      };

      recorder.onerror = (event) => {
        console.error("Recording error:", event);
        toast.error("Recording error occurred");
        setIsRecording(false);
        stream.getTracks().forEach(track => track.stop());
      };

      // Store the recorder and start recording
      setMediaRecorder(recorder);
      
      // Instruct user to select the audio source
      toast.info("Select the tab or application whose audio you want to capture");
      
      // Listen for when a user denies permission
      stream.getAudioTracks()[0].onended = () => {
        if (isRecording) {
          toast.error("Audio recording was stopped");
          setIsRecording(false);
          if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
          }
        }
      };
      
      // Start with a short interval to capture smaller chunks
      recorder.start(100);
    } catch (error) {
      console.error('Error starting recording:', error);
      if ((error as Error)?.name === 'NotAllowedError') {
        toast.error("Permission to record was denied");
      } else if ((error as Error)?.name === 'NotFoundError') {
        toast.error("No audio device found");
      } else {
        toast.error("Failed to start recording: " + (error as Error)?.message || "Unknown error");
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      setIsRecording(false);
      toast.success("Recording stopped");
    }
  };

  return {
    isRecording,
    startRecording,
    stopRecording
  };
};
