
import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, FileText, Download } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

interface SubtitleEntry {
  startTime: string;
  endTime: string;
  text: string;
}

const SubtitleHandler = () => {
  const [subtitles, setSubtitles] = useState<SubtitleEntry[]>([]);

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

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-4">
        <Input
          type="file"
          accept=".srt,.vtt,.txt"
          onChange={handleFileUpload}
          className="max-w-sm"
        />
        <Button onClick={downloadWebVTT} disabled={subtitles.length === 0}>
          <Download className="mr-2 h-4 w-4" />
          Download WebVTT
        </Button>
      </div>
      <div className="mt-4">
        {subtitles.map((subtitle, index) => (
          <div key={index} className="mb-2 p-2 border rounded">
            <div className="text-sm text-gray-600">
              {subtitle.startTime} → {subtitle.endTime}
            </div>
            <div>{subtitle.text}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SubtitleHandler;
