import React from 'react';
import { X, Clock, ShieldCheck, Sun, CheckCircle, ArrowRight } from 'lucide-react';

interface RulesInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesInfoModal: React.FC<RulesInfoModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="rules-modal-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
    >
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 id="rules-modal-title" className="text-base font-bold text-slate-900">
                Shift & Overtime Calculation Rules
              </h3>
              <p className="text-xs text-slate-500">
                Official automated calculation logic implemented in this system
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

        <div className="p-5 space-y-4 text-xs text-slate-600 max-h-[75vh] overflow-y-auto">
          {/* Rule 1: Standard Shift */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
            <div className="flex items-center gap-2 text-slate-900 font-semibold text-xs">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>1. Standard Shift (9 Hours)</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              A standard workday duty is calibrated at exactly <strong>9 hours</strong> (540 minutes).
              On normal working days (Monday through Saturday), up to 9 hours are classified as Basic Duty Hours.
            </p>
          </div>

          {/* Rule 2: Buffer / Grace Period */}
          <div className="p-3.5 bg-sky-50/60 rounded-xl border border-sky-200/80 space-y-1.5">
            <div className="flex items-center gap-2 text-sky-950 font-semibold text-xs">
              <CheckCircle className="w-4 h-4 text-sky-600" />
              <span>2. Buffer / Grace Period (8h 45m – 9h 15m)</span>
            </div>
            <p className="text-sky-900 leading-relaxed">
              If the total worked duration falls between <strong>8 hours 45 minutes</strong> and <strong>9 hours 15 minutes</strong>,
              it is automatically rounded to count as exactly:
            </p>
            <div className="bg-white p-2 rounded-lg border border-sky-200 flex items-center justify-between font-mono text-[11px] text-slate-800">
              <span>Worked: 8h 45m ~ 9h 15m</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-bold text-sky-800">Basic: 9.0h | Overtime: 0.0h</span>
            </div>
          </div>

          {/* Rule 3: Regular Overtime */}
          <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200/80 space-y-1.5">
            <div className="flex items-center gap-2 text-amber-950 font-semibold text-xs">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>3. Regular Overtime (&gt; 9h 15m)</span>
            </div>
            <p className="text-amber-900 leading-relaxed">
              Any shift duration extending beyond <strong>9 hours 15 minutes</strong> counts the standard 9 hours as Basic Duty,
              and the excess is added directly to Overtime (OT).
            </p>
            <div className="bg-white p-2 rounded-lg border border-amber-200 flex items-center justify-between font-mono text-[11px] text-slate-800">
              <span>e.g., 10 hours worked</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-bold text-amber-800">Basic: 9.0h | Overtime: 1.0h</span>
            </div>
          </div>

          {/* Rule 4: Sunday Rule */}
          <div className="p-3.5 bg-orange-50/60 rounded-xl border border-orange-200/80 space-y-1.5">
            <div className="flex items-center gap-2 text-orange-950 font-semibold text-xs">
              <Sun className="w-4 h-4 text-orange-600" />
              <span>4. Sunday Special Rule (100% Overtime)</span>
            </div>
            <p className="text-orange-900 leading-relaxed">
              If the shift falls on a <strong>Sunday</strong>, Basic Duty Hours are set to <strong>0</strong>,
              and the <strong>entire duration worked is counted directly as Overtime (OT)</strong>.
            </p>
            <div className="bg-white p-2 rounded-lg border border-orange-200 flex items-center justify-between font-mono text-[11px] text-slate-800">
              <span>e.g., Sunday 8 hours worked</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-bold text-orange-800">Basic: 0.0h | Overtime: 8.0h</span>
            </div>
          </div>

          {/* Under Shift */}
          <div className="p-3 bg-slate-100 rounded-lg text-[11px] text-slate-600 space-y-1">
            <span className="font-semibold text-slate-700 block">Partial / Under-duration Shift (&lt; 8h 45m):</span>
            <p>
              When a worker clocks less than 8 hours 45 minutes on a regular day, they receive actual hours worked credited to Basic Hours, with 0 Overtime.
            </p>
          </div>
        </div>

        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
};
