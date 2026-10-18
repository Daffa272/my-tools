import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  Volume2,
  ArrowRight,
  Mic,
  MicOff,
  Flame,
  Award,
  Layers,
  HelpCircle,
  BrainCircuit,
  Headphones,
  Check,
  ListOrdered
} from 'lucide-react';
import { ObjectCard, ReviewEntry } from '../types';
import { speakEnglish } from '../services/speech';

interface ReviewSectionProps {
  cards: ObjectCard[];
  onRateEntry: (
    cardId: string,
    wordIndex: number | undefined,
    schedule: { easiness: number; repetition: number; interval: number; nextReviewDate: string }
  ) => Promise<void>;
  onToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onGoToCollection: () => void;
}

export function normalizeAnswer(value: string): string {
  return String(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

export function isReviewDue(entry: ReviewEntry, now = Date.now()): boolean {
  if (!entry.nextReviewDate) return true;
  const dueTime = new Date(entry.nextReviewDate).getTime();
  return !Number.isFinite(dueTime) || dueTime <= now;
}

export function getAllReviewEntries(cards: ObjectCard[]): ReviewEntry[] {
  return cards.flatMap(card => {
    const entries: ReviewEntry[] = [
      {
        cardId: card.id,
        english: card.english,
        indonesian: card.indonesian,
        category: card.category,
        image: card.image,
        repetition: card.repetition || 0,
        easiness: card.easiness || 2.5,
        interval: card.interval || 0,
        nextReviewDate: card.nextReviewDate
      }
    ];

    (Array.isArray(card.words) ? card.words : []).forEach((word, index) => {
      if (!word?.english) return;
      entries.push({
        cardId: card.id,
        wordIndex: index,
        english: word.english,
        indonesian: word.indonesian,
        category: card.category,
        image: card.image,
        repetition: word.repetition || 0,
        easiness: word.easiness || 2.5,
        interval: word.interval || 0,
        nextReviewDate: word.nextReviewDate
      });
    });

    return entries;
  });
}

type QuizMode = 'typing' | 'choice' | 'listening';

export const ReviewSection: React.FC<ReviewSectionProps> = ({
  cards,
  onRateEntry,
  onToast,
  onGoToCollection
}) => {
  const [quizMode, setQuizMode] = useState<QuizMode>('typing');
  const [queue, setQueue] = useState<ReviewEntry[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [isReviewActive, setIsReviewActive] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  // Answering states
  const [userAnswer, setUserAnswer] = useState('');
  const [checkedState, setCheckedState] = useState<{ isCorrect: boolean } | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeImageUrl, setActiveImageUrl] = useState<string>('');

  // Speech Recognition states
  const [isListeningSpeech, setIsListeningSpeech] = useState(false);
  const [speechError, setSpeechError] = useState('');

  // Streak state
  const [streak, setStreak] = useState(() => {
    return parseInt(localStorage.getItem('object_english_streak') || '1', 10);
  });

  const allEntries = useMemo(() => getAllReviewEntries(cards), [cards]);
  const dueEntries = useMemo(() => allEntries.filter(e => isReviewDue(e)), [allEntries]);

  // Memory stats
  const stats = useMemo(() => {
    let mastered = 0;
    let reviewing = 0;
    let fresh = 0;
    allEntries.forEach(e => {
      if ((e.interval || 0) >= 21) mastered++;
      else if ((e.interval || 0) > 0) reviewing++;
      else fresh++;
    });
    return { mastered, reviewing, fresh };
  }, [allEntries]);

  const currentEntry = queue[currentIndex];

  // Options for multiple choice
  const multipleChoiceOptions = useMemo(() => {
    if (!currentEntry) return [];
    const others = allEntries
      .filter(e => normalizeAnswer(e.english) !== normalizeAnswer(currentEntry.english))
      .map(e => e.english);

    const shuffledOthers = others.sort(() => Math.random() - 0.5).slice(0, 3);
    const combined = [currentEntry.english, ...shuffledOthers];
    return combined.sort(() => Math.random() - 0.5);
  }, [currentEntry, allEntries]);

  useEffect(() => {
    if (currentEntry?.image instanceof Blob) {
      const url = URL.createObjectURL(currentEntry.image);
      setActiveImageUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setActiveImageUrl('');
    }
  }, [currentEntry]);

  // When listening mode is active, automatically speak prompt
  useEffect(() => {
    if (isReviewActive && currentEntry && quizMode === 'listening' && !checkedState) {
      speakEnglish(currentEntry.english);
    }
  }, [isReviewActive, currentIndex, quizMode, currentEntry, checkedState]);

  const startReviewSession = (forceAll = false) => {
    const listToReview = forceAll ? allEntries : dueEntries;
    if (listToReview.length === 0) return;
    const shuffled = [...listToReview].sort(() => Math.random() - 0.5);
    setQueue(shuffled);
    setCurrentIndex(0);
    setCorrectCount(0);
    setIsReviewActive(true);
    setIsComplete(false);
    setUserAnswer('');
    setCheckedState(null);
  };

  const handleCheckAnswer = (answerToCheck: string) => {
    if (!currentEntry || !answerToCheck.trim()) return;

    const isCorrect = normalizeAnswer(answerToCheck) === normalizeAnswer(currentEntry.english);
    if (isCorrect) {
      setCorrectCount(prev => prev + 1);
    }
    setCheckedState({ isCorrect });
  };

  // Speech Recognition integration
  const handleToggleSpeech = () => {
    // @ts-expect-error browser speech recognition check
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      onToast('Browser Anda belum mendukung speech recognition.', 'info');
      return;
    }

    if (isListeningSpeech) {
      setIsListeningSpeech(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      setIsListeningSpeech(true);
      setSpeechError('');

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        const spoken = event.results[0][0].transcript;
        setUserAnswer(spoken);
        setIsListeningSpeech(false);
        handleCheckAnswer(spoken);
      };

      recognition.onerror = () => {
        setIsListeningSpeech(false);
        setSpeechError('Suara tidak terdengar jelas, coba lagi.');
      };

      recognition.onend = () => {
        setIsListeningSpeech(false);
      };

      recognition.start();
    } catch {
      setIsListeningSpeech(false);
      onToast('Mikrofon tidak dapat diakses.', 'error');
    }
  };

  const handleRating = async (quality: number) => {
    if (!currentEntry) return;

    const previousEasiness = currentEntry.easiness || 2.5;
    const previousRepetition = currentEntry.repetition || 0;
    const previousInterval = currentEntry.interval || 0;

    const easiness = Math.max(
      1.3,
      previousEasiness + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    );

    let repetition = previousRepetition;
    let interval = previousInterval;

    if (quality < 3) {
      repetition = 0;
      interval = 0;
    } else {
      if (repetition === 0) {
        interval = quality === 5 ? 2 : 1;
      } else if (repetition === 1) {
        interval = quality === 5 ? 8 : 6;
      } else {
        interval = Math.max(
          1,
          Math.round(interval * easiness * (quality === 5 ? 1.3 : quality === 3 ? 0.7 : 1))
        );
      }
      repetition += 1;
    }

    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + interval);

    try {
      await onRateEntry(currentEntry.cardId, currentEntry.wordIndex, {
        easiness,
        repetition,
        interval,
        nextReviewDate: nextDate.toISOString()
      });

      // Advance
      if (currentIndex + 1 < queue.length) {
        setCurrentIndex(prev => prev + 1);
        setUserAnswer('');
        setCheckedState(null);
      } else {
        // Update streak on completion
        const today = new Date().toISOString().slice(0, 10);
        const lastDate = localStorage.getItem('object_english_last_review_date');
        let newStreak = streak;
        if (lastDate !== today) {
          newStreak = streak + 1;
          setStreak(newStreak);
          localStorage.setItem('object_english_streak', newStreak.toString());
          localStorage.setItem('object_english_last_review_date', today);
        }

        setIsReviewActive(false);
        setIsComplete(true);
      }
    } catch {
      onToast('Gagal menyimpan jadwal review kartu.', 'error');
    }
  };

  const handleSpeak = (text: string) => {
    setIsSpeaking(true);
    speakEnglish(text, speaking => {
      if (!speaking) setIsSpeaking(false);
    });
  };

  return (
    <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/90 dark:border-stone-800 shadow-sm overflow-hidden p-6 sm:p-8 transition-colors">
      {/* Session Inactive: Overview & Stats & Mode Selector */}
      {!isReviewActive && !isComplete && (
        <div className="max-w-3xl mx-auto py-4">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-bold mb-3 shadow-2xs">
              <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>{streak} Hari Streak Belajar Berturut-turut!</span>
            </div>

            <h2 className="text-3xl font-serif font-bold text-stone-900 dark:text-white mb-2">
              Review Hafalan Spaced Repetition
            </h2>
            <p className="text-sm text-stone-600 dark:text-stone-400 max-w-lg mx-auto">
              Uji daya ingatmu dengan algoritma SuperMemo (SM-2) agar kosakata melekat permanen dalam memori jangka panjang.
            </p>
          </div>

          {/* Retention Stats Bar */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700 text-center">
              <span className="text-xs text-stone-500 dark:text-stone-400 block mb-1">Baru Ditambahkan</span>
              <strong className="text-xl font-bold text-stone-900 dark:text-stone-100">{stats.fresh}</strong>
            </div>

            <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/60 text-center">
              <span className="text-xs text-amber-800 dark:text-amber-300 block mb-1">Sedang Dipelajari</span>
              <strong className="text-xl font-bold text-amber-900 dark:text-amber-200">{stats.reviewing}</strong>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-900/60 text-center">
              <span className="text-xs text-emerald-800 dark:text-emerald-300 block mb-1">Sudah Dikuasai</span>
              <strong className="text-xl font-bold text-emerald-900 dark:text-emerald-200">{stats.mastered}</strong>
            </div>
          </div>

          {/* Quiz Mode Selector */}
          <div className="mb-8 p-4 bg-stone-50 dark:bg-stone-950 rounded-2xl border border-stone-200 dark:border-stone-800">
            <span className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-3 uppercase tracking-wider">
              Pilih Mode Latihan:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setQuizMode('typing')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  quizMode === 'typing'
                    ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 border-stone-900 dark:border-stone-100 shadow-sm'
                    : 'bg-white dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-800'
                }`}
              >
                <div className="font-bold text-xs flex items-center gap-1.5 mb-1">
                  <span>⌨️ Ketik Jawaban</span>
                </div>
                <p className="text-[11px] opacity-80 leading-snug">
                  Menebak dan mengetik ejaan kata dalam bahasa Inggris.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setQuizMode('choice')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  quizMode === 'choice'
                    ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 border-stone-900 dark:border-stone-100 shadow-sm'
                    : 'bg-white dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-800'
                }`}
              >
                <div className="font-bold text-xs flex items-center gap-1.5 mb-1">
                  <span>🔘 Pilihan Ganda</span>
                </div>
                <p className="text-[11px] opacity-80 leading-snug">
                  Pilih 1 dari 4 pilihan cepat, cocok untuk latihan di ponsel.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setQuizMode('listening')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  quizMode === 'listening'
                    ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 border-stone-900 dark:border-stone-100 shadow-sm'
                    : 'bg-white dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-800'
                }`}
              >
                <div className="font-bold text-xs flex items-center gap-1.5 mb-1">
                  <span>🎧 Kuis Mendengarkan</span>
                </div>
                <p className="text-[11px] opacity-80 leading-snug">
                  Dengar suara pelafalan, tebak arti kata bendanya.
                </p>
              </button>
            </div>
          </div>

          {/* Action CTA */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            {dueEntries.length > 0 ? (
              <button
                type="button"
                onClick={() => startReviewSession(false)}
                className="w-full sm:w-auto px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-sm shadow-emerald-700/20 text-sm flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-emerald-200" />
                <span>Mulai Sesi Review ({dueEntries.length} Jatuh Tempo)</span>
              </button>
            ) : allEntries.length > 0 ? (
              <button
                type="button"
                onClick={() => startReviewSession(true)}
                className="w-full sm:w-auto px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-sm shadow-emerald-700/20 text-sm flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-emerald-200" />
                <span>Latihan Bebas ({allEntries.length} Kata)</span>
              </button>
            ) : null}

            <button
              type="button"
              onClick={onGoToCollection}
              className="w-full sm:w-auto px-5 py-3.5 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 font-semibold rounded-xl text-sm transition-colors"
            >
              Kembali ke Koleksi Benda
            </button>
          </div>
        </div>
      )}

      {/* Session Active: Flashcard Quiz */}
      {isReviewActive && currentEntry && (
        <div className="max-w-2xl mx-auto">
          {/* Progress Header */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400 tracking-wide uppercase">
              Soal {currentIndex + 1} dari {queue.length} · {currentEntry.category}
            </span>
            <span className="text-xs font-mono font-medium text-stone-500 dark:text-stone-400">
              Benar: {correctCount}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden mb-6">
            <div
              className="h-full bg-emerald-600 transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / queue.length) * 100}%` }}
            />
          </div>

          <div className="bg-stone-50 dark:bg-stone-950 rounded-2xl border border-stone-200 dark:border-stone-800 p-6 flex flex-col sm:flex-row gap-6 items-center transition-colors">
            {/* Image Thumbnail */}
            <div className="w-36 sm:w-44 aspect-[2/3] bg-stone-200 dark:bg-stone-800 rounded-xl overflow-hidden shrink-0 shadow-xs relative">
              {activeImageUrl ? (
                <img
                  src={activeImageUrl}
                  alt="Petunjuk gambar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-stone-400 p-3 text-center">
                  Gambar di perangkat asal
                </div>
              )}
            </div>

            {/* Question & Interactive Form */}
            <div className="flex-1 w-full flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-stone-400 dark:text-stone-500 block mb-1">
                  {quizMode === 'listening' ? (
                    <span className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1">
                      <Headphones className="w-3.5 h-3.5" />
                      <span>Dengarkan pelafalannya & tebak bendanya:</span>
                    </span>
                  ) : currentEntry.wordIndex === undefined ? (
                    'Nama benda utama pada gambar:'
                  ) : (
                    'Kosakata bagian benda pada gambar:'
                  )}
                </span>

                {quizMode === 'listening' ? (
                  <div className="mb-4">
                    <button
                      type="button"
                      onClick={() => handleSpeak(currentEntry.english)}
                      className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-xs transition-colors"
                    >
                      <Volume2 className="w-5 h-5" />
                      <span>Putar Ulang Suara</span>
                    </button>
                  </div>
                ) : (
                  <h3 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 dark:text-white leading-tight mb-4">
                    {currentEntry.indonesian || 'Nama Bahasa Indonesia'}
                  </h3>
                )}
              </div>

              {!checkedState ? (
                <>
                  {/* Mode 1: Typing with Speech Recognition */}
                  {quizMode === 'typing' && (
                    <form
                      onSubmit={e => {
                        e.preventDefault();
                        handleCheckAnswer(userAnswer);
                      }}
                      className="space-y-3"
                    >
                      <div className="relative">
                        <input
                          type="text"
                          required
                          autoFocus
                          maxLength={80}
                          value={userAnswer}
                          onChange={e => setUserAnswer(e.target.value)}
                          placeholder="Ketik nama bendanya dalam bahasa Inggris..."
                          className="w-full text-base font-semibold px-4 py-3 pr-12 rounded-xl border border-stone-300 dark:border-stone-700 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 outline-none bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 transition-all"
                        />
                        <button
                          type="button"
                          onClick={handleToggleSpeech}
                          className={`absolute right-2 top-2 p-2 rounded-lg transition-colors ${
                            isListeningSpeech
                              ? 'bg-rose-500 text-white animate-pulse'
                              : 'text-stone-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                          }`}
                          title="Latih pengucapan dengan mikrofon"
                        >
                          {isListeningSpeech ? <Mic className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                        </button>
                      </div>

                      {speechError && (
                        <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">{speechError}</p>
                      )}

                      <button
                        type="submit"
                        className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm transition-all shadow-sm flex items-center justify-center gap-2"
                      >
                        <span>Periksa Jawaban</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </form>
                  )}

                  {/* Mode 2: Multiple Choice & Listening Options */}
                  {(quizMode === 'choice' || quizMode === 'listening') && (
                    <div className="space-y-2">
                      <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 block mb-1">
                        Pilih jawaban yang benar:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {multipleChoiceOptions.map((opt, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setUserAnswer(opt);
                              handleCheckAnswer(opt);
                            }}
                            className="p-3 bg-white dark:bg-stone-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:border-emerald-500 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-100 text-sm font-semibold rounded-xl text-left transition-colors flex items-center justify-between"
                          >
                            <span>{opt}</span>
                            <ArrowRight className="w-3.5 h-3.5 opacity-40" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-4 animate-in fade-in">
                  <div
                    className={`p-4 rounded-xl border flex items-start gap-3 ${
                      checkedState.isCorrect
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                        : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-950 dark:text-rose-200'
                    }`}
                  >
                    {checkedState.isCorrect ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-6 h-6 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <strong className="text-base font-bold block">
                        {checkedState.isCorrect
                          ? 'Luar biasa, tepat!'
                          : `Belum tepat. Jawaban yang benar: ${currentEntry.english}`}
                      </strong>
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => handleSpeak(currentEntry.english)}
                          className="px-3 py-1.5 rounded-lg bg-white/80 dark:bg-stone-800 hover:bg-white dark:hover:bg-stone-700 text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>Dengarkan Pelafalan</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <span className="text-xs font-bold text-stone-600 dark:text-stone-300 block mb-2">
                      Nilai seberapa mudah kamu mengingatnya:
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <button
                        type="button"
                        onClick={() => handleRating(1)}
                        className="p-2.5 rounded-xl bg-rose-100 dark:bg-rose-950/60 hover:bg-rose-200 dark:hover:bg-rose-900 text-rose-900 dark:text-rose-200 text-xs font-bold transition-all text-center flex flex-col items-center gap-0.5"
                      >
                        <span>Lupa</span>
                        <span className="text-[10px] font-normal opacity-80">Ulangi hari ini</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRating(3)}
                        className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-950/60 hover:bg-amber-200 dark:hover:bg-amber-900 text-amber-900 dark:text-amber-200 text-xs font-bold transition-all text-center flex flex-col items-center gap-0.5"
                      >
                        <span>Sulit</span>
                        <span className="text-[10px] font-normal opacity-80">Jadwal pendek</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRating(4)}
                        className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 hover:bg-emerald-200 dark:hover:bg-emerald-900 text-emerald-900 dark:text-emerald-200 text-xs font-bold transition-all text-center flex flex-col items-center gap-0.5"
                      >
                        <span>Ingat</span>
                        <span className="text-[10px] font-normal opacity-80">Jadwal normal</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRating(5)}
                        className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all text-center flex flex-col items-center gap-0.5 shadow-sm"
                      >
                        <span>Mudah</span>
                        <span className="text-[10px] font-normal text-emerald-100">Jadwal lama</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Session Complete Screen */}
      {isComplete && (
        <div className="max-w-md mx-auto text-center py-6 animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4">
            <Award className="w-8 h-8" />
          </div>

          <h2 className="text-2xl font-serif font-bold text-stone-900 dark:text-white mb-1">
            Sesi Review Selesai!
          </h2>
          <p className="text-sm text-stone-600 dark:text-stone-400 mb-6">
            Hasil: <strong className="text-emerald-700 dark:text-emerald-400 font-bold">{correctCount} dari {queue.length} benar</strong>. Streak belajarmu meningkat menjadi {streak} hari!
          </p>

          <button
            type="button"
            onClick={() => {
              setIsComplete(false);
              onGoToCollection();
            }}
            className="w-full py-3 px-5 bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-white text-white dark:text-stone-900 font-semibold rounded-xl text-sm transition-all shadow-sm"
          >
            Kembali ke Koleksi
          </button>
        </div>
      )}
    </div>
  );
};
