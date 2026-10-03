import React, { useState, useEffect } from 'react';
import { Clock, Check, ChevronDown, CheckCircle2 } from 'lucide-react';

interface TimePickerInputProps {
  id?: string;
  label: string;
  value: string; // "HH:mm" (24-hour format e.g. "09:00" or "18:30")
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
  const [isOpen, setIsOpen] = useState(false);

  // Parse 24h "HH:mm" to 12h representation for easy user picking
  const parseTime = (val: string) => {
    if (!val || !val.includes(':')) {
      return { hour12: '09', minute: '00', period: 'AM' };
    }
    const [hStr, mStr] = val.split(':');
    let h = parseInt(hStr, 10);
    const m = mStr.padStart(2, '0');
    if (isNaN(h)) h = 9;

    const period = h >= 12 ? 'PM' : 'AM';
    let h12 = h % 12;
    if (h12 === 0) h12 = 12;
    return {
      hour12: String(h12).padStart(2, '0'),
      minute: m,
      period,
    };
  };

  const initial = parseTime(value);
  const [selectedHour, setSelectedHour] = useState(initial.hour12);
  const [selectedMinute, setSelectedMinute] = useState(initial.minute);
  const [selectedPeriod, setSelectedPeriod] = useState(initial.period);
  const [confirmedMessage, setConfirmedMessage] = useState(false);

  // Keep in sync when external value changes
  useEffect(() => {
    const parsed = parseTime(value);
    setSelectedHour(parsed.hour12);
    setSelectedMinute(parsed.minute);
    setSelectedPeriod(parsed.period);
  }, [value]);

  // Convert 12h back to 24h "HH:mm"
  const get24HourString = (h12: string, min: string, per: string) => {
    let h = parseInt(h12, 10);
    if (per === 'PM' && h < 12) h += 12;
    if (per === 'AM' && h === 12) h = 0;
    return `${String(h).padStart(2, '0')}:${min.padStart(2, '0')}`;
  };

  // Explicit OK handler
  const handleConfirm = () => {
    const formatted24 = get24HourString(selectedHour, selectedMinute, selectedPeriod);
    onChange(formatted24);
    setConfirmedMessage(true);
    setTimeout(() => setConfirmedMessage(false), 1200);
    setIsOpen(false);
  };

  // Quick presets
  const presets = [
    { label: '08:00 AM', time24: '08:00' },
    { label: '09:00 AM', time24: '09:00' },
    { label: '10:00 AM', time24: '10:00' },
    { label: '01:00 PM', time24: '13:00' },
    { label: '05:00 PM', time24: '17:00' },
    { label: '06:00 PM', time24: '18:00' },
    { label: '07:00 PM', time24: '19:00' },
    { label: '08:00 PM', time24: '20:00' },
  ];

  const handleSelectPreset = (time24: string) => {
    onChange(time24);
    const parsed = parseTime(time24);
    setSelectedHour(parsed.hour12);
    setSelectedMinute(parsed.minute);
    setSelectedPeriod(parsed.period);
    setConfirmedMessage(true);
    setTimeout(() => setConfirmedMessage(false), 1200);
    setIsOpen(false);
  };

  const hoursList = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
  const minutesList = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

