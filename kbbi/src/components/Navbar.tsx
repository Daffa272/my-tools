import React, { useState } from 'react';
import { BookOpen, Key, Timer, Zap, PenTool, Flame, Target, Award, ShieldCheck, X, Sparkles } from 'lucide-react';
import { StreakData, MasteryRank, QuizMode } from '../types';
import { MASTERY_RANKS } from '../utils/streak';

interface NavbarProps {
  apiKey: string;
  onApiKeyChange: (key: string) => void;
  onOpenPomodoro: () => void;
  isPomodoroActive?: boolean;
  pomodoroTimeLeft?: string;
  streakData: StreakData;
  masteredCount: number;
  currentRank: MasteryRank;
  onStartQuiz: (mode: QuizMode) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  apiKey,
  onApiKeyChange,
  onOpenPomodoro,
  isPomodoroActive,
  pomodoroTimeLeft,
  streakData,
  masteredCount,
  currentRank,
  onStartQuiz
}) => {
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [showRankModal, setShowRankModal] = useState(false);
  const [tempKey, setTempKey] = useState(apiKey);
  const [showPassword, setShowPassword] = useState(false);

  const handleSaveKey = () => {
    onApiKeyChange(tempKey.trim());
    setShowKeyModal(false);
  };

  const isDailyTargetReached = streakData.todayCount >= streakData.dailyTarget;

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-stone-200/80 bg-stone-50/95 backdrop-blur-md transition-all">
        {/* Top bar: Streak & Daily Target & Ranks */}
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-1.5 text-xs border-b border-stone-200/60 sm:px-6">
          <div className="flex items-center gap-3">
            {/* Daily Streak Indicator */}
            <div
              className={`flex items-center gap-1.5 font-bold px-2 py-0.5 rounded-full text-xs transition-colors ${
                streakData.currentStreak > 0
                  ? 'bg-amber-100/90 text-amber-900 border border-amber-300/80'
                  : 'bg-stone-100 text-stone-500'
              }`}
              title={`Runtutan belajar harian: ${streakData.currentStreak} hari berturut-turut! Rekor terbaik: ${streakData.bestStreak} hari.`}
            >
              <Flame className="h-3.5 w-3.5 text-amber-600 fill-amber-500" />
              <span>{streakData.currentStreak} Hari Berturut-turut</span>
            </div>

            {/* Daily Target Progress */}
            <div
              className={`hidden sm:flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full ${
                isDailyTargetReached
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-stone-100 text-stone-700'
              }`}
              title="Target harian review kartu"
            >
              <Target className="h-3.5 w-3.5 text-emerald-700" />
              <span>
                Target: {streakData.todayCount}/{streakData.dailyTarget} kata
                {isDailyTargetReached && ' ✓'}
              </span>
            </div>
          </div>

          {/* Right Badges & Controls */}
          <div className="flex items-center gap-2">
            {/* Mastery Rank Trigger */}
            <button
              onClick={() => setShowRankModal(true)}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-colors cursor-pointer"
              title="Lihat Lencana & Peringkat Prestasi Anda"
            >
              <span>{currentRank.icon}</span>
              <span className="hidden md:inline">{currentRank.title}</span>
              <span className="md:hidden">Peringkat</span>
            </button>

            {/* Pomodoro Focus Timer */}
            <button
              onClick={onOpenPomodoro}
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium transition-colors ${
                isPomodoroActive
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
              }`}
              title="Focus Timer / Pomodoro"
            >
              <Timer className="h-3.5 w-3.5 text-amber-600" />
              <span>{isPomodoroActive ? pomodoroTimeLeft : 'Fokus Timer'}</span>
            </button>

            {/* API Key */}
            <button
              onClick={() => {
                setTempKey(apiKey);
                setShowKeyModal(true);
              }}
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium transition-colors ${
                apiKey
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                  : 'bg-stone-100 text-stone-700 border border-stone-300 hover:bg-stone-200'
              }`}
              title="Atur Gemini API Key"
            >
              <Key className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{apiKey ? 'API Key Aktif' : 'Set API Key'}</span>
            </button>
          </div>
        </div>

        {/* Main Navbar */}
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-800 to-emerald-950 text-emerald-100 shadow-sm ring-1 ring-emerald-900/20">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif text-lg font-bold tracking-tight text-stone-900">
                  Kosa Kata KBBI
                </span>
                <span className="rounded bg-emerald-100/80 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-emerald-900 uppercase">
                  Spaced Repetition
                </span>
              </div>
              <p className="text-[11px] text-stone-500">
                Kamus Besar Bahasa Indonesia & Penguasaan Kosakata Ilmiah
              </p>
            </div>
          </div>

          {/* Interactive Learning Mode Buttons (Speed Quiz, Fill in the blanks, Daily Puzzle) */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => onStartQuiz('puzzle')}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-purple-500/15 text-purple-950 hover:bg-purple-500/25 border border-purple-300/80 text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-98"
              title="Teka-Teki Kata Harian (Katla-Style)"
            >
              <Sparkles className="h-3.5 w-3.5 text-purple-600" />
              <span>Teka-Teki Kata</span>
            </button>

            <button
              type="button"
              onClick={() => onStartQuiz('speed')}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-amber-500/15 text-amber-950 hover:bg-amber-500/25 border border-amber-300/80 text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-98"
              title="Kuis 60 Detik Tantangan Tebak Makna"
            >
              <Zap className="h-3.5 w-3.5 text-amber-600 fill-amber-500" />
              <span>Kuis 60s</span>
            </button>

            <button
              type="button"
              onClick={() => onStartQuiz('fill-blank')}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-800 text-white hover:bg-emerald-900 text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-98"
              title="Latihan Kalimat Rumpang Kontekstual"
            >
              <PenTool className="h-3.5 w-3.5 text-emerald-200" />
              <span>Kalimat Rumpang</span>
            </button>
          </div>
        </div>
        <nav aria-label="Menu aplikasi" className="mx-auto flex max-w-7xl gap-1 overflow-x-auto border-t border-stone-200/60 px-4 py-2 text-xs sm:px-6 lg:px-8">
          {[
            { id: 'vocab', label: 'Vocab', href: 'https://my-tools-eyy1.vercel.app/' },
            { id: 'object', label: 'Object', href: 'https://my-tools-mzmj.vercel.app/' },
            { id: 'note', label: 'Note', href: 'https://my-tools-ulry.vercel.app/' },
            { id: 'listening', label: 'Listening', href: 'https://my-tools-n9a3.vercel.app/' },
            { id: 'kbbi', label: 'KBBI', href: 'https://my-tools-hdof.vercel.app/' },
            { id: 'pauli', label: 'Pauli', href: 'https://my-tools-dz2c.vercel.app/' },
          ].map((app) => (
            <a
              key={app.id}
              href={app.href}
              aria-current={app.id === 'kbbi' ? 'page' : undefined}
              className={`shrink-0 rounded-lg px-3 py-1.5 font-semibold transition-colors ${
                app.id === 'kbbi'
                  ? 'bg-emerald-100 text-emerald-900'
                  : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
              }`}
            >
              {app.label}
            </a>
          ))}
        </nav>
      </header>

      {/* Mastery Ranks & Badges Modal */}
      {showRankModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-stone-900/10">
            <div className="flex items-start justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-800 text-xl">
                  {currentRank.icon}
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-stone-900">
                    Lencana Prestasi Leksikon
                  </h3>
                  <p className="text-xs text-stone-500">
                    {masteredCount} kosa kata telah Anda kuasai
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowRankModal(false)}
                className="text-stone-400 hover:text-stone-600 p-1 rounded-md"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {MASTERY_RANKS.map((rank) => {
                const isEarned = masteredCount >= rank.requiredMastered;
                const isCurrent = currentRank.id === rank.id;

                return (
                  <div
                    key={rank.id}
                    className={`flex items-start gap-3 rounded-2xl p-3.5 border transition-all ${
                      isCurrent
                        ? 'bg-purple-50/80 border-purple-300 ring-2 ring-purple-200'
                        : isEarned
                        ? 'bg-stone-50/80 border-stone-200'
                        : 'bg-stone-50/30 border-stone-200/60 opacity-50'
                    }`}
                  >
                    <div className="text-2xl pt-0.5">{rank.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-serif text-sm font-bold text-stone-900">
                          {rank.title}
                        </h4>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isEarned ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-600'
                        }`}>
                          {isEarned ? 'Diraih' : `Butuh ${rank.requiredMastered} Kata`}
                        </span>
                      </div>
                      <p className="text-xs text-stone-600 mt-0.5">
                        {rank.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 pt-3 border-t border-stone-100 text-center">
              <button
                type="button"
                onClick={() => setShowRankModal(false)}
                className="w-full rounded-xl bg-stone-900 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-stone-800 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* API Key Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/40 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl ring-1 ring-stone-900/10">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                  <Key className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-stone-900">
                    Konfigurasi Gemini API
                  </h3>
                  <p className="text-xs text-stone-500">
                    Untuk fitur AI Lengkapi Kata dan Generate 5 Kata
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowKeyModal(false)}
                className="text-stone-400 hover:text-stone-600 text-xl leading-none"
              >
                &times;
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Gemini API Key
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={tempKey}
                    onChange={(e) => setTempKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm text-stone-900 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 pr-16"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-medium text-stone-500 hover:text-stone-800 px-1.5 py-0.5 rounded"
                  >
                    {showPassword ? 'Sembunyi' : 'Lihat'}
                  </button>
                </div>
                <p className="mt-2 text-[11px] text-stone-500">
                  Kunci API disimpan secara lokal di peramban (localStorage) dan digunakan langsung ke layanan Gemini AI.
                </p>
              </div>

              <div className="rounded-xl bg-stone-50 p-3 text-xs text-stone-600 flex items-start gap-2 border border-stone-200">
                <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  Infrastruktur model: <strong>gemini-3.5-flash-lite</strong>. Aman dan tidak disimpan di server pihak ketiga.
                </span>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowKeyModal(false)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveKey}
                className="rounded-xl bg-emerald-800 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-900 transition-colors"
              >
                Simpan Kunci API
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
