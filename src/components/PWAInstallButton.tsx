import React, { useState } from 'react';
import { Download, Smartphone, X, Share2, PlusSquare, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  // If already running as an installed PWA on home screen, hide
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    setIsInstalling(true);
    try {
      await install();
    } finally {
      setIsInstalling(false);
    }
  };

  // Chromium / Android / Desktop flow (beforeinstallprompt is ready)
  if (isInstallable) {
    return (
      <button
        onClick={handleInstallClick}
        disabled={isInstalling}
        title="Install ShiftTrack App on your phone/desktop"
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition active:scale-95 cursor-pointer"
      >
        <Download className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Install App</span>
        <span className="sm:hidden">Install</span>
      </button>
    );
  }

  // iOS Safari flow (beforeinstallprompt is not supported by WebKit)
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          title="Add ShiftTrack App to your iPhone / iPad Home Screen"
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition active:scale-95 cursor-pointer"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Add to Home</span>
          <span className="sm:hidden">App</span>
        </button>

        {showIOSGuide && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/70 backdrop-blur-xs p-3 sm:p-4"
          >
            <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl border border-slate-200 animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                    ST
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Install ShiftTrack</h3>
                    <p className="text-[11px] text-slate-500">iPhone / iPad Home Screen</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-3.5 space-y-2.5 text-xs text-slate-700">
                <div className="flex items-start gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <div className="w-6 h-6 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                    1
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 flex items-center gap-1">
                      Tap <Share2 className="w-3.5 h-3.5 text-blue-600 inline" /> Share button
                    </p>
                    <p className="text-[11px] text-slate-500">Safari browser toolbar ke bottom me Share icon dabayein.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <div className="w-6 h-6 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                    2
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 flex items-center gap-1">
                      Tap <PlusSquare className="w-3.5 h-3.5 text-slate-700 inline" /> Add to Home Screen
                    </p>
                    <p className="text-[11px] text-slate-500">Scroll down karke 'Add to Home Screen' select karein.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-emerald-900 font-medium">
                    Ab ShiftTrack aapke phone me bilkul native Android/iOS app ki tarah offline chalega!
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-4 w-full rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition cursor-pointer"
              >
                Theek Hai (Got it)
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Fallback button if user wants to install or learn how to install
  return (
    <button
      onClick={() => {
        alert('App ko phone me install karne ke liye browser menu (3-dots) me jakar "Add to Home Screen" ya "Install App" par click karein.');
      }}
      title="Install App"
      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition active:scale-95 cursor-pointer"
    >
      <Download className="w-3.5 h-3.5 text-emerald-600" />
      <span className="hidden sm:inline">Install App</span>
      <span className="sm:hidden">Install</span>
    </button>
  );
};

export const OfflineIndicator: React.FC = () => {
  return null;
};
