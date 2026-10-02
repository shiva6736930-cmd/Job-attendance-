import React, { useState } from 'react';
import { X, UserPlus, Edit2, Trash2, Check, Users, Briefcase, DollarSign } from 'lucide-react';
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
  const [isAddingOrEditing, setIsAddingOrEditing] = useState(false);
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [hourlyRate, setHourlyRate] = useState<string>('20');
  const [otHourlyRate, setOtHourlyRate] = useState<string>('30');
  const [avatarColor, setAvatarColor] = useState(COLOR_OPTIONS[0]);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleStartAdd = () => {
    setEditingEmployeeId(null);
    setName('');
    setRole('Team Member');
    setHourlyRate('20');
    setOtHourlyRate('30');
    setAvatarColor(COLOR_OPTIONS[employees.length % COLOR_OPTIONS.length]);
    setIsAddingOrEditing(true);
    setErrorMsg('');
  };

  const handleStartEdit = (emp: Employee) => {
    setEditingEmployeeId(emp.id);
    setName(emp.name);
    setRole(emp.role);
    setHourlyRate(emp.hourlyRate !== undefined ? String(emp.hourlyRate) : '20');
    setOtHourlyRate(emp.otHourlyRate !== undefined ? String(emp.otHourlyRate) : '30');
    setAvatarColor(emp.avatarColor || COLOR_OPTIONS[0]);
    setIsAddingOrEditing(true);
    setErrorMsg('');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Employee name is required.');
      return;
    }

    const rateNum = parseFloat(hourlyRate) || 0;
    const otRateNum = parseFloat(otHourlyRate) || (rateNum * 1.5);

    if (editingEmployeeId) {
      const existing = employees.find((e) => e.id === editingEmployeeId);
      if (existing) {
        onUpdateEmployee({
          ...existing,
          name: name.trim(),
          role: role.trim() || 'Team Member',
          hourlyRate: rateNum,
          otHourlyRate: otRateNum,
          avatarColor,
        });
      }
    } else {
      onAddEmployee({
        name: name.trim(),
        role: role.trim() || 'Team Member',
        hourlyRate: rateNum,
        otHourlyRate: otRateNum,
        avatarColor,
      });
    }

    setIsAddingOrEditing(false);
    setEditingEmployeeId(null);
  };

  const handleCancelForm = () => {
    setIsAddingOrEditing(false);
    setEditingEmployeeId(null);
    setErrorMsg('');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="employee-manager-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
    >
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 id="employee-manager-title" className="text-base font-bold text-slate-900">
                Employee Management
              </h3>
              <p className="text-xs text-slate-500">
                Add, edit, or configure hourly rates for your workers.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Top Add Button bar if not currently showing form */}
          {!isAddingOrEditing ? (
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Total Team Members ({employees.length})
              </span>
              <button
                type="button"
                onClick={handleStartAdd}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition shadow-2xs"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Add Employee</span>
              </button>
            </div>
          ) : (
            /* Add / Edit Form */
            <form onSubmit={handleSave} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                {editingEmployeeId ? 'Edit Employee Details' : 'New Employee'}
              </h4>

              {errorMsg && (
                <p className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200">
                  {errorMsg}
                </p>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter employee full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Role / Designation
                </label>
                <input
                  type="text"
                  placeholder="e.g., Lead Supervisor, Site Worker, Electrician"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Basic Hourly Rate ($/hr)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={hourlyRate}
                    onChange={(e) => {
                      setHourlyRate(e.target.value);
                      // Auto-suggest 1.5x OT rate if standard
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val)) {
                        setOtHourlyRate(String(Math.round(val * 1.5 * 10) / 10));
                      }
                    }}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    OT Hourly Rate ($/hr)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={otHourlyRate}
                    onChange={(e) => setOtHourlyRate(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Color Tag
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setAvatarColor(c)}
                      className={`w-7 h-7 rounded-full ${c} flex items-center justify-center transition ${
                        avatarColor === c ? 'ring-2 ring-slate-900 ring-offset-2 scale-110' : 'opacity-80 hover:opacity-100'
                      }`}
                    >
                      {avatarColor === c && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition shadow-2xs"
                >
                  {editingEmployeeId ? 'Save Changes' : 'Create Employee'}
                </button>
              </div>
            </form>
          )}

          {/* List of employees */}
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden max-h-[380px] overflow-y-auto">
            {employees.map((emp) => {
              const empRecords = attendanceRecords.filter((r) => r.employeeId === emp.id);
              const totalBasic = empRecords.reduce((acc, r) => acc + r.basicHours, 0);
              const totalOt = empRecords.reduce((acc, r) => acc + r.otHours, 0);

              return (
                <div
                  key={emp.id}
                  className="p-3 sm:p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs ${
                        emp.avatarColor || 'bg-slate-700'
                      }`}
                    >
                      {emp.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                          {emp.name}
                        </h4>
                        <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                          {emp.role}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5 flex items-center gap-2 flex-wrap">
                        <span>{empRecords.length} shifts logged</span>
                        <span>·</span>
                        <span>{totalBasic.toFixed(1)}h Basic</span>
                        <span>·</span>
                        <span className="text-amber-800 font-semibold">+{totalOt.toFixed(1)}h OT</span>
                        {emp.hourlyRate ? (
                          <>
                            <span>·</span>
                            <span>${emp.hourlyRate}/h (OT ${emp.otHourlyRate || emp.hourlyRate * 1.5})</span>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        onSelectEmployeeForFilter(emp.id);
                        onClose();
                      }}
                      title="Filter views to this employee"
                      className="px-2 py-1 text-[11px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition"
                    >
                      Filter
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStartEdit(emp)}
                      title="Edit employee"
                      className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {employees.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          if (
                            window.confirm(
                              `Are you sure you want to delete ${emp.name}? This will remove all their logged shifts.`
                            )
                          ) {
                            onDeleteEmployee(emp.id);
                          }
                        }}
                        title="Delete employee"
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50/70 flex items-center justify-between text-xs text-slate-500">
          <span>Click "Filter" to focus dashboard on any worker.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-200/60 rounded-lg transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
