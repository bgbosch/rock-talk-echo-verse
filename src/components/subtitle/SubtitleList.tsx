
import React from 'react';
import { SubtitleEntry } from '@/utils/subtitleUtils';
import SubtitleItem from './SubtitleItem';

interface SubtitleListProps {
  subtitles: SubtitleEntry[];
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

const SubtitleList = ({
  subtitles,
  sourceFileName,
  audioBuffer,
  isRecording,
  selectedVoice,
  selectedLanguage,
  voices,
  onStartRecording,
  onStopRecording,
  onUpdateSubtitle,
}: SubtitleListProps) => {
  return (
    <div className="space-y-4">
      {subtitles.map((subtitle, index) => (
        <SubtitleItem
          key={index}
          subtitle={subtitle}
          index={index}
          sourceFileName={sourceFileName}
          audioBuffer={audioBuffer}
          isRecording={isRecording}
          selectedVoice={selectedVoice}
          selectedLanguage={selectedLanguage}
          voices={voices}
          onStartRecording={onStartRecording}
          onStopRecording={onStopRecording}
          onUpdateSubtitle={onUpdateSubtitle}
        />
      ))}
    </div>
  );
};

export default SubtitleList;
