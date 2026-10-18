import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, CheckCircle, AlertTriangle, ArrowDown, ArrowUp, Divide, Eye } from 'lucide-react';
import { QuestionColumn, QuestionStep, SessionResult, TestConfig } from '../types';
import { buildColumnSteps, generateColumnNumbers } from '../utils/testEngine';
import { sound, triggerHaptic, speakProctor } from '../utils/audio';
import { Keypad } from './Keypad';

interface TestViewProps {
  config: TestConfig;
  onFinish: (sessionResults: SessionResult[]) => void;
  onAbort: () => void;
}

export const TestView: React.FC<TestViewProps> = ({ config, onFinish, onAbort }) => {
  // Test State
  const [columns, setColumns] = useState<QuestionColumn[]>(() => {
    const cols: QuestionColumn[] = [];
    for (let c = 0; c < config.columns; c++) {
      cols.push({
        colIndex: c,
        numbers: generateColumnNumbers(config.rows),
      });
    }
    return cols;
  });

  const [currentColIdx, setCurrentColIdx] = useState(0);
  const [currentPairIdx, setCurrentPairIdx] = useState(0);
  const [currentSession, setCurrentSession] = useState(1);
  const [isBreak, setIsBreak] = useState(false);
  const [breakRemaining, setBreakRemaining] = useState(config.breakDurationSec);
  const [timeRemaining, setTimeRemaining] = useState(config.sessionDurationSec);
  const [isPaused, setIsPaused] = useState(false);

  // Stored answers map: key = `${colIdx}_${pairIdx}`
  const [answersMap, setAnswersMap] = useState<
    Record<string, { answer: number; isCorrect: boolean; isEvenExpected: boolean }>
  >({});

  // Session results tally
  const [sessionResults, setSessionResults] = useState<SessionResult[]>([]);

  // Live session counters
  const currentSessionAnswersCount = useRef(0);
  const currentSessionCorrectCount = useRef(0);
  const currentSessionWrongCount = useRef(0);
  const currentSessionSkippedCount = useRef(0);
  const currentSessionEvenAnswered = useRef(0);
  const currentSessionEvenCorrect = useRef(0);
  const currentSessionOddAnswered = useRef(0);
  const currentSessionOddCorrect = useRef(0);

  // References for layout auto-scrolling
  const activeInputRef = useRef<HTMLDivElement | null>(null);
  const boardRef = useRef<HTMLDivElement | null>(null);

  // Voice proctor initial trigger
  useEffect(() => {
    speakProctor('mulai', config.voiceProctorEnabled);
  }, [config.voiceProctorEnabled]);

  // Theme styling classes
  const themeClasses = {
    modern: 'bg-slate-100 text-slate-900',
    paper: 'bg-[#f4efe4] text-[#1c1917]',
    dark: 'bg-slate-950 text-slate-100',
  }[config.theme];

  const boardThemeClasses = {
    modern: 'bg-white border-slate-200 shadow-sm',
    paper: 'bg-[#fffdf8] border-[#e7dec8] shadow-sm',
    dark: 'bg-slate-900 border-slate-800 text-slate-100',
  }[config.theme];

  const numBoxClasses = {
    modern: 'bg-slate-50 text-slate-900 border-slate-200',
    paper: 'bg-[#faf6ee] text-[#1c1917] border-[#e7dec8]',
    dark: 'bg-slate-800 text-slate-100 border-slate-700',
  }[config.theme];

  // Helper to get steps for current column
  const currentCol = columns[currentColIdx] || columns[0];
  const steps = buildColumnSteps(currentCol, config.testType, config.answerMode);
  const currentStep: QuestionStep | undefined = steps[currentPairIdx];

  // Smooth scroll active element into view
  const scrollToActive = useCallback(() => {
    if (activeInputRef.current && boardRef.current) {
      activeInputRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center',
      });
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(scrollToActive, 30);
    return () => clearTimeout(timer);
  }, [currentColIdx, currentPairIdx, scrollToActive]);

  // Complete current session and trigger "Garis!"
  const completeCurrentSession = useCallback(() => {
    const answered = currentSessionAnswersCount.current;
    const correct = currentSessionCorrectCount.current;
    const wrong = currentSessionWrongCount.current;
    const skipped = currentSessionSkippedCount.current;
    const accuracy = answered > 0 ? (correct / answered) * 100 : 0;
    const speedPerMin = (answered / config.sessionDurationSec) * 60;

    const result: SessionResult = {
      sessionNumber: currentSession,
      answered,
      correct,
      wrong,
      skipped,
      accuracy: Math.round(accuracy * 10) / 10,
      speedPerMin: Math.round(speedPerMin * 10) / 10,
      durationSec: config.sessionDurationSec,
      evenAnswered: currentSessionEvenAnswered.current,
      evenCorrect: currentSessionEvenCorrect.current,
      oddAnswered: currentSessionOddAnswered.current,
      oddCorrect: currentSessionOddCorrect.current,
    };

    const newResults = [...sessionResults, result];
    setSessionResults(newResults);

    // Reset session counters
    currentSessionAnswersCount.current = 0;
    currentSessionCorrectCount.current = 0;
    currentSessionWrongCount.current = 0;
    currentSessionSkippedCount.current = 0;
    currentSessionEvenAnswered.current = 0;
    currentSessionEvenCorrect.current = 0;
    currentSessionOddAnswered.current = 0;
    currentSessionOddCorrect.current = 0;

    // Check if finished entire test
    if (currentSession >= config.sessionCount) {
      sound.playFinished();
      speakProctor('selesai', config.voiceProctorEnabled);
      onFinish(newResults);
      return;
    }

    // Play "Garis!" announcement sound & voice
    sound.playLineChime();
    speakProctor(config.testType === 'pauli' ? 'garis' : 'pindah', config.voiceProctorEnabled);
    triggerHaptic(60);

    // Enter break mode ("Garis!")
    setIsBreak(true);
    setBreakRemaining(config.breakDurationSec);

    // Move to next column for new session
    setColumns((prev) => {
      if (currentColIdx + 1 >= prev.length) {
        return [
          ...prev,
          {
            colIndex: prev.length,
            numbers: generateColumnNumbers(config.rows),
          },
        ];
      }
      return prev;
    });
    setCurrentColIdx((prev) => prev + 1);
    setCurrentPairIdx(0);
  }, [
    currentSession,
    config.sessionCount,
    config.sessionDurationSec,
    config.breakDurationSec,
    config.testType,
    config.voiceProctorEnabled,
    sessionResults,
    currentColIdx,
    config.rows,
    onFinish,
  ]);

  // Main countdown timer
  useEffect(() => {
    if (isPaused) return;

    if (isBreak) {
      const breakInterval = setInterval(() => {
        setBreakRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(breakInterval);
            setIsBreak(false);
            setCurrentSession((s) => s + 1);
            setTimeRemaining(config.sessionDurationSec);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(breakInterval);
    }

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          completeCurrentSession();
          return 0;
        }
        if (prev <= 5) {
          sound.playCountdownWarning();
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isBreak, isPaused, config.sessionDurationSec, completeCurrentSession]);

  // Advance to next problem
  const advance = useCallback(() => {
    const totalPairs = steps.length;
    if (currentPairIdx + 1 < totalPairs) {
      setCurrentPairIdx((prev) => prev + 1);
    } else {
      // Completed this entire column before session timer ran out! Seamlessly move to next column
      setColumns((prev) => {
        if (currentColIdx + 1 >= prev.length) {
          return [
            ...prev,
            {
              colIndex: prev.length,
              numbers: generateColumnNumbers(config.rows),
            },
          ];
        }
        return prev;
      });
      setCurrentColIdx((prev) => prev + 1);
      setCurrentPairIdx(0);
    }
  }, [currentPairIdx, steps.length, currentColIdx, config.rows]);

  // Handle user input
  const handleAnswerInput = useCallback(
    (digit: number) => {
      if (isBreak || isPaused || !currentStep) return;

      const isCorrect = digit === currentStep.expectedAnswer;
      const key = `${currentColIdx}_${currentPairIdx}`;
      const isEvenExpected = currentStep.expectedAnswer === 0;

      setAnswersMap((prev) => ({
        ...prev,
        [key]: { answer: digit, isCorrect, isEvenExpected },
      }));

      currentSessionAnswersCount.current += 1;

      // Track even/odd breakdown if in parity mode
      if (config.answerMode === 'parity') {
        if (isEvenExpected) {
          currentSessionEvenAnswered.current += 1;
          if (isCorrect) currentSessionEvenCorrect.current += 1;
        } else {
          currentSessionOddAnswered.current += 1;
          if (isCorrect) currentSessionOddCorrect.current += 1;
        }
      }

      if (isCorrect) {
        currentSessionCorrectCount.current += 1;
        sound.playClick(1.0);
      } else {
        currentSessionWrongCount.current += 1;
        sound.playClick(0.7); // slightly lower pitch for tactile discrimination
      }
      triggerHaptic(20);

      advance();
    },
    [isBreak, isPaused, currentStep, currentColIdx, currentPairIdx, config.answerMode, advance]
  );

  // Handle backspace / undo
  const handleBackspace = useCallback(() => {
    if (currentPairIdx > 0) {
      setCurrentPairIdx((prev) => prev - 1);
    }
  }, [currentPairIdx]);

  // Handle skip
  const handleSkip = useCallback(() => {
    if (isBreak || isPaused) return;
    currentSessionAnswersCount.current += 1;
    currentSessionSkippedCount.current += 1;
    advance();
  }, [isBreak, isPaused, advance]);

  // Global physical keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isBreak || isPaused) return;

      // Parity Mode shortcuts:
      // GENAP: A, F, 0, ArrowLeft
      // GANJIL: B, J, 1, ArrowRight
      if (config.answerMode === 'parity') {
        const key = e.key.toLowerCase();
        if (key === 'a' || key === 'f' || key === '0' || e.key === 'ArrowLeft') {
          e.preventDefault();
          handleAnswerInput(0);
          return;
        }
        if (key === 'b' || key === 'j' || key === '1' || e.key === 'ArrowRight') {
          e.preventDefault();
          handleAnswerInput(1);
          return;
        }
      } else {
        // Standard digit mode (0-9)
        if (/^[0-9]$/.test(e.key)) {
          e.preventDefault();
          handleAnswerInput(Number(e.key));
          return;
        }
      }

      if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleSkip();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isBreak, isPaused, config.answerMode, handleAnswerInput, handleBackspace, handleSkip]);

  // Format MM:SS
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const rawSum = currentStep ? currentStep.numA + currentStep.numB : 0;

  return (
    <div className={`h-[calc(100dvh-3.5rem)] sm:h-[calc(100dvh-4rem)] flex flex-col ${themeClasses} select-none transition-colors overflow-hidden`}>
      {/* Top Test Navigation & Session Bar */}
      <div className="shrink-0 bg-white/95 backdrop-blur border-b border-slate-200 px-3 py-2 sm:px-4 sm:py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
          {/* Left: Participant & Mode */}
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-900 leading-tight">
                {config.name || 'Peserta'}
              </span>
              <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
                {config.answerMode === 'parity' ? (
                  <span className="text-indigo-600 font-bold flex items-center gap-1">
                    <Divide className="w-3 h-3" />
                    <span>Mode Genap/Ganjil</span>
                  </span>
                ) : (
                  <span>Digit Satuan (0–9)</span>
                )}
                <span>·</span>
                <span>{config.testType === 'pauli' ? 'Atas ke Bawah' : 'Bawah ke Atas'}</span>
              </span>
            </div>
          </div>

          {/* Center: Live Session Indicator & Countdown */}
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Sesi {currentSession} dari {config.sessionCount}
              </div>
              <div
                className={`text-2xl sm:text-3xl font-extrabold font-mono tracking-tight ${
                  timeRemaining <= 5 ? 'text-rose-600 animate-pulse' : 'text-slate-900'
                }`}
              >
                {formatTime(timeRemaining)}
              </div>
            </div>
          </div>

          {/* Right: Controls & Tally */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col text-right text-xs">
              <span className="text-slate-500">
                Sesi Ini: <strong className="text-slate-900">{currentSessionAnswersCount.current}</strong>
              </span>
              <span className="text-slate-500">
                Benar: <strong className="text-emerald-600">{currentSessionCorrectCount.current}</strong>
              </span>
            </div>

            <button
              onClick={() => setIsPaused(!isPaused)}
              title={isPaused ? 'Lanjutkan' : 'Jeda'}
              className="p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
            >
              {isPaused ? <Play className="w-4 h-4 fill-slate-700" /> : <Pause className="w-4 h-4" />}
            </button>

            <button
              onClick={() => {
                if (confirm('Selesaikan tes sekarang dan periksa hasil sementara?')) {
                  completeCurrentSession();
                }
              }}
              className="px-3 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 transition-colors cursor-pointer"
            >
              Selesai
            </button>
          </div>
        </div>

        {/* Live Calculation Prompt Banner for Active Pair */}
        {currentStep && (
          <div className="max-w-md mx-auto mt-2 text-center text-xs">
            {config.answerMode === 'parity' ? (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-900 font-medium">
                <span>
                  Hitung: <strong>{currentStep.numA} + {currentStep.numB} = {rawSum}</strong>
                </span>
                <span>→</span>
                <span className="font-bold text-indigo-700">Genap atau Ganjil?</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-700 font-medium">
                <span>
                  Hitung: <strong>{currentStep.numA} + {currentStep.numB} = {rawSum}</strong>
                </span>
                <span>→</span>
                <span>Ambil digit satuan ({rawSum % 10})</span>
              </div>
            )}
          </div>
        )}

        {/* Linear progress bar across sessions */}
        <div className="w-full bg-slate-100 h-1.5 mt-2 rounded-full overflow-hidden">
          <div
            className="bg-indigo-600 h-full transition-all duration-300"
            style={{
              width: `${((currentSession - 1 + (config.sessionDurationSec - timeRemaining) / config.sessionDurationSec) / config.sessionCount) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Main Board Arena */}
      <div className="flex-1 min-h-0 flex flex-col justify-between p-2 sm:p-5 overflow-hidden relative">
        {/* Break / "Garis!" Overlay Modal */}
        {isBreak && (
          <div className="absolute inset-0 z-40 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl border border-slate-200 space-y-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
                <CheckCircle className="w-7 h-7 sm:w-8 sm:h-8" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-indigo-600">
                  Instruksi Pindah
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
                  {config.testType === 'pauli' ? 'GARIS!' : 'PINDAH!'}
                </h2>
                <p className="text-xs text-slate-500 mt-2">
                  Tarik garis di bawah angka terakhir dan bersiap untuk sesi ke-{currentSession + 1}.
                </p>
              </div>

              <div className="py-2.5 px-4 rounded-xl bg-slate-50 border border-slate-200 inline-block font-mono text-lg sm:text-xl font-bold text-slate-800">
                00:0{breakRemaining}
              </div>

              <p className="text-[11px] text-slate-400">
                Istirahatkan mata sejenak, tes akan lanjut otomatis...
              </p>
            </div>
          </div>
        )}

        {/* Pause Modal */}
        {isPaused && (
          <div className="absolute inset-0 z-40 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl border border-slate-200 space-y-4">
              <AlertTriangle className="w-10 h-10 sm:w-12 sm:h-12 text-amber-500 mx-auto" />
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Ujian Dijeda</h2>
              <p className="text-xs text-slate-600">
                Waktu dihentikan sementara. Klik tombol di bawah untuk melanjutkan kembali.
              </p>
              <button
                onClick={() => setIsPaused(false)}
                className="w-full py-2.5 sm:py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition-colors cursor-pointer"
              >
                Lanjutkan Ujian
              </button>
            </div>
          </div>
        )}

        {/* Scrollable Columns Container */}
        <div
          ref={boardRef}
          className={`flex-1 min-h-0 overflow-auto rounded-2xl border p-3 sm:p-6 custom-scrollbar ${boardThemeClasses} flex justify-center relative`}
        >
          <div className="flex gap-3 sm:gap-6 min-w-max pb-6 relative">
            {columns.map((col, cIdx) => {
              const isCurrentCol = cIdx === currentColIdx;

              return (
                <div
                  key={cIdx}
                  className={`w-20 sm:w-28 flex flex-col items-center py-2 px-1 rounded-2xl transition-all ${
                    isCurrentCol ? 'ring-2 ring-indigo-500/40 bg-indigo-50/20' : 'opacity-60'
                  }`}
                >
                  <div className="text-[10px] font-bold text-slate-400 mb-2 uppercase">
                    Kolom {cIdx + 1}
                  </div>

                  {/* Render numbers & answers stacked */}
                  {config.testType === 'pauli' ? (
                    // Pauli: Top to bottom
                    <div className="flex flex-col items-center w-full gap-1.5">
                      {col.numbers.map((num, rIdx) => {
                        const isLastNumber = rIdx === col.numbers.length - 1;
                        const pairIdx = rIdx;
                        const isCurrentPair = isCurrentCol && pairIdx === currentPairIdx;
                        const answerKey = `${cIdx}_${pairIdx}`;
                        const savedAnswer = answersMap[answerKey];

                        return (
                          <React.Fragment key={rIdx}>
                            {/* Number Box */}
                            <div
                              className={`w-13 sm:w-16 h-11 sm:h-14 rounded-xl border flex items-center justify-center text-xl sm:text-3xl font-extrabold font-mono transition-all relative ${numBoxClasses} ${
                                isCurrentPair
                                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-400'
                                  : ''
                              }`}
                            >
                              {num}
                              {/* Line Focus Guide Bar */}
                              {config.lineFocusGuide && isCurrentPair && (
                                <span className="absolute -left-2 sm:-left-3 w-1.5 h-6 rounded-full bg-indigo-600 animate-pulse" />
                              )}
                            </div>

                            {/* Answer Box between numbers */}
                            {!isLastNumber && (
                              <div
                                ref={isCurrentPair ? activeInputRef : undefined}
                                className={`h-7 sm:h-9 rounded-lg border-2 flex items-center justify-center font-bold text-[11px] sm:text-sm px-1.5 transition-all ${
                                  config.answerMode === 'parity' ? 'w-18 sm:w-24' : 'w-11 sm:w-14 font-mono text-base'
                                } ${
                                  isCurrentPair
                                    ? 'border-indigo-600 bg-white ring-4 ring-indigo-500/20 shadow-md text-indigo-600 animate-pulse'
                                    : savedAnswer !== undefined
                                      ? savedAnswer.isCorrect
                                        ? config.answerMode === 'parity'
                                          ? savedAnswer.answer === 0
                                            ? 'border-indigo-300 bg-indigo-50 text-indigo-800'
                                            : 'border-amber-300 bg-amber-50 text-amber-800'
                                          : 'border-slate-300 bg-slate-50 text-slate-700'
                                        : 'border-rose-300 bg-rose-50 text-rose-700'
                                      : 'border-dashed border-slate-200 bg-transparent text-slate-300'
                                }`}
                              >
                                {savedAnswer !== undefined ? (
                                  config.answerMode === 'parity' ? (
                                    <span>{savedAnswer.answer === 0 ? 'GENAP' : 'GANJIL'}</span>
                                  ) : (
                                    <span>{savedAnswer.answer}</span>
                                  )
                                ) : isCurrentPair ? (
                                  <span>{config.answerMode === 'parity' ? 'PILIH' : '?'}</span>
                                ) : (
                                  ''
                                )}
                              </div>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  ) : (
                    // Kraepelin: Bottom to top
                    <div className="flex flex-col-reverse items-center w-full gap-1.5">
                      {col.numbers.map((num, rIdx) => {
                        const isLastFromBottom = rIdx === 0;
                        const pairIdx = col.numbers.length - 1 - rIdx;
                        const isCurrentPair = isCurrentCol && pairIdx === currentPairIdx;
                        const answerKey = `${cIdx}_${pairIdx}`;
                        const savedAnswer = answersMap[answerKey];

                        return (
                          <React.Fragment key={rIdx}>
                            {/* Number Box */}
                            <div
                              className={`w-13 sm:w-16 h-11 sm:h-14 rounded-xl border flex items-center justify-center text-xl sm:text-3xl font-extrabold font-mono transition-all relative ${numBoxClasses} ${
                                isCurrentPair
                                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-400'
                                  : ''
                              }`}
                            >
                              {num}
                              {/* Line Focus Guide Bar */}
                              {config.lineFocusGuide && isCurrentPair && (
                                <span className="absolute -left-2 sm:-left-3 w-1.5 h-6 rounded-full bg-indigo-600 animate-pulse" />
                              )}
                            </div>

                            {/* Answer Box above it (in Kraepelin upward flow) */}
                            {!isLastFromBottom && (
                              <div
                                ref={isCurrentPair ? activeInputRef : undefined}
                                className={`h-7 sm:h-9 rounded-lg border-2 flex items-center justify-center font-bold text-[11px] sm:text-sm px-1.5 transition-all ${
                                  config.answerMode === 'parity' ? 'w-18 sm:w-24' : 'w-11 sm:w-14 font-mono text-base'
                                } ${
                                  isCurrentPair
                                    ? 'border-indigo-600 bg-white ring-4 ring-indigo-500/20 shadow-md text-indigo-600 animate-pulse'
                                    : savedAnswer !== undefined
                                      ? savedAnswer.isCorrect
                                        ? config.answerMode === 'parity'
                                          ? savedAnswer.answer === 0
                                            ? 'border-indigo-300 bg-indigo-50 text-indigo-800'
                                            : 'border-amber-300 bg-amber-50 text-amber-800'
                                          : 'border-slate-300 bg-slate-50 text-slate-700'
                                        : 'border-rose-300 bg-rose-50 text-rose-700'
                                      : 'border-dashed border-slate-200 bg-transparent text-slate-300'
                                }`}
                              >
                                {savedAnswer !== undefined ? (
                                  config.answerMode === 'parity' ? (
                                    <span>{savedAnswer.answer === 0 ? 'GENAP' : 'GANJIL'}</span>
                                  ) : (
                                    <span>{savedAnswer.answer}</span>
                                  )
                                ) : isCurrentPair ? (
                                  <span>{config.answerMode === 'parity' ? 'PILIH' : '?'}</span>
                                ) : (
                                  ''
                                )}
                              </div>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Keypad Area */}
        {config.showKeypad && (
          <div className="mt-2 sm:mt-4 pt-1 sm:pt-2 shrink-0">
            <Keypad
              answerMode={config.answerMode}
              onNumberPress={handleAnswerInput}
              onBackspace={handleBackspace}
              onSkip={handleSkip}
            />
          </div>
        )}
      </div>
    </div>
  );
};
