
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileText, Download } from 'lucide-react';
import { toast } from 'sonner';
import { parseSubtitles, SubtitleEntry, generateSubtitleFile, SubtitleFormat } from '@/utils/subtitleUtils';

interface FileUploadProps {
  onSubtitlesLoaded: (subtitles: SubtitleEntry[], fileName: string, format: SubtitleFormat) => void;
  onAudioLoaded: (buffer: AudioBuffer) => void;
  subtitles: SubtitleEntry[];
  currentFormat: SubtitleFormat;
  onFormatChange: (format: SubtitleFormat) => void;
}

const FileUpload = ({ onSubtitlesLoaded, subtitles, currentFormat, onFormatChange, onAudioLoaded }: FileUploadProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    if (fileExtension === 'mp3' || fileExtension === 'wav' || fileExtension === 'ogg') {
      // Handle audio file
      try {
        const arrayBuffer = await file.arrayBuffer();
        const audioContext = new AudioContext();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        onAudioLoaded(audioBuffer);
        toast.success("Audio file loaded successfully");
      } catch (error) {
        toast.error("Failed to load audio file");
        console.error('Error loading audio file:', error);
      }
    } else if (['srt', 'vtt', 'txt'].includes(fileExtension as string)) {
      // Handle subtitle file
      try {
        const text = await file.text();
        const entries = parseSubtitles(text, fileExtension as SubtitleFormat);
        onSubtitlesLoaded(entries, file.name.split('.')[0], fileExtension as SubtitleFormat);
        toast.success("Subtitles imported successfully");
      } catch (error) {
        toast.error("Failed to import subtitles");
        console.error('Error importing subtitles:', error);
      }
    } else {
      toast.error("Unsupported file type");
      return;
    }
  };

  const downloadSubtitles = () => {
    if (subtitles.length === 0) {
      toast.error("No subtitles to download");
      return;
    }

    const content = generateSubtitleFile(subtitles, currentFormat);
    const blob = new Blob([content], { type: `text/${currentFormat}` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subtitles.${currentFormat}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`${currentFormat.toUpperCase()} file downloaded`);
  };

  const formatButtons: { format: SubtitleFormat; label: string }[] = [
    { format: 'srt', label: 'SRT' },
    { format: 'vtt', label: 'WebVTT' },
    { format: 'txt', label: 'Text' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <Input
          type="file"
          accept=".srt,.vtt,.txt,.mp3,.wav,.ogg"
          onChange={handleFileUpload}
          className="max-w-sm"
        />
        <Button onClick={downloadSubtitles} disabled={subtitles.length === 0}>
          <Download className="mr-2 h-4 w-4" />
          Download {currentFormat.toUpperCase()}
        </Button>
      </div>
      
      <div className="flex gap-2">
        {formatButtons.map(({ format, label }) => (
          <Button
            key={format}
            variant={currentFormat === format ? 'default' : 'outline'}
            onClick={() => onFormatChange(format)}
          >
            <FileText className="mr-2 h-4 w-4" />
            {label}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default FileUpload;
