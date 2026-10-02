import React, { useState, useEffect } from 'react';
import { X, Clock, Calendar, AlertCircle, CheckCircle2, Zap, Sun, UserPlus } from 'lucide-react';
import { Employee, AttendanceRecord } from '../types/attendance';
import { calculateAttendanceHours, formatDateDisplay, formatMinutes, getTodayString } from '../utils/calculator';
import { TimePickerInput } from './TimePickerInput';

interface AttendanceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  initialRecord?: AttendanceRecord | null;
  onSave: (recordData: Omit<AttendanceRecord, 'id' | 'createdAt' | 'updatedAt'>, recordId?: string) => void;
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
      setEmployeeId(defaultEmployeeId && defaultEmployeeId !== 'all' ? defaultEmployeeId : employees[0]?.id || '');
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

  // Quick preset shortcuts
  const applyPreset = (presetIn: string, presetOut: string) => {
    setTimeIn(presetIn);
    setTimeOut(presetOut);
  };

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

    // Always close immediately so the user sees the saved entry on the main screen
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="attendance-modal-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
    >
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div>
            <h3 id="attendance-modal-title" className="text-base font-bold text-slate-900">
              {initialRecord ? 'Edit Attendance Record' : 'Log Daily Attendance'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter clock times. Overtime & Sunday rules calculate automatically.
            </p>
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

        {/* Modal Form */}
        {employees.length === 0 ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 bg-slate-100 text-slate-700 rounded-full flex items-center justify-center mx-auto">
              <UserPlus className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">No Employees Found</h4>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Pehle employee add karein jiska attendance record karna hai.
            </p>
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onOpenAddEmployee) onOpenAddEmployee();
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs transition"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Add New Employee</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Employee Selector */}
            <div>
              <label htmlFor="modal-employee-select" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Employee Name <span className="text-red-500">*</span>
              </label>
              <select
                id="modal-employee-select"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition"
                required
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} — {emp.role}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Picker */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="modal-date-picker" className="block text-xs font-semibold text-slate-700">
                  Shift Date <span className="text-red-500">*</span>
                </label>
                {dateInfo.dayOfWeek && (
                  <span
                    className={`text-xs font-medium ${
                      dateInfo.isSunday ? 'text-amber-700 font-semibold' : 'text-slate-500'
                    }`}
                  >
                    {dateInfo.dayOfWeek} {dateInfo.isSunday ? '(Sunday OT Rule)' : ''}
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  id="modal-date-picker"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition font-mono"
                  required
                />
              </div>
            </div>

            {/* Shift Type Button: Regular Shift vs Full Day OT / Holiday */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Shift Type (Duty Rule)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setIsFullDayOt(false)}
                  className={`py-2.5 px-3 text-xs font-semibold rounded-lg border transition text-center cursor-pointer ${
                    !isFullDayOt
                      ? 'bg-slate-900 text-white border-slate-900 shadow-2xs font-bold'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  Regular (9h Basic + OT)
                </button>
                <button
                  type="button"
                  onClick={() => setIsFullDayOt(true)}
                  className={`py-2.5 px-3 text-xs font-semibold rounded-lg border transition text-center flex items-center justify-center gap-1.5 cursor-pointer ${
                    isFullDayOt
                      ? 'bg-amber-600 text-white border-amber-600 shadow-2xs font-bold'
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
                  : '⚡ Normal day: 9 ghante Basic duty + baaki extra time Overtime (OT).'}
              </p>
            </div>

            {/* Time In & Time Out with Explicit OK Button */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TimePickerInput
                id="modal-time-in"
                label="Time In"
                value={timeIn}
                onChange={(newTime) => setTimeIn(newTime)}
                required
              />
              <TimePickerInput
                id="modal-time-out"
                label="Time Out"
                value={timeOut}
                onChange={(newTime) => setTimeOut(newTime)}
                required
              />
            </div>

            {/* Quick Shift Presets */}
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">
                Common Shifts (Click to apply):
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                <button
                  type="button"
                  onClick={() => applyPreset('09:00', '18:00')}
                  className="text-center px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium rounded-md transition border border-slate-200"
                >
                  09:00 – 18:00 (9h)
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('08:00', '17:00')}
                  className="text-center px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium rounded-md transition border border-slate-200"
                >
                  08:00 – 17:00 (9h)
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('09:00', '20:00')}
                  className="text-center px-2 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-semibold rounded-md transition border border-amber-200"
                >
                  09:00 – 20:00 (+2h OT)
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('08:50', '17:45')}
                  className="text-center px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium rounded-md transition border border-slate-200"
                >
                  08:50 – 17:45 (Buffer)
                </button>
              </div>
            </div>

          {/* Live Calculation Preview Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs border-b border-slate-200 pb-2">
              <span className="font-medium text-slate-600 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Total Duration
              </span>
              <span className="font-bold text-slate-900 font-mono tabular-nums">
                {formatMinutes(calc.totalMinutes)} ({calc.isOvernight ? 'Crosses midnight' : (calc.totalMinutes / 60).toFixed(2) + ' hrs'})
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200/80">
                <span className="text-[11px] text-slate-500 block uppercase font-medium">Basic Hours</span>
                <span className="text-lg font-bold text-slate-900 font-mono tabular-nums">
                  {calc.basicHours.toFixed(1)} <span className="text-xs font-normal text-slate-500">hrs</span>
                </span>
                <span className="text-[10px] text-slate-400 block truncate">
                  {calc.isSunday ? '0 on Sundays' : 'Max 9.0h shift'}
                </span>
              </div>

              <div className={`p-2.5 rounded-lg border ${calc.otHours > 0 ? 'bg-amber-50/80 border-amber-200' : 'bg-white border-slate-200/80'}`}>
                <span className="text-[11px] text-amber-800 block uppercase font-semibold flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-600" /> Overtime (OT)
                </span>
                <span className="text-lg font-bold text-amber-900 font-mono tabular-nums">
                  {calc.otHours.toFixed(1)} <span className="text-xs font-normal text-amber-800">hrs</span>
                </span>
                <span className="text-[10px] text-amber-700 block truncate">
                  {calc.otMinutes > 0 ? formatMinutes(calc.otMinutes) + ' overtime' : 'No overtime'}
                </span>
              </div>
            </div>

            {/* Rule Applied Explanation Box */}
            <div className="text-[11px] text-slate-600 bg-white/80 p-2 rounded-md border border-slate-200/60 flex items-start gap-1.5">
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
            <label htmlFor="modal-notes" className="block text-xs font-semibold text-slate-700 mb-1">
              Notes (Optional)
            </label>
            <input
              id="modal-notes"
              type="text"
              placeholder="e.g., Client site visit, warehouse delivery, half-day"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition"
            />
          </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 text-xs sm:text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 active:scale-95 disabled:opacity-50 rounded-lg transition shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                {isSubmitting ? (
                  <span>Saving...</span>
                ) : (
                  <span>{initialRecord ? 'Save Changes' : 'Save Attendance'}</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
