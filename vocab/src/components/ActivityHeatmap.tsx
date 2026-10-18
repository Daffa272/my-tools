import React, { useMemo } from 'react';
import { getActivityHeatmap30Days, HeatmapDay } from '../services/storage';
import { Calendar } from 'lucide-react';

interface ActivityHeatmapProps {
  days?: HeatmapDay[];
}

export const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({ days }) => {
  const heatmapDays = useMemo(() => {
    return days || getActivityHeatmap30Days();
  }, [days]);

  const totalReviews30d = useMemo(() => {
    return heatmapDays.reduce((acc, cur) => acc + cur.count, 0);
  }, [heatmapDays]);

  const levelColors = {
    0: 'bg-slate-100 dark:bg-slate-800 border-slate-200/60 dark:border-slate-700/60',
    1: 'bg-emerald-200 dark:bg-emerald-950 text-emerald-900 border-emerald-300 dark:border-emerald-800',
    2: 'bg-emerald-300 dark:bg-emerald-800 text-emerald-950 border-emerald-400 dark:border-emerald-700',
    3: 'bg-emerald-400 dark:bg-emerald-600 text-white border-emerald-500 dark:border-emerald-500',
    4: 'bg-emerald-600 dark:bg-emerald-500 text-white border-emerald-700 dark:border-emerald-400',
  };

  return (
    <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850 p-3.5 space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
          <Calendar className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          Aktivitas 30 Hari Terakhir
        </span>
        <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
          {totalReviews30d} Review
        </span>
      </div>

      {/* Grid of 30 days (6 columns x 5 rows) */}
      <div className="grid grid-cols-10 gap-1.5">
        {heatmapDays.map((day) => {
          return (
            <div
              key={day.dateStr}
              title={`${day.dateStr}: ${day.count} review`}
              className={`h-4 w-full rounded-sm border transition-all cursor-default hover:scale-110 ${
                levelColors[day.level]
              }`}
            />
          );
        })}
      </div>

      <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 pt-1">
        <span>30 hari lalu</span>
        <div className="flex items-center gap-1">
          <span>Sedikit</span>
          <span className="h-2 w-2 rounded-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
          <span className="h-2 w-2 rounded-xs bg-emerald-300 dark:bg-emerald-800" />
          <span className="h-2 w-2 rounded-xs bg-emerald-600 dark:bg-emerald-500" />
          <span>Banyak</span>
        </div>
        <span>Hari ini</span>
      </div>
    </div>
  );
};
