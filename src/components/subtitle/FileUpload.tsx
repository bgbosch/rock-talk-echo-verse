
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { parseSubtitles, SubtitleEntry, generateWebVTT } from '@/utils/subtitleUtils';

interface FileUploadProps {
  onSubtitlesLoaded: (subtitles: SubtitleEntry[], fileName: string) => void;
  onAudioLoaded: (audioBuffer: AudioBuffer, file: File) => void;
  subtitles: SubtitleEntry[];
}

const FileUpload = ({ onSubtitlesLoaded, onAudioLoaded, subtitles }: FileUploadProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    try {
      if (['srt', 'vtt', 'txt'].includes(fileExtension || '')) {
        const text = await file.text();
        const entries = parseSubtitles(text);
        onSubtitlesLoaded(entries, file.name.split('.')[0]);
        toast.success("Subtitles imported successfully");
      } else if (file.type.startsWith('audio/')) {
        const arrayBuffer = await file.arrayBuffer();
        const audioContext = new AudioContext();
        const buffer = await audioContext.decodeAudioData(arrayBuffer);
        onAudioLoaded(buffer, file);
        toast.success("Audio file loaded successfully");
      } else {
        toast.error("Unsupported file type");
      }
    } catch (error) {
      toast.error("Failed to import file");
      console.error('Error importing file:', error);
    }
  };

  const downloadWebVTT = () => {
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
  };

  return (
    <div className="flex flex-wrap items-center gap-4">
      <Input
        type="file"
        accept=".srt,.vtt,.txt,audio/*"
        onChange={handleFileUpload}
        className="max-w-sm"
      />
      <Button onClick={downloadWebVTT} disabled={subtitles.length === 0}>
        <Download className="mr-2 h-4 w-4" />
        Download WebVTT
      </Button>
    </div>
  );
};

export default FileUpload;

