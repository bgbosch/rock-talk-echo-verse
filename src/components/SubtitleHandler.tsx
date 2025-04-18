import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, FileText, Download, Headphones, Mic } from 'lucide-react';
import { toast } from 'sonner';
import { parseSubtitles, generateWebVTT, SubtitleEntry, generateAudioClip } from '@/utils/subtitleUtils';

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

  const handleAudioUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const audioContext = new AudioContext();
      const buffer = await audioContext.decodeAudioData(arrayBuffer);
      setAudioBuffer(buffer);
      setAudioFile(file);
      toast.success("Audio file loaded successfully");
    } catch (error) {
      toast.error("Failed to load audio file");
      console.error('Error loading audio:', error);
    }
  };

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const entries = parseSubtitles(text);
      setSubtitles(entries);
      setSourceFileName(file.name.split('.')[0]);
      toast.success("Subtitles imported successfully");
    } catch (error) {
      toast.error("Failed to import subtitles");
      console.error('Error importing subtitles:', error);
    }
  }, []);

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

  const downloadWebVTT = useCallback(() => {
    if (subtitles.length === 0) {
      toast.error("No subtitles to download");
      return;
    }

    const vttContent = generateWebVTT(subtitles);
    const blob = new Blob([vttContent], { type: 'text/vtt' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'subtitles.vtt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("WebVTT file downloaded");
  }, [subtitles]);

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

  return (
    <div className="space-y-6 p-4 max-w-4xl mx-auto">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          <Input
            type="file"
            accept=".srt,.vtt,.txt"
            onChange={handleFileUpload}
            className="max-w-sm"
          />
          <Input
            type="file"
            accept="audio/*"
            onChange={handleAudioUpload}
            className="max-w-sm"
          />
          <Button onClick={downloadWebVTT} disabled={subtitles.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Download WebVTT
          </Button>
        </div>

        {voices.length > 0 && (
          <div className="flex flex-wrap gap-4">
            <div className="w-full max-w-xs">
              <label className="block text-sm font-medium mb-1">Language</label>
              <select
                className="w-full rounded-md border border-gray-300 p-2"
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
              >
                {availableLanguages.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-full max-w-xs">
              <label className="block text-sm font-medium mb-1">Voice</label>
              <select
                className="w-full rounded-md border border-gray-300 p-2"
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
              >
                {voices
                  .filter(voice => voice.lang === selectedLanguage)
                  .map((voice) => (
                    <option key={voice.name} value={voice.name}>
                      {voice.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {subtitles.map((subtitle, index) => (
          <div key={index} className="p-4 border rounded-lg space-y-2">
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
                  onClick={async () => {
                    try {
                      const startTimeSeconds = subtitle.startTime.split(':').reduce((acc, time, index) => {
                        return acc + parseFloat(time) * (index === 0 ? 3600 : index === 1 ? 60 : 1);
                      }, 0);
                      
                      const endTimeSeconds = subtitle.endTime.split(':').reduce((acc, time, index) => {
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
                  }}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Clip
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => isRecording ? stopRecording() : startRecording(index)}
                className={isRecording ? "bg-red-500 text-white hover:bg-red-600" : ""}
              >
                <Mic className="mr-2 h-4 w-4" />
                {isRecording ? "Stop Recording" : "Record Clip"}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SubtitleHandler;
