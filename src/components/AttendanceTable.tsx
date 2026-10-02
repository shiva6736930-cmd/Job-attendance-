import React, { useState } from 'react';
import { Edit2, Trash2, Search, Download, Sun, ArrowUpDown, Clock, Zap } from 'lucide-react';
import { AttendanceRecord, Employee } from '../types/attendance';
import { formatDateDisplay, formatMinutes } from '../utils/calculator';

interface AttendanceTableProps {
  records: AttendanceRecord[];
  employees: Employee[];
  onEdit: (record: AttendanceRecord) => void;
  onDelete: (id: string) => void;
  onExportCSV: () => void;
}

type SortField = 'date' | 'employee' | 'totalMinutes' | 'basicHours' | 'otHours';
type SortOrder = 'asc' | 'desc';

export const AttendanceTable: React.FC<AttendanceTableProps> = ({
  records,
  employees,
  onEdit,
  onDelete,
  onExportCSV,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOtOnly, setFilterOtOnly] = useState(false);
  const [filterSundayOnly, setFilterSundayOnly] = useState(false);
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Employee lookup map
  const employeeMap = React.useMemo(() => {
    return new Map(employees.map((e) => [e.id, e]));
  }, [employees]);

  // Filtering & searching
  const filteredRecords = React.useMemo(() => {
    return records.filter((rec) => {
      const emp = employeeMap.get(rec.employeeId);
      const empName = emp?.name.toLowerCase() || '';
      const notes = rec.notes?.toLowerCase() || '';
      const date = rec.date.toLowerCase();
      const q = searchQuery.toLowerCase().trim();

      const matchesSearch = !q || empName.includes(q) || notes.includes(q) || date.includes(q);
      const matchesOt = !filterOtOnly || rec.otHours > 0;
      const matchesSunday = !filterSundayOnly || rec.isSunday;

      return matchesSearch && matchesOt && matchesSunday;
    });
  }, [records, employeeMap, searchQuery, filterOtOnly, filterSundayOnly]);

  // Sorting
  const sortedRecords = React.useMemo(() => {
    return [...filteredRecords].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'date') {
        comparison = a.date.localeCompare(b.date);
      } else if (sortField === 'employee') {
        const nameA = employeeMap.get(a.employeeId)?.name || '';
        const nameB = employeeMap.get(b.employeeId)?.name || '';
        comparison = nameA.localeCompare(nameB);
      } else if (sortField === 'totalMinutes') {
        comparison = a.totalMinutes - b.totalMinutes;
      } else if (sortField === 'basicHours') {
        comparison = a.basicHours - b.basicHours;
      } else if (sortField === 'otHours') {
        comparison = a.otHours - b.otHours;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [filteredRecords, sortField, sortOrder, employeeMap]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  return (
    <section className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
      {/* Table Toolbar */}
      <div className="p-3 sm:p-4 border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50/50">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by employee, date, or note..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition"
            />
          </div>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs text-slate-500 hover:text-slate-800 px-2 py-1 rounded"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filters and CSV export */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setFilterOtOnly(!filterOtOnly)}
            className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border transition ${
              filterOtOnly
                ? 'bg-amber-100 border-amber-300 text-amber-900 font-semibold'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            OT Shifts Only
          </button>

          <button
            type="button"
            onClick={() => setFilterSundayOnly(!filterSundayOnly)}
            className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border transition ${
              filterSundayOnly
                ? 'bg-orange-100 border-orange-300 text-orange-900 font-semibold'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Sundays Only
          </button>

          <button
            type="button"
            onClick={onExportCSV}
            title="Download CSV spreadsheet"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition shadow-2xs cursor-pointer ml-auto sm:ml-0"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Export CSV</span>
            <span className="sm:hidden">CSV</span>
          </button>
        </div>
      </div>

      {/* Empty State */}
      {sortedRecords.length === 0 ? (
        <div className="p-10 text-center">
          <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-800 mb-1">No Attendance Records Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {records.length === 0
              ? 'No attendance shifts logged yet. Click "Log Attendance" above to record duty hours.'
              : 'No shifts match your search criteria or active filters.'}
          </p>
        </div>
      ) : (
        <>
          {/* MOBILE VIEW: Card List for phone touch ergonomics */}
          <div className="block lg:hidden divide-y divide-slate-100">
            {sortedRecords.map((record) => {
              const emp = employeeMap.get(record.employeeId);
              const { formatted, dayOfWeek, isSunday } = formatDateDisplay(record.date);

              return (
                <div key={record.id} className="p-3.5 space-y-2.5 hover:bg-slate-50/60 transition">
                  {/* Top row: Employee & Actions */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-7 h-7 rounded-full text-white flex items-center justify-center text-xs font-bold shrink-0 ${
                          emp?.avatarColor || 'bg-slate-700'
                        }`}
                      >
                        {emp?.name.slice(0, 2).toUpperCase() || 'EM'}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 leading-tight">
                          {emp?.name || 'Unknown Employee'}
                        </h4>
                        <p className="text-[11px] text-slate-500">{emp?.role || '-'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEdit(record)}
                        aria-label="Edit attendance"
                        className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDelete(record.id)}
                        aria-label="Delete attendance"
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Middle row: Date & Clock times */}
                  <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 rounded-lg p-2 font-mono">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {isSunday && <Sun className="w-3.5 h-3.5 text-orange-600" />}
                      {!isSunday && record.isFullDayOt && <Zap className="w-3.5 h-3.5 text-amber-600" />}
                      <span className={isSunday ? 'text-orange-900 font-semibold' : record.isFullDayOt ? 'text-amber-900 font-semibold' : 'text-slate-800'}>
                        {formatted}
                      </span>
                      <span className="text-slate-400">({dayOfWeek})</span>
                      {record.isFullDayOt && !isSunday && (
                        <span className="text-[10px] bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded font-sans font-bold">
                          Holiday OT
                        </span>
                      )}
                    </div>
                    <div className="text-slate-700">
                      {record.timeIn} – {record.timeOut}
                    </div>
                  </div>

                  {/* Bottom metrics row: Duration, Basic, OT */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-slate-50/80 rounded p-1.5 border border-slate-100">
                      <span className="text-[10px] text-slate-400 block uppercase">Duration</span>
                      <span className="font-semibold text-slate-800 font-mono tabular-nums">
                        {formatMinutes(record.totalMinutes)}
                      </span>
                    </div>
                    <div className="bg-slate-50/80 rounded p-1.5 border border-slate-100">
                      <span className="text-[10px] text-slate-400 block uppercase">Basic</span>
                      <span className="font-semibold text-slate-800 font-mono tabular-nums">
                        {record.basicHours.toFixed(1)}h
                      </span>
                    </div>
                    <div
                      className={`rounded p-1.5 border ${
                        record.otHours > 0
                          ? 'bg-amber-50 border-amber-200 text-amber-900 font-bold'
                          : 'bg-slate-50/80 border-slate-100 text-slate-400'
                      }`}
                    >
                      <span className="text-[10px] block uppercase">Overtime</span>
                      <span className="font-mono tabular-nums">
                        {record.otHours > 0 ? `+${record.otHours.toFixed(1)}h` : '0h'}
                      </span>
                    </div>
                  </div>

                  {/* Note or explanation */}
                  <div className="text-[11px] text-slate-500 flex items-center justify-between gap-2">
                    <span className="truncate">{record.ruleExplanation}</span>
                    {record.notes && (
                      <span className="text-slate-700 font-medium truncate max-w-[140px] text-right">
                        "{record.notes}"
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* DESKTOP VIEW: High-density data grid */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 uppercase text-[11px] font-semibold tracking-wider select-none">
                  <th
                    scope="col"
                    onClick={() => toggleSort('employee')}
                    className="py-3 px-4 cursor-pointer hover:text-slate-900 transition"
                  >
                    <div className="flex items-center gap-1">
                      <span>Employee Name</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th
                    scope="col"
                    onClick={() => toggleSort('date')}
                    className="py-3 px-4 cursor-pointer hover:text-slate-900 transition"
                  >
                    <div className="flex items-center gap-1">
                      <span>Date & Day</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th scope="col" className="py-3 px-3">Time In</th>
                  <th scope="col" className="py-3 px-3">Time Out</th>
                  <th
                    scope="col"
                    onClick={() => toggleSort('totalMinutes')}
                    className="py-3 px-3 cursor-pointer hover:text-slate-900 transition text-right"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Total Duration</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th
                    scope="col"
                    onClick={() => toggleSort('basicHours')}
                    className="py-3 px-3 cursor-pointer hover:text-slate-900 transition text-right"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Basic Hours</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th
                    scope="col"
                    onClick={() => toggleSort('otHours')}
                    className="py-3 px-3 cursor-pointer hover:text-slate-900 transition text-right"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>OT Hours</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th scope="col" className="py-3 px-4">Calculation Rule / Notes</th>
                  <th scope="col" className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedRecords.map((record) => {
                  const emp = employeeMap.get(record.employeeId);
                  const { formatted, dayOfWeek, isSunday } = formatDateDisplay(record.date);

                  return (
                    <tr
                      key={record.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Employee Name */}
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-6 h-6 rounded-full text-white flex items-center justify-center text-[10px] font-bold shrink-0 ${
                              emp?.avatarColor || 'bg-slate-700'
                            }`}
                          >
                            {emp?.name.slice(0, 2).toUpperCase() || 'EM'}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-900 block leading-tight">
                              {emp?.name || 'Unknown Employee'}
                            </span>
                            <span className="text-[11px] text-slate-400">{emp?.role}</span>
                          </div>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-2.5 px-4 font-mono tabular-nums whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {isSunday && <Sun className="w-3.5 h-3.5 text-orange-600 shrink-0" />}
                          {!isSunday && record.isFullDayOt && <Zap className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                          <span className={isSunday ? 'text-orange-950 font-semibold' : record.isFullDayOt ? 'text-amber-950 font-semibold' : 'text-slate-800'}>
                            {formatted}
                          </span>
                          <span className="text-slate-400 text-[11px]">({dayOfWeek})</span>
                          {record.isFullDayOt && !isSunday && (
                            <span className="text-[10px] bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded font-sans font-bold ml-1">
                              Holiday OT
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Time In */}
                      <td className="py-2.5 px-3 font-mono tabular-nums text-slate-700 whitespace-nowrap">
                        {record.timeIn}
                      </td>

                      {/* Time Out */}
                      <td className="py-2.5 px-3 font-mono tabular-nums text-slate-700 whitespace-nowrap">
                        {record.timeOut}
                      </td>

                      {/* Total Duration */}
                      <td className="py-2.5 px-3 font-mono tabular-nums text-slate-900 font-semibold text-right whitespace-nowrap">
                        {formatMinutes(record.totalMinutes)}
                      </td>

                      {/* Basic Hours */}
                      <td className="py-2.5 px-3 font-mono tabular-nums text-slate-800 text-right whitespace-nowrap">
                        <span className={record.basicHours === 0 ? 'text-slate-400' : 'font-semibold'}>
                          {record.basicHours.toFixed(1)}h
                        </span>
                      </td>

                      {/* OT Hours */}
                      <td className="py-2.5 px-3 font-mono tabular-nums text-right whitespace-nowrap">
                        {record.otHours > 0 ? (
                          <span className="font-bold text-amber-800 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded text-[11px]">
                            +{record.otHours.toFixed(1)}h
                          </span>
                        ) : (
                          <span className="text-slate-400">0.0h</span>
                        )}
                      </td>

                      {/* Notes / Explanation */}
                      <td className="py-2.5 px-4 text-[11px] text-slate-600 max-w-xs truncate">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate">{record.ruleExplanation}</span>
                          {record.notes && (
                            <span className="text-slate-800 font-medium shrink-0">
                              · "{record.notes}"
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition">
                          <button
                            type="button"
                            onClick={() => onEdit(record)}
                            aria-label={`Edit record for ${emp?.name}`}
                            className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDelete(record.id)}
                            aria-label={`Delete record for ${emp?.name}`}
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Table Footer info */}
      <div className="p-3 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
        <span>
          Showing {sortedRecords.length} of {records.length} shifts
        </span>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline">
            Total OT in view: <strong className="font-mono text-slate-800">{sortedRecords.reduce((acc, r) => acc + r.otHours, 0).toFixed(1)} hrs</strong>
          </span>
        </div>
      </div>
    </section>
  );
};
