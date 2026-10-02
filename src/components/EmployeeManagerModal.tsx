import React, { useState, useEffect } from 'react';
import {
  X,
  UserPlus,
  Edit2,
  Trash2,
  Check,
  Users,
  IndianRupee,
  Calendar,
  Zap,
  Info,
} from 'lucide-react';
import { Employee, AttendanceRecord } from '../types/attendance';

interface EmployeeManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  attendanceRecords: AttendanceRecord[];
  onAddEmployee: (emp: Omit<Employee, 'id' | 'createdAt'>) => void;
  onUpdateEmployee: (emp: Employee) => void;
  onDeleteEmployee: (id: string) => void;
  onSelectEmployeeForFilter: (id: string) => void;
}

const COLOR_OPTIONS = [
  'bg-emerald-600',
  'bg-sky-600',
  'bg-indigo-600',
  'bg-violet-600',
  'bg-amber-600',
  'bg-rose-600',
  'bg-teal-600',
  'bg-slate-700',
];

export const EmployeeManagerModal: React.FC<EmployeeManagerModalProps> = ({
  isOpen,
  onClose,
  employees,
  attendanceRecords,
  onAddEmployee,
  onUpdateEmployee,
  onDeleteEmployee,
  onSelectEmployeeForFilter,
}) => {
  // Tabs: 'form' (Add or Edit) vs 'list' (View All)
  // If no employees, open directly in 'form' mode!
  const [activeTab, setActiveTab] = useState<'form' | 'list'>(
    employees.length === 0 ? 'form' : 'form'
  );
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null);

  // Form State with user's exact default values
  const [name, setName] = useState('');
  const [role, setRole] = useState('Staff');
  const [monthlyFixedSalary, setMonthlyFixedSalary] = useState<string>('16000');
  const [standardWorkingDays, setStandardWorkingDays] = useState<string>('26');
  const [otHourlyRate, setOtHourlyRate] = useState<string>('110');
  const [avatarColor, setAvatarColor] = useState(COLOR_OPTIONS[0]);
  const [errorMsg, setErrorMsg] = useState('');

  // Whenever modal opens, set proper default state
  useEffect(() => {
    if (isOpen) {
      if (employees.length === 0) {
        handleStartAdd();
      }
    }
  }, [isOpen, employees.length]);

  if (!isOpen) return null;

  // Live calculation of daily base rate
  const salaryNum = parseFloat(monthlyFixedSalary) || 0;
  const daysNum = parseFloat(standardWorkingDays) || 26;
  const calculatedDailyRate = daysNum > 0 ? Math.round((salaryNum / daysNum) * 100) / 100 : 0;
  const otRateNum = parseFloat(otHourlyRate) || 110;

  const handleStartAdd = () => {
    setEditingEmployeeId(null);
    setName('');
    setRole('Staff');
    setMonthlyFixedSalary('16000');
    setStandardWorkingDays('26');
    setOtHourlyRate('110');
    setAvatarColor(COLOR_OPTIONS[employees.length % COLOR_OPTIONS.length]);
    setActiveTab('form');
    setErrorMsg('');
  };

  const handleStartEdit = (emp: Employee) => {
    setEditingEmployeeId(emp.id);
    setName(emp.name);
    setRole(emp.role);
    setMonthlyFixedSalary(String(emp.monthlyFixedSalary ?? 16000));
    setStandardWorkingDays(String(emp.standardWorkingDays ?? 26));
    setOtHourlyRate(String(emp.otHourlyRate ?? 110));
    setAvatarColor(emp.avatarColor || COLOR_OPTIONS[0]);
    setActiveTab('form');
    setErrorMsg('');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Employee name likhna zaroori hai.');
      return;
    }

    const fixedSal = parseFloat(monthlyFixedSalary) || 16000;
    const workDays = parseFloat(standardWorkingDays) || 26;
    const daily = workDays > 0 ? Math.round((fixedSal / workDays) * 100) / 100 : 615.38;
    const otRate = parseFloat(otHourlyRate) || 110;

    if (editingEmployeeId) {
      const existing = employees.find((e) => e.id === editingEmployeeId);
      if (existing) {
        onUpdateEmployee({
          ...existing,
          name: name.trim(),
          role: role.trim() || 'Staff',
          monthlyFixedSalary: fixedSal,
          standardWorkingDays: workDays,
          dailyRate: daily,
          otHourlyRate: otRate,
          avatarColor,
        });
      }
    } else {
      onAddEmployee({
        name: name.trim(),
        role: role.trim() || 'Staff',
        monthlyFixedSalary: fixedSal,
        standardWorkingDays: workDays,
        dailyRate: daily,
        otHourlyRate: otRate,
        avatarColor,
      });
    }

    // Switch to list view or close
    setActiveTab('list');
    setEditingEmployeeId(null);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="employee-manager-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
    >
      {/* Modal Container: Full-width bottom sheet on mobile, rounded modal on desktop */}
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] sm:max-h-[88vh] overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-4 py-3 sm:px-5 sm:py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 id="employee-manager-title" className="text-sm sm:text-base font-bold text-slate-900">
                {editingEmployeeId ? 'Edit Employee' : 'Employee & Salary Settings'}
              </h3>
              <p className="text-[11px] text-slate-500">
                Fixed Salary (₹16,000/26 days) & Overtime (₹110/hr)
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

        {/* Mobile-Friendly Tabs Switcher */}
        <div className="px-3 pt-2 pb-1 bg-slate-100/80 border-b border-slate-200 shrink-0 flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleStartAdd}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition text-center cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'form' && !editingEmployeeId
                ? 'bg-slate-900 text-white shadow-xs'
                : activeTab === 'form' && editingEmployeeId
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>{editingEmployeeId ? 'Edit Mode' : '+ Naya Employee'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('list')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition text-center cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'list'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Sabhi Employees ({employees.length})</span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto px-4 py-3 sm:px-5 sm:py-4 space-y-4">
          {/* TAB 1: FORM (Add or Edit Employee) */}
          {activeTab === 'form' && (
            <form id="employee-form" onSubmit={handleSave} className="space-y-3.5">
              {errorMsg && (
                <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-medium">
                  {errorMsg}
                </div>
              )}

              {/* Employee Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Employee Name (नाम) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., Shiva Pande, Rajesh, Suresh"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                  required
                  autoFocus
                />
              </div>

              {/* Role / Designation */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Designation / Role (पद)
                </label>
                <input
                  type="text"
                  placeholder="e.g., Master, Operator, Helper, Staff"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              {/* Salary Configuration Block */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <IndianRupee className="w-3.5 h-3.5 text-emerald-600" />
                  <span>सैलरी और ओवरटाइम दर (Salary & OT Rates)</span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  {/* Monthly Fixed Salary */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      महीने की फिक्स सैलरी
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-2 text-xs font-bold text-slate-400">₹</span>
                      <input
                        type="number"
                        min="0"
                        step="100"
                        value={monthlyFixedSalary}
                        onChange={(e) => setMonthlyFixedSalary(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg pl-6 pr-2 py-1.5 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                      />
                    </div>
                  </div>

                  {/* Standard Working Days */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      कार्यदिवस (Working Days)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={standardWorkingDays}
                      onChange={(e) => setStandardWorkingDays(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                  </div>
                </div>

                {/* Overtime (OT) Hourly Rate */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    ओवरटाइम दर (₹ per hour)
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-xs font-bold text-slate-400">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="5"
                      value={otHourlyRate}
                      onChange={(e) => setOtHourlyRate(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg pl-6 pr-2 py-1.5 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                  </div>
                </div>

                {/* Auto Calculated Daily Base Rate Badge */}
                <div className="bg-emerald-50 border border-emerald-200/80 rounded-lg p-2 flex items-center justify-between text-xs">
                  <span className="text-emerald-800 font-medium">
                    1 दिन का बेस रेट (Daily Rate):
                  </span>
                  <span className="font-mono font-bold text-emerald-950 text-sm">
                    ₹{calculatedDailyRate} / day
                  </span>
                </div>
              </div>

              {/* Exact Rules Explanation Accordion */}
              <div className="p-2.5 bg-amber-50/70 border border-amber-200/80 rounded-xl space-y-1.5 text-[11px] text-amber-900">
                <div className="font-bold flex items-center gap-1 text-xs text-amber-950">
                  <Info className="w-3.5 h-3.5 text-amber-700" />
                  <span>नियम (Calculation Rules):</span>
                </div>
                <ul className="space-y-1 text-slate-700 pl-4 list-disc">
                  <li>
                    <strong>सरकारी छुट्टी का काम (Public Holiday):</strong> उस दिन की फिक्स डेली सैलरी (₹{calculatedDailyRate}) + कुल ओवरटाइम (घंटे × ₹{otRateNum}) — दोनों जोड़कर मिलेंगे।
                  </li>
                  <li>
                    <strong>संडे का काम (Sunday):</strong> केवल काम किए गए घंटों का ओवरटाइम (घंटे × ₹{otRateNum}) जुड़ेगा (संडे का कोई अलग बेस नहीं)।
                  </li>
                  <li>
                    <strong>सामान्य दिन (Regular Days):</strong> 26 दिन की फिक्स सैलरी + 9 घंटे के ऊपर का एक्स्ट्रा ओवरटाइम (घंटे × ₹{otRateNum})।
                  </li>
                </ul>
              </div>

              {/* Color Tag Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Avatar Color
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setAvatarColor(c)}
                      className={`w-7 h-7 rounded-full ${c} flex items-center justify-center transition cursor-pointer ${
                        avatarColor === c ? 'ring-2 ring-slate-900 ring-offset-2 scale-110' : 'opacity-80 hover:opacity-100'
                      }`}
                    >
                      {avatarColor === c && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  ))}
                </div>
              </div>
            </form>
          )}

          {/* TAB 2: LIST (View All Employees) */}
          {activeTab === 'list' && (
            <div className="space-y-2.5">
              {employees.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  Koi employee add nahi hai. Upar "+ Naya Employee" button dabayein.
                </div>
              ) : (
                employees.map((emp) => {
                  const empRecords = attendanceRecords.filter((r) => r.employeeId === emp.id);
                  const totalBasic = empRecords.reduce((acc, r) => acc + r.basicHours, 0);
                  const totalOt = empRecords.reduce((acc, r) => acc + r.otHours, 0);
                  const daily = emp.dailyRate ?? Math.round(((emp.monthlyFixedSalary ?? 16000) / (emp.standardWorkingDays ?? 26)) * 100) / 100;
                  const otRate = emp.otHourlyRate ?? 110;

                  return (
                    <div
                      key={emp.id}
                      className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs hover:border-slate-300 transition flex items-center justify-between gap-2.5"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl text-white flex items-center justify-center font-bold text-xs shrink-0 ${
                            emp.avatarColor || 'bg-slate-700'
                          }`}
                        >
                          {emp.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                              {emp.name}
                            </h4>
                            <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded shrink-0">
                              {emp.role}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                            <span>₹{emp.monthlyFixedSalary ?? 16000}/mo</span>
                            <span className="mx-1">·</span>
                            <span>₹{daily}/day</span>
                            <span className="mx-1">·</span>
                            <span className="text-amber-800 font-bold">OT ₹{otRate}/h</span>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            onSelectEmployeeForFilter(emp.id);
                            onClose();
                          }}
                          className="px-2 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition cursor-pointer"
                        >
                          Filter
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStartEdit(emp)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {employees.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`${emp.name} ko delete karein?`)) {
                                onDeleteEmployee(emp.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Sticky Mobile Bottom Action Bar */}
        <div className="px-4 py-3 border-t border-slate-200 bg-white flex items-center justify-between gap-2 shrink-0">
          {activeTab === 'form' ? (
            <>
              <button
                type="button"
                onClick={() => {
                  if (employees.length > 0) {
                    setActiveTab('list');
                  } else {
                    onClose();
                  }
                }}
                className="flex-1 min-h-[44px] py-2.5 px-3 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer text-center"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="employee-form"
                className="flex-2 min-h-[44px] py-2.5 px-4 text-xs sm:text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 active:scale-98 rounded-xl shadow-xs transition cursor-pointer text-center"
              >
                {editingEmployeeId ? 'Save Changes' : 'Employee Save Karein'}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleStartAdd}
                className="flex-1 min-h-[44px] py-2.5 px-3 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Add Another</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="min-h-[44px] px-6 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
              >
                Done
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
