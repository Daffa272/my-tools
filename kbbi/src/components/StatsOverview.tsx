import React from 'react';
import { KBBICard, ReviewMode, StreakData, QuizMode } from '../types';
import { getProficiency, isDue } from '../utils/sm2';
import { getCurrentMasteryRank } from '../utils/streak';
import {
  Sparkles,
  Play,
  Flame,
  GraduationCap,
  CheckCircle2,
  Zap,
  PenTool,
  Target,
  Trophy
} from 'lucide-react';

interface StatsOverviewProps {
  cards: KBBICard[];
  streakData: StreakData;
  onStartReview: (mode: ReviewMode) => void;
  onFilterChange: (filter: 'all' | 'due' | 'learning' | 'mastered') => void;
  activeFilter: 'all' | 'due' | 'learning' | 'mastered';
  onStartQuiz: (mode: QuizMode) => void;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({
  cards,
  streakData,
  onStartReview,
  onFilterChange,
  activeFilter,
  onStartQuiz,
}) => {
  const total = cards.length;
  const dueCount = cards.filter(isDue).length;
  const learningCards = cards.filter(c => getProficiency(c) === 'Sedang Dipelajari');
  const masteredCards = cards.filter(c => getProficiency(c) === 'Dikuasai');
  const newCards = cards.filter(c => getProficiency(c) === 'Baru');

  const learningCount = learningCards.length;
  const masteredCount = masteredCards.length;
  const newCount = newCards.length;

  const percentNew = total ? Math.round((newCount / total) * 100) : 0;
  const percentLearning = total ? Math.round((learningCount / total) * 100) : 0;
  const percentMastered = total ? Math.round((masteredCount / total) * 100) : 0;

  // Donut chart calculation
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  
  const strokeNew = (percentNew / 100) * circumference;
  const strokeLearning = (percentLearning / 100) * circumference;
  const strokeMastered = (percentMastered / 100) * circumference;

  const offsetNew = 0;
  const offsetLearning = -strokeNew;
  const offsetMastered = -(strokeNew + strokeLearning);

  // Mastery Rank
  const { currentRank, nextRank, progressToNext } = getCurrentMasteryRank(masteredCount);

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
      {/* Hero Action Card */}
      <div className="md:col-span-7 lg:col-span-8 rounded-3xl bg-gradient-to-br from-emerald-900 via-emerald-950 to-stone-900 p-6 text-white shadow-lg relative overflow-hidden flex flex-col justify-between">
        <div className="absolute right-0 top-0 -mt-8 -mr-8 h-48 w-48 rounded-full bg-emerald-700/20 blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 -mb-10 h-32 w-32 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-3 text-xs mb-2.5">
            <span className="inline-flex items-center gap-1.5 font-bold text-amber-300 bg-amber-950/60 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
              <Flame className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
              <span>{streakData.currentStreak} Hari Beruntun</span>
            </span>

            <span className="inline-flex items-center gap-1.5 font-bold text-emerald-200 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
              <Target className="h-3.5 w-3.5 text-emerald-400" />
              <span>Target: {streakData.todayCount}/{streakData.dailyTarget} kata</span>
            </span>
          </div>

          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
            Perkaya Diksi & Daya Ingat Bahasa
          </h1>
          <p className="text-emerald-100/80 text-xs sm:text-sm max-w-xl leading-relaxed">
            Kuasai kosakata baku KBBI dengan algoritma pengulangan berkala (SM-2), kuis kilat 60 detik, dan latihan kalimat rumpang.
          </p>
        </div>

        {/* Action Triggers */}
        <div className="relative z-10 mt-6 pt-5 border-t border-emerald-800/60 flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onStartReview('due')}
            disabled={dueCount === 0}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all shadow-md ${
              dueCount > 0
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 hover:from-amber-400 hover:to-amber-500 active:scale-98 cursor-pointer ring-2 ring-amber-400/30'
                : 'bg-stone-800 text-stone-500 cursor-not-allowed border border-stone-700'
            }`}
          >
            <Play className="h-4 w-4 fill-current" />
            <span>Mulai Review Jatuh Tempo</span>
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
              dueCount > 0 ? 'bg-stone-950/20 text-stone-950' : 'bg-stone-700 text-stone-400'
            }`}>
              {dueCount}
            </span>
          </button>

