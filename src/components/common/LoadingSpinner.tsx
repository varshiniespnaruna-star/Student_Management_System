import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
  text?: string;
  fullScreen?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message,
  text,
  fullScreen = false,
}) => {
  const displayMessage = text || message || 'Loading data...';
  if (fullScreen) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
        <p className="text-sm font-medium text-slate-600">{displayMessage}</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-8 text-slate-500 gap-2">
      <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
      <span className="text-sm font-medium text-slate-600">{displayMessage}</span>
    </div>
  );
};
