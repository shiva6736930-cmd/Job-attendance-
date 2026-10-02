import React from 'react';
import { CalendarDays, Clock, Zap, Sun, TrendingUp } from 'lucide-react';
import { AttendanceSummary } from '../types/attendance';

interface SummaryCardsProps {
  summary: AttendanceSummary;
  filterLabel: string;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ summary, filterLabel }) => {
  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-slate-800 tracking-tight flex items-center gap-2">
          <span>Duty & Overtime Summary</span>
          <span className="text-xs font-normal text-slate-500">· {filterLabel}</span>
        </h2>
        <span className="text-xs font-mono text-slate-500">
          {summary.recordsCount} {summary.recordsCount === 1 ? 'shift logged' : 'shifts logged'}
        </span>
      </div>

      {/* Grid of clean metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Total Working Days */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 sm:p-4 shadow-xs transition hover:border-slate-300">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Working Days
            </span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
              <CalendarDays className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-mono tabular-nums">
              {summary.totalWorkingDays}
            </span>
            <span className="text-xs text-slate-500 font-medium">days</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1 truncate">
            {summary.recordsCount} total recorded shifts
          </p>
        </div>

        {/* Card 2: Total Basic Duty Hours */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 sm:p-4 shadow-xs transition hover:border-slate-300">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Basic Duty Hours
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-700">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-mono tabular-nums">
              {summary.totalBasicHours.toFixed(1)}
            </span>
            <span className="text-xs text-slate-500 font-medium">hrs</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1 truncate">
            Standard shift rate (9h cap)
          </p>
        </div>

        {/* Card 3: Total Overtime (OT) Hours */}
        <div className="bg-white border border-amber-200/80 bg-linear-to-b from-amber-50/40 to-white rounded-xl p-3.5 sm:p-4 shadow-xs transition hover:border-amber-300">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider text-amber-800 font-semibold">
              Total Overtime (OT)
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-amber-900 font-mono tabular-nums">
              {summary.totalOtHours.toFixed(1)}
            </span>
            <span className="text-xs text-amber-800 font-semibold">hrs</span>
          </div>
          <p className="text-[11px] text-amber-700/90 mt-1 truncate">
            Includes weekday OT + Sundays
          </p>
        </div>

        {/* Card 4: Sunday Special OT & Gross Hours */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 sm:p-4 shadow-xs transition hover:border-slate-300">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Sunday OT Work
            </span>
            <div className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600">
              <Sun className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-mono tabular-nums">
              {summary.totalSundayOtHours.toFixed(1)}
            </span>
            <span className="text-xs text-slate-500 font-medium">hrs</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1 truncate">
            {summary.totalSundayDays} Sunday {summary.totalSundayDays === 1 ? 'shift' : 'shifts'} (100% OT credited)
          </p>
        </div>
      </div>

      {/* Aggregate bar: Gross time & average */}
      <div className="mt-3 bg-slate-100/80 border border-slate-200 rounded-lg px-3.5 py-2.5 flex items-center justify-between flex-wrap gap-2 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-slate-500" />
          <span>Combined Gross Hours Worked:</span>
          <span className="font-semibold text-slate-900 font-mono tabular-nums">
            {summary.totalGrossHours.toFixed(1)} hrs
          </span>
          <span className="text-slate-400">({Math.floor(summary.totalGrossHours)}h {Math.round((summary.totalGrossHours % 1) * 60)}m)</span>
        </div>
        <div className="flex items-center gap-3 text-slate-500 text-[11px]">
          <span>Ratio: Basic {(summary.totalGrossHours > 0 ? (summary.totalBasicHours / summary.totalGrossHours * 100).toFixed(0) : 0)}%</span>
          <span>·</span>
          <span>OT {(summary.totalGrossHours > 0 ? (summary.totalOtHours / summary.totalGrossHours * 100).toFixed(0) : 0)}%</span>
        </div>
      </div>
    </section>
  );
};
