
import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, Headphones, Mic, Edit, Save } from 'lucide-react';

interface SubtitleActionsProps {
  isEditing: boolean;
  isRecording: boolean;
  hasAudioBuffer: boolean;
  onSave: () => void;
  onCancel: () => void;
  onReadAloud: () => void;
  onDownloadClip: () => void;
  onRecordingToggle: () => void;
  onEdit: () => void;
}

const SubtitleActions = ({
  isEditing,
  isRecording,
  hasAudioBuffer,
  onSave,
  onCancel,
  onReadAloud,
  onDownloadClip,
  onRecordingToggle,
  onEdit
}: SubtitleActionsProps) => {
  if (isEditing) {
    return (
      <div className="flex gap-2">
        <Button onClick={onSave} variant="default" size="sm">
          <Save className="mr-2 h-4 w-4" />
          Save Changes
        </Button>
        <Button onClick={onCancel} variant="outline" size="sm">
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <Button 
        variant="secondary" 
        size="sm"
        onClick={onReadAloud}
      >
        <Headphones className="mr-2 h-4 w-4" />
        Read Aloud
      </Button>
      {hasAudioBuffer && (
        <Button
          variant="outline"
          size="sm"
          onClick={onDownloadClip}
        >
          <Download className="mr-2 h-4 w-4" />
          Download Clip
        </Button>
      )}
      <Button
        variant="outline"
        size="sm"
        onClick={onRecordingToggle}
        className={isRecording ? "bg-red-500 text-white hover:bg-red-600" : ""}
      >
        <Mic className="mr-2 h-4 w-4" />
        {isRecording ? "Stop Recording" : "Record Clip"}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={onEdit}
      >
        <Edit className="mr-2 h-4 w-4" />
        Edit
      </Button>
    </div>
  );
};

export default SubtitleActions;