          <button
            onClick={() => onStartReview('learning')}
            disabled={learningCount === 0}
            className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all ${
              learningCount > 0
                ? 'bg-emerald-800/80 text-emerald-100 hover:bg-emerald-700 active:scale-98 border border-emerald-600/40 cursor-pointer'
                : 'bg-stone-800/50 text-stone-500 border border-stone-800 cursor-not-allowed'
            }`}
          >
            <GraduationCap className="h-4 w-4" />
            <span>Sedang Dipelajari ({learningCount})</span>
          </button>

          <button
            onClick={() => onStartQuiz('speed')}
            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold bg-amber-400/20 text-amber-200 hover:bg-amber-400/30 border border-amber-300/30 transition-all cursor-pointer"
            title="Kuis 60 Detik Tantangan Cepat"
          >
            <Zap className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
            <span>Kuis 60s</span>
          </button>

          <button
            onClick={() => onStartQuiz('fill-blank')}
            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold bg-white/10 text-emerald-100 hover:bg-white/20 border border-white/15 transition-all cursor-pointer"
            title="Latihan Kalimat Rumpang"
          >
            <PenTool className="h-3.5 w-3.5 text-emerald-300" />
            <span>Kalimat Rumpang</span>
          </button>
        </div>
      </div>

      {/* Donut Chart & Proficiency Card */}
      <div className="md:col-span-5 lg:col-span-4 rounded-3xl bg-white p-5 border border-stone-200/90 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-serif text-sm font-bold text-stone-900 flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            Kemahiran Kosakata
          </h2>
          <span className="text-xs text-stone-400 font-mono">
            {total} Total
          </span>
        </div>

        {/* Mastery Rank Progress Sub-bar */}
        <div className="mb-3 rounded-2xl bg-stone-50 p-2.5 border border-stone-200/80 text-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="font-semibold text-stone-800 flex items-center gap-1.5">
              <span>{currentRank.icon}</span>
              <span>{currentRank.title}</span>
            </span>
            <span className="text-[11px] text-stone-500 font-mono">
              {masteredCount} dikuasai
            </span>
          </div>
          {nextRank && (
            <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden mt-1.5">
              <div
                className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${progressToNext}%` }}
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 my-auto">
          {/* SVG Donut */}
          <div className="relative h-26 w-26 shrink-0 flex items-center justify-center">
            <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r={radius}
                className="stroke-stone-100"
                strokeWidth="12"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r={radius}
                className="stroke-stone-300 transition-all duration-500"
                strokeWidth="12"
                strokeDasharray={`${strokeNew} ${circumference}`}
                strokeDashoffset={offsetNew}
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r={radius}
                className="stroke-amber-500 transition-all duration-500"
                strokeWidth="12"
                strokeDasharray={`${strokeLearning} ${circumference}`}
                strokeDashoffset={offsetLearning}
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r={radius}
                className="stroke-emerald-600 transition-all duration-500"
                strokeWidth="12"
                strokeDasharray={`${strokeMastered} ${circumference}`}
                strokeDashoffset={offsetMastered}
                fill="transparent"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="font-serif text-xl font-bold text-stone-900 leading-none">
                {total}
              </span>
              <span className="text-[10px] text-stone-500 font-medium">kartu</span>
            </div>
          </div>

          {/* Breakdown Legend */}
          <div className="space-y-1 w-full text-xs">
            <button
              onClick={() => onFilterChange(activeFilter === 'mastered' ? 'all' : 'mastered')}
              className={`w-full flex items-center justify-between p-1.5 rounded-lg transition-colors text-left ${
                activeFilter === 'mastered' ? 'bg-emerald-50 text-emerald-950 font-bold' : 'hover:bg-stone-50 text-stone-700'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-600 shrink-0" />
                <span>Dikuasai</span>
              </div>
              <span className="font-mono text-stone-900 font-semibold">{masteredCount} ({percentMastered}%)</span>
            </button>

            <button
              onClick={() => onFilterChange(activeFilter === 'learning' ? 'all' : 'learning')}
              className={`w-full flex items-center justify-between p-1.5 rounded-lg transition-colors text-left ${
                activeFilter === 'learning' ? 'bg-amber-50 text-amber-950 font-bold' : 'hover:bg-stone-50 text-stone-700'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500 shrink-0" />
                <span>Dipromosikan</span>
              </div>
              <span className="font-mono text-stone-900 font-semibold">{learningCount} ({percentLearning}%)</span>
            </button>

            <button
              onClick={() => onFilterChange('all')}
              className={`w-full flex items-center justify-between p-1.5 rounded-lg transition-colors text-left ${
                activeFilter === 'all' ? 'bg-stone-100 text-stone-950 font-medium' : 'hover:bg-stone-50 text-stone-600'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-stone-300 shrink-0" />
                <span>Belum Direview</span>
              </div>
              <span className="font-mono text-stone-700">{newCount} ({percentNew}%)</span>
            </button>
          </div>
        </div>

        {/* Due indicator */}
        <div className="mt-2 pt-2.5 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
          <span>Jatuh tempo saat ini:</span>
          <span className={`font-semibold ${dueCount > 0 ? 'text-amber-600' : 'text-emerald-700'}`}>
            {dueCount > 0 ? `${dueCount} kartu perlu direview` : 'Semua kartu up-to-date!'}
          </span>
        </div>
      </div>
    </div>
  );
};
