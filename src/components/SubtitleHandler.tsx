import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, FileText, Download, Headphones } from 'lucide-react';
import { toast } from 'sonner';
import { parseSubtitles, generateWebVTT, SubtitleEntry, generateAudioClip } from '@/utils/subtitleUtils';

const SubtitleHandler = () => {
  const [subtitles, setSubtitles] = useState<SubtitleEntry[]>([]);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);

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
      toast.success("Subtitles imported successfully");
    } catch (error) {
      toast.error("Failed to import subtitles");
      console.error('Error importing subtitles:', error);
    }
  }, []);

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

  const generateSpeech = async (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
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
                      const startTime = parseFloat(subtitle.startTime.split(':').reduce((acc, time) => (60 * parseFloat(time)) + parseFloat(acc), '0'));
                      const endTime = parseFloat(subtitle.endTime.split(':').reduce((acc, time) => (60 * parseFloat(time)) + parseFloat(acc), '0'));
                      const audioClip = await generateAudioClip(audioBuffer, startTime, endTime);
                      const url = URL.createObjectURL(audioClip);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `clip_${index}.wav`;
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
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SubtitleHandler;
