import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      className="fixed bottom-3 left-3 right-3 sm:left-auto sm:right-4 z-50 flex items-center justify-between gap-2.5 rounded-xl bg-slate-900/95 text-white px-3.5 py-2.5 text-xs font-medium shadow-xl border border-slate-700/60 backdrop-blur-xs animate-in slide-in-from-bottom-2 duration-200"
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
        </span>
        <WifiOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span className="truncate">
          Offline Mode — App phone memory se chal rahi hai.
        </span>
      </div>
      <span className="text-[10px] text-slate-400 font-mono shrink-0">Safe</span>
    </div>
  );
};
