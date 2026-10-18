import React from 'react';
import {
  BookOpen,
  Key,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sun,
  Moon,
  Keyboard,
  Flame
} from 'lucide-react';

interface TopNavProps {
  apiKey: string;
  onOpenApiSettings: () => void;
  onOpenPomodoro: () => void;
  isPomodoroRunning: boolean;
  pomodoroTime: string;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenShortcuts: () => void;
  onOpenAudioSettings: () => void;
  streakCount: number;
}

export const TopNav: React.FC<TopNavProps> = ({
  apiKey,
  onOpenApiSettings,
  onOpenPomodoro,
  isPomodoroRunning,
  pomodoroTime,
  isDarkMode,
  onToggleDarkMode,
  onOpenShortcuts,
  onOpenAudioSettings,
  streakCount,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md transition-colors">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        {/* Brand Zone */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-500/20">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">VocabMaster</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/60">
                TOEFL iBT
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Gemini 3.5 Flash Lite</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Daily Streak Indicator */}
          <div
            title={`Streak Belajar: ${streakCount} Hari Berturut-turut!`}
            className="hidden sm:flex items-center gap-1.5 rounded-lg border border-orange-200/80 dark:border-orange-900/50 bg-orange-50/60 dark:bg-orange-950/40 px-2.5 py-1.5 text-xs font-bold text-orange-700 dark:text-orange-400"
          >
            <Flame className="h-4 w-4 fill-orange-500 text-orange-500" />
            <span className="tabular-nums">{streakCount}d</span>
          </div>

          {/* Audio Settings button (Multi-accent & speed) */}
          <button
            type="button"
            onClick={onOpenAudioSettings}
            title="Pengaturan Aksen & Kecepatan Suara"
            className="flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <span>🎙️</span>
            <span className="hidden sm:inline text-[11px]">Aksen</span>
          </button>

          {/* Shortcuts trigger */}
          <button
            type="button"
            onClick={onOpenShortcuts}
            title="Pintasan Keyboard Pro (/)"
            className="hidden sm:flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <Keyboard className="h-4 w-4" />
          </button>

          {/* Dark Mode toggle */}
          <button
            type="button"
            onClick={onToggleDarkMode}
            title={isDarkMode ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            {isDarkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-indigo-600" />}
          </button>

          {/* Pomodoro quick trigger */}
          <button
            type="button"
            onClick={onOpenPomodoro}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
              isPomodoroRunning
                ? 'border-orange-300 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400 animate-pulse'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
            title="Buka / Perkecil Pomodoro Timer"
          >
            <Clock className="h-3.5 w-3.5 text-orange-500" />
            <span className="font-mono font-semibold tabular-nums">{pomodoroTime}</span>
          </button>

          {/* API Key configuration button */}
          <button
            type="button"
            onClick={onOpenApiSettings}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
              apiKey
                ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100/60'
                : 'border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 hover:bg-amber-100'
            }`}
          >
            <Key className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{apiKey ? 'API Terhubung' : 'Set API Key'}</span>
            {apiKey ? (
              <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <AlertCircle className="h-3 w-3 text-amber-600 dark:text-amber-400" />
            )}
          </button>
        </div>
      </div>
      <nav aria-label="Menu aplikasi" className="mx-auto flex max-w-7xl gap-1 overflow-x-auto border-t border-slate-200/60 px-4 py-2 text-xs dark:border-slate-800 sm:px-6">
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
            aria-current={app.id === 'vocab' ? 'page' : undefined}
            className={`shrink-0 rounded-lg px-3 py-1.5 font-semibold transition-colors ${
              app.id === 'vocab'
                ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
            }`}
          >
            {app.label}
          </a>
        ))}
      </nav>
    </header>
  );
};
