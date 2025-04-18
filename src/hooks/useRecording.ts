
import { useState } from 'react';
import { toast } from 'sonner';

export const useRecording = (sourceFileName: string) => {
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);

  const startRecording = async (index: number) => {
    try {
      // Request audio stream with proper constraints for better audio quality
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 2,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
        },
      });
      
      // Create a new MediaRecorder with proper audio codec
      const options = { mimeType: 'audio/webm' };
      const recorder = new MediaRecorder(stream, options);
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        // Create audio blob from recorded chunks
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        
        // Create download link
        const a = document.createElement('a');
        a.href = url;
        a.download = `${sourceFileName}_${index + 1}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // Clean up resources
        URL.revokeObjectURL(url);
        stream.getTracks().forEach(track => track.stop());
        
        toast.success("Recording saved");
      };

      // Set up event handlers for recording state
      recorder.onstart = () => {
        setIsRecording(true);
        toast.success("Recording started");
      };

      recorder.onerror = (event) => {
        console.error("Recording error:", event);
        toast.error("Recording error occurred");
        setIsRecording(false);
      };

      // Store the recorder and start recording
      setMediaRecorder(recorder);
      recorder.start();
    } catch (error) {
      toast.error("Failed to access microphone");
      console.error('Error starting recording:', error);
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
