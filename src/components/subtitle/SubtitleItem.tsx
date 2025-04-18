import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { SubtitleEntry } from '@/utils/subtitleUtils';
import SubtitleTime from './SubtitleTime';
import SubtitleText from './SubtitleText';
import SubtitleActions from './SubtitleActions';
import { generateAudioClip, playAudio } from '@/utils/subtitles/audioUtils';

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
  onUpdateSubtitle: (index: number, updatedSubtitle: SubtitleEntry) => void;
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
  onUpdateSubtitle,
}: SubtitleItemProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(subtitle.text);
  const [editedStartTime, setEditedStartTime] = useState(subtitle.startTime);
  const [editedEndTime, setEditedEndTime] = useState(subtitle.endTime);
  const [estimatedDuration, setEstimatedDuration] = useState<string | null>(null);
  
  useEffect(() => {
    estimateAudioDuration();
  }, [subtitle.text, selectedVoice, selectedLanguage]);

  const formatTimeString = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    const milliseconds = Math.floor((seconds % 1) * 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')},${milliseconds.toString().padStart(3, '0')}`;
  };

  const estimateAudioDuration = () => {
    if ('speechSynthesis' in window && subtitle.text) {
      const utterance = new SpeechSynthesisUtterance(subtitle.text);
      
      if (selectedVoice) {
        const voice = voices.find(v => v.name === selectedVoice);
        if (voice) utterance.voice = voice;
      }
      
      if (selectedLanguage) {
        utterance.lang = selectedLanguage;
      }
      
      const wordCount = subtitle.text.split(/\s+/).filter(Boolean).length;
      const durationInSeconds = (wordCount / 150) * 60;
      
      setEstimatedDuration(formatTimeString(durationInSeconds));
    }
  };

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

  const handleSaveEdit = () => {
    const updatedSubtitle = {
      startTime: editedStartTime,
      endTime: editedEndTime,
      text: editedText
    };
    
    onUpdateSubtitle(index, updatedSubtitle);
    setIsEditing(false);
    toast.success("Subtitle updated");
  };

  return (
    <div className="p-4 border rounded-lg space-y-2">
      <SubtitleTime
        startTime={editedStartTime}
        endTime={editedEndTime}
        estimatedDuration={estimatedDuration}
        isEditing={isEditing}
        onStartTimeChange={setEditedStartTime}
        onEndTimeChange={setEditedEndTime}
      />
      <SubtitleText
        text={editedText}
        isEditing={isEditing}
        onTextChange={setEditedText}
      />
      <SubtitleActions
        isEditing={isEditing}
        isRecording={isRecording}
        hasAudioBuffer={!!audioBuffer}
        onSave={handleSaveEdit}
        onCancel={() => setIsEditing(false)}
        onReadAloud={() => generateSpeech(subtitle.text)}
        onDownloadClip={handleAudioClip}
        onRecordingToggle={() => isRecording ? onStopRecording() : onStartRecording(index)}
        onEdit={() => {
          setEditedText(subtitle.text);
          setEditedStartTime(subtitle.startTime);
          setEditedEndTime(subtitle.endTime);
          setIsEditing(true);
        }}
      />
    </div>
  );
};

export default SubtitleItem;
