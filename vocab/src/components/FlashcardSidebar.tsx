import React, { useMemo, useRef, useState } from 'react';
import {
  Brain,
  Download,
  Upload,
  Calendar,
  Sparkles,
  Trash2,
  CheckCircle2,
  Play,
  FileCheck2,
  ChevronRight,
  Flame,
  Zap,
  Headphones,
  Compass,
  Printer,
  Target
} from 'lucide-react';
import { SavedWord, TOEFLTopic } from '../types';
import {
  getEnglishProficiency,
  exportBackupJSON,
  StudyStreakData,
  inferTOEFLTopic
} from '../services/storage';
import { ActivityHeatmap } from './ActivityHeatmap';

interface FlashcardSidebarProps {
  words: SavedWord[];
  onSelectWord: (word: SavedWord) => void;
  onRemoveWord: (wordStr: string) => void;
  onStartReview: (mode?: 'due' | 'learning' | 'new-learning') => void;
  onStartWeeklyTest: () => void;
  onOpenWeeklySchedule: () => void;
  onImportJSON: (file: File) => void;
  streakData: StudyStreakData;
  onOpenSpeedMatch: () => void;
  onOpenHandsFree: () => void;
  onOpenPrintSheet: () => void;
  onUpdateDailyGoal?: (goal: number) => void;
}

