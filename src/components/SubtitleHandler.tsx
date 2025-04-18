
import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileText, Download, Headphones } from 'lucide-react';
import { toast } from 'sonner';
import { parseSubtitles, generateWebVTT, SubtitleEntry, generateAudioClip } from '@/utils/subtitleUtils';

// Available ElevenLabs voices
const VOICES = [
  { id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel" },
  { id: "AZnzlk1XvdvUeBnXmlld", name: "Domi" },
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah" },
  { id: "MF3mGyEYCl7XYWbV9V6O", name: "Elli" },
];

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
];

const SubtitleHandler = () => {
  const [subtitles, setSubtitles] = useState<SubtitleEntry[]>([]);
  const [selectedVoice, setSelectedVoice] = useState(VOICES[0].id);
  const [selectedLanguage, setSelectedLanguage] = useState(LANGUAGES[0].code);
  const [apiKey, setApiKey] = useState('');
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
    if (!apiKey) {
      toast.error("Please enter your ElevenLabs API key");
      return;
    }

    try {
      const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/' + selectedVoice, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5,
          }
        }),
      });

      if (!response.ok) throw new Error('Failed to generate speech');

      const audioBlob = await response.blob();
      const url = URL.createObjectURL(audioBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `speech_${Date.now()}.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Audio generated and downloaded");
    } catch (error) {
      toast.error("Failed to generate speech");
      console.error('Error generating speech:', error);
    }
  };

  return (
    <div className="space-y-6 p-4 max-w-4xl mx-auto">
      <div className="space-y-4">
        <Input
          type="password"
          placeholder="Enter your ElevenLabs API key"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          className="max-w-md"
        />
        
        <div className="flex flex-wrap gap-4">
          <Select value={selectedVoice} onValueChange={setSelectedVoice}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select voice" />
            </SelectTrigger>
            <SelectContent>
              {VOICES.map((voice) => (
                <SelectItem key={voice.id} value={voice.id}>
                  {voice.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((lang) => (
                <SelectItem key={lang.code} value={lang.code}>
                  {lang.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

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
                Generate Speech
              </Button>
              {audioBuffer && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      const startTime = parseFloat(subtitle.startTime.split(':').reduce((acc, time) => (60 * acc) + parseFloat(time), 0));
                      const endTime = parseFloat(subtitle.endTime.split(':').reduce((acc, time) => (60 * acc) + parseFloat(time), 0));
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
