
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { SubtitleEntry } from '@/utils/subtitleUtils';
import FileUpload from './subtitle/FileUpload';
import VoiceSettings from './subtitle/VoiceSettings';
import SubtitleList from './subtitle/SubtitleList';

const SubtitleHandler = () => {
  const [subtitles, setSubtitles] = useState<SubtitleEntry[]>([]);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [availableLanguages, setAvailableLanguages] = useState<string[]>([]);
  const [sourceFileName, setSourceFileName] = useState<string>('');
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);

  useEffect(() => {
    if ('speechSynthesis' in window) {
      const getVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        setVoices(availableVoices);
        
        const languages = [...new Set(availableVoices.map(voice => voice.lang))];
        setAvailableLanguages(languages);
        
        if (availableVoices.length > 0) {
          setSelectedVoice(availableVoices[0].name);
          setSelectedLanguage(availableVoices[0].lang);
        }
      };

      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = getVoices;
      }
      
      getVoices();
    }
  }, []);

  const handleSubtitlesLoaded = (entries: SubtitleEntry[], fileName: string) => {
    setSubtitles(entries);
    setSourceFileName(fileName);
  };

  const handleAudioLoaded = (buffer: AudioBuffer, file: File) => {
    setAudioBuffer(buffer);
    setAudioFile(file);
  };

  const startRecording = async (index: number) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${sourceFileName}_${index + 1}.wav`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        stream.getTracks().forEach(track => track.stop());
      };

      setMediaRecorder(recorder);
      recorder.start();
      setIsRecording(true);
      toast.success("Recording started");
    } catch (error) {
      toast.error("Failed to start recording");
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

  return (
    <div className="space-y-6 p-4 max-w-4xl mx-auto">
      <div className="space-y-4">
        <FileUpload
          onSubtitlesLoaded={handleSubtitlesLoaded}
          onAudioLoaded={handleAudioLoaded}
          subtitles={subtitles}
        />
        <VoiceSettings
          voices={voices}
          selectedVoice={selectedVoice}
          selectedLanguage={selectedLanguage}
          availableLanguages={availableLanguages}
          onVoiceChange={setSelectedVoice}
          onLanguageChange={setSelectedLanguage}
        />
      </div>

      <SubtitleList
        subtitles={subtitles}
        sourceFileName={sourceFileName}
        audioBuffer={audioBuffer}
        isRecording={isRecording}
        selectedVoice={selectedVoice}
        selectedLanguage={selectedLanguage}
        voices={voices}
        onStartRecording={startRecording}
        onStopRecording={stopRecording}
      />
    </div>
  );
};

export default SubtitleHandler;
