import React, { useState } from 'react';
import {
  X,
  Database,
  Cloud,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Shield,
  Copy,
  Check,
  User,
  HelpCircle,
} from 'lucide-react';
import { firebaseConfig, signOutFirebase } from '../firebase/firebase';
import { Employee, AttendanceRecord } from '../types/attendance';

interface FirebaseStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  isConnected: boolean;
  isSyncing: boolean;
  cloudSyncError: string | null;
  employees: Employee[];
  attendance: AttendanceRecord[];
  currentUser: any;
  onForceSyncToCloud: () => Promise<void>;
  onPullFromCloud: () => Promise<void>;
}

export const FirebaseStatusModal: React.FC<FirebaseStatusModalProps> = ({
  isOpen,
  onClose,
  isConnected,
  isSyncing,
  cloudSyncError,
  employees,
  attendance,
  currentUser,
  onForceSyncToCloud,
  onPullFromCloud,
}) => {
  const [copiedRules, setCopiedRules] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const RECOMMENDED_RULES = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}`;

  const handleCopyRules = () => {
    navigator.clipboard.writeText(RECOMMENDED_RULES);
    setCopiedRules(true);
    setTimeout(() => setCopiedRules(false), 2500);
  };

  const handlePush = async () => {
    setSyncFeedback('Uploading records to Firebase...');
    try {
      await onForceSyncToCloud();
      setSyncFeedback('✓ Successfully uploaded all records to Firebase! Ab Chrome & any device me dikhega.');
    } catch (err: any) {
      setSyncFeedback(`⚠️ Upload failed: ${err?.message || 'Check Firestore security rules in Firebase Console'}`);
    }
    setTimeout(() => setSyncFeedback(null), 6000);
  };

  const handlePull = async () => {
    setSyncFeedback('Fetching records from Firebase...');
    try {
      await onPullFromCloud();
      setSyncFeedback('✓ Cloud data synchronized from Firebase.');
    } catch (err: any) {
      setSyncFeedback(`⚠️ Sync failed: ${err?.message || 'Check Firestore security rules'}`);
    }
    setTimeout(() => setSyncFeedback(null), 6000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="firebase-modal-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
    >
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[88vh] animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 id="firebase-modal-title" className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Firebase Cloud Synchronization</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                Project: {firebaseConfig.projectId}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 space-y-4 text-xs overflow-y-auto flex-1">
          {/* User Auth Info */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold">
                {currentUser?.email?.slice(0, 1).toUpperCase() || 'U'}
              </div>
              <div>
                <span className="block font-bold text-slate-900 text-xs">
                  {currentUser?.email || currentUser?.displayName || 'Google User'}
                </span>
                <span className="text-[10px] text-emerald-600 font-medium">
                  ✓ Signed in with Google
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => signOutFirebase()}
              className="px-2.5 py-1 text-xs text-red-600 hover:bg-red-50 rounded-md transition font-semibold cursor-pointer border border-red-200"
            >
              Sign Out
            </button>
          </div>

          {/* Sync Actions Box */}
          <div className="p-3.5 bg-slate-900 text-white rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs">Cross-Browser Cloud Sync</span>
              <span className="text-[10px] text-slate-300 font-mono">
                {employees.length} employees · {attendance.length} records
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Brave aur Chrome ke beech data sync karne ke liye niche diya gaya <strong>"Upload to Cloud"</strong> button dabayein:
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={handlePush}
                disabled={isSyncing}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-lg transition disabled:opacity-50 cursor-pointer"
              >
                <Cloud className="w-4 h-4" />
                <span>Upload to Cloud</span>
              </button>
              <button
                type="button"
                onClick={handlePull}
                disabled={isSyncing}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-lg transition disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>Pull Cloud Data</span>
              </button>
            </div>
          </div>

          {syncFeedback && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-xs font-semibold animate-in fade-in">
              {syncFeedback}
            </div>
          )}

          {/* Why Chrome didn't show Brave's data: Firestore Rules Instruction */}
          <div className="p-3.5 bg-amber-50/80 border border-amber-300 rounded-xl space-y-2.5 text-amber-950">
            <div className="flex items-center gap-1.5 font-bold text-xs text-amber-900">
              <Shield className="w-4 h-4 text-amber-700" />
              <span>Brave se Chrome me data kyu nahi dikha? (Fix Guide)</span>
            </div>
            <p className="text-[11px] text-slate-700 leading-relaxed">
              Agar aapne Brave me data banaya aur Chrome me nahi dikh raha, toh iska kaaran yeh hai ki aapke Firebase project (<strong>shiva-shoes-store</strong>) me Firestore Security Rules locked hain aur read/write reject ho raha tha.
            </p>
            <div className="p-2.5 bg-white rounded-lg border border-amber-200 space-y-2">
              <span className="block font-bold text-slate-800 text-[11px]">
                Ise 1 minute me theek karne ke steps:
              </span>
              <ol className="list-decimal pl-4 space-y-1 text-[11px] text-slate-600">
                <li>
                  <a
                    href="https://console.firebase.google.com/project/shiva-shoes-store/firestore/rules"
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 font-bold hover:underline inline-flex items-center gap-1"
                  >
                    <span>Firebase Console Rules Page kholein</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
                <li>Wahan niche diya gaya rule paste karke <strong>Publish</strong> button dabayein:</li>
              </ol>
              <pre className="bg-slate-900 text-slate-200 p-2.5 rounded-md font-mono text-[10px] overflow-x-auto">
{RECOMMENDED_RULES}
              </pre>
              <button
                type="button"
                onClick={handleCopyRules}
                className="w-full py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-md transition flex items-center justify-center gap-1.5 text-xs cursor-pointer border border-slate-300"
              >
                {copiedRules ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedRules ? 'Copied to Clipboard!' : 'Copy Firestore Rules'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>Connected: shiva-shoes-store</span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
