export interface Employee {
  id: string;
  userId?: string;
  name: string;
  role: string;
  avatarColor: string;
  monthlyFixedSalary?: number; // Default: ₹16,000 / month
  standardWorkingDays?: number; // Default: 26 working days (excluding 4 Sundays)
  dailyRate?: number; // Default: ₹16,000 / 26 = ₹615.38 / day
  otHourlyRate?: number; // Default: ₹110 / hour
  hourlyRate?: number; // Optional legacy hourly rate
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  userId?: string;
  employeeId: string;
  date: string; // YYYY-MM-DD
  timeIn: string; // HH:mm
  timeOut: string; // HH:mm
  totalMinutes: number;
  basicMinutes: number;
  otMinutes: number;
  basicHours: number; // Decimal hours (e.g. 9.0)
  otHours: number; // Decimal hours (e.g. 1.5)
  isSunday: boolean;
  isFullDayOt?: boolean; // When marked as holiday or 100% OT day
  notes?: string;
  ruleExplanation: string;
  createdAt: number;
  updatedAt: number;
}

export interface CalculationResult {
  totalMinutes: number;
  basicMinutes: number;
  otMinutes: number;
  basicHours: number;
  otHours: number;
  isSunday: boolean;
  isFullDayOt: boolean;
  ruleExplanation: string;
  isBufferApplied: boolean;
  isOvernight: boolean;
}

export interface AttendanceSummary {
  totalWorkingDays: number;
  totalBasicHours: number;
  totalOtHours: number;
  totalGrossHours: number;
  totalSundayDays: number;
  totalSundayOtHours: number;
  recordsCount: number;
}
