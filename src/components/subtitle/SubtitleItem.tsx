import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Headphones, Mic, Clock, Edit, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
      
      // Average speaking rate is about 150 words per minute
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

  const toggleEdit = () => {
    if (!isEditing) {
      setEditedText(subtitle.text);
      setEditedStartTime(subtitle.startTime);
      setEditedEndTime(subtitle.endTime);
    }
    setIsEditing(!isEditing);
  };

  return (
    <div className="p-4 border rounded-lg space-y-2">
      {isEditing ? (
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="w-1/2">
              <label className="text-sm text-gray-600 mb-1 block">Start Time</label>
              <Input 
                value={editedStartTime} 
                onChange={(e) => setEditedStartTime(e.target.value)} 
                placeholder="HH:MM:SS.mmm"
              />
            </div>
            <div className="w-1/2">
              <label className="text-sm text-gray-600 mb-1 block">End Time</label>
              <Input 
                value={editedEndTime} 
                onChange={(e) => setEditedEndTime(e.target.value)} 
                placeholder="HH:MM:SS.mmm"
              />
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Text</label>
            <Textarea 
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              className="min-h-20"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSaveEdit} variant="default" size="sm">
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
            <Button onClick={toggleEdit} variant="outline" size="sm">
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="text-sm text-gray-600">
            {subtitle.startTime} → {subtitle.endTime}
          </div>
          <div>{subtitle.text}</div>
          <div className="flex gap-2 items-center">
            <div className="text-sm text-gray-500 flex items-center mr-2">
              <Clock className="mr-1 h-4 w-4" />
              Est. duration: {estimatedDuration || "calculating..."}
            </div>
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
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleEdit}
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default SubtitleItem;
