import { CalculationResult } from '../types/attendance';

/**
 * Checks whether a YYYY-MM-DD date falls on a Sunday.
 * Avoids timezone off-by-one by splitting components.
 */
export function isDateSunday(dateString: string): boolean {
  if (!dateString) return false;
  const parts = dateString.split('-').map(Number);
  if (parts.length !== 3) return false;
  const [year, month, day] = parts;
  const dateObj = new Date(year, month - 1, day);
  return dateObj.getDay() === 0;
}

/**
 * Parses "HH:mm" time string into total minutes from 00:00.
 */
export function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

/**
 * Calculates shift duration in minutes, handling overnight crossing.
 */
export function calculateDurationMinutes(timeIn: string, timeOut: string): { duration: number; isOvernight: boolean } {
  if (!timeIn || !timeOut) {
    return { duration: 0, isOvernight: false };
  }

  const start = parseTimeToMinutes(timeIn);
  const end = parseTimeToMinutes(timeOut);

  if (end >= start) {
    return { duration: end - start, isOvernight: false };
  } else {
    // Overnight: e.g. 21:00 to 06:00
    const duration = (24 * 60 - start) + end;
    return { duration, isOvernight: true };
  }
}

/**
 * Automatic Attendance & Overtime Calculation Rules:
 * 1. Standard Shift: 9 hours (540 minutes).
 * 2. Buffer / Grace Period: If total worked time is between 8h 45m (525m) and 9h 15m (555m),
 *    count Basic Hours as 9 hours and OT as 0.
 * 3. Regular Overtime: Any time beyond 9h 15m (>555m) adds the difference beyond 9h to OT.
 *    (e.g., 10 hours worked = 9h Basic + 1h OT).
 * 4. Under standard buffer (<525m): Counted as actual duration for Basic, OT = 0.
 * 5. Sunday Rule: If date falls on Sunday, Basic Hours = 0, and entire duration is counted as Overtime (OT).
 */
export function calculateAttendanceHours(
  dateString: string,
  timeIn: string,
  timeOut: string,
  isFullDayOt: boolean = false
): CalculationResult {
  const isSunday = isDateSunday(dateString);
  const { duration: totalMinutes, isOvernight } = calculateDurationMinutes(timeIn, timeOut);

  if (totalMinutes <= 0) {
    return {
      totalMinutes: 0,
      basicMinutes: 0,
      otMinutes: 0,
      basicHours: 0,
      otHours: 0,
      isSunday,
      isFullDayOt,
      ruleExplanation: 'No hours recorded',
      isBufferApplied: false,
      isOvernight: false,
    };
  }

  // Full Day OT (Holiday / Special Day or Sunday): Basic Hours = 0, 100% Overtime
  if (isFullDayOt || isSunday) {
    const otHours = Math.round((totalMinutes / 60) * 100) / 100;
    const explanation = isSunday
      ? `Sunday Shift: 100% duty (${formatMinutes(totalMinutes)}) credited directly to Overtime (Basic = 0h)`
      : `Holiday / Full Day OT: 100% duty (${formatMinutes(totalMinutes)}) credited to Overtime (Basic = 0h)`;
    return {
      totalMinutes,
      basicMinutes: 0,
      otMinutes: totalMinutes,
      basicHours: 0,
      otHours,
      isSunday,
      isFullDayOt: true,
      ruleExplanation: explanation,
      isBufferApplied: false,
      isOvernight,
    };
  }

  const STANDARD_SHIFT_MINUTES = 9 * 60; // 540 min (9h)
  const BUFFER_LOWER_MINUTES = 8 * 60 + 45; // 525 min (8h 45m)
  const BUFFER_UPPER_MINUTES = 9 * 60 + 15; // 555 min (9h 15m)

  // Buffer / Grace Period Rule: 8h 45m to 9h 15m -> 9h Basic, 0h OT
  if (totalMinutes >= BUFFER_LOWER_MINUTES && totalMinutes <= BUFFER_UPPER_MINUTES) {
    return {
      totalMinutes,
      basicMinutes: STANDARD_SHIFT_MINUTES,
      otMinutes: 0,
      basicHours: 9.0,
      otHours: 0,
      isSunday: false,
      isFullDayOt: false,
      ruleExplanation: `Buffer Rule: Total ${formatMinutes(totalMinutes)} falls within 8h45m–9h15m grace window (Counted as 9.0h Basic, 0h OT)`,
      isBufferApplied: true,
      isOvernight,
    };
  }

  // Regular Overtime Rule: Beyond 9 hours 15 minutes
  if (totalMinutes > BUFFER_UPPER_MINUTES) {
    const otMinutes = totalMinutes - STANDARD_SHIFT_MINUTES;
    const basicHours = 9.0;
    const otHours = Math.round((otMinutes / 60) * 100) / 100;

    return {
      totalMinutes,
      basicMinutes: STANDARD_SHIFT_MINUTES,
      otMinutes,
      basicHours,
      otHours,
      isSunday: false,
      isFullDayOt: false,
      ruleExplanation: `Overtime Rule: Exceeded 9h 15m threshold. 9.0h Basic + ${formatMinutes(otMinutes)} OT`,
      isBufferApplied: false,
      isOvernight,
    };
  }

  // Under Standard Shift (< 8h 45m)
  const basicHours = Math.round((totalMinutes / 60) * 100) / 100;
  return {
    totalMinutes,
    basicMinutes: totalMinutes,
    otMinutes: 0,
    basicHours,
    otHours: 0,
    isSunday: false,
    isFullDayOt: false,
    ruleExplanation: `Partial Shift: ${formatMinutes(totalMinutes)} recorded as Basic Hours (0h OT)`,
    isBufferApplied: false,
    isOvernight,
  };
}

/**
 * Formats minutes into human-readable e.g. "9h 15m" or "45m"
 */
export function formatMinutes(minutes: number): string {
  if (minutes <= 0) return '0m';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/**
 * Formats decimal hours into a neat string e.g. "9.0 hrs"
 */
export function formatHours(hours: number): string {
  return `${hours.toFixed(1)} hrs`;
}

/**
 * Formats a date string into readable e.g. "Thu, Oct 1, 2026"
 */
export function formatDateDisplay(dateString: string): { formatted: string; dayOfWeek: string; isSunday: boolean } {
  if (!dateString) return { formatted: '', dayOfWeek: '', isSunday: false };
  const parts = dateString.split('-').map(Number);
  if (parts.length !== 3) return { formatted: dateString, dayOfWeek: '', isSunday: false };
  
  const [year, month, day] = parts;
  const dateObj = new Date(year, month - 1, day);
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayOfWeek = days[dateObj.getDay()];
  const isSunday = dateObj.getDay() === 0;

  const formatted = dateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return { formatted, dayOfWeek, isSunday };
}

/**
 * Returns current date string in YYYY-MM-DD
 */
export function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
