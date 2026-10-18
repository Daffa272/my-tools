import React from 'react';
import { X, Award, CheckCircle2, TrendingUp, Sparkles, Star } from 'lucide-react';
import { FluencyScorecard } from '../types';

interface ScorecardModalProps {
  isOpen: boolean;
  onClose: () => void;
  scorecard: FluencyScorecard | null;
  personaName: string;
}

export const ScorecardModal: React.FC<ScorecardModalProps> = ({
  isOpen,
  onClose,
  scorecard,
  personaName
}) => {
  if (!isOpen || !scorecard) return null;

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-600 dark:text-emerald-400 border-emerald-500';
    if (score >= 70) return 'text-blue-600 dark:text-blue-400 border-blue-500';
    return 'text-amber-600 dark:text-amber-400 border-amber-500';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
                Rapor Evaluasi Sesi Bersama {personaName}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Analisis kelancaran, kosakata, & tata bahasa</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Main Score Grid */}
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase">Kelancaran</span>
              <p className={`text-xl font-bold font-mono mt-1 ${getScoreColor(scorecard.fluencyScore).split(' ')[0]}`}>
                {scorecard.fluencyScore}
              </p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase">Kosakata</span>
              <p className={`text-xl font-bold font-mono mt-1 ${getScoreColor(scorecard.vocabScore).split(' ')[0]}`}>
                {scorecard.vocabScore}
              </p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase">Grammar</span>
              <p className={`text-xl font-bold font-mono mt-1 ${getScoreColor(scorecard.grammarScore).split(' ')[0]}`}>
                {scorecard.grammarScore}
              </p>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl border border-emerald-200 dark:border-emerald-800">
              <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase">Total</span>
              <p className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-300 mt-1">
                {scorecard.overallScore}
              </p>
            </div>
          </div>

          {/* Summary */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/70 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
            <span className="font-semibold block mb-1">Ulasan Evaluator:</span>
            {scorecard.summary}
          </div>

          {/* Strengths */}
          {scorecard.strengths?.length > 0 && (
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Kekuatan Kamu:</span>
              </h4>
              <ul className="space-y-1">
                {scorecard.strengths.map((str, idx) => (
                  <li key={idx} className="text-xs text-slate-600 dark:text-slate-300 flex items-start gap-1.5 pl-1">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Improvements */}
          {scorecard.improvements?.length > 0 && (
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-amber-800 dark:text-amber-400 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Area Pengembangan:</span>
              </h4>
              <ul className="space-y-1">
                {scorecard.improvements.map((imp, idx) => (
                  <li key={idx} className="text-xs text-slate-600 dark:text-slate-300 flex items-start gap-1.5 pl-1">
                    <span className="text-amber-500 font-bold">•</span>
                    <span>{imp}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Good Phrases Used */}
          {scorecard.goodPhrasesUsed?.length > 0 && (
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Frasa Bagus yang Digunakan:</span>
              </h4>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {scorecard.goodPhrasesUsed.map((phrase, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700"
                  >
                    "{phrase}"
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-3.5 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg shadow-sm transition-all"
          >
            Tutup Rapor
          </button>
        </div>
      </div>
    </div>
  );
};
