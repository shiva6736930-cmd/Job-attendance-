import { Employee, AttendanceRecord, AttendanceSummary } from '../types/attendance';

const EMPLOYEES_STORAGE_KEY = 'shifttrack_employees_clean_v2';
const ATTENDANCE_STORAGE_KEY = 'shifttrack_attendance_clean_v2';

// Clear legacy dummy data keys if present
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem('shifttrack_employees_v1');
    localStorage.removeItem('shifttrack_attendance_v1');
  } catch (e) {
    // Ignore in SSR
  }
}

export const INITIAL_EMPLOYEES: Employee[] = [];

export function loadEmployees(): Employee[] {
  try {
    const data = localStorage.getItem(EMPLOYEES_STORAGE_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) return [];
    // Filter out any old mock ids if somehow persisted
    return parsed.filter((e) => !['emp-shiva', 'emp-rajesh', 'emp-amit'].includes(e.id));
  } catch (e) {
    console.error('Error loading employees', e);
    return [];
  }
}

export function saveEmployees(employees: Employee[]): void {
  try {
    localStorage.setItem(EMPLOYEES_STORAGE_KEY, JSON.stringify(employees));
  } catch (e) {
    console.error('Error saving employees', e);
  }
}

export function deduplicateAttendance(records: AttendanceRecord[]): AttendanceRecord[] {
  const map = new Map<string, AttendanceRecord>();
  records.forEach((r) => {
    const key = `${r.employeeId}-${r.date}`;
    const existing = map.get(key);
    if (!existing || (r.updatedAt || r.createdAt) >= (existing.updatedAt || existing.createdAt)) {
      map.set(key, r);
    }
  });
  return Array.from(map.values());
}

export function loadAttendance(): AttendanceRecord[] {
  try {
    const data = localStorage.getItem(ATTENDANCE_STORAGE_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) return [];
    // Filter out old mock attendance and deduplicate
    const filtered = parsed.filter((r) => !['emp-shiva', 'emp-rajesh', 'emp-amit'].includes(r.employeeId));
    const deduped = deduplicateAttendance(filtered);
    if (deduped.length !== parsed.length) {
      saveAttendance(deduped);
    }
    return deduped;
  } catch (e) {
    console.error('Error loading attendance', e);
    return [];
  }
}

export function saveAttendance(records: AttendanceRecord[]): void {
  try {
    localStorage.setItem(ATTENDANCE_STORAGE_KEY, JSON.stringify(records));
  } catch (e) {
    console.error('Error saving attendance', e);
  }
}

export function calculateSummary(records: AttendanceRecord[]): AttendanceSummary {
  const distinctDays = new Set(records.map((r) => `${r.employeeId}-${r.date}`));

  let totalBasicHours = 0;
  let totalOtHours = 0;
  let totalSundayDays = 0;
  let totalSundayOtHours = 0;

  records.forEach((r) => {
    totalBasicHours += r.basicHours;
    totalOtHours += r.otHours;
    if (r.isSunday) {
      totalSundayDays += 1;
      totalSundayOtHours += r.otHours;
    }
  });

  return {
    totalWorkingDays: distinctDays.size,
    totalBasicHours: Math.round(totalBasicHours * 10) / 10,
    totalOtHours: Math.round(totalOtHours * 10) / 10,
    totalGrossHours: Math.round((totalBasicHours + totalOtHours) * 10) / 10,
    totalSundayDays,
    totalSundayOtHours: Math.round(totalSundayOtHours * 10) / 10,
    recordsCount: records.length,
  };
}

export function exportToCSV(
  records: AttendanceRecord[],
  employeesMap: Map<string, Employee>,
  filterLabel: string
): void {
  const headers = [
    'Employee Name',
    'Date',
    'Day',
    'Time In',
    'Time Out',
    'Duration (Minutes)',
    'Duration',
    'Basic Hours',
    'Overtime (OT) Hours',
    'Special OT / Holiday',
    'Rule Explanation',
    'Notes',
  ];

  const rows = records.map((r) => {
    const emp = employeesMap.get(r.employeeId);
    const dateObj = new Date(r.date + 'T00:00:00');
    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
    const h = Math.floor(r.totalMinutes / 60);
    const m = r.totalMinutes % 60;
    const durStr = `${h}h ${m}m`;

    return [
      `"${emp?.name || 'Unknown'}"`,
      `"${r.date}"`,
      `"${dayName}"`,
      `"${r.timeIn}"`,
      `"${r.timeOut}"`,
      r.totalMinutes,
      `"${durStr}"`,
      r.basicHours.toFixed(2),
      r.otHours.toFixed(2),
      r.isSunday ? 'Sunday (100% OT)' : r.isFullDayOt ? 'Holiday (100% OT)' : 'Regular Shift',
      `"${(r.ruleExplanation || '').replace(/"/g, '""')}"`,
      `"${(r.notes || '').replace(/"/g, '""')}"`,
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const cleanFilter = filterLabel.replace(/[^a-zA-Z0-9-_]/g, '_');
  link.setAttribute('download', `Attendance_${cleanFilter}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportBackupJSON(employees: Employee[], records: AttendanceRecord[]): void {
  const payload = {
    version: '2.0',
    exportDate: new Date().toISOString(),
    employees,
    attendance: records,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `ShiftTrack_Backup_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
