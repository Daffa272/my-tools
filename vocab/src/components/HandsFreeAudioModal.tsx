import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Headphones,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  Sparkles,
  RotateCcw
} from 'lucide-react';
import { SavedWord } from '../types';
import { speakEnglish, speakIndonesian, cancelSpeech } from '../services/speech';

interface HandsFreeAudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  cards: SavedWord[];
}

export const HandsFreeAudioModal: React.FC<HandsFreeAudioModalProps> = ({
  isOpen,
  onClose,
  cards,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [phase, setPhase] = useState<'english' | 'pause' | 'indonesian'>('english');
  const [countdown, setCountdown] = useState(3);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const safetyTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentCard = cards[currentIndex];

  // Main hands-free player loop
  useEffect(() => {
    if (!isOpen || !isPlaying || !currentCard) return;

    if (phase === 'english') {
      setCountdown(3);

      let transitioned = false;
      const proceedToPause = () => {
        if (transitioned) return;
        transitioned = true;
        if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          setPhase('pause');
        }, 500);
      };

      // Speak english with onEnd callback
      speakEnglish(currentCard.word, undefined, undefined, proceedToPause);

      // Safety fallback timer (e.g. 3.5s) in case browser fails to fire onEnd
      safetyTimeoutRef.current = setTimeout(proceedToPause, 3500);
    } else if (phase === 'pause') {
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setPhase('indonesian');
            return 0;
          }
          return prev - 1;
        });
      }, 900);
      return () => clearInterval(interval);
    } else if (phase === 'indonesian') {
      const translationText = `Artinya: ${currentCard.translation}`;

      let hasFinishedSpeaking = false;
      const handleSpeechComplete = () => {
        if (hasFinishedSpeaking) return;
        hasFinishedSpeaking = true;
        if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current);

        // Comfortable pause (1.4s) after translation finishes speaking
        // so learner can absorb the definition before the next card starts
        timeoutRef.current = setTimeout(() => {
          if (currentIndex + 1 < cards.length) {
            setCurrentIndex((prev) => prev + 1);
            setPhase('english');
          } else {
            // Finished playlist
            setIsPlaying(false);
          }
        }, 1400);
      };

      // Play Indonesian speech and ONLY transition AFTER speech genuinely completes
      speakIndonesian(translationText, handleSpeechComplete);

      // Dynamic safety fallback: estimate max reading time based on character count
      // ~80ms per char + 4s buffer, ensures it never cuts off long translations
      const fallbackDuration = Math.max(5000, translationText.length * 100 + 4000);
      safetyTimeoutRef.current = setTimeout(handleSpeechComplete, fallbackDuration);
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current);
    };
  }, [isOpen, isPlaying, phase, currentIndex, currentCard, cards.length]);

  const handleTogglePlay = () => {
    if (isPlaying) {
      cancelSpeech();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      setPhase('english');
    }
  };

  const handleNext = () => {
    cancelSpeech();
    if (currentIndex + 1 < cards.length) {
      setCurrentIndex((prev) => prev + 1);
      setPhase('english');
    }
  };

  const handlePrev = () => {
    cancelSpeech();
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setPhase('english');
    }
  };

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
      setIsPlaying(true);
      setPhase('english');
    }
    return () => {
      cancelSpeech();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current);
    };
  }, [isOpen]);

  if (!isOpen || !currentCard) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <Headphones className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Mode Hands-Free Audio (Podcast)</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Putar otomatis tanpa sentuh · Kartu {currentIndex + 1} dari {cards.length}
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

        {/* Player Stage */}
        <div className="p-8 flex flex-col items-center justify-center text-center space-y-6">
          {/* Status Indicator */}
          <span
            className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider transition-all ${
              phase === 'english'
                ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 animate-pulse'
                : phase === 'pause'
                ? 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400'
                : 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
            }`}
          >
            {phase === 'english'
              ? '🔊 Mengucapkan Kata Bahasa Inggris'
              : phase === 'pause'
              ? `⏳ Jeda Berpikir (${countdown}s)`
              : '📖 Mengucapkan Arti Indonesia'}
          </span>

          {/* Word Display */}
          <div className="space-y-2">
            <h2 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-slate-100 capitalize tracking-tight">
              {currentCard.word}
            </h2>
            {currentCard.phonetic && (
              <p className="font-mono text-base text-indigo-600 dark:text-indigo-400 font-semibold">
                {currentCard.phonetic}
              </p>
            )}
            <p
              className={`text-lg font-semibold transition-all duration-300 ${
                phase === 'indonesian'
                  ? 'text-slate-800 dark:text-slate-200 opacity-100 scale-100'
                  : 'text-slate-400 dark:text-slate-500 opacity-40 blur-[2px]'
              }`}
            >
              {currentCard.translation}
            </p>
          </div>

          {/* Academic sentence preview */}
          {currentCard.tenses?.present?.example_en && (
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm italic leading-relaxed">
              "{currentCard.tenses.present.example_en}"
            </p>
          )}

          {/* Player Controls */}
          <div className="flex items-center gap-4 pt-2">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="rounded-full p-2.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 transition-all"
            >
              <SkipBack className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={handleTogglePlay}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 active:scale-95 transition-all"
            >
              {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 fill-current ml-0.5" />}
            </button>

            <button
              type="button"
              onClick={handleNext}
              disabled={currentIndex + 1 >= cards.length}
              className="rounded-full p-2.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 transition-all"
            >
              <SkipForward className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
