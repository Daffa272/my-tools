import React, { useState, useEffect, useRef } from 'react';
import {
  Clock,
  Minus,
  Play,
  Pause,
  RotateCcw,
  Youtube
} from 'lucide-react';
import { STORAGE_KEYS } from '../services/storage';

interface PomodoroWidgetProps {
  isExpanded: boolean;
  setIsExpanded: (val: boolean) => void;
  onTimerTick?: (timeStr: string, isRunning: boolean) => void;
}

export const PomodoroWidget: React.FC<PomodoroWidgetProps> = ({
  isExpanded,
  setIsExpanded,
  onTimerTick,
}) => {
  // Durations
  const [focusDuration, setFocusDuration] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.POMODORO_DURATIONS) || '{}');
      return Number(saved.focus) || 25;
    } catch {
      return 25;
    }
  });

  const [breakDuration, setBreakDuration] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.POMODORO_DURATIONS) || '{}');
      return Number(saved.break) || 5;
    } catch {
      return 5;
    }
  });

  const [mode, setMode] = useState<'focus' | 'break'>('focus');
  const [completedSessions, setCompletedSessions] = useState(() => {
    return Number(localStorage.getItem(STORAGE_KEYS.POMODORO_SESSIONS) || 0) || 0;
  });

  const [remainingSeconds, setRemainingSeconds] = useState(focusDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [statusText, setStatusText] = useState('Siap fokus');

  // YouTube player
  const [youtubeInput, setYoutubeInput] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.POMODORO_YOUTUBE) || '';
  });
  const [activeVideoId, setActiveVideoId] = useState<string | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.POMODORO_YOUTUBE) || '';
    return extractYouTubeId(saved);
  });
  const [youtubeError, setYoutubeError] = useState('');

  const audioContextRef = useRef<AudioContext | null>(null);

  // Time formatting
  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const formattedTime = formatTime(remainingSeconds);

  // Sync with parent for TopNav widget
  useEffect(() => {
    onTimerTick?.(formattedTime, isRunning);
  }, [formattedTime, isRunning, onTimerTick]);

  // Audio tone alarm
  const playAlarm = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        if (!audioContextRef.current) {
          audioContextRef.current = new AudioContextClass();
        }
        const ctx = audioContextRef.current;
        if (ctx.state === 'suspended') ctx.resume();

        const now = ctx.currentTime;
        [0, 0.25, 0.5].forEach((offset) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(880, now + offset);
          gain.gain.setValueAtTime(0.001, now + offset);
          gain.gain.exponentialRampToValueAtTime(0.2, now + offset + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.2);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + offset);
          osc.stop(now + offset + 0.22);
        });
        return;
      }
    } catch {}

    if ('speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance('Waktu Pomodoro selesai');
      u.lang = 'id-ID';
      window.speechSynthesis.speak(u);
    }
  };

  // Timer interval
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning) {
      interval = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            playAlarm();
            if (mode === 'focus') {
              const nextSessions = (completedSessions + 1) % 5;
              setCompletedSessions(nextSessions);
              localStorage.setItem(STORAGE_KEYS.POMODORO_SESSIONS, String(nextSessions));
              setMode('break');
              setStatusText(`Sesi ${nextSessions} selesai · istirahat dimulai`);
              return breakDuration * 60;
            } else {
              setMode('focus');
              setStatusText('Istirahat selesai · fokus dimulai');
              return focusDuration * 60;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, mode, completedSessions, focusDuration, breakDuration]);

  // Mode change
  const handleSetMode = (nextMode: 'focus' | 'break') => {
    setIsRunning(false);
    setMode(nextMode);
    const secs = nextMode === 'focus' ? focusDuration * 60 : breakDuration * 60;
    setRemainingSeconds(secs);
    setStatusText(nextMode === 'focus' ? 'Siap fokus' : 'Waktunya istirahat');
  };

  // Reset
  const handleReset = () => {
    setIsRunning(false);
    const secs = mode === 'focus' ? focusDuration * 60 : breakDuration * 60;
    setRemainingSeconds(secs);
    setStatusText('Timer direset');
  };

  // YouTube Parser
  function extractYouTubeId(url: string): string | null {
    try {
      const parsed = new URL(url);
      const host = parsed.hostname.replace(/^www\./, '').toLowerCase();
      if (host === 'youtu.be') return parsed.pathname.split('/').filter(Boolean)[0] || null;
      if (['youtube.com', 'm.youtube.com', 'music.youtube.com'].includes(host)) {
        if (parsed.pathname === '/watch') return parsed.searchParams.get('v') || null;
        const match = parsed.pathname.match(/^\/(?:embed|shorts|live)\/([^/?]+)/);
        return match ? match[1] : null;
      }
    } catch {}
    return null;
  }

  const handleYoutubeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = extractYouTubeId(youtubeInput.trim());
    if (!id || !/^[A-Za-z0-9_-]{11}$/.test(id)) {
      setYoutubeError('Tautan YouTube tidak valid. Harap gunakan format youtube.com atau youtu.be');
      return;
    }
    setYoutubeError('');
    setActiveVideoId(id);
    localStorage.setItem(STORAGE_KEYS.POMODORO_YOUTUBE, youtubeInput.trim());
  };

  const totalModeSeconds = (mode === 'focus' ? focusDuration : breakDuration) * 60;
  const progressPercent = Math.min(100, Math.max(0, ((totalModeSeconds - remainingSeconds) / totalModeSeconds) * 100));

  return (
    <div className="fixed bottom-4 right-4 z-40 w-[340px] font-sans">
      {!isExpanded && (
        /* Minimized Floating Circle */
        <button
          type="button"
          onClick={() => setIsExpanded(true)}
          className="absolute bottom-0 right-0 group flex items-center gap-2 rounded-full border border-orange-200 dark:border-orange-900/60 bg-white/95 dark:bg-slate-900/95 p-2.5 pr-4 shadow-xl backdrop-blur-md hover:bg-orange-50 dark:hover:bg-slate-800 active:scale-95 transition-all"
        >
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-full text-white shadow-md ${
              isRunning ? 'bg-orange-600 animate-pulse' : 'bg-orange-500'
            }`}
          >
            <Clock className="h-5 w-5" />
          </div>
          <div className="text-left">
            <span className="font-mono text-xs font-extrabold text-slate-800 dark:text-slate-100 block tabular-nums">
              {formattedTime}
            </span>
            <span className="text-[10px] text-orange-600 dark:text-orange-400 font-semibold block capitalize">
              {mode}
            </span>
          </div>
        </button>
      )}
      {/* Keep the panel mounted so its YouTube iframe continues playing while minimized. */}
      <div
        className={`absolute bottom-0 right-0 w-[340px] max-h-[85vh] overflow-y-auto rounded-2xl border border-orange-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xl animate-in zoom-in-95 duration-200 space-y-4 ${
          isExpanded ? 'visible opacity-100' : 'invisible opacity-0 pointer-events-none'
        }`}
      >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400">
                <Clock className="h-4 w-4" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Pomodoro Study Suite</h4>
            </div>
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              <Minus className="h-4 w-4" />
            </button>
          </div>

          {/* Mode Switcher */}
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 dark:bg-slate-800 p-1 text-xs">
            <button
              type="button"
              onClick={() => handleSetMode('focus')}
              className={`rounded-lg py-1.5 font-bold transition-all ${
                mode === 'focus'
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Fokus ({focusDuration}m)
            </button>
            <button
              type="button"
              onClick={() => handleSetMode('break')}
              className={`rounded-lg py-1.5 font-bold transition-all ${
                mode === 'break'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Istirahat ({breakDuration}m)
            </button>
          </div>

          {/* Duration settings inputs */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                Fokus (menit)
              </label>
              <input
                type="number"
                min={1}
                max={180}
                value={focusDuration}
                onChange={(e) => {
                  const val = Math.max(1, Math.min(180, Number(e.target.value) || 1));
                  setFocusDuration(val);
                  localStorage.setItem(
                    STORAGE_KEYS.POMODORO_DURATIONS,
                    JSON.stringify({ focus: val, break: breakDuration })
                  );
                  if (mode === 'focus' && !isRunning) setRemainingSeconds(val * 60);
                }}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-1.5 text-center text-xs font-semibold text-slate-900 dark:text-slate-100 focus:border-orange-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                Istirahat (menit)
              </label>
              <input
                type="number"
                min={1}
                max={180}
                value={breakDuration}
                onChange={(e) => {
                  const val = Math.max(1, Math.min(180, Number(e.target.value) || 1));
                  setBreakDuration(val);
                  localStorage.setItem(
                    STORAGE_KEYS.POMODORO_DURATIONS,
                    JSON.stringify({ focus: focusDuration, break: val })
                  );
                  if (mode === 'break' && !isRunning) setRemainingSeconds(val * 60);
                }}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-1.5 text-center text-xs font-semibold text-slate-900 dark:text-slate-100 focus:border-orange-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Session dots */}
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
            <span>Siklus Sesi</span>
            <div className="flex items-center gap-1.5">
              {[0, 1, 2, 3].map((idx) => (
                <span
                  key={idx}
                  className={`h-2.5 w-2.5 rounded-full transition-colors ${
                    idx < completedSessions ? 'bg-orange-500' : 'bg-slate-200 dark:bg-slate-700'
                  }`}
                />
              ))}
            </div>
            <span className="font-bold text-slate-700 dark:text-slate-300">{completedSessions} / 4</span>
          </div>

          {/* Clock Display */}
          <div className="text-center py-2">
            <span className="font-mono text-5xl font-black text-slate-900 dark:text-slate-100 tracking-tight tabular-nums block">
              {formattedTime}
            </span>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 block">
              {statusText}
            </span>

            {/* Progress Bar */}
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className={`h-full transition-all duration-300 ${
                  mode === 'focus' ? 'bg-orange-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setIsRunning(!isRunning)}
              className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold text-white shadow-xs transition-all active:scale-95 ${
                isRunning
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-orange-600 hover:bg-orange-700'
              }`}
            >
              {isRunning ? (
                <>
                  <Pause className="h-3.5 w-3.5" />
                  <span>Jeda</span>
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>Mulai</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-95 transition-all"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset</span>
            </button>
          </div>

          {/* YouTube Study Lo-fi Player */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Youtube className="h-3.5 w-3.5 text-rose-600" />
              <span>Audio / Video YouTube (Lo-Fi Study)</span>
            </label>
            <form onSubmit={handleYoutubeSubmit} className="flex gap-1.5">
              <input
                type="text"
                placeholder="Tempel link YouTube..."
                value={youtubeInput}
                onChange={(e) => setYoutubeInput(e.target.value)}
                className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:border-rose-500 focus:outline-none"
              />
              <button
                type="submit"
                className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-700"
              >
                Putar
              </button>
            </form>
            {youtubeError && <p className="text-[11px] text-rose-600">{youtubeError}</p>}

            {/* Embedded Player */}
            {activeVideoId && (
              <div className="aspect-video w-full overflow-hidden rounded-xl bg-slate-900 shadow-inner mt-2">
                <iframe
                  className="h-full w-full"
                  src={`https://www.youtube-nocookie.com/embed/${activeVideoId}`}
                  title="YouTube study player"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}
          </div>
      </div>
    </div>
  );
};
