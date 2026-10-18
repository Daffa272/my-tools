import React from 'react';
import { GitBranch, Volume2 } from 'lucide-react';
import { WordData } from '../types';
import { speakEnglish } from '../services/speech';

interface MorphologyTreeGraphProps {
  data: WordData;
}

export const MorphologyTreeGraph: React.FC<MorphologyTreeGraphProps> = ({ data }) => {
  const root = data.morphology?.root || data.word;
  const prefix = data.morphology?.prefix && data.morphology.prefix !== '-' ? data.morphology.prefix : null;
  const suffix = data.morphology?.suffix && data.morphology.suffix !== '-' ? data.morphology.suffix : null;

  const family = [
    { label: 'Noun', val: data.word_family?.noun },
    { label: 'Verb', val: data.word_family?.verb },
    { label: 'Adjective', val: data.word_family?.adjective },
    { label: 'Adverb', val: data.word_family?.adverb },
  ].filter((item) => item.val && item.val !== '-');

  return (
    <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Peta Konsep Morfologi & Cabang Kata (Visual Tree)
          </h3>
        </div>
        <span className="text-[11px] text-slate-400">Klik node kata untuk mendengarkan</span>
      </div>

      <div className="relative overflow-x-auto py-4 flex flex-col items-center justify-center">
        {/* Morphology Affixes Row (Prefix & Suffix) */}
        {(prefix || suffix) && (
          <div className="flex items-center gap-6 mb-3">
            {prefix && (
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Prefix (Awalan)
                </span>
                <div className="rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/40 px-3 py-1 text-xs font-semibold text-amber-800 dark:text-amber-300 shadow-2xs">
                  {prefix}
                </div>
              </div>
            )}

            {suffix && (
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Suffix (Akhiran)
                </span>
                <div className="rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50 dark:bg-blue-950/40 px-3 py-1 text-xs font-semibold text-blue-800 dark:text-blue-300 shadow-2xs">
                  {suffix}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Center Root Node */}
        <div className="relative z-10 flex flex-col items-center my-2">
          <div
            onClick={() => speakEnglish(data.word)}
            className="group cursor-pointer rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white px-5 py-2.5 shadow-md shadow-indigo-600/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
          >
            <span className="text-sm font-extrabold capitalize">{data.word}</span>
            <Volume2 className="h-3.5 w-3.5 opacity-80 group-hover:opacity-100" />
          </div>
          <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 mt-1 uppercase tracking-wider">
            Akar: {root}
          </span>
        </div>

        {/* Tree Connection Line */}
        {family.length > 0 && (
          <div className="w-48 h-4 border-b-2 border-indigo-200 dark:border-indigo-900 my-1" />
        )}

        {/* Word Family Branches */}
        {family.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-3 mt-3">
            {family.map((f) => (
              <button
                key={f.label}
                type="button"
                onClick={() => speakEnglish(f.val || '')}
                className="group flex flex-col items-center rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 hover:border-indigo-400 dark:hover:border-indigo-600 hover:bg-white dark:hover:bg-slate-800 transition-all shadow-2xs"
              >
                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">
                  {f.label}
                </span>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                    {f.val}
                  </span>
                  <Volume2 className="h-3 w-3 text-slate-400 group-hover:text-indigo-600" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
