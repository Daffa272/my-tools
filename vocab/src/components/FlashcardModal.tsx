import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  Volume2,
  Mic,
  RotateCw,
  Sparkles,
  ArrowRight,
  Brain,
  Maximize2,
  Minimize2,
  Keyboard,
  PenTool,
  CheckCircle,
  Lightbulb,
  Languages
} from 'lucide-react';
import { SavedWord, ChunkTestQuestion, ChunkItem } from '../types';
import {
  speakEnglish,
  normalizeSpokenText,
  getSpeechRecognition,
  ISpeechRecognition,
  ISpeechRecognitionEvent,
} from '../services/speech';
import { generateChunkMiniTestAI } from '../services/gemini';
import { AudioWaveform } from './AudioWaveform';

export type FlashcardReviewMode = 'standard' | 'reverse' | 'spelling';

interface FlashcardModalProps {
  isOpen: boolean;
  onClose: () => void;
  cards: SavedWord[];
  apiKey: string;
  onRateCard: (word: string, quality: number) => void;
  title?: string;
}

export const FlashcardModal: React.FC<FlashcardModalProps> = ({
  isOpen,
  onClose,
  cards,
  apiKey,
  onRateCard,
  title = 'Review Flashcard',
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);
  const [reviewMode, setReviewMode] = useState<FlashcardReviewMode>('standard');

  // Spelling & Typing Recall Drill states
  const [spellingInput, setSpellingInput] = useState('');
  const [hintCount, setHintCount] = useState(0);
  const [isSpellingSuccess, setIsSpellingSuccess] = useState(false);
  const spellingInputRef = useRef<HTMLInputElement>(null);

  // Exercises states
  const [synonymAnswer, setSynonymAnswer] = useState<string | null>(null);
  const [reviewQuizAnswers, setReviewQuizAnswers] = useState<Record<string, string>>({});

  // Voice test on card state
  const [isVoiceTesting, setIsVoiceTesting] = useState(false);
  const [voiceScore, setVoiceScore] = useState<number | null>(null);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const voiceRecognitionRef = useRef<ISpeechRecognition | null>(null);

  // Chunk mini test state
  const [step, setStep] = useState<'card' | 'chunk-intro' | 'chunk-test'>('card');
  const [isGeneratingChunkTest, setIsGeneratingChunkTest] = useState(false);
  const [chunkQuestions, setChunkQuestions] = useState<ChunkTestQuestion[]>([]);
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [selectedChunkOption, setSelectedChunkOption] = useState<number | null>(null);
  const [isChunkAnswerChecked, setIsChunkAnswerChecked] = useState(false);

  const currentCard = cards[currentIndex];
  const getReviewOptions = (answer: string, distractors: string[]) => {
    const uniqueOptions = [...new Map(
      [...distractors, answer]
        .map((option) => option.trim())
        .filter((option) => option && option.toLowerCase() !== answer.trim().toLowerCase())
        .map((option) => [option.toLowerCase(), option])
    ).values()];
    return [...uniqueOptions.slice(0, 3), answer];
  };

  // Reset states when current card changes or modal opens
  useEffect(() => {
    setIsFlipped(false);
    setSynonymAnswer(null);
    setReviewQuizAnswers({});
    setIsVoiceTesting(false);
    setVoiceScore(null);
    setVoiceTranscript('');
    setStep('card');
    setChunkQuestions([]);
    setCurrentChunkIndex(0);
    setSelectedChunkOption(null);
    setIsChunkAnswerChecked(false);
    setSpellingInput('');
    setHintCount(0);
    setIsSpellingSuccess(false);
  }, [currentIndex, isOpen, reviewMode]);

  // Clean up recognition
  useEffect(() => {
    return () => {
      if (voiceRecognitionRef.current) {
        try { voiceRecognitionRef.current.stop(); } catch {}
      }
    };
  }, []);

  // Voice test on card
  const handleToggleVoiceTest = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!currentCard) return;

    const RecognitionClass = getSpeechRecognition();
    if (!RecognitionClass) {
      alert('Browser Anda belum mendukung Speech Recognition.');
      return;
    }

    if (isVoiceTesting && voiceRecognitionRef.current) {
      voiceRecognitionRef.current.stop();
      setIsVoiceTesting(false);
      return;
    }

    try {
      const recognition = new RecognitionClass();
      voiceRecognitionRef.current = recognition;
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      let spokenText = '';
      recognition.onstart = () => {
        setIsVoiceTesting(true);
        setVoiceScore(null);
        setVoiceTranscript('Mendengarkan... Ucapkan sekarang');
      };

      recognition.onresult = (event: ISpeechRecognitionEvent) => {
        spokenText = Array.from(event.results)
          .map((res) => res[0].transcript)
          .join(' ');
      };

      recognition.onerror = () => {
        setVoiceTranscript('Suara tidak terdengar jelas.');
      };

      recognition.onend = () => {
        setIsVoiceTesting(false);
        voiceRecognitionRef.current = null;
        const target = normalizeSpokenText(currentCard.word);
        const spoken = normalizeSpokenText(spokenText);

        let score = 0;
        if (spoken) {
          if (spoken === target) score = 100;
          else if (spoken.includes(target) || target.includes(spoken)) score = 70;
          else score = 25;
        }

        setVoiceTranscript(spokenText || 'Tidak terdeteksi');
        setVoiceScore(score);
      };

      recognition.start();
    } catch {
      setIsVoiceTesting(false);
    }
  }, [currentCard, isVoiceTesting]);

  // Rate card (SM-2)
  const handleRate = useCallback((quality: number) => {
    if (!currentCard) return;
    onRateCard(currentCard.word, quality);
    if (currentIndex + 1 < cards.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      onClose();
    }
  }, [currentCard, onRateCard, currentIndex, cards.length, onClose]);

  // Spelling recall helper functions
  const handleCheckSpelling = useCallback((inputVal: string) => {
    if (!currentCard) return;
    const cleanInput = inputVal.trim().toLowerCase();
    const cleanWord = currentCard.word.trim().toLowerCase();

    if (cleanInput === cleanWord) {
      setIsSpellingSuccess(true);
      speakEnglish(currentCard.word);
      setTimeout(() => {
        setIsFlipped(true);
      }, 700);
    }
  }, [currentCard]);

  const handleRevealHint = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!currentCard) return;
    setHintCount((prev) => Math.min(prev + 1, currentCard.word.length));
  };

  const getMaskedWord = () => {
    if (!currentCard) return '';
    const word = currentCard.word;
    return word
      .split('')
      .map((char, idx) => {
        if (char === ' ' || char === '-') return char;
        if (idx < hintCount) return char;
        return '_';
      })
      .join(' ');
  };

  // Keyboard Shortcuts inside Flashcard Review Modal
  useEffect(() => {
    if (!isOpen || step !== 'card') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA');

      if (e.key === 'Tab' && !isFlipped) {
        e.preventDefault();
        setReviewMode((prev) => (prev === 'standard' ? 'reverse' : prev === 'reverse' ? 'spelling' : 'standard'));
        return;
      }

      if (isInput) {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleCheckSpelling(spellingInput);
        }
        return;
      }

      if (e.code === 'Space' || e.key === 'Enter') {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        if (currentCard) speakEnglish(currentCard.word);
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        handleToggleVoiceTest();
      } else if (isFlipped) {
        if (e.key === '1') handleRate(1);
        else if (e.key === '2' || e.key === '3') handleRate(3);
        else if (e.key === '4') handleRate(4);
        else if (e.key === '5') handleRate(5);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, step, isFlipped, currentCard, handleRate, handleToggleVoiceTest, spellingInput, handleCheckSpelling]);

  if (!isOpen || !currentCard) return null;

  const validChunks: ChunkItem[] = Array.isArray(currentCard.chunks)
    ? currentCard.chunks.filter((c) => c && c.pattern && c.rule && c.example_en)
    : [];

  const example =
    currentCard.tenses?.present ||
    currentCard.tenses?.past ||
    currentCard.tenses?.present_perfect || {
      example_en: currentCard.chunks?.[0]?.example_en || 'Contoh kalimat belum tersedia.',
      example_id: currentCard.chunks?.[0]?.example_id || '',
    };

  // Handle Chunk Test start
  const handleStartChunkTest = async () => {
    if (!validChunks.length) return;
    setIsGeneratingChunkTest(true);
    try {
      const questions = await generateChunkMiniTestAI(currentCard.word, validChunks, apiKey);
      setChunkQuestions(questions);
      setCurrentChunkIndex(0);
      setSelectedChunkOption(null);
      setIsChunkAnswerChecked(false);
      setStep('chunk-test');
    } catch (err: unknown) {
      alert((err as Error).message || 'Gagal memuat mini test chunk.');
    } finally {
      setIsGeneratingChunkTest(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`relative w-full overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col transition-all duration-300 ${
          isZenMode ? 'max-w-4xl h-[95vh]' : 'max-w-2xl max-h-[92vh]'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <Brain className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{title}</h3>
                {isZenMode && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-600 text-white">
                    Mode Zen
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Kartu {currentIndex + 1} dari {cards.length} ·{' '}
                {currentCard.repetition ? `Review ke-${currentCard.repetition}` : 'Kartu Baru'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Zen Mode toggle */}
            <button
              type="button"
              onClick={() => setIsZenMode(!isZenMode)}
              title={isZenMode ? 'Keluar Mode Zen' : 'Mode Zen Layar Penuh'}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              {isZenMode ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Review Mode Selector (Peningkatan 1: Standar, Terbalik ID->EN, Latihan Ejaan) */}
        {step === 'card' && (
          <div className="flex items-center justify-between px-6 py-2 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs">
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setReviewMode('standard')}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-semibold transition-all ${
                  reviewMode === 'standard'
                    ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <span>🇬🇧 Standar (EN → ID)</span>
              </button>

              <button
                type="button"
                onClick={() => setReviewMode('reverse')}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-semibold transition-all ${
                  reviewMode === 'reverse'
                    ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Languages className="h-3.5 w-3.5" />
                <span>🇮🇩 Terbalik (ID → EN)</span>
              </button>

              <button
                type="button"
                onClick={() => setReviewMode('spelling')}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-semibold transition-all ${
                  reviewMode === 'spelling'
                    ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <PenTool className="h-3.5 w-3.5" />
                <span>⌨️ Latihan Ejaan</span>
              </button>
            </div>

            <span className="hidden sm:inline-block text-[11px] text-slate-400 font-medium">
              Tekan <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[10px]">Tab</kbd> ganti mode
            </span>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {step === 'card' && (
            <>
              {/* 3D Flashcard */}
              <div
                className="perspective-1000 cursor-pointer select-none"
                onClick={() => {
                  if (reviewMode !== 'spelling') {
                    setIsFlipped(!isFlipped);
                  }
                }}
              >
                <div
                  className={`transform-style-3d relative w-full min-h-[350px] rounded-2xl border border-slate-200 dark:border-slate-800 transition-transform duration-500 ${
                    isFlipped ? 'rotate-y-180' : ''
                  }`}
                >
                  {/* FRONT FACE */}
                  <div className="backface-hidden absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-50/50 dark:from-slate-900 via-white dark:via-slate-900 to-slate-50 dark:to-slate-800/80 p-8 text-center shadow-xs">
                    {reviewMode === 'standard' ? (
                      /* MODE 1: Standard (EN -> ID) */
                      <>
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-100/70 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 mb-4">
                          Tap / Spasi untuk membuka arti
                        </span>
                        <h2
                          className={`font-extrabold tracking-tight text-slate-900 dark:text-slate-100 capitalize ${
                            isZenMode ? 'text-5xl sm:text-6xl' : 'text-4xl sm:text-5xl'
                          }`}
                        >
                          {currentCard.word}
                        </h2>
                        {currentCard.phonetic && (
                          <p className="font-mono text-sm text-indigo-600 dark:text-indigo-400 font-semibold mt-3">
                            {currentCard.phonetic}
                          </p>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            speakEnglish(currentCard.word);
                          }}
                          className="mt-6 flex items-center gap-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-95 transition-all shadow-xs"
                        >
                          <Volume2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                          <span>Dengarkan Pengucapan (R)</span>
                        </button>
                      </>
                    ) : reviewMode === 'reverse' ? (
                      /* MODE 2: Reverse (ID -> EN Active Recall) */
                      <>
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100/80 dark:bg-amber-950 text-amber-800 dark:text-amber-300 mb-4 flex items-center gap-1.5">
                          <Languages className="h-3.5 w-3.5" />
                          Tebak Kata Bahasa Inggris
                        </span>
                        <h2
                          className={`font-bold tracking-tight text-slate-900 dark:text-slate-100 ${
                            isZenMode ? 'text-3xl sm:text-4xl' : 'text-2xl sm:text-3xl'
                          } max-w-lg leading-snug`}
                        >
                          {currentCard.translation}
                        </h2>
                        {currentCard.word_family?.noun && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-3">
                            Petunjuk Turunan: <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{currentCard.word_family.noun}</span>
                          </p>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsFlipped(true);
                          }}
                          className="mt-6 flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 active:scale-95 transition-all"
                        >
                          <RotateCw className="h-4 w-4" />
                          <span>Periksa Jawaban Bahasa Inggris (Spasi)</span>
                        </button>
                      </>
                    ) : (
                      /* MODE 3: Active Spelling & Typing Recall Drill */
                      <div
                        className="w-full max-w-md space-y-4"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100/80 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 inline-flex items-center gap-1.5">
                          <PenTool className="h-3.5 w-3.5" />
                          Latihan Ejaan TOEFL (Active Typing)
                        </span>

                        <div>
                          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Arti Kata:</p>
                          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-0.5 leading-snug">
                            {currentCard.translation}
                          </h3>
                        </div>

                        {/* Masked letter hint */}
                        <div className="font-mono text-sm tracking-widest text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50/70 dark:bg-indigo-950/40 py-2 px-3 rounded-xl border border-indigo-100 dark:border-indigo-900/60">
                          {getMaskedWord()}
                        </div>

                        {/* Interactive spelling input */}
                        <div className="space-y-2">
                          <div className="relative">
                            <input
                              ref={spellingInputRef}
                              type="text"
                              autoFocus
                              value={spellingInput}
                              onChange={(e) => {
                                setSpellingInput(e.target.value);
                                handleCheckSpelling(e.target.value);
                              }}
                              placeholder="Ketik ejaan kata di sini..."
                              className={`w-full rounded-xl border-2 px-4 py-3 text-center text-lg font-bold tracking-wide focus:outline-hidden transition-all shadow-inner ${
                                isSpellingSuccess
                                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200'
                                  : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
                              }`}
                            />
                            {isSpellingSuccess && (
                              <CheckCircle className="absolute right-3.5 top-3.5 h-6 w-6 text-emerald-500 animate-bounce" />
                            )}
                          </div>

                          <div className="flex items-center justify-between gap-2 text-xs">
                            <span className="text-[11px] text-slate-400">
                              {spellingInput.length} / {currentCard.word.length} huruf
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={handleRevealHint}
                                className="flex items-center gap-1 rounded-lg px-2.5 py-1 font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900/60 hover:bg-amber-100 transition-colors"
                              >
                                <Lightbulb className="h-3 w-3" />
                                <span>Petunjuk Huruf ({hintCount})</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => speakEnglish(currentCard.word)}
                                title="Dengarkan pengucapan kata untuk mendikte"
                                className="flex items-center gap-1 rounded-lg px-2.5 py-1 font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-colors"
                              >
                                <Volume2 className="h-3 w-3" />
                                <span>Audio</span>
                              </button>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setIsFlipped(true)}
                          className="text-xs font-semibold text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 underline decoration-dotted transition-colors pt-1 block mx-auto"
                        >
                          Menyerah? Buka Jawaban Lengkap
                        </button>
                      </div>
                    )}
                  </div>

                  {/* BACK FACE */}
                  <div className="rotate-y-180 backface-hidden flex flex-col rounded-2xl bg-gradient-to-br from-white dark:from-slate-900 to-slate-50/50 dark:to-slate-800/60 p-6 shadow-xs space-y-4">
                    <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 capitalize">
                            {currentCard.word}
                          </h3>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              speakEnglish(currentCard.word);
                            }}
                            className="text-indigo-600 dark:text-indigo-400 p-1 hover:text-indigo-800"
                          >
                            <Volume2 className="h-4 w-4" />
                          </button>
                        </div>
                        {currentCard.phonetic && (
                          <span className="font-mono text-xs text-indigo-600 dark:text-indigo-400">
                            {currentCard.phonetic}
                          </span>
                        )}
                        <p className="text-base font-semibold text-slate-800 dark:text-slate-200 mt-1">
                          {currentCard.translation}
                        </p>
                      </div>
                      <span className="text-[11px] font-semibold text-slate-400">Bagian Belakang</span>
                    </div>

                    {/* Example sentence */}
                    <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800/70 p-3.5 space-y-1 text-xs">
                      <span className="font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block text-[10px]">
                        Contoh Kalimat Akademik
                      </span>
                      <p
                        onClick={(e) => {
                          e.stopPropagation();
                          speakEnglish(example.example_en);
                        }}
                        className="font-semibold text-slate-900 dark:text-slate-100 leading-relaxed cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center justify-between"
                      >
                        <span>"{example.example_en}"</span>
                        <Volume2 className="h-3.5 w-3.5 text-slate-400 shrink-0 ml-2" />
                      </p>
                      <p className="text-slate-500 dark:text-slate-400 italic">{example.example_id}</p>
                    </div>

                    {/* Interactive Drills on Card */}
                    <div className="space-y-2 pt-1">
                      {/* 1. Synonym Drill */}
                      {currentCard.synonyms && currentCard.synonyms.length > 0 && (
                        <div
                          className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-800/80 p-3 space-y-2 text-xs"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span className="font-bold text-slate-600 dark:text-slate-300 block">
                            Latihan Sinonim: pilih arti yang paling dekat
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {[
                              currentCard.synonyms[0],
                              currentCard.antonyms?.[0] || 'distractor',
                              currentCard.word,
                            ]
                              .filter((v, i, a) => v && a.indexOf(v) === i)
                              .sort()
                              .map((opt) => {
                                const isCorrect = opt === currentCard.synonyms![0];
                                const isSelected = synonymAnswer === opt;
                                return (
                                  <button
                                    key={opt}
                                    type="button"
                                    disabled={Boolean(synonymAnswer)}
                                    onClick={() => setSynonymAnswer(opt)}
                                    className={`rounded-lg px-2.5 py-1 text-xs font-medium border transition-all ${
                                      isSelected
                                        ? isCorrect
                                          ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-300'
                                          : 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border-rose-300'
                                        : synonymAnswer && isCorrect
                                        ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-300'
                                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                                    }`}
                                  >
                                    {opt}
                                  </button>
                                );
                              })}
                          </div>
                        </div>
                      )}

                      {/* Antonym and word-family review questions */}
                      {currentCard.antonyms?.filter(Boolean).length ? (
                        <div
                          className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-800/80 p-3 space-y-2 text-xs"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span className="font-bold text-slate-600 dark:text-slate-300 block">
                            Latihan Antonim: pilih lawan kata dari "{currentCard.word}"
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {getReviewOptions(
                              currentCard.antonyms![0],
                              cards.flatMap((card) => [
                                card.word,
                                ...(card.synonyms || []),
                                ...(card.antonyms || []),
                                ...Object.values(card.word_family || {}).filter((form): form is string => Boolean(form))
                              ])
                            ).map((option) => {
                              const selected = reviewQuizAnswers.antonym === option;
                              const correct = option === currentCard.antonyms![0];
                              return (
                                <button
                                  key={option}
                                  type="button"
                                  disabled={Boolean(reviewQuizAnswers.antonym)}
                                  onClick={() => setReviewQuizAnswers((previous) => ({ ...previous, antonym: option }))}
                                  className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-all ${
                                    selected
                                      ? correct
                                        ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                        : 'border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                      : reviewQuizAnswers.antonym && correct
                                        ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                                  }`}
                                >
                                  {option}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ) : null}

                      {(['noun', 'verb', 'adjective', 'adverb'] as const).map((partOfSpeech) => {
                        const answer = currentCard.word_family?.[partOfSpeech];
                        if (!answer) return null;
                        const answerKey = `family-${partOfSpeech}`;
                        const distractors = cards.flatMap((card) => [
                          card.word_family?.[partOfSpeech] || '',
                          card.word,
                          ...Object.values(card.word_family || {}).filter((form): form is string => Boolean(form))
                        ]);
                        return (
                          <div
                            key={partOfSpeech}
                            className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-800/80 p-3 space-y-2 text-xs"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span className="font-bold text-slate-600 dark:text-slate-300 block">
                              Latihan Word Family: pilih bentuk {partOfSpeech} dari "{currentCard.word}"
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {getReviewOptions(answer, distractors).map((option) => {
                                const selected = reviewQuizAnswers[answerKey] === option;
                                const correct = option === answer;
                                return (
                                  <button
                                    key={option}
                                    type="button"
                                    disabled={Boolean(reviewQuizAnswers[answerKey])}
                                    onClick={() => setReviewQuizAnswers((previous) => ({ ...previous, [answerKey]: option }))}
                                    className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-all ${
                                      selected
                                        ? correct
                                          ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                          : 'border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                        : reviewQuizAnswers[answerKey] && correct
                                          ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                                    }`}
                                  >
                                    {option}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}

                      {/* 2. Voice test drill on card with AudioWaveform */}
                      <div
                        className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-800/80 p-3 flex flex-wrap items-center justify-between gap-3 text-xs"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center gap-3">
                          <div>
                            <span className="font-bold text-slate-700 dark:text-slate-300 block">
                              Uji Pengucapan Mikrofon (M)
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">
                              {voiceTranscript || 'Tekan mikrofon untuk menguji pengucapan'}
                            </span>
                          </div>
                          <AudioWaveform isActive={isVoiceTesting} barCount={12} />
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {voiceScore !== null && (
                            <span
                              className={`font-bold tabular-nums text-xs px-2 py-0.5 rounded ${
                                voiceScore >= 70
                                  ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                                  : 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                              }`}
                            >
                              {voiceScore}%
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={handleToggleVoiceTest}
                            className={`rounded-lg p-2 text-white transition-all shadow-xs ${
                              isVoiceTesting ? 'bg-rose-600 animate-pulse' : 'bg-indigo-600 hover:bg-indigo-700'
                            }`}
                          >
                            <Mic className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Next step to Chunk Speak test (if chunks exist) */}
              {isFlipped && validChunks.length > 0 && (
                <div className="rounded-xl border border-indigo-100 dark:border-indigo-900/60 bg-indigo-50/70 dark:bg-indigo-950/40 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in">
                  <div>
                    <h4 className="text-xs font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      Langkah Berikutnya: Mini Test Chunk Speak
                    </h4>
                    <p className="text-xs text-indigo-700 dark:text-indigo-300 mt-0.5">
                      Tersedia {validChunks.length} pola chunk untuk kata ini. Uji pemahaman konteks tata bahasa Anda.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep('chunk-intro')}
                    className="whitespace-nowrap rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 active:scale-95 transition-all"
                  >
                    Buka Latihan Chunk
                  </button>
                </div>
              )}

              {/* Rating Actions (SM-2 Quality) */}
              {isFlipped && (
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block text-center">
                    Beri Penilaian Memori (SM-2) · Tombol 1-4 di Keyboard
                  </span>
                  <div className="grid grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => handleRate(1)}
                      className="flex flex-col items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 py-3 px-2 text-rose-800 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-all active:scale-95"
                    >
                      <span className="text-xs font-extrabold">[1] Lupa</span>
                      <span className="text-[10px] text-rose-600 dark:text-rose-400 mt-0.5">Hari Ini</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRate(3)}
                      className="flex flex-col items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 py-3 px-2 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-all active:scale-95"
                    >
                      <span className="text-xs font-extrabold">[2] Sulit</span>
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">Besok</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRate(4)}
                      className="flex flex-col items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 py-3 px-2 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-all active:scale-95"
                    >
                      <span className="text-xs font-extrabold">[3] Ingat</span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">Terjadwal</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRate(5)}
                      className="flex flex-col items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 py-3 px-2 text-blue-800 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-all active:scale-95"
                    >
                      <span className="text-xs font-extrabold">[4] Mudah</span>
                      <span className="text-[10px] text-blue-600 dark:text-blue-400 mt-0.5">Lama</span>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* CHUNK INTRO STEP */}
          {step === 'chunk-intro' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span>🧩</span> Pola Chunk untuk "{currentCard.word}"
                  </h4>
                  <button
                    type="button"
                    onClick={() => setStep('card')}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  >
                    Kembali ke Kartu
                  </button>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Pelajari pola-pola berikut sebelum memulai kuis mini evaluasi:
                </p>

                <div className="space-y-2.5">
                  {validChunks.map((chunk, i) => (
                    <div
                      key={i}
                      className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 space-y-1.5 text-xs"
                    >
                      <span className="font-mono font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded">
                        {chunk.pattern}
                      </span>
                      <p className="text-slate-600 dark:text-slate-400 font-medium">{chunk.rule}</p>
                      <p className="text-slate-900 dark:text-slate-100 font-semibold italic">"{chunk.example_en}"</p>
                      <p className="text-slate-500 dark:text-slate-400 text-[11px]">{chunk.example_id}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep('card')}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Kembali
                </button>
                <button
                  type="button"
                  disabled={isGeneratingChunkTest}
                  onClick={handleStartChunkTest}
                  className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 active:scale-95 disabled:opacity-50 transition-all"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>{isGeneratingChunkTest ? 'AI Membuat Soal...' : 'Mulai Mini Test (3 Soal)'}</span>
                </button>
              </div>
            </div>
          )}

          {/* CHUNK TEST QUESTIONS STEP */}
          {step === 'chunk-test' && chunkQuestions.length > 0 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="font-bold text-indigo-700 dark:text-indigo-400">
                  Soal {currentChunkIndex + 1} dari {chunkQuestions.length}
                </span>
                <button
                  type="button"
                  onClick={() => setStep('card')}
                  className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                >
                  Keluar ke Kartu
                </button>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-relaxed">
                  {chunkQuestions[currentChunkIndex].question}
                </h4>

                <div className="space-y-2">
                  {chunkQuestions[currentChunkIndex].options.map((opt, idx) => {
                    const isSelected = selectedChunkOption === idx;
                    const isCorrectAnswer = idx === chunkQuestions[currentChunkIndex].answerIndex;
                    let btnStyle =
                      'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:border-indigo-300';

                    if (isChunkAnswerChecked) {
                      if (isCorrectAnswer) {
                        btnStyle = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200 font-bold';
                      } else if (isSelected) {
                        btnStyle = 'border-rose-400 bg-rose-50 dark:bg-rose-950 text-rose-800 dark:text-rose-200';
                      }
                    } else if (isSelected) {
                      btnStyle = 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950 text-indigo-900 dark:text-indigo-200 font-bold';
                    }

                    return (
                      <button
                        key={idx}
                        type="button"
                        disabled={isChunkAnswerChecked}
                        onClick={() => setSelectedChunkOption(idx)}
                        className={`w-full text-left rounded-xl border p-3.5 text-xs transition-all flex items-center justify-between ${btnStyle}`}
                      >
                        <span>{opt}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Explanation feedback */}
                {isChunkAnswerChecked && (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 p-3.5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed animate-in fade-in">
                    <span className="font-bold block text-slate-900 dark:text-slate-100 mb-1">
                      {selectedChunkOption === chunkQuestions[currentChunkIndex].answerIndex
                        ? '✅ Jawaban Benar!'
                        : '❌ Kurang Tepat!'}
                    </span>
                    <p>{chunkQuestions[currentChunkIndex].explanation}</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                {!isChunkAnswerChecked ? (
                  <button
                    type="button"
                    disabled={selectedChunkOption === null}
                    onClick={() => setIsChunkAnswerChecked(true)}
                    className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 active:scale-95 disabled:opacity-40 transition-all"
                  >
                    Periksa Jawaban
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (currentChunkIndex + 1 < chunkQuestions.length) {
                        setCurrentChunkIndex((prev) => prev + 1);
                        setSelectedChunkOption(null);
                        setIsChunkAnswerChecked(false);
                      } else {
                        setStep('card');
                      }
                    }}
                    className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 active:scale-95 transition-all"
                  >
                    <span>
                      {currentChunkIndex + 1 < chunkQuestions.length
                        ? 'Soal Berikutnya'
                        : 'Selesai Mini Test & Beri Nilai'}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
