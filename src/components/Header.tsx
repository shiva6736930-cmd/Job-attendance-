import React from 'react';
import {
  Plus,
  Users,
  Calendar,
  UserCheck,
  ShieldCheck,
  Database,
  UserPlus,
  LogOut,
} from 'lucide-react';
import { Employee } from '../types/attendance';
import { User } from 'firebase/auth';

interface HeaderProps {
  activeTab: 'attendance' | 'summary' | 'employees';
  setActiveTab: (tab: 'attendance' | 'summary' | 'employees') => void;
  selectedEmployeeId: string; // 'all' or emp.id
  setSelectedEmployeeId: (id: string) => void;
  selectedMonth: string; // YYYY-MM
  setSelectedMonth: (month: string) => void;
  employees: Employee[];
  currentUser: User | null;
  onSignOut: () => void;
  onOpenNewRecord: () => void;
  onOpenRules: () => void;
  onOpenFirebaseStatus: () => void;
  onOpenAddEmployee: () => void;
  isFirebaseConnected: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  selectedEmployeeId,
  setSelectedEmployeeId,
  selectedMonth,
  setSelectedMonth,
  employees,
  currentUser,
  onSignOut,
  onOpenNewRecord,
  onOpenRules,
  onOpenFirebaseStatus,
  onOpenAddEmployee,
}) => {
  // Generate list of recent 12 months for selector
  const monthOptions = React.useMemo(() => {
    const list: { value: string; label: string }[] = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      list.push({ value: val, label });
    }
    return list;
  }, []);

  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-30 shadow-xs">
      {/* Top Bar: Wordmark, Desktop Nav, and Action Buttons */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Wordmark + Google User Badge */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs tracking-tight shadow-xs shrink-0">
            ST
          </div>
          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-bold tracking-tight text-slate-900 leading-tight truncate">
              ShiftTrack
            </h1>
            {currentUser && (
              <p className="text-[10px] sm:text-[11px] text-slate-500 truncate max-w-[140px] sm:max-w-[200px]">
                {currentUser.displayName || currentUser.email || 'Google User'}
              </p>
            )}
          </div>
        </div>

        {/* Middle: Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200/80">
          <button
            onClick={() => setActiveTab('attendance')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'attendance'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Attendance Log
          </button>
          <button
            onClick={() => setActiveTab('summary')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'summary'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Timesheet & Summary
          </button>
          <button
            onClick={() => setActiveTab('employees')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'employees'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Employees ({employees.length})
          </button>
        </nav>

        {/* Right: Actions + User Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Add Employee Button */}
          <button
            type="button"
            onClick={onOpenAddEmployee}
            title="Add New Employee"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 sm:py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-300 hover:bg-slate-50 active:scale-95 rounded-lg transition shadow-2xs whitespace-nowrap cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">Add Employee</span>
          </button>

          {/* Primary: Log Attendance Button */}
          <button
            type="button"
            onClick={onOpenNewRecord}
            className="inline-flex items-center gap-1 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 active:scale-95 rounded-lg transition shadow-xs whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>Log Shift</span>
          </button>

          {/* Google Sign Out Button */}
          {currentUser && (
            <button
              type="button"
              onClick={onSignOut}
              title={`Sign out (${currentUser.email})`}
              className="p-1.5 sm:px-2 sm:py-1.5 text-xs font-medium text-slate-600 hover:text-red-700 hover:bg-red-50 border border-slate-200 rounded-lg transition flex items-center gap-1 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Logout</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub-Header: Global Filter Bar & Mobile View Switcher */}
      <div className="border-t border-slate-100 bg-slate-50/80 px-3 sm:px-6 py-2">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
          {/* Mobile view switcher tabs */}
          <div className="flex md:hidden items-center justify-between bg-slate-200/80 p-0.5 rounded-lg text-xs font-medium text-slate-700">
            <button
              onClick={() => setActiveTab('attendance')}
              className={`flex-1 py-1.5 text-center rounded-md transition text-xs ${
                activeTab === 'attendance'
                  ? 'bg-white text-slate-900 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Attendance
            </button>
            <button
              onClick={() => setActiveTab('summary')}
              className={`flex-1 py-1.5 text-center rounded-md transition text-xs ${
                activeTab === 'summary'
                  ? 'bg-white text-slate-900 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Timesheet
            </button>
            <button
              onClick={() => setActiveTab('employees')}
              className={`flex-1 py-1.5 text-center rounded-md transition text-xs ${
                activeTab === 'employees'
                  ? 'bg-white text-slate-900 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Team ({employees.length})
            </button>
          </div>

          {/* Filtering Controls */}
          <div className="flex items-center gap-2 flex-1 sm:flex-initial">
            {/* Employee Dropdown */}
            <div className="flex-1 sm:flex-initial flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 shadow-2xs min-w-0">
              <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <label htmlFor="employee-filter" className="text-xs text-slate-500 whitespace-nowrap sr-only sm:not-sr-only">
                Employee:
              </label>
              <select
                id="employee-filter"
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer pr-1 truncate w-full sm:max-w-[170px]"
              >
                <option value="all">All Employees ({employees.length})</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Month Dropdown */}
            <div className="flex-1 sm:flex-initial flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 shadow-2xs min-w-0">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <label htmlFor="month-filter" className="text-xs text-slate-500 whitespace-nowrap sr-only sm:not-sr-only">
                Month:
              </label>
              <select
                id="month-filter"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer pr-1 w-full sm:w-auto"
              >
                <option value="all">All Months</option>
                {monthOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Shift Rules Info Link */}
            <button
              type="button"
              onClick={onOpenRules}
              title="View Overtime & Calculation Rules"
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition shrink-0 hidden sm:inline-flex items-center gap-1 text-xs"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Rules</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
