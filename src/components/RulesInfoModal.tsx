import React from 'react';
import { X, Clock, ShieldCheck, Sun, CheckCircle, ArrowRight, IndianRupee, Zap } from 'lucide-react';

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
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
    >
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-150">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 id="rules-modal-title" className="text-sm sm:text-base font-bold text-slate-900">
                सैलरी और ओवरटाइम नियम (Calculation Rules)
              </h3>
              <p className="text-xs text-slate-500">
                ShiftTrack official wage & overtime calculation policy
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-5 space-y-3.5 text-xs text-slate-600 overflow-y-auto flex-1">
          {/* Rule 1: Fixed Salary */}
          <div className="p-3.5 bg-emerald-50/70 rounded-xl border border-emerald-200 space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-950 font-bold text-xs">
              <IndianRupee className="w-4 h-4 text-emerald-700" />
              <span>1. फिक्स सैलरी (Fixed Salary: ₹16,000 / 26 कार्यदिवस)</span>
            </div>
            <p className="text-emerald-900 leading-relaxed">
              महीने की कुल फिक्स सैलरी <strong>₹16,000</strong> होती है, जो <strong>26 कार्यदिवसों (Working Days)</strong> के लिए है (4 संडे की छुट्टियां शामिल नहीं हैं)।
            </p>
            <div className="bg-white p-2.5 rounded-lg border border-emerald-200 flex items-center justify-between font-mono text-[11px] text-slate-800">
              <span>बेस रेट (Daily Base Rate):</span>
              <span className="font-bold text-emerald-900">₹16,000 ÷ 26 = लगभग ₹615.38 / दिन</span>
            </div>
          </div>

          {/* Rule 2: Public Holiday Work */}
          <div className="p-3.5 bg-amber-50/80 rounded-xl border border-amber-300 space-y-1.5">
            <div className="flex items-center gap-2 text-amber-950 font-bold text-xs">
              <Zap className="w-4 h-4 text-amber-600" />
              <span>2. सरकारी छुट्टी का काम (Public Holiday Work / Full Day OT)</span>
            </div>
            <p className="text-amber-900 leading-relaxed">
              यदि किसी सरकारी छुट्टी (जैसे गांधी जयंती, दीवाली आदि) के दिन काम किया जाता है, तो कर्मचारी को:
            </p>
            <div className="bg-white p-2.5 rounded-lg border border-amber-200 space-y-1 font-mono text-[11px] text-slate-800">
              <div className="flex items-center justify-between text-slate-700">
                <span>1. फिक्स डेली सैलरी:</span>
                <span className="font-bold text-slate-900">+₹615.38</span>
              </div>
              <div className="flex items-center justify-between text-slate-700">
                <span>2. कुल ओवरटाइम घंटे:</span>
                <span className="font-bold text-amber-900">+(काम किए गए घंटे × ₹110)</span>
              </div>
              <div className="pt-1 border-t border-slate-100 flex items-center justify-between font-bold text-emerald-800">
                <span>कुल मिला कर:</span>
                <span>दोनों जोड़कर पूरा पैसा दिया जाएगा</span>
              </div>
            </div>
          </div>

          {/* Rule 3: Sunday Work */}
          <div className="p-3.5 bg-orange-50/70 rounded-xl border border-orange-200 space-y-1.5">
            <div className="flex items-center gap-2 text-orange-950 font-bold text-xs">
              <Sun className="w-4 h-4 text-orange-600" />
              <span>3. संडे का काम (Sunday Work - 100% OT Only)</span>
            </div>
            <p className="text-orange-900 leading-relaxed">
              यदि संडे के दिन काम किया जाता है, तो <strong>केवल उस दिन के काम किए गए घंटों का ओवरटाइम (घंटे × ₹110)</strong> जोड़ा जाएगा।
            </p>
            <p className="text-[11px] text-orange-800/90 leading-relaxed italic">
              *संडे का अलग से कोई फिक्स बेस नहीं मिलता, क्योंकि फिक्स सैलरी पहले ही 26 दिनों में कवर होती है, और संडे काम न करने पर भी फिक्स सैलरी ₹16,000 ही रहती है।
            </p>
          </div>

          {/* Rule 4: Regular Working Hours & OT */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
              <Clock className="w-4 h-4 text-slate-700" />
              <span>4. सामान्य दिन का ओवरटाइम (Regular Weekday OT)</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              सामान्य कार्यदिवस पर 9 घंटे की बेसिक ड्यूटी होती है। 9 घंटे 15 मिनट से ऊपर जितना भी अतिरिक्त काम होता है, वह <strong>₹110 प्रति घंटे</strong> की दर से ओवरटाइम में जुड़ता है।
            </p>
          </div>
        </div>

        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition cursor-pointer text-center"
          >
            Samajh Aa Gaya (OK)
          </button>
        </div>
      </div>
    </div>
  );
};
