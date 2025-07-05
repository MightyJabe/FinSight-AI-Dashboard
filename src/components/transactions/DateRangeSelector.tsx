'use client';

import { format } from 'date-fns';
import { Calendar } from 'lucide-react';
import { useState } from 'react';

interface DateRangeSelectorProps {
  onDateRangeChange: (startDate: Date, endDate: Date) => void;
}

const PRESET_RANGES = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
  { label: 'This month', days: 0, isThisMonth: true },
  { label: 'Last month', days: 0, isLastMonth: true },
];

/**
 *
 */
export function DateRangeSelector({ onDateRangeChange }: DateRangeSelectorProps) {
  const [startDate, setStartDate] = useState<Date>(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30); // Default to last 30 days
    return date;
  });

  const [endDate, setEndDate] = useState<Date>(new Date());

  const handlePresetClick = (days: number, isThisMonth?: boolean, isLastMonth?: boolean) => {
    const end = new Date();
    const start = new Date();

    if (isThisMonth) {
      start.setDate(1);
    } else if (isLastMonth) {
      start.setMonth(start.getMonth() - 1);
      start.setDate(1);
      end.setDate(0);
    } else {
      start.setDate(end.getDate() - days);
    }

    setStartDate(start);
    setEndDate(end);
    onDateRangeChange(start, end);
  };

  const handleCustomDateChange = () => {
    onDateRangeChange(startDate, endDate);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-5 h-5 text-gray-500" />
        <h3 className="text-lg font-semibold">Date Range</h3>
      </div>

      {/* Preset Ranges */}
      <div className="flex flex-wrap gap-2 mb-6">
        {PRESET_RANGES.map(preset => (
          <button
            key={preset.label}
            onClick={() => handlePresetClick(preset.days, preset.isThisMonth, preset.isLastMonth)}
            className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Custom Date Range */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-1">
            Start Date
          </label>
          <input
            id="start-date"
            type="date"
            value={format(startDate, 'yyyy-MM-dd')}
            onChange={e => {
              const date = new Date(e.target.value);
              setStartDate(date);
              handleCustomDateChange();
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            suppressHydrationWarning
          />
        </div>
        <div>
          <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-1">
            End Date
          </label>
          <input
            id="end-date"
            type="date"
            value={format(endDate, 'yyyy-MM-dd')}
            onChange={e => {
              const date = new Date(e.target.value);
              setEndDate(date);
              handleCustomDateChange();
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            suppressHydrationWarning
          />
        </div>
      </div>
    </div>
  );
}