  return (
    <div className="relative w-full">
      <div className="flex items-center justify-between mb-1">
        <label htmlFor={id} className="block text-xs font-bold text-slate-800">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        {confirmedMessage && (
          <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1 animate-in fade-in">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Time Set!
          </span>
        )}
      </div>

      {/* Main Visible Time Selector Box */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          id={id}
          onClick={() => setIsOpen(!isOpen)}
          className={`flex-1 min-h-[44px] flex items-center justify-between bg-white border ${
            isOpen ? 'border-slate-900 ring-2 ring-slate-900/10' : 'border-slate-300'
          } rounded-xl px-3 py-2 text-sm font-mono font-bold text-slate-900 shadow-2xs hover:border-slate-400 transition cursor-pointer text-left`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Clock className="w-4 h-4 text-slate-500 shrink-0" />
            <span className="text-sm sm:text-base font-bold tracking-wider text-slate-900 font-mono">
              {value || '09:00'}
            </span>
            <span className="text-[11px] text-slate-500 font-sans font-medium truncate">
              ({selectedHour}:{selectedMinute} {selectedPeriod})
            </span>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {/* Quick Set / OK button right on the input row */}
        <button
          type="button"
          onClick={() => {
            if (isOpen) {
              handleConfirm();
            } else {
              setIsOpen(true);
            }
          }}
          className="min-h-[44px] px-3.5 py-2 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center gap-1 shrink-0 cursor-pointer"
        >
          <Check className="w-3.5 h-3.5" />
          <span>{isOpen ? 'OK' : 'Set'}</span>
        </button>
      </div>

      {/* Dropdown / Modal Picker with Hour, Minute, AM/PM & OK Button */}
      {isOpen && (
        <div className="mt-2 bg-white border border-slate-300 rounded-2xl p-3 shadow-xl space-y-3 z-30 animate-in fade-in zoom-in-95 duration-100">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-bold text-slate-800">
              Select Time & Click OK (समय चुनें)
            </span>
            <span className="text-xs font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
              {selectedHour}:{selectedMinute} {selectedPeriod} ({get24HourString(selectedHour, selectedMinute, selectedPeriod)})
            </span>
          </div>

          {/* Steppers / Dropdowns */}
          <div className="grid grid-cols-3 gap-2">
            {/* Hour Picker */}
            <div>
              <span className="block text-[10px] uppercase font-bold text-slate-500 mb-1 text-center">
                Hour (घंटा)
              </span>
              <select
                value={selectedHour}
                onChange={(e) => setSelectedHour(e.target.value)}
                className="w-full min-h-[40px] bg-slate-50 border border-slate-300 rounded-lg p-2 text-center text-sm font-bold text-slate-900 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
              >
                {hoursList.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>

            {/* Minute Picker */}
            <div>
              <span className="block text-[10px] uppercase font-bold text-slate-500 mb-1 text-center">
                Minute (मिनट)
              </span>
              <select
                value={selectedMinute}
                onChange={(e) => setSelectedMinute(e.target.value)}
                className="w-full min-h-[40px] bg-slate-50 border border-slate-300 rounded-lg p-2 text-center text-sm font-bold text-slate-900 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
              >
                {minutesList.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {/* AM/PM Toggle */}
            <div>
              <span className="block text-[10px] uppercase font-bold text-slate-500 mb-1 text-center">
                AM / PM
              </span>
              <div className="grid grid-cols-2 gap-1 min-h-[40px]">
                <button
                  type="button"
                  onClick={() => setSelectedPeriod('AM')}
                  className={`rounded-lg text-xs font-bold transition flex items-center justify-center cursor-pointer ${
                    selectedPeriod === 'AM'
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  AM
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPeriod('PM')}
                  className={`rounded-lg text-xs font-bold transition flex items-center justify-center cursor-pointer ${
                    selectedPeriod === 'PM'
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  PM
                </button>
              </div>
            </div>
          </div>

          {/* Quick Presets inside picker */}
          <div>
            <span className="block text-[10px] font-semibold text-slate-500 mb-1">
              Quick Pick:
            </span>
            <div className="grid grid-cols-4 gap-1">
              {presets.map((p) => (
                <button
                  type="button"
                  key={p.time24}
                  onClick={() => handleSelectPreset(p.time24)}
                  className={`py-1 text-[11px] font-medium rounded-md border text-center transition cursor-pointer ${
                    value === p.time24
                      ? 'bg-slate-900 text-white border-slate-900 font-bold'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Explicit Confirm Button */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-lg transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition shadow-xs flex items-center gap-1 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Confirm & Set OK</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
