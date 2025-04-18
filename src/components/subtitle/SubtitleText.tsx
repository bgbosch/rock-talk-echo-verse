
import React from 'react';
import { Textarea } from '@/components/ui/textarea';

interface SubtitleTextProps {
  text: string;
  isEditing: boolean;
  onTextChange: (value: string) => void;
}

const SubtitleText = ({ text, isEditing, onTextChange }: SubtitleTextProps) => {
  if (isEditing) {
    return (
      <div>
        <label className="text-sm text-gray-600 mb-1 block">Text</label>
        <Textarea 
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          className="min-h-20"
        />
      </div>
    );
  }

  return <div>{text}</div>;
};

export default SubtitleText;
