import React, { useState } from 'react';
import { Clock, Check } from 'lucide-react';

interface TimePickerInputProps {
  id?: string;
  label: string;
  value: string; // "HH:mm" (24-hour format e.g. "09:00" or "18:00")
  onChange: (timeStr: string) => void;
  required?: boolean;
}

export const TimePickerInput: React.FC<TimePickerInputProps> = ({
  id,
  label,
  value,
  onChange,
  required,
}) => {
  // Convert "HH:mm" 24h to 12h display
  const format12h = (val: string) => {
    if (!val || !val.includes(':')) return '09:00 AM';
    const [hStr, mStr] = val.split(':');
    let h = parseInt(hStr, 10);
    if (isNaN(h)) h = 9;
    const m = mStr.padStart(2, '0');
    const period = h >= 12 ? 'PM' : 'AM';
    let h12 = h % 12;
    if (h12 === 0) h12 = 12;
    return `${String(h12).padStart(2, '0')}:${m} ${period}`;
  };

  return (
    <div className="space-y-1 w-full">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="block text-xs font-bold text-slate-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <span className="text-[11px] font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
          {format12h(value)}
        </span>
      </div>

      {/* Mobile-Friendly Native Time Input with Custom Shell */}
      <div className="relative flex items-center">
        <div className="absolute left-3 text-slate-400 pointer-events-none flex items-center">
          <Clock className="w-4 h-4" />
        </div>
        <input
          id={id}
          type="time"
          value={value}
          onChange={(e) => {
            if (e.target.value) {
              onChange(e.target.value);
            }
          }}
          required={required}
          className="w-full min-h-[44px] bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-base sm:text-sm font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition cursor-pointer"
        />
      </div>
    </div>
  );
};
