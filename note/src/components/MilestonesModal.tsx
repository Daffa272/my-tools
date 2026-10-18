import React from 'react';
import { X, Award, CheckCircle, Lock, Trophy, Flame } from 'lucide-react';
import { Badge } from '../types';

interface MilestonesModalProps {
  isOpen: boolean;
  onClose: () => void;
  badges: Badge[];
}

export const MilestonesModal: React.FC<MilestonesModalProps> = ({ isOpen, onClose, badges }) => {
  if (!isOpen) return null;

  const unlockedCount = badges.filter(b => b.unlocked).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">Lencana & Prestasi Belajar</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {unlockedCount} dari {badges.length} lencana telah terbuka
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Badges Grid */}
        <div className="p-6 overflow-y-auto space-y-3">
          {badges.map(b => (
            <div
              key={b.id}
              className={`p-3.5 rounded-xl border flex items-center gap-3.5 transition-all ${
                b.unlocked
                  ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800'
                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-700/80 opacity-70'
              }`}
            >
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 ${
                  b.unlocked
                    ? 'bg-amber-100 dark:bg-amber-900/60 shadow-xs'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                }`}
              >
                {b.unlocked ? b.icon : '🔒'}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4
                    className={`font-semibold text-xs truncate ${
                      b.unlocked ? 'text-slate-900 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {b.title}
                  </h4>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      b.unlocked
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                    }`}
                  >
                    {b.unlocked ? 'Terbuka' : `${b.progress}/${b.maxProgress}`}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{b.description}</p>

                {/* Progress bar if not unlocked */}
                {!b.unlocked && (
                  <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mt-2 overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all"
                      style={{ width: `${Math.min(100, Math.round((b.progress / b.maxProgress) * 100))}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-3.5 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg shadow-sm transition-all"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
