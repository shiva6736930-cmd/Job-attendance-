import React from 'react';
import { Download, Printer, User, Calendar, Clock, Zap, Sun, DollarSign } from 'lucide-react';
import { Employee, AttendanceRecord } from '../types/attendance';
import { formatDateDisplay } from '../utils/calculator';

interface MonthlyReportViewProps {
  records: AttendanceRecord[];
  employees: Employee[];
  selectedEmployeeId: string;
  selectedMonth: string;
  onExportCSV: () => void;
}

export const MonthlyReportView: React.FC<MonthlyReportViewProps> = ({
  records,
  employees,
  selectedEmployeeId,
  selectedMonth,
  onExportCSV,
}) => {
  const handlePrint = () => {
    window.print();
  };

  // Group by employee
  const employeeData = React.useMemo(() => {
    return employees
      .filter((emp) => selectedEmployeeId === 'all' || emp.id === selectedEmployeeId)
      .map((emp) => {
        const empRecords = records.filter((r) => r.employeeId === emp.id);

        const workingDays = new Set(empRecords.map((r) => r.date)).size;
        const totalBasic = empRecords.reduce((acc, r) => acc + r.basicHours, 0);
        const totalOt = empRecords.reduce((acc, r) => acc + r.otHours, 0);
        const sundayRecords = empRecords.filter((r) => r.isSunday);
        const sundayOtHours = sundayRecords.reduce((acc, r) => acc + r.otHours, 0);
        const regularOtHours = totalOt - sundayOtHours;
        const totalGross = totalBasic + totalOt;

        // Wage estimation
        const hourlyRate = emp.hourlyRate || 0;
        const otRate = emp.otHourlyRate || hourlyRate * 1.5;
        const basicPay = totalBasic * hourlyRate;
        const otPay = totalOt * otRate;
        const totalPay = basicPay + otPay;

        return {
          employee: emp,
          records: empRecords,
          workingDays,
          totalBasic: Math.round(totalBasic * 10) / 10,
          totalOt: Math.round(totalOt * 10) / 10,
          regularOtHours: Math.round(regularOtHours * 10) / 10,
          sundayOtHours: Math.round(sundayOtHours * 10) / 10,
          sundayDaysCount: sundayRecords.length,
          totalGross: Math.round(totalGross * 10) / 10,
          basicPay: Math.round(basicPay * 100) / 100,
          otPay: Math.round(otPay * 100) / 100,
          totalPay: Math.round(totalPay * 100) / 100,
        };
      });
  }, [records, employees, selectedEmployeeId]);

  const grandTotals = React.useMemo(() => {
    return employeeData.reduce(
      (acc, item) => ({
        workingDays: acc.workingDays + item.workingDays,
        totalBasic: acc.totalBasic + item.totalBasic,
        totalOt: acc.totalOt + item.totalOt,
        sundayOtHours: acc.sundayOtHours + item.sundayOtHours,
        totalGross: acc.totalGross + item.totalGross,
        totalPay: acc.totalPay + item.totalPay,
      }),
      { workingDays: 0, totalBasic: 0, totalOt: 0, sundayOtHours: 0, totalGross: 0, totalPay: 0 }
    );
  }, [employeeData]);

  return (
    <div className="space-y-6">
      {/* Report Header Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <span>Monthly Attendance & Overtime Statement</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit-ready summary for payroll and duty records · Month:{' '}
            <strong className="text-slate-800 font-mono">
              {selectedMonth === 'all' ? 'All Records' : selectedMonth}
            </strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition shadow-2xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Print Timesheet</span>
          </button>
          <button
            type="button"
            onClick={onExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition shadow-2xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Aggregate Grand Total Strip */}
      <div className="bg-slate-900 text-white rounded-xl p-4 sm:p-5 grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div>
          <span className="text-[11px] text-slate-400 uppercase tracking-wider block font-medium">
            Active Staff
          </span>
          <span className="text-xl sm:text-2xl font-bold font-mono tabular-nums">
            {employeeData.length}
          </span>
        </div>
        <div>
          <span className="text-[11px] text-slate-400 uppercase tracking-wider block font-medium">
            Total Working Days
          </span>
          <span className="text-xl sm:text-2xl font-bold font-mono tabular-nums">
            {grandTotals.workingDays}
          </span>
        </div>
        <div>
          <span className="text-[11px] text-slate-400 uppercase tracking-wider block font-medium">
            Basic Duty Hours
          </span>
          <span className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-sky-400">
            {grandTotals.totalBasic.toFixed(1)}h
          </span>
        </div>
        <div>
          <span className="text-[11px] text-slate-400 uppercase tracking-wider block font-medium">
            Total Overtime (OT)
          </span>
          <span className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-amber-400">
            +{grandTotals.totalOt.toFixed(1)}h
          </span>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider block font-medium">
            Estimated Wages
          </span>
          <span className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-emerald-400">
            ${grandTotals.totalPay.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Per-Employee Breakdown Cards */}
      <div className="space-y-4">
        {employeeData.map((item) => (
          <div
            key={item.employee.id}
            className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs"
          >
            {/* Employee header banner */}
            <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl text-white flex items-center justify-center font-bold text-xs ${
                    item.employee.avatarColor || 'bg-slate-700'
                  }`}
                >
                  {item.employee.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 leading-tight">
                    {item.employee.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {item.employee.role} · Rate: ${item.employee.hourlyRate || 0}/h (OT: $
                    {item.employee.otHourlyRate || (item.employee.hourlyRate || 0) * 1.5}/h)
                  </p>
                </div>
              </div>

              {/* Hours Pill Summary */}
              <div className="flex items-center gap-4 text-xs font-mono text-slate-600">
                <div>
                  <span className="text-slate-400 text-[10px] block uppercase">Days</span>
                  <span className="font-bold text-slate-900">{item.workingDays}d</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block uppercase">Basic</span>
                  <span className="font-bold text-blue-700">{item.totalBasic.toFixed(1)}h</span>
                </div>
                <div>
                  <span className="text-amber-800 text-[10px] block uppercase font-semibold">OT</span>
                  <span className="font-bold text-amber-900">+{item.totalOt.toFixed(1)}h</span>
                </div>
                <div>
                  <span className="text-emerald-800 text-[10px] block uppercase font-semibold">Wages</span>
                  <span className="font-bold text-emerald-900">
                    ${item.totalPay.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Shift Breakdown Table for this worker */}
            {item.records.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                No shifts logged for this employee in the selected period.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-white text-slate-500 uppercase text-[10px] font-semibold">
                      <th className="py-2 px-4">Date</th>
                      <th className="py-2 px-3">Day</th>
                      <th className="py-2 px-3">Clock In</th>
                      <th className="py-2 px-3">Clock Out</th>
                      <th className="py-2 px-3 text-right">Duration</th>
                      <th className="py-2 px-3 text-right">Basic Duty</th>
                      <th className="py-2 px-3 text-right">Overtime</th>
                      <th className="py-2 px-4">Rule / Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {item.records.map((rec) => {
                      const { formatted, dayOfWeek, isSunday } = formatDateDisplay(rec.date);
                      return (
                        <tr key={rec.id} className="hover:bg-slate-50/50">
                          <td className="py-2 px-4 font-semibold text-slate-800 whitespace-nowrap">
                            {formatted}
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap">
                            <span
                              className={`text-[11px] ${
                                isSunday
                                  ? 'text-orange-700 font-bold'
                                  : rec.isFullDayOt
                                  ? 'text-amber-700 font-bold'
                                  : 'text-slate-500'
                              }`}
                            >
                              {dayOfWeek} {isSunday ? '(Sunday OT)' : rec.isFullDayOt ? '(Holiday OT)' : ''}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-slate-600">{rec.timeIn}</td>
                          <td className="py-2 px-3 text-slate-600">{rec.timeOut}</td>
                          <td className="py-2 px-3 text-right text-slate-700 font-medium">
                            {(rec.totalMinutes / 60).toFixed(1)}h
                          </td>
                          <td className="py-2 px-3 text-right text-slate-800 font-semibold">
                            {rec.basicHours.toFixed(1)}h
                          </td>
                          <td className="py-2 px-3 text-right">
                            {rec.otHours > 0 ? (
                              <span className="text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded text-[11px]">
                                +{rec.otHours.toFixed(1)}h
                              </span>
                            ) : (
                              <span className="text-slate-400">0.0h</span>
                            )}
                          </td>
                          <td className="py-2 px-4 font-sans text-[11px] text-slate-600 truncate max-w-xs">
                            {rec.ruleExplanation} {rec.notes ? `· ${rec.notes}` : ''}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-slate-200 bg-slate-50 font-mono text-xs font-semibold">
                      <td colSpan={5} className="py-2.5 px-4 text-slate-700">
                        Subtotal for {item.employee.name} ({item.records.length} shifts)
                      </td>
                      <td className="py-2.5 px-3 text-right text-blue-900">
                        {item.totalBasic.toFixed(1)}h
                      </td>
                      <td className="py-2.5 px-3 text-right text-amber-900">
                        +{item.totalOt.toFixed(1)}h
                      </td>
                      <td className="py-2.5 px-4 text-emerald-800 font-sans text-right">
                        Total Wages: ${item.totalPay.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
