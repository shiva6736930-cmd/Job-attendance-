import React, { useState, useEffect, useRef } from 'react';
import { Clock, Check, ChevronDown } from 'lucide-react';

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
  const [tempManual, setTempManual] = useState(value);
  const [confirmedMessage, setConfirmedMessage] = useState(false);

  // Keep in sync when external value changes
  useEffect(() => {
    const parsed = parseTime(value);
    setSelectedHour(parsed.hour12);
    setSelectedMinute(parsed.minute);
    setSelectedPeriod(parsed.period);
    setTempManual(value);
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

  const handleManualBlurOrOk = () => {
    if (tempManual && tempManual.includes(':')) {
      const [h, m] = tempManual.split(':');
      const cleanH = Math.min(23, Math.max(0, parseInt(h, 10) || 0));
      const cleanM = Math.min(59, Math.max(0, parseInt(m, 10) || 0));
      const result = `${String(cleanH).padStart(2, '0')}:${String(cleanM).padStart(2, '0')}`;
      onChange(result);
      const parsed = parseTime(result);
      setSelectedHour(parsed.hour12);
      setSelectedMinute(parsed.minute);
      setSelectedPeriod(parsed.period);
      setConfirmedMessage(true);
      setTimeout(() => setConfirmedMessage(false), 1200);
      setIsOpen(false);
    }
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
    setTempManual(time24);
    setConfirmedMessage(true);
    setTimeout(() => setConfirmedMessage(false), 1200);
    setIsOpen(false);
  };

  const hoursList = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
  const minutesList = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-1">
        <label htmlFor={id} className="block text-xs font-semibold text-slate-800">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        {confirmedMessage && (
          <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 animate-in fade-in">
            <Check className="w-3 h-3" /> Time Set!
          </span>
        )}
      </div>

      {/* Main Visible Time Selector Box */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          id={id}
          onClick={() => setIsOpen(!isOpen)}
          className={`flex-1 flex items-center justify-between bg-white border ${
            isOpen ? 'border-slate-900 ring-2 ring-slate-900/10' : 'border-slate-300'
          } rounded-lg px-3 py-2 text-sm font-mono font-bold text-slate-900 shadow-2xs hover:border-slate-400 transition cursor-pointer text-left`}
        >
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500 shrink-0" />
            <span className="text-base tracking-wider">{value || '00:00'}</span>
            <span className="text-xs text-slate-500 font-sans font-medium">
              ({selectedHour}:{selectedMinute} {selectedPeriod})
            </span>
          </div>
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Quick OK button right on the input row */}
        <button
          type="button"
          onClick={() => {
            if (isOpen) {
              handleConfirm();
            } else {
              setIsOpen(true);
            }
          }}
          className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white text-xs font-bold rounded-lg transition shadow-xs flex items-center gap-1 shrink-0"
        >
          <Check className="w-3.5 h-3.5" />
          <span>{isOpen ? 'OK' : 'Set'}</span>
        </button>
      </div>

      {/* Dropdown / Modal Picker with OK Button */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-white border border-slate-300 rounded-xl p-3 shadow-xl space-y-3 animate-in fade-in zoom-in-95 duration-100">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-bold text-slate-800">Select Time & Click OK</span>
            <span className="text-xs font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
              {selectedHour}:{selectedMinute} {selectedPeriod} ({get24HourString(selectedHour, selectedMinute, selectedPeriod)})
            </span>
          </div>

          {/* Steppers / Dropdowns */}
          <div className="grid grid-cols-3 gap-2">
            {/* Hour Picker */}
            <div>
              <span className="block text-[10px] uppercase font-semibold text-slate-500 mb-1 text-center">
                Hour
              </span>
              <select
                value={selectedHour}
                onChange={(e) => setSelectedHour(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-center text-sm font-bold text-slate-900 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
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
              <span className="block text-[10px] uppercase font-semibold text-slate-500 mb-1 text-center">
                Minute
              </span>
              <select
                value={selectedMinute}
                onChange={(e) => setSelectedMinute(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-center text-sm font-bold text-slate-900 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
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
              <span className="block text-[10px] uppercase font-semibold text-slate-500 mb-1 text-center">
                AM / PM
              </span>
              <div className="grid grid-cols-2 gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => setSelectedPeriod('AM')}
                  className={`py-1.5 text-xs font-bold rounded-md transition ${
                    selectedPeriod === 'AM'
                      ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  AM
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPeriod('PM')}
                  className={`py-1.5 text-xs font-bold rounded-md transition ${
                    selectedPeriod === 'PM'
                      ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  PM
                </button>
              </div>
            </div>
          </div>

          {/* Quick preset buttons */}
          <div>
            <span className="block text-[10px] text-slate-500 mb-1 font-medium">Quick Times:</span>
            <div className="grid grid-cols-4 gap-1 text-[11px]">
              {presets.map((p) => (
                <button
                  key={p.time24}
                  type="button"
                  onClick={() => handleSelectPreset(p.time24)}
                  className={`p-1 text-center rounded border transition font-mono ${
                    value === p.time24
                      ? 'bg-slate-900 text-white font-bold border-slate-900'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Big Green/Dark OK Button to confirm! */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800 font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-lg transition shadow-xs flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>OK - Select This Time</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
