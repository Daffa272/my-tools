import React, { useState, useEffect } from 'react';
import { Timer, Play, Pause, RotateCcw, X, Bell } from 'lucide-react';

interface PomodoroWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  onStateUpdate: (isActive: boolean, formattedTime: string) => void;
}

export const PomodoroWidget: React.FC<PomodoroWidgetProps> = ({
  isOpen,
  onClose,
  onStateUpdate
}) => {
  const [duration, setDuration] = useState(25 * 60); // 25 minutes default
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<'pomodoro' | 'shortBreak' | 'longBreak'>('pomodoro');

  useEffect(() => {
    let interval: any = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      // Play audio notification chime
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1.2);
        osc.start();
        osc.stop(audioCtx.currentTime + 1.2);
      } catch (e) {}
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // Notify parent navbar about current time
  useEffect(() => {
    onStateUpdate(isRunning, formattedTime);
  }, [isRunning, formattedTime, onStateUpdate]);

  const selectMode = (m: 'pomodoro' | 'shortBreak' | 'longBreak') => {
    setMode(m);
    setIsRunning(false);
    let seconds = 25 * 60;
    if (m === 'shortBreak') seconds = 5 * 60;
    if (m === 'longBreak') seconds = 15 * 60;
    setDuration(seconds);
    setTimeLeft(seconds);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(duration);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4 duration-200">
      <div className="w-80 rounded-2xl bg-white p-5 shadow-2xl ring-1 ring-stone-900/10 border border-stone-200">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <Timer className="h-4 w-4 text-amber-600" />
            <h4 className="font-serif text-sm font-bold text-stone-900">
              Pengatur Waktu Belajar (Pomodoro)
            </h4>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 p-1 rounded-md"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Mode selector */}
        <div className="mt-3 flex gap-1 rounded-xl bg-stone-100 p-1 text-xs">
          <button
            onClick={() => selectMode('pomodoro')}
            className={`flex-1 py-1 rounded-lg font-semibold transition-all ${
              mode === 'pomodoro'
                ? 'bg-white text-emerald-950 shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Fokus 25m
          </button>
          <button
            onClick={() => selectMode('shortBreak')}
            className={`flex-1 py-1 rounded-lg font-semibold transition-all ${
              mode === 'shortBreak'
                ? 'bg-white text-emerald-950 shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Jeda 5m
          </button>
          <button
            onClick={() => selectMode('longBreak')}
            className={`flex-1 py-1 rounded-lg font-semibold transition-all ${
              mode === 'longBreak'
                ? 'bg-white text-emerald-950 shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Istirahat 15m
          </button>
        </div>

        {/* Big Countdown */}
        <div className="my-5 text-center">
          <div className="font-serif text-4xl font-extrabold tracking-tight text-stone-900 font-mono">
            {formattedTime}
          </div>
          <span className="text-[11px] text-stone-400 font-medium">
            {isRunning ? 'Sedang berlangsung...' : 'Siap dimulai'}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold transition-all shadow-sm ${
              isRunning
                ? 'bg-amber-600 text-white hover:bg-amber-700'
                : 'bg-emerald-800 text-white hover:bg-emerald-900'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="h-4 w-4" />
                <span>Jeda</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                <span>Mulai</span>
              </>
            )}
          </button>

          <button
            onClick={resetTimer}
            className="rounded-xl border border-stone-200 bg-stone-50 p-2.5 text-stone-600 hover:bg-stone-100 transition-colors"
            title="Reset timer"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
