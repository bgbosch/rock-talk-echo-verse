
import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, Headphones, Mic } from 'lucide-react';
import { toast } from 'sonner';
import { SubtitleEntry, generateAudioClip } from '@/utils/subtitleUtils';

interface SubtitleItemProps {
  subtitle: SubtitleEntry;
  index: number;
  sourceFileName: string;
  audioBuffer: AudioBuffer | null;
  isRecording: boolean;
  selectedVoice: string;
  selectedLanguage: string;
  voices: SpeechSynthesisVoice[];
  onStartRecording: (index: number) => void;
  onStopRecording: () => void;
}

const SubtitleItem = ({
  subtitle,
  index,
  sourceFileName,
  audioBuffer,
  isRecording,
  selectedVoice,
  selectedLanguage,
  voices,
  onStartRecording,
  onStopRecording,
}: SubtitleItemProps) => {
  const generateSpeech = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      
      if (selectedVoice) {
        const voice = voices.find(v => v.name === selectedVoice);
        if (voice) utterance.voice = voice;
      }
      
      if (selectedLanguage) {
        utterance.lang = selectedLanguage;
      }
      
      window.speechSynthesis.speak(utterance);
      toast.success("Speaking text");
    } else {
      toast.error("Speech synthesis not supported in this browser");
    }
  };

  const handleAudioClip = async () => {
    if (!audioBuffer) return;

    try {
      const startTimeSeconds = subtitle.startTime.split(':').reduce((acc: number, time: string, index: number) => {
        return acc + parseFloat(time) * (index === 0 ? 3600 : index === 1 ? 60 : 1);
      }, 0);
      
      const endTimeSeconds = subtitle.endTime.split(':').reduce((acc: number, time: string, index: number) => {
        return acc + parseFloat(time) * (index === 0 ? 3600 : index === 1 ? 60 : 1);
      }, 0);
      
      const audioClip = await generateAudioClip(audioBuffer, startTimeSeconds, endTimeSeconds);
      const url = URL.createObjectURL(audioClip);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${sourceFileName}_${index + 1}.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Audio clip downloaded");
    } catch (error) {
      toast.error("Failed to generate audio clip");
      console.error('Error generating audio clip:', error);
    }
  };

  return (
    <div className="p-4 border rounded-lg space-y-2">
      <div className="text-sm text-gray-600">
        {subtitle.startTime} → {subtitle.endTime}
      </div>
      <div>{subtitle.text}</div>
      <div className="flex gap-2">
        <Button 
          variant="secondary" 
          size="sm"
          onClick={() => generateSpeech(subtitle.text)}
        >
          <Headphones className="mr-2 h-4 w-4" />
          Read Aloud
        </Button>
        {audioBuffer && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleAudioClip}
          >
            <Download className="mr-2 h-4 w-4" />
            Download Clip
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => isRecording ? onStopRecording() : onStartRecording(index)}
          className={isRecording ? "bg-red-500 text-white hover:bg-red-600" : ""}
        >
          <Mic className="mr-2 h-4 w-4" />
          {isRecording ? "Stop Recording" : "Record Clip"}
        </Button>
      </div>
    </div>
  );
};

export default SubtitleItem;
