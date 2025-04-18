
import React from 'react';
import { Input } from '@/components/ui/input';
import { Clock } from 'lucide-react';

interface SubtitleTimeProps {
  startTime: string;
  endTime: string;
  estimatedDuration: string | null;
  isEditing: boolean;
  onStartTimeChange: (value: string) => void;
  onEndTimeChange: (value: string) => void;
}

const SubtitleTime = ({
  startTime,
  endTime,
  estimatedDuration,
  isEditing,
  onStartTimeChange,
  onEndTimeChange
}: SubtitleTimeProps) => {
  if (isEditing) {
    return (
      <div className="flex gap-2">
        <div className="w-1/2">
          <label className="text-sm text-gray-600 mb-1 block">Start Time</label>
          <Input 
            value={startTime} 
            onChange={(e) => onStartTimeChange(e.target.value)} 
            placeholder="HH:MM:SS.mmm"
          />
        </div>
        <div className="w-1/2">
          <label className="text-sm text-gray-600 mb-1 block">End Time</label>
          <Input 
            value={endTime} 
            onChange={(e) => onEndTimeChange(e.target.value)} 
            placeholder="HH:MM:SS.mmm"
          />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="text-sm text-gray-600">
        {startTime} → {endTime}
      </div>
      {estimatedDuration && (
        <div className="text-sm text-gray-500 flex items-center">
          <Clock className="mr-1 h-4 w-4" />
          Est. duration: {estimatedDuration}
        </div>
      )}
    </>
  );
};

export default SubtitleTime;
