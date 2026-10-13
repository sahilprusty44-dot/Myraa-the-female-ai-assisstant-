import React from 'react';
import { AlertCircle, X } from 'lucide-react';

interface NotificationBannerProps {
  message: string | null;
  onDismiss: () => void;
}

export const NotificationBanner: React.FC<NotificationBannerProps> = ({ message, onDismiss }) => {
  if (!message) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md animate-in fade-in slide-in-from-top-4 duration-200">
      <div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 backdrop-blur-xl text-rose-200 text-xs shadow-2xl">
        <div className="flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <p className="font-medium leading-relaxed">{message}</p>
        </div>
        <button
          onClick={onDismiss}
          className="p-1 text-rose-400 hover:text-white rounded-lg hover:bg-white/10 shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
