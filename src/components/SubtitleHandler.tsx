
import React from 'react';
import FileUpload from './subtitle/FileUpload';
import VoiceSettings from './subtitle/VoiceSettings';
import SubtitleList from './subtitle/SubtitleList';
import { useVoiceManagement } from '@/hooks/useVoiceManagement';
import { useRecording } from '@/hooks/useRecording';
import { useSubtitles } from '@/hooks/useSubtitles';

const SubtitleHandler = () => {
  const {
    voices,
    selectedVoice,
    setSelectedVoice,
    selectedLanguage,
    setSelectedLanguage,
    languageOptions
  } = useVoiceManagement();

  const {
    subtitles,
    sourceFileName,
    currentFormat,
    handleSubtitlesLoaded,
    handleFormatChange,
    updateSubtitle
  } = useSubtitles();

  const {
    isRecording,
    startRecording,
    stopRecording
  } = useRecording(sourceFileName);

  return (
    <div className="space-y-6 p-4 max-w-4xl mx-auto">
      <div className="space-y-4">
        <FileUpload
          onSubtitlesLoaded={handleSubtitlesLoaded}
          subtitles={subtitles}
          currentFormat={currentFormat}
          onFormatChange={handleFormatChange}
        />
        <VoiceSettings
          voices={voices}
          selectedVoice={selectedVoice}
          selectedLanguage={selectedLanguage}
          languageOptions={languageOptions}
          onVoiceChange={setSelectedVoice}
          onLanguageChange={setSelectedLanguage}
        />
      </div>

      <SubtitleList
        subtitles={subtitles}
        sourceFileName={sourceFileName}
        isRecording={isRecording}
        selectedVoice={selectedVoice}
        selectedLanguage={selectedLanguage}
        voices={voices}
        onStartRecording={startRecording}
        onStopRecording={stopRecording}
        onUpdateSubtitle={updateSubtitle}
      />
    </div>
  );
};

export default SubtitleHandler;
