import React from 'react';
import { Plus, Users, FileSpreadsheet, Calendar, UserCheck, ShieldCheck, Database, UserPlus } from 'lucide-react';
import { Employee } from '../types/attendance';

interface HeaderProps {
  activeTab: 'attendance' | 'summary' | 'employees';
  setActiveTab: (tab: 'attendance' | 'summary' | 'employees') => void;
  selectedEmployeeId: string; // 'all' or emp.id
  setSelectedEmployeeId: (id: string) => void;
  selectedMonth: string; // YYYY-MM
  setSelectedMonth: (month: string) => void;
  employees: Employee[];
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
  onOpenNewRecord,
  onOpenRules,
  onOpenFirebaseStatus,
  onOpenAddEmployee,
  isFirebaseConnected,
}) => {
  // Generate list of recent 12 months for selector
  const monthOptions = React.useMemo(() => {
    const list: { value: string; label: string }[] = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      list.push({ value: val, label });
    }
    return list;
  }, []);

  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-30 shadow-xs">
      {/* Top Bar Contract: Zone 1 (Wordmark) - Zone 2 (Clean Nav) - Zone 3 (Primary Action) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        {/* Zone 1: Wordmark */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-sm tracking-tight shadow-xs">
            ST
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 leading-tight">
              ShiftTrack
            </h1>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              Multi-Employee Attendance & Overtime
            </p>
          </div>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200/80">
          <button
            onClick={() => setActiveTab('attendance')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'attendance'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Attendance Log
          </button>
          <button
            onClick={() => setActiveTab('summary')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'summary'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Timesheet & Summary
          </button>
          <button
            onClick={() => setActiveTab('employees')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'employees'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Employees ({employees.length})
          </button>
        </nav>

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenFirebaseStatus}
            title="Firebase Project Status: shiva-shoes-store"
            className="px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors border border-slate-200 inline-flex items-center gap-1.5"
          >
            <Database className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden sm:inline font-mono">Firebase</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </button>

          <button
            type="button"
            onClick={onOpenAddEmployee}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-800 bg-white border border-slate-300 hover:bg-slate-100 active:scale-[0.98] rounded-lg transition shadow-2xs whitespace-nowrap cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Employee</span>
          </button>

          <button
            type="button"
            onClick={onOpenNewRecord}
            className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 active:scale-[0.98] rounded-lg transition shadow-xs whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>Log Attendance</span>
          </button>
        </div>
      </div>

      {/* Sub-Header: Global Filter Bar (Employee selector + Month picker + Mobile Tab Switcher) */}
      <div className="border-t border-slate-100 bg-slate-50/70 px-4 sm:px-6 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {/* Mobile view switcher buttons */}
          <div className="flex md:hidden items-center justify-between bg-slate-200/80 p-0.5 rounded-lg text-xs font-medium text-slate-700">
            <button
              onClick={() => setActiveTab('attendance')}
              className={`flex-1 py-1.5 text-center rounded-md transition ${
                activeTab === 'attendance' ? 'bg-white text-slate-900 font-semibold shadow-xs' : 'text-slate-600'
              }`}
            >
              Log
            </button>
            <button
              onClick={() => setActiveTab('summary')}
              className={`flex-1 py-1.5 text-center rounded-md transition ${
                activeTab === 'summary' ? 'bg-white text-slate-900 font-semibold shadow-xs' : 'text-slate-600'
              }`}
            >
              Timesheet
            </button>
            <button
              onClick={() => setActiveTab('employees')}
              className={`flex-1 py-1.5 text-center rounded-md transition ${
                activeTab === 'employees' ? 'bg-white text-slate-900 font-semibold shadow-xs' : 'text-slate-600'
              }`}
            >
              Team ({employees.length})
            </button>
          </div>

          {/* Filtering Controls */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* Employee Dropdown */}
            <div className="flex-1 sm:flex-initial flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 shadow-2xs">
              <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <label htmlFor="employee-filter" className="text-xs text-slate-500 whitespace-nowrap">
                Employee:
              </label>
              <select
                id="employee-filter"
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-800 outline-none cursor-pointer pr-1 truncate max-w-[150px] sm:max-w-[200px]"
              >
                <option value="all">All Employees ({employees.length})</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.role})
                  </option>
                ))}
              </select>
            </div>

            {/* Month Dropdown */}
            <div className="flex-1 sm:flex-initial flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <label htmlFor="month-filter" className="text-xs text-slate-500 whitespace-nowrap">
                Month:
              </label>
              <select
                id="month-filter"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-800 outline-none cursor-pointer pr-1"
              >
                <option value="all">All Months</option>
                {monthOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick info chip */}
          <div className="flex items-center justify-between sm:justify-end gap-2 text-xs text-slate-500">
            <button
              onClick={onOpenRules}
              className="sm:hidden text-slate-600 hover:text-slate-900 underline text-xs font-medium"
            >
              Rules & Overtime Info
            </button>
            <span className="hidden sm:inline text-slate-400">·</span>
            <span className="text-[11px] text-slate-400 font-mono">Standard shift: 9h</span>
          </div>
        </div>
      </div>
    </header>
  );
};
