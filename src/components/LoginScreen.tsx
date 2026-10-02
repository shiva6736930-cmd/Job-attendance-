import React, { useState } from 'react';
import { Clock, ShieldCheck, CheckCircle2, AlertCircle, Smartphone, Calendar } from 'lucide-react';
import { signInWithGoogle } from '../firebase/firebase';

interface LoginScreenProps {
  onLoginSuccess?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      if (err?.code === 'auth/popup-closed-by-user') {
        setError('Sign in popup band ho gaya tha. Kripya dubara koshish karein.');
      } else {
        setError(err?.message || 'Google Sign-In safal nahi ho paya. Kripya internet ya permissions check karein.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 py-8 sm:px-6">
      <div className="w-full max-w-sm sm:max-w-md bg-white rounded-2xl shadow-xl border border-slate-200/90 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Brand Header */}
        <div className="bg-slate-900 text-white p-6 sm:p-8 text-center relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="w-12 h-12 rounded-xl bg-white text-slate-900 font-extrabold text-lg flex items-center justify-center mx-auto shadow-md mb-3">
            ST
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">ShiftTrack</h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Personal Attendance & Overtime Tracker
          </p>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="text-center space-y-1.5">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Sign In with Google
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Sabhi users ka attendance aur employee records alag aur 100% private rahenge.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Google Sign In Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full min-h-[48px] py-3 px-4 bg-white border border-slate-300 hover:border-slate-400 hover:bg-slate-50 active:scale-[0.98] rounded-xl shadow-xs text-slate-800 text-sm font-semibold flex items-center justify-center gap-3 transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>{loading ? 'Signing in with Google...' : 'Continue with Google'}</span>
          </button>

          {/* Quick Feature Highlights */}
          <div className="pt-2 border-t border-slate-100 space-y-2 text-[11px] text-slate-600">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Har user ka private database aur attendance history</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Pichli kisi bhi date ka attendance bhulne par backfill karein</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>9h Standard duty + Overtime + Holiday 100% OT calculation</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200/80 text-center text-[11px] text-slate-400">
          Secure Firebase Authentication · shiva-shoes-store
        </div>
      </div>
    </div>
  );
};
