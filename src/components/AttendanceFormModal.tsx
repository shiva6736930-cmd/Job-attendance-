import React, { useState, useEffect } from 'react';
import {
  X,
  Clock,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Zap,
  Sun,
  UserPlus,
  IndianRupee,
} from 'lucide-react';
import { Employee, AttendanceRecord } from '../types/attendance';
import {
  calculateAttendanceHours,
  formatDateDisplay,
  formatMinutes,
  getTodayString,
} from '../utils/calculator';
import { TimePickerInput } from './TimePickerInput';

interface AttendanceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  initialRecord?: AttendanceRecord | null;
  onSave: (
    recordData: Omit<AttendanceRecord, 'id' | 'createdAt' | 'updatedAt'>,
    recordId?: string
  ) => void;
  defaultEmployeeId?: string;
  onOpenAddEmployee?: () => void;
}

export const AttendanceFormModal: React.FC<AttendanceFormModalProps> = ({
  isOpen,
  onClose,
  employees,
  initialRecord,
  onSave,
  defaultEmployeeId,
  onOpenAddEmployee,
}) => {
  const [employeeId, setEmployeeId] = useState<string>(
    initialRecord?.employeeId || defaultEmployeeId || (employees[0]?.id ?? '')
  );
  const [date, setDate] = useState<string>(initialRecord?.date || getTodayString());
  const [timeIn, setTimeIn] = useState<string>(initialRecord?.timeIn || '09:00');
  const [timeOut, setTimeOut] = useState<string>(initialRecord?.timeOut || '18:00');
  const [notes, setNotes] = useState<string>(initialRecord?.notes || '');
  const [isFullDayOt, setIsFullDayOt] = useState<boolean>(initialRecord?.isFullDayOt || false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync state when editing or reopening
  useEffect(() => {
    if (initialRecord) {
      setEmployeeId(initialRecord.employeeId);
      setDate(initialRecord.date);
      setTimeIn(initialRecord.timeIn);
      setTimeOut(initialRecord.timeOut);
      setNotes(initialRecord.notes || '');
      setIsFullDayOt(Boolean(initialRecord.isFullDayOt));
    } else {
      setEmployeeId(
        defaultEmployeeId && defaultEmployeeId !== 'all'
          ? defaultEmployeeId
          : employees[0]?.id || ''
      );
      setDate(getTodayString());
      setTimeIn('09:00');
      setTimeOut('18:00');
      setNotes('');
      setIsFullDayOt(false);
    }
    setErrorMessage('');
    setIsSubmitting(false);
  }, [initialRecord, isOpen, defaultEmployeeId, employees]);

  if (!isOpen) return null;

  // Live calculation preview
  const calc = calculateAttendanceHours(date, timeIn, timeOut, isFullDayOt);
  const dateInfo = formatDateDisplay(date);
  const selectedEmp = employees.find((e) => e.id === employeeId);

  // Wage estimation for this shift
  const dailyRate =
    selectedEmp?.dailyRate ??
    (selectedEmp?.standardWorkingDays && selectedEmp?.monthlyFixedSalary
      ? Math.round((selectedEmp.monthlyFixedSalary / selectedEmp.standardWorkingDays) * 100) / 100
      : 615.38);
  const otRate = selectedEmp?.otHourlyRate ?? 110;

  let estimatedShiftPay = 0;
  if (calc.isSunday) {
    // Sunday: Only OT hours
    estimatedShiftPay = calc.otHours * otRate;
  } else if (calc.isFullDayOt) {
    // Holiday: Fixed daily salary + OT hours
    estimatedShiftPay = dailyRate + calc.otHours * otRate;
  } else {
    // Regular: Daily base + extra OT hours
    estimatedShiftPay = dailyRate + calc.otHours * otRate;
  }

  // Quick preset shortcuts
  const applyPreset = (presetIn: string, presetOut: string) => {
    setTimeIn(presetIn);
    setTimeOut(presetOut);
  };

  // Quick Date Helpers
  const getRelativeDateStr = (daysAgo: number) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const todayStr = getTodayString();
  const yesterdayStr = getRelativeDateStr(1);
  const twoDaysAgoStr = getRelativeDateStr(2);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!employeeId) {
      setErrorMessage('Please select an employee.');
      return;
    }
    if (!date) {
      setErrorMessage('Please select a date.');
      return;
    }
    if (!timeIn || !timeOut) {
      setErrorMessage('Please specify both Time In and Time Out.');
      return;
    }
    if (calc.totalMinutes <= 0) {
      setErrorMessage('Shift duration must be greater than 0.');
      return;
    }

    setIsSubmitting(true);
    onSave(
      {
        employeeId,
        date,
        timeIn,
        timeOut,
        totalMinutes: calc.totalMinutes,
        basicMinutes: calc.basicMinutes,
        otMinutes: calc.otMinutes,
        basicHours: calc.basicHours,
        otHours: calc.otHours,
        isSunday: calc.isSunday,
        isFullDayOt: calc.isFullDayOt,
        notes: notes.trim(),
        ruleExplanation: calc.ruleExplanation,
      },
      initialRecord?.id
    );

    // Close modal
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="attendance-modal-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
    >
      {/* Modal Container: Bottom sheet on mobile, centered modal on desktop */}
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] sm:max-h-[88vh] overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-4 py-3 sm:px-5 sm:py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 id="attendance-modal-title" className="text-sm sm:text-base font-bold text-slate-900">
                {initialRecord ? 'Edit Attendance' : 'Log Attendance (हाजिरी भरें)'}
              </h3>
              <p className="text-[11px] text-slate-500">
                Time In / Out, Past Date selection & Overtime
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

        {/* Modal Body */}
        {employees.length === 0 ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 bg-slate-100 text-slate-700 rounded-full flex items-center justify-center mx-auto">
              <UserPlus className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">Koi Employee Add Nahi Hai</h4>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Pehle employee add karein jiska attendance record karna hai.
            </p>
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onOpenAddEmployee) onOpenAddEmployee();
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs transition cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Add New Employee</span>
            </button>
          </div>
        ) : (
          <form
            id="attendance-form"
            onSubmit={handleSubmit}
            className="flex-1 overflow-y-auto px-4 py-3 sm:px-5 sm:py-4 space-y-3.5"
          >
            {errorMessage && (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Employee Selector */}
            <div>
              <label htmlFor="modal-employee-select" className="block text-xs font-bold text-slate-700 mb-1">
                Employee (कर्मचारी चुनें) <span className="text-red-500">*</span>
              </label>
              <select
                id="modal-employee-select"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="w-full min-h-[44px] bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 transition cursor-pointer"
                required
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} — {emp.role} (₹{emp.dailyRate ?? 615}/day)
                  </option>
                ))}
              </select>
            </div>

            {/* Date & Day Selection (Mobile-Optimized with Past Date Buttons) */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <label htmlFor="modal-date-picker" className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-600" />
                  <span>Shift Date & Day (तारीख और दिन)</span>
                </label>
                <span className="text-[10px] text-slate-500">
                  {date === todayStr ? 'Today' : 'Past Date'}
                </span>
              </div>

              {/* 3 Quick 1-Tap Date Pills: Today, Yesterday, 2 Days Ago */}
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => setDate(todayStr)}
                  className={`min-h-[40px] py-2 px-2 text-xs rounded-lg border transition text-center cursor-pointer flex flex-col items-center justify-center ${
                    date === todayStr
                      ? 'bg-slate-900 text-white border-slate-900 font-bold shadow-2xs'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  <span className="font-bold text-xs">Today (आज)</span>
                  <span className="text-[10px] opacity-75">Current</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDate(yesterdayStr)}
                  className={`min-h-[40px] py-2 px-2 text-xs rounded-lg border transition text-center cursor-pointer flex flex-col items-center justify-center ${
                    date === yesterdayStr
                      ? 'bg-slate-900 text-white border-slate-900 font-bold shadow-2xs'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  <span className="font-bold text-xs">Yesterday (कल)</span>
                  <span className="text-[10px] opacity-75">1 Day Ago</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDate(twoDaysAgoStr)}
                  className={`min-h-[40px] py-2 px-2 text-xs rounded-lg border transition text-center cursor-pointer flex flex-col items-center justify-center ${
                    date === twoDaysAgoStr
                      ? 'bg-slate-900 text-white border-slate-900 font-bold shadow-2xs'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  <span className="font-bold text-xs">2 Days Ago</span>
                  <span className="text-[10px] opacity-75">Parso</span>
                </button>
              </div>

              {/* Native Calendar Picker for ANY past date */}
              <div>
                <label htmlFor="modal-date-picker" className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Or pick any calendar date (या पुरानी तारीख चुनें):
                </label>
                <div className="relative">
                  <input
                    id="modal-date-picker"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full min-h-[44px] bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 transition font-mono cursor-pointer"
                    required
                  />
                </div>
              </div>

              {/* Prominent Day of the Week Display Card */}
              <div className="p-2.5 bg-white rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>Selected: <strong>{dateInfo.dayOfWeek}</strong> ({dateInfo.formatted})</span>
                </div>
                {dateInfo.isSunday ? (
                  <span className="text-[10px] font-bold bg-orange-100 text-orange-950 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <Sun className="w-3 h-3 text-orange-600" />
                    Sunday OT
                  </span>
                ) : (
                  <span className="text-[10px] font-medium text-slate-500">
                    Normal Day
                  </span>
                )}
              </div>
            </div>

            {/* Shift Type Button: Regular vs Full Day OT / Holiday */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Shift Type (ड्यूटी का प्रकार)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setIsFullDayOt(false)}
                  className={`min-h-[44px] py-2 px-3 text-xs font-bold rounded-xl border transition text-center cursor-pointer ${
                    !isFullDayOt
                      ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  Regular (9h Base + OT)
                </button>
                <button
                  type="button"
                  onClick={() => setIsFullDayOt(true)}
                  className={`min-h-[44px] py-2 px-3 text-xs font-bold rounded-xl border transition text-center flex items-center justify-center gap-1.5 cursor-pointer ${
                    isFullDayOt
                      ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                      : 'bg-amber-50/70 text-amber-900 border-amber-300 hover:bg-amber-100'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>Poora Day OT / Holiday</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                {isFullDayOt
                  ? '⚡ Holiday/Off-day: Poora time direct Overtime (OT) count hoga (Basic = 0h).'
                  : dateInfo.isSunday
                  ? '⚡ Sunday: Automatic 100% Overtime count hoga.'
                  : '⚡ Normal day: 9h Basic duty + baaki extra time Overtime (OT).'}
              </p>
            </div>

            {/* Time In & Time Out Inputs (Clean Mobile Layout) */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2.5">
              <span className="block text-xs font-bold text-slate-800">
                Duty Timing (आने और जाने का समय)
              </span>

              <div className="grid grid-cols-2 gap-2.5">
                <TimePickerInput
                  id="modal-time-in"
                  label="Time In (आने का समय)"
                  value={timeIn}
                  onChange={(newTime) => setTimeIn(newTime)}
                  required
                />
                <TimePickerInput
                  id="modal-time-out"
                  label="Time Out (जाने का समय)"
                  value={timeOut}
                  onChange={(newTime) => setTimeOut(newTime)}
                  required
                />
              </div>

              {/* Quick Shift Presets */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Common Shifts (1-Click to set):
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => applyPreset('09:00', '18:00')}
                    className="py-1.5 px-2 bg-white hover:bg-slate-100 text-slate-800 text-xs font-semibold rounded-lg transition border border-slate-200 text-center"
                  >
                    09:00 – 18:00 (9h Shift)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('08:00', '17:00')}
                    className="py-1.5 px-2 bg-white hover:bg-slate-100 text-slate-800 text-xs font-semibold rounded-lg transition border border-slate-200 text-center"
                  >
                    08:00 – 17:00 (9h Shift)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('09:00', '20:00')}
                    className="py-1.5 px-2 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-semibold rounded-lg transition border border-amber-200 text-center"
                  >
                    09:00 – 20:00 (+2h OT)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('09:00', '21:00')}
                    className="py-1.5 px-2 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-semibold rounded-lg transition border border-amber-200 text-center"
                  >
                    09:00 – 21:00 (+3h OT)
                  </button>
                </div>
              </div>
            </div>

            {/* Live Calculation & Wage Estimation Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between text-xs border-b border-slate-200 pb-2">
                <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  Total Duration:
                </span>
                <span className="font-bold text-slate-900 font-mono text-sm">
                  {formatMinutes(calc.totalMinutes)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 block uppercase font-medium">Basic Hours</span>
                  <span className="text-base font-bold text-slate-900 font-mono">
                    {calc.basicHours.toFixed(1)}h
                  </span>
                  <span className="text-[10px] text-slate-400 block truncate">
                    {calc.isSunday ? '0 on Sunday' : '9.0h standard'}
                  </span>
                </div>

                <div
                  className={`p-2.5 rounded-lg border ${
                    calc.otHours > 0 ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200'
                  }`}
                >
                  <span className="text-[10px] text-amber-800 block uppercase font-semibold flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-600" /> Overtime (OT)
                  </span>
                  <span className="text-base font-bold text-amber-900 font-mono">
                    +{calc.otHours.toFixed(1)}h
                  </span>
                  <span className="text-[10px] text-amber-700 block truncate">
                    @ ₹{otRate}/hour
                  </span>
                </div>
              </div>

              {/* Estimated Shift Pay Badge */}
              <div className="bg-emerald-50 border border-emerald-200/80 rounded-lg p-2 flex items-center justify-between text-xs">
                <span className="text-emerald-800 font-medium">
                  इस शिफ्ट की अनुमानित कमाई:
                </span>
                <span className="font-mono font-bold text-emerald-950 text-sm">
                  ₹{Math.round(estimatedShiftPay)}
                </span>
              </div>

              {/* Explanation Note */}
              <div className="text-[11px] text-slate-600 bg-white/80 p-2 rounded-md border border-slate-200 flex items-start gap-1.5">
                {calc.isSunday ? (
                  <Sun className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                )}
                <span>{calc.ruleExplanation}</span>
              </div>
            </div>

            {/* Notes Input */}
            <div>
              <label htmlFor="modal-notes" className="block text-xs font-bold text-slate-700 mb-1">
                Notes / Remark (वैकल्पिक)
              </label>
              <input
                id="modal-notes"
                type="text"
                placeholder="e.g., Gandhi Jayanti holiday duty, half-day, delivery"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full min-h-[40px] bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 transition"
              />
            </div>
          </form>
        )}

        {/* Sticky Mobile Bottom Action Bar */}
        {employees.length > 0 && (
          <div className="px-4 py-3 border-t border-slate-200 bg-white flex items-center justify-between gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 min-h-[44px] py-2.5 px-3 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="attendance-form"
              disabled={isSubmitting}
              className="flex-2 min-h-[44px] py-2.5 px-4 text-xs sm:text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 active:scale-98 disabled:opacity-50 rounded-xl shadow-xs transition cursor-pointer text-center flex items-center justify-center gap-1.5"
            >
              {isSubmitting ? (
                <span>Saving...</span>
              ) : (
                <span>{initialRecord ? 'Save Changes' : 'Save Attendance (हाजिरी सेव करें)'}</span>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
