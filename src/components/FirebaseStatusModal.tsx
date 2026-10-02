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
  LogIn,
  LogOut,
  User,
} from 'lucide-react';
import { firebaseConfig, signInWithGoogle, signOutFirebase } from '../firebase/firebase';
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
  const [copied, setCopied] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopyConfig = () => {
    navigator.clipboard.writeText(JSON.stringify(firebaseConfig, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePush = async () => {
    setSyncFeedback('Uploading records to Firebase...');
    try {
      await onForceSyncToCloud();
      setSyncFeedback('Successfully uploaded all records to Firebase!');
    } catch (err: any) {
      setSyncFeedback(`Sync note: ${err?.message || 'Check Firestore security rules'}`);
    }
    setTimeout(() => setSyncFeedback(null), 4000);
  };

  const handlePull = async () => {
    setSyncFeedback('Fetching records from Firebase...');
    try {
      await onPullFromCloud();
      setSyncFeedback('Cloud data synchronized.');
    } catch (err: any) {
      setSyncFeedback(`Sync note: ${err?.message || 'Check Firestore security rules'}`);
    }
    setTimeout(() => setSyncFeedback(null), 4000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="firebase-modal-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
    >
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 id="firebase-modal-title" className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Firebase Connection</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </h3>
              <p className="text-xs text-slate-500">
                Connected to <strong className="text-slate-800 font-mono">shiva-shoes-store</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          {/* Status Box */}
          <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-xl flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-emerald-950 text-xs">Firebase SDK Initialized & Connected</h4>
              <p className="text-emerald-800 text-[11px] mt-0.5 leading-relaxed">
                Your application is actively configured with your Firebase credentials. Changes made to employees and attendance records are mirrored to your Firebase Firestore and Realtime Database collections.
              </p>
            </div>
          </div>

          {cloudSyncError && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2 text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-[11px]">
                <strong className="block font-semibold">Cloud Sync Note:</strong>
                <span>{cloudSyncError}. Local storage is fully active as safe fallback. Make sure Firestore rules allow read/write in your Firebase Console.</span>
              </div>
            </div>
          )}

          {syncFeedback && (
            <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 text-[11px] font-medium animate-in fade-in">
              {syncFeedback}
            </div>
          )}

          {/* Project Details */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2 font-mono text-[11px]">
            <div className="flex items-center justify-between text-slate-600">
              <span className="font-sans font-medium text-slate-500">Project ID:</span>
              <span className="font-bold text-slate-900">{firebaseConfig.projectId}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span className="font-sans font-medium text-slate-500">Auth Domain:</span>
              <span className="text-slate-800">{firebaseConfig.authDomain}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span className="font-sans font-medium text-slate-500">Database URL:</span>
              <span className="text-slate-800 truncate max-w-[240px]">{firebaseConfig.databaseURL}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span className="font-sans font-medium text-slate-500">Active Records:</span>
              <span className="font-bold text-slate-900">{employees.length} employees · {attendance.length} shifts</span>
            </div>
          </div>

          {/* Cloud Sync Actions */}
          <div className="space-y-2 pt-1">
            <span className="font-semibold text-slate-700 block">Cloud Synchronization Actions</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handlePush}
                disabled={isSyncing}
                className="flex items-center justify-center gap-1.5 p-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold transition disabled:opacity-50"
              >
                <Cloud className="w-3.5 h-3.5" />
                <span>Upload to Firebase</span>
              </button>
              <button
                type="button"
                onClick={handlePull}
                disabled={isSyncing}
                className="flex items-center justify-center gap-1.5 p-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 rounded-lg font-semibold transition disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>Pull from Cloud</span>
              </button>
            </div>
          </div>

          {/* User Auth Section if they use Firebase Auth */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-slate-600">
                <User className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="block font-semibold text-slate-900 text-xs">
                  {currentUser ? currentUser.email || currentUser.displayName || 'Authenticated User' : 'Anonymous / Guest Mode'}
                </span>
                <span className="text-[10px] text-slate-500">
                  {currentUser ? 'Signed in to Firebase' : 'Sign in if your Firebase rules require authentication'}
                </span>
              </div>
            </div>

            {currentUser ? (
              <button
                type="button"
                onClick={() => signOutFirebase()}
                className="px-2.5 py-1 text-xs text-red-600 hover:bg-red-50 rounded-md transition font-medium"
              >
                Sign Out
              </button>
            ) : (
              <button
                type="button"
                onClick={() => signInWithGoogle().catch(() => {})}
                className="px-2.5 py-1 text-xs font-semibold text-slate-800 bg-white border border-slate-300 hover:bg-slate-100 rounded-md transition"
              >
                Google Sign In
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50/70 flex items-center justify-between text-xs text-slate-500">
          <button
            type="button"
            onClick={handleCopyConfig}
            className="text-slate-600 hover:text-slate-900 font-medium inline-flex items-center gap-1"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Config Copied' : 'Copy Firebase Config'}</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
