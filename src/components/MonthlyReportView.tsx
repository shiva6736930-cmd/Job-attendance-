import React from 'react';
import { Download, Printer, User, Calendar, Clock, Zap, Sun, IndianRupee, Info } from 'lucide-react';
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

  // Group by employee with exact salary & overtime rules
  const employeeData = React.useMemo(() => {
    return employees
      .filter((emp) => selectedEmployeeId === 'all' || emp.id === selectedEmployeeId)
      .map((emp) => {
        const empRecords = records.filter((r) => r.employeeId === emp.id);

        const monthlyFixedSalary = emp.monthlyFixedSalary ?? 16000;
        const standardWorkingDays = emp.standardWorkingDays ?? 26;
        const dailyRate =
          emp.dailyRate ??
          (standardWorkingDays > 0
            ? Math.round((monthlyFixedSalary / standardWorkingDays) * 100) / 100
            : 615.38);
        const otRate = emp.otHourlyRate ?? 110;

        // Categorize shifts
        const sundayRecords = empRecords.filter((r) => r.isSunday);
        const holidayRecords = empRecords.filter((r) => r.isFullDayOt && !r.isSunday);
        const regularRecords = empRecords.filter((r) => !r.isSunday && !r.isFullDayOt);

        const workingDays = new Set(empRecords.map((r) => r.date)).size;
        const regularDaysCount = new Set(regularRecords.map((r) => r.date)).size;
        const holidayDaysCount = new Set(holidayRecords.map((r) => r.date)).size;
        const sundayDaysCount = sundayRecords.length;

        const totalBasic = empRecords.reduce((acc, r) => acc + r.basicHours, 0);
        const totalOt = empRecords.reduce((acc, r) => acc + r.otHours, 0);
        const sundayOtHours = sundayRecords.reduce((acc, r) => acc + r.otHours, 0);
        const holidayOtHours = holidayRecords.reduce((acc, r) => acc + r.otHours, 0);
        const totalGross = totalBasic + totalOt;

        // Payout calculation:
        // 1. Regular base: regularDaysCount * dailyRate
        const basePay = Math.round(regularDaysCount * dailyRate * 100) / 100;

        // 2. Public Holiday Work: Fixed daily rate (₹615.38) + OT hours (hours * ₹110)
        // (OT hours are included in totalOt, so we add the extra day daily rate here)
        const holidayBasePay = Math.round(holidayDaysCount * dailyRate * 100) / 100;

        // 3. Sunday Work: ONLY OT hours (hours * ₹110) - no extra daily base.
        // 4. Overtime: totalOt * otRate
        const otPay = Math.round(totalOt * otRate * 100) / 100;

        // 5. Total Payout
        const totalPay = Math.round((basePay + holidayBasePay + otPay) * 100) / 100;

        return {
          employee: emp,
          records: empRecords,
          workingDays,
          regularDaysCount,
          holidayDaysCount,
          sundayDaysCount,
          totalBasic: Math.round(totalBasic * 10) / 10,
          totalOt: Math.round(totalOt * 10) / 10,
          sundayOtHours: Math.round(sundayOtHours * 10) / 10,
          holidayOtHours: Math.round(holidayOtHours * 10) / 10,
          totalGross: Math.round(totalGross * 10) / 10,
          monthlyFixedSalary,
          dailyRate,
          otRate,
          basePay,
          holidayBasePay,
          otPay,
          totalPay,
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
    <div className="space-y-4 sm:space-y-6">
      {/* Report Header Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 sm:p-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xs">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
            <span>Attendance & Salary Statement (मासिक सैलरी और ओवरटाइम रिपोर्ट)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Fixed Salary (₹16,000 / 26 days = ₹615/day) · Overtime (₹110/hr) · Month:{' '}
            <strong className="text-slate-800 font-mono">
              {selectedMonth === 'all' ? 'All Records' : selectedMonth}
            </strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition shadow-2xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Print</span>
          </button>
          <button
            type="button"
            onClick={onExportCSV}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition shadow-2xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Aggregate Grand Total Strip */}
      <div className="bg-slate-900 text-white rounded-xl p-4 sm:p-5 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div>
          <span className="text-[10px] sm:text-[11px] text-slate-400 uppercase tracking-wider block font-medium">
            Active Staff
          </span>
          <span className="text-lg sm:text-2xl font-bold font-mono tabular-nums">
            {employeeData.length}
          </span>
        </div>
        <div>
          <span className="text-[10px] sm:text-[11px] text-slate-400 uppercase tracking-wider block font-medium">
            Total Working Days
          </span>
          <span className="text-lg sm:text-2xl font-bold font-mono tabular-nums">
            {grandTotals.workingDays}
          </span>
        </div>
        <div>
          <span className="text-[10px] sm:text-[11px] text-slate-400 uppercase tracking-wider block font-medium">
            Total Overtime (OT)
          </span>
          <span className="text-lg sm:text-2xl font-bold font-mono tabular-nums text-amber-400">
            +{grandTotals.totalOt.toFixed(1)}h
          </span>
        </div>
        <div>
          <span className="text-[10px] sm:text-[11px] text-slate-400 uppercase tracking-wider block font-medium">
            कुल सैलरी व ओवरटाइम
          </span>
          <span className="text-lg sm:text-2xl font-bold font-mono tabular-nums text-emerald-400">
            ₹{grandTotals.totalPay.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
          </span>
        </div>
      </div>

      {/* Per-Employee Detailed Salary & Shift Cards */}
      <div className="space-y-4">
        {employeeData.map((item) => (
          <div
            key={item.employee.id}
            className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs"
          >
            {/* Employee header banner */}
            <div className="p-3.5 sm:p-4 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl text-white flex items-center justify-center font-bold text-xs shrink-0 ${
                    item.employee.avatarColor || 'bg-slate-700'
                  }`}
                >
                  {item.employee.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                    {item.employee.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {item.employee.role} · Fixed: ₹{item.monthlyFixedSalary}/mo (₹{item.dailyRate}/day) · OT: ₹{item.otRate}/hr
                  </p>
                </div>
              </div>

              {/* Total Payout Badge */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5 flex items-center justify-between sm:justify-end gap-3 text-xs">
                <span className="text-emerald-800 font-medium">कुल भुगतान (Total Payout):</span>
                <span className="font-bold text-emerald-950 font-mono text-sm sm:text-base">
                  ₹{item.totalPay.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Salary Calculation Breakdown */}
            <div className="px-4 py-3 bg-slate-50/40 border-b border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2 bg-white rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 block">Regular Days Base ({item.regularDaysCount} दिन):</span>
                <span className="font-bold text-slate-900 font-mono">₹{item.basePay}</span>
              </div>
              <div className="p-2 bg-white rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 block">Holiday Extra Base ({item.holidayDaysCount} दिन):</span>
                <span className="font-bold text-amber-900 font-mono">+₹{item.holidayBasePay}</span>
              </div>
              <div className="p-2 bg-white rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 block">Overtime Pay ({item.totalOt}h × ₹{item.otRate}):</span>
                <span className="font-bold text-amber-900 font-mono">+₹{item.otPay}</span>
              </div>
              <div className="p-2 bg-emerald-50/80 rounded-lg border border-emerald-200">
                <span className="text-[10px] text-emerald-800 font-semibold block">Total Earnings:</span>
                <span className="font-bold text-emerald-950 font-mono">₹{item.totalPay}</span>
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
                      <th className="py-2 px-3 sm:px-4">Date</th>
                      <th className="py-2 px-2 sm:px-3">Day</th>
                      <th className="py-2 px-2 sm:px-3">In - Out</th>
                      <th className="py-2 px-2 sm:px-3 text-right">Duration</th>
                      <th className="py-2 px-2 sm:px-3 text-right">Basic Duty</th>
                      <th className="py-2 px-2 sm:px-3 text-right">Overtime</th>
                      <th className="py-2 px-3 sm:px-4">Salary Earned (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {item.records.map((rec) => {
                      const { formatted, dayOfWeek, isSunday } = formatDateDisplay(rec.date);
                      const isHoliday = rec.isFullDayOt && !isSunday;

                      // Earnings for this specific shift:
                      let shiftEarning = 0;
                      let shiftBreakdown = '';
                      if (isHoliday) {
                        // Holiday: Fixed daily salary + OT
                        const otEarnings = rec.otHours * item.otRate;
                        shiftEarning = item.dailyRate + otEarnings;
                        shiftBreakdown = `₹${item.dailyRate} (Fixed) + ₹${otEarnings} (${rec.otHours}h OT)`;
                      } else if (isSunday) {
                        // Sunday: ONLY OT hours
                        shiftEarning = rec.otHours * item.otRate;
                        shiftBreakdown = `₹${shiftEarning} (${rec.otHours}h Sunday OT)`;
                      } else {
                        // Regular day: 1 day base salary + excess OT hours
                        const otEarnings = rec.otHours * item.otRate;
                        shiftEarning = item.dailyRate + otEarnings;
                        shiftBreakdown = `₹${item.dailyRate} (Base) ${otEarnings > 0 ? `+ ₹${otEarnings} (OT)` : ''}`;
                      }

                      return (
                        <tr key={rec.id} className="hover:bg-slate-50/50">
                          <td className="py-2 px-3 sm:px-4 font-semibold text-slate-800 whitespace-nowrap">
                            {formatted}
                          </td>
                          <td className="py-2 px-2 sm:px-3 whitespace-nowrap">
                            <span
                              className={`text-[11px] font-sans font-bold ${
                                isSunday
                                  ? 'text-orange-700'
                                  : isHoliday
                                  ? 'text-amber-700'
                                  : 'text-slate-600'
                              }`}
                            >
                              {dayOfWeek} {isSunday ? '(Sunday OT)' : isHoliday ? '(Holiday OT)' : ''}
                            </span>
                          </td>
                          <td className="py-2 px-2 sm:px-3 text-slate-600 whitespace-nowrap">
                            {rec.timeIn} – {rec.timeOut}
                          </td>
                          <td className="py-2 px-2 sm:px-3 text-right font-semibold text-slate-800 whitespace-nowrap">
                            {Math.floor(rec.totalMinutes / 60)}h {rec.totalMinutes % 60}m
                          </td>
                          <td className="py-2 px-2 sm:px-3 text-right text-slate-700 whitespace-nowrap">
                            {rec.basicHours.toFixed(1)}h
                          </td>
                          <td className="py-2 px-2 sm:px-3 text-right font-bold text-amber-800 whitespace-nowrap">
                            {rec.otHours > 0 ? `+${rec.otHours.toFixed(1)}h` : '0h'}
                          </td>
                          <td className="py-2 px-3 sm:px-4 text-emerald-900 font-bold whitespace-nowrap">
                            <span>₹{Math.round(shiftEarning)}</span>
                            <span className="text-[10px] font-normal text-slate-400 font-sans ml-1">
                              ({shiftBreakdown})
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