export const FlashcardSidebar: React.FC<FlashcardSidebarProps> = ({
  words,
  onSelectWord,
  onRemoveWord,
  onStartReview,
  onStartWeeklyTest,
  onOpenWeeklySchedule,
  onImportJSON,
  streakData,
  onOpenSpeedMatch,
  onOpenHandsFree,
  onOpenPrintSheet,
  onUpdateDailyGoal,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'learning' | 'new'>('all');
  const [topicFilter, setTopicFilter] = useState<TOEFLTopic | 'all'>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Statistics & Proficiency breakdown
  const stats = useMemo(() => {
    let baru = 0;
    let learning = 0;
    let mastered = 0;

    words.forEach((w) => {
      const prof = getEnglishProficiency(w);
      if (prof === 'Dikuasai') mastered++;
      else if (prof === 'Sedang Dipelajari') learning++;
      else baru++;
    });

    const total = words.length;
    const now = new Date();
    const dueCount = words.filter((w) => !w.nextReviewDate || new Date(w.nextReviewDate) <= now).length;
    const weeklyCandidates = words.filter(
      (w) => getEnglishProficiency(w) === 'Dikuasai' && (!w.nextWeeklyTestDate || new Date(w.nextWeeklyTestDate) <= now)
    ).length;

    return {
      total,
      baru,
      learning,
      mastered,
      dueCount,
      weeklyCandidates,
    };
  }, [words]);

  // Donut chart CSS gradient
  const donutGradient = useMemo(() => {
    if (stats.total === 0) return 'conic-gradient(#e2e8f0 0% 100%)';
    const p1 = (stats.baru / stats.total) * 100;
    const p2 = p1 + (stats.learning / stats.total) * 100;
    return `conic-gradient(#cbd5e1 0% ${p1}%, #f59e0b ${p1}% ${p2}%, #10b981 ${p2}% 100%)`;
  }, [stats]);

  // Filtered words by status and topic
  const filteredWords = useMemo(() => {
    return words.filter((w) => {
      // 1. Status Filter
      if (filterMode === 'learning' && getEnglishProficiency(w) !== 'Sedang Dipelajari') {
        return false;
      }
      if (filterMode === 'new' && (w.repetition || 0) !== 1) {
        return false;
      }

      // 2. Topic Filter
      if (topicFilter !== 'all') {
        const itemTopic = w.topic || inferTOEFLTopic(w.word, w.translation, w.tenses?.present?.example_en);
        if (itemTopic !== topicFilter) return false;
      }

      return true;
    });
  }, [words, filterMode, topicFilter]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportJSON(file);
      e.target.value = '';
    }
  };

  const goalPercent = Math.min(100, Math.round((streakData.todayReviews / (streakData.dailyGoal || 10)) * 100));

  const topicTabs: { id: TOEFLTopic | 'all'; label: string }[] = [
    { id: 'all', label: 'Semua' },
    { id: 'biology', label: '🌿 Sains' },
    { id: 'history', label: '🏛️ Sejarah' },
    { id: 'psychology', label: '🧠 Psikologi' },
    { id: 'geology', label: '🌌 Geologi' },
    { id: 'economics', label: '📈 Ekonomi' },
  ];

  return (
    <div className="space-y-5">
      {/* 0. Daily Goal & Streak Card */}
      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-sm space-y-3 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400">
              <Flame className="h-4 w-4 fill-orange-500 text-orange-500" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                Daily Study Streak
              </h4>
              <p className="text-xs text-orange-600 dark:text-orange-400 font-bold">
                {streakData.streakCount} Hari Aktif Berturut-turut!
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 tabular-nums">
            {streakData.todayReviews} / {streakData.dailyGoal} Kartu
          </span>
        </div>

        {/* Target Progress Bar */}
        <div className="space-y-1">
          <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                goalPercent >= 100
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                  : 'bg-gradient-to-r from-orange-500 to-amber-400'
              }`}
              style={{ width: `${goalPercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
            <span>Target: {streakData.dailyGoal} review / hari</span>
            <span className={goalPercent >= 100 ? 'text-emerald-600 dark:text-emerald-400 font-bold' : ''}>
              {goalPercent}% {goalPercent >= 100 ? '· Tercapai! 🎉' : 'tercapai'}
            </span>
          </div>
        </div>

        {/* Quick Goal Selector */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Target className="h-3 w-3 text-indigo-500" />
            Setel Target:
          </span>
          <div className="flex items-center gap-1">
            {[5, 10, 15, 20].map((goal) => (
              <button
                key={goal}
                type="button"
                onClick={() => onUpdateDailyGoal && onUpdateDailyGoal(goal)}
                className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${
                  streakData.dailyGoal === goal
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {goal}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 1. Quick Interactive Modes Strip (Speed Match & Hands-Free Audio) */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onOpenSpeedMatch}
          className="flex items-center justify-center gap-2 rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/30 p-3 text-xs font-bold text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 active:scale-95 transition-all shadow-xs"
        >
          <Zap className="h-4 w-4 fill-amber-500 text-amber-500" />
          <span>⚡ Speed Match (60s)</span>
        </button>

        <button
          type="button"
          onClick={onOpenHandsFree}
          className="flex items-center justify-center gap-2 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/70 dark:bg-indigo-950/30 p-3 text-xs font-bold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 active:scale-95 transition-all shadow-xs"
        >
          <Headphones className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          <span>🎧 Mode Hands-Free</span>
        </button>
      </div>

      {/* 2. Main Spaced Repetition Panel */}
      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4 transition-colors">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <Brain className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Spaced Repetition (SM-2)</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Algoritma Memori Jangka Panjang</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onStartReview('due')}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 active:scale-95 transition-all"
          >
            <Play className="h-3 w-3 fill-current" />
            <span>Review ({stats.dueCount})</span>
          </button>
        </div>

        {/* Donut Chart & Proficiency */}
        <div className="flex items-center gap-4 py-1">
          <div
            className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full shadow-inner"
            style={{ background: donutGradient }}
          >
            <div className="flex h-16 w-16 flex-col items-center justify-center rounded-full bg-white dark:bg-slate-900 shadow-xs">
              <span className="text-base font-extrabold text-slate-900 dark:text-slate-100 leading-none">
                {stats.total}
              </span>
              <span className="text-[10px] font-semibold text-slate-400 mt-0.5">kartu</span>
            </div>
          </div>

          <div className="flex-1 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
                <span className="text-slate-600 dark:text-slate-300 font-medium">Dikuasai</span>
              </div>
              <span className="font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                {stats.mastered} ({stats.total ? Math.round((stats.mastered / stats.total) * 100) : 0}%)
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500"></span>
                <span className="text-slate-600 dark:text-slate-300 font-medium">Dipelajari</span>
              </div>
              <span className="font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                {stats.learning} ({stats.total ? Math.round((stats.learning / stats.total) * 100) : 0}%)
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                <span className="text-slate-600 dark:text-slate-300 font-medium">Baru</span>
              </div>
              <span className="font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                {stats.baru} ({stats.total ? Math.round((stats.baru / stats.total) * 100) : 0}%)
              </span>
            </div>
          </div>
        </div>

        {/* 30-Day Activity Heatmap */}
        <ActivityHeatmap />

        {/* Status Filter buttons */}
        <div className="grid grid-cols-3 gap-1.5 pt-1">
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`rounded-lg py-1.5 px-2 text-[11px] font-semibold transition-all ${
              filterMode === 'all'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-700'
            }`}
          >
            Semua ({words.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('learning')}
            className={`rounded-lg py-1.5 px-2 text-[11px] font-semibold transition-all ${
              filterMode === 'learning'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-700'
            }`}
          >
            Dipelajari ({stats.learning})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('new')}
            className={`rounded-lg py-1.5 px-2 text-[11px] font-semibold transition-all ${
              filterMode === 'new'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-700'
            }`}
          >
            Baru Masuk
          </button>
        </div>

        {/* Thematic TOEFL Topic Tabs */}
        <div className="space-y-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Compass className="h-3 w-3" /> Topik Akademik TOEFL
          </span>
          <div className="flex flex-wrap gap-1">
            {topicTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTopicFilter(tab.id)}
                className={`rounded-lg px-2 py-1 text-[10px] font-bold transition-all ${
                  topicFilter === tab.id
                    ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                    : 'bg-slate-50 dark:bg-slate-800/70 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Review shortcuts */}
        <div className="space-y-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => onStartReview('learning')}
            className="w-full flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:border-indigo-200 dark:hover:border-indigo-800 hover:text-indigo-700 dark:hover:text-indigo-300 transition-all"
          >
            <span className="flex items-center gap-1.5">
              <span>🧠</span> Review Sedang Dipelajari
            </span>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
          </button>

          <button
            type="button"
            onClick={() => onStartReview('new-learning')}
            className="w-full flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:border-indigo-200 dark:hover:border-indigo-800 hover:text-indigo-700 dark:hover:text-indigo-300 transition-all"
          >
            <span className="flex items-center gap-1.5">
              <span>🆕</span> Review Baru Masuk
            </span>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
          </button>
        </div>

        {/* Weekly Mastery Test */}
        <div className="rounded-xl border border-emerald-100 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/30 p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
              <FileCheck2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              Tes Mingguan Kata Dikuasai
            </span>
            {stats.weeklyCandidates > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white animate-pulse">
                {stats.weeklyCandidates} Siap
              </span>
            )}
          </div>
          <p className="text-[11px] text-emerald-800 dark:text-emerald-300/80 leading-relaxed">
            Uji kembali arti kata yang sudah dikuasai secara berkala untuk mempertahankan retensi memori.
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onStartWeeklyTest}
              disabled={stats.weeklyCandidates === 0}
              className="flex-1 rounded-lg bg-emerald-600 py-1.5 px-3 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-all"
            >
              📝 Mulai Tes ({stats.weeklyCandidates})
            </button>
            <button
              type="button"
              onClick={onOpenWeeklySchedule}
              className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-800 py-1.5 px-2.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-slate-700 transition-all"
              title="Lihat Jadwal Tes Mingguan"
            >
              <Calendar className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Backup, Import & Print/PDF */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={exportBackupJSON}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-2 px-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-xs"
            >
              <Download className="h-3.5 w-3.5 text-slate-500" />
              <span>Backup JSON</span>
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-2 px-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-xs"
            >
              <Upload className="h-3.5 w-3.5 text-slate-500" />
              <span>Import JSON</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onOpenPrintSheet}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-indigo-200 dark:border-indigo-800/80 bg-indigo-50/70 dark:bg-indigo-950/40 py-2 px-3 text-xs font-bold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 active:scale-95 transition-all shadow-xs"
          >
            <Printer className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>🖨️ Cetak Lembar Studi / Ekspor PDF</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>

      {/* 3. Saved Cards List */}
      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-3 transition-colors">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Daftar Kosakata ({filteredWords.length})
            </h4>
          </div>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">Klik kartu untuk membuka</span>
        </div>

        {filteredWords.length > 0 ? (
          <div className="max-h-[500px] overflow-y-auto space-y-2 pr-1">
            {filteredWords
              .slice()
              .reverse()
              .map((item) => {
                const now = new Date();
                const isDue = !item.nextReviewDate || new Date(item.nextReviewDate) <= now;
                const daysRemaining = item.nextReviewDate
                  ? Math.ceil((new Date(item.nextReviewDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                  : 0;

                const itemTopic = item.topic || inferTOEFLTopic(item.word, item.translation, item.tenses?.present?.example_en);

                return (
                  <div
                    key={item.word}
                    onClick={() => onSelectWord(item)}
                    className="group flex items-center justify-between gap-3 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-3 hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-white dark:hover:bg-slate-800 hover:shadow-xs transition-all cursor-pointer"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <strong className="text-sm font-bold text-slate-900 dark:text-slate-100 capitalize truncate">
                          {item.word}
                        </strong>
                        <span className="text-[10px] font-semibold text-slate-400 capitalize">
                          · {itemTopic}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{item.translation}</p>
                      <div className="mt-1 flex items-center gap-2">
                        {isDue ? (
                          <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded">
                            Due Now!
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded">
                            {daysRemaining} Hari Lagi
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400">
                          Rep: {item.repetition || 0}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveWord(item.word);
                      }}
                      title="Hapus dari daftar"
                      className="opacity-0 group-hover:opacity-100 rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 hover:text-rose-600 dark:hover:text-rose-400 transition-all"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
          </div>
        ) : (
          <div className="py-8 text-center text-slate-400 dark:text-slate-500 text-xs border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
            {filterMode === 'all' && topicFilter === 'all'
              ? 'Belum ada flashcard yang disimpan.'
              : 'Tidak ada kartu pada filter terpilih.'}
          </div>
        )}
      </div>
    </div>
  );
};
