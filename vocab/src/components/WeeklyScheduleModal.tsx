import React from 'react';
import { X, Calendar, CheckCircle2 } from 'lucide-react';
import { SavedWord } from '../types';
import { getEnglishProficiency } from '../services/storage';

interface WeeklyScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  words: SavedWord[];
}

export const WeeklyScheduleModal: React.FC<WeeklyScheduleModalProps> = ({
  isOpen,
  onClose,
  words,
}) => {
  if (!isOpen) return null;

  const now = new Date();
  const masteredWords = words
    .filter((card) => getEnglishProficiency(card) === 'Dikuasai')
    .sort((a, b) => {
      const aTime = a.nextWeeklyTestDate ? new Date(a.nextWeeklyTestDate).getTime() : 0;
      const bTime = b.nextWeeklyTestDate ? new Date(b.nextWeeklyTestDate).getTime() : 0;
      return aTime - bTime || a.word.localeCompare(b.word);
    });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
              <Calendar className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Jadwal Tes Mingguan</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {masteredWords.length} kata berstatus Dikuasai
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-2.5">
          {masteredWords.length > 0 ? (
            masteredWords.map((card) => {
              const nextDate = card.nextWeeklyTestDate ? new Date(card.nextWeeklyTestDate) : null;
              const isReady = !nextDate || nextDate <= now;
              const intervalDays = card.weeklyTestIntervalDays || 7;

              return (
                <div
                  key={card.word}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-3 hover:bg-white dark:hover:bg-slate-800 transition-all"
                >
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 capitalize">{card.word}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{card.translation}</p>
                  </div>
                  <div className="text-right">
                    {isReady ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                        <CheckCircle2 className="h-3 w-3" />
                        Siap Dites
                      </span>
                    ) : (
                      <div className="text-xs space-y-0.5">
                        <span className="font-semibold text-slate-700 dark:text-slate-300 block">
                          {nextDate
                            ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(nextDate)
                            : '-'}
                        </span>
                        <span className="text-[10px] text-slate-400">Interval {intervalDays} hari</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-xs border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              Belum ada kartu berstatus Dikuasai untuk dijadwalkan tes mingguan.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
