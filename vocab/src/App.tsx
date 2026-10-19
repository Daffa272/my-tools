/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TopNav } from './components/TopNav';
import { SearchHeader } from './components/SearchHeader';
import { WordResultView } from './components/WordResultView';
import { SkeletonResultView } from './components/SkeletonResultView';
import { FlashcardSidebar } from './components/FlashcardSidebar';
import { FlashcardModal } from './components/FlashcardModal';
import { QuizModal } from './components/QuizModal';
import { WeeklyScheduleModal } from './components/WeeklyScheduleModal';
import { ApiSettingsModal } from './components/ApiSettingsModal';
import { ShortcutsModal } from './components/ShortcutsModal';
import { SpeedMatchModal } from './components/SpeedMatchModal';
import { HandsFreeAudioModal } from './components/HandsFreeAudioModal';
import { AudioSettingsModal } from './components/AudioSettingsModal';
import { PrintStudySheetModal } from './components/PrintStudySheetModal';
import { PomodoroWidget } from './components/PomodoroWidget';
import { WordData, SavedWord, QuizQuestion, WeeklyCorrectionResult } from './types';
import {
  getStoredAppData,
  persistAppData,
  updateSM2Schedule,
  getEnglishProficiency,
  getStudyStreak,
  recordReviewIncrement,
  setDailyGoal,
  STORAGE_KEYS
} from './services/storage';
import {
  processWordAI,
  generateChunksAI,
  generateTOEFLQuizAI,
  correctWeeklyMasteryTestAI
} from './services/gemini';
import {
  Sparkles,
  Brain,
  AlertCircle,
  CheckCircle2,
  X
} from 'lucide-react';

// Default initial showcase word for immediate rich visualization
const INITIAL_DEMO_WORD: WordData = {
  word: 'unprecedented',
  phonetic: '/ʌnˈpresɪdentɪd/',
  translation: 'belum pernah terjadi sebelumnya / luar biasa',
  synonyms: ['unparalleled', 'novel', 'groundbreaking'],
  antonyms: ['commonplace', 'routine'],
  word_family: {
    noun: 'precedent',
    verb: 'precede',
    adjective: 'unprecedented',
    adverb: 'unprecedentedly'
  },
  collocations: ['unprecedented growth', 'unprecedented challenge', 'on an unprecedented scale'],
  morphology: {
    prefix: 'un- (tidak/bukan)',
    root: 'cedere (berjalan/mundur)',
    suffix: '-ed (bentuk lampau/kata sifat)'
  },
  chunks: [
    {
      pattern: 'S + witness + unprecedented + Noun',
      rule: 'Digunakan saat subjek menyaksikan atau mengalami fenomena berskala luar biasa yang belum pernah ada presedennya.',
      example_en: 'The marine ecosystem witnessed unprecedented disruption due to sudden oceanic thermal anomalies.',
      example_id: 'Ekosistem laut menyaksikan gangguan yang belum pernah terjadi sebelumnya akibat anomali termal laut mendadak.'
    },
    {
      pattern: 'at an unprecedented rate / pace',
      rule: 'Pola adverbial untuk mendeskripsikan laju perubahan ilmiah atau pergeseran demografi yang sangat pesat.',
      example_en: 'Glacial ice caps are currently receding at an unprecedented rate in recorded history.',
      example_id: 'Lapisan es gletser saat ini menyusut dengan kecepatan yang belum pernah terjadi sebelumnya dalam sejarah tercatat.'
    }
  ],
  tenses: {
    present: {
      form: 'is / are unprecedented',
      example_en: 'The global acceleration of carbon emissions is unprecedented in modern climatology.',
      example_id: 'Akselerasi emisi karbon global belum pernah terjadi sebelumnya dalam klimatologi modern.'
    },
    past: {
      form: 'remained unprecedented',
      example_en: 'The seismic intensity recorded during the 1906 earthquake remained unprecedented for decades.',
      example_id: 'Intensitas seismik yang tercatat pada gempa tahun 1906 tetap belum pernah terjadi sebelumnya selama beberapa dekade.'
    },
    present_perfect: {
      form: 'has reached unprecedented levels',
      example_en: 'Atmospheric research has reached unprecedented levels of precision through satellite telemetry.',
      example_id: 'Penelitian atmosfer telah mencapai tingkat presisi yang belum pernah terjadi sebelumnya melalui telemetri satelit.'
    }
  }
};

export default function App() {
  const [appState, setAppState] = useState(getStoredAppData);

  // Dark Mode
  const [isDarkMode, setIsDarkMode] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.THEME_MODE);
      if (saved) return saved === 'dark';
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem(STORAGE_KEYS.THEME_MODE, 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem(STORAGE_KEYS.THEME_MODE, 'light');
    }
  }, [isDarkMode]);

  // Streak & Daily Target
  const [streakData, setStreakData] = useState(getStudyStreak);

  // Search input and result state
  const [inputValue, setInputValue] = useState('');
  const [searchedWord, setSearchedWord] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentWordData, setCurrentWordData] = useState<WordData | null>(INITIAL_DEMO_WORD);
  const [isGeneratingChunks, setIsGeneratingChunks] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Modals state
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isFlashcardModalOpen, setIsFlashcardModalOpen] = useState(false);
  const [flashcardReviewQueue, setFlashcardReviewQueue] = useState<SavedWord[]>([]);
  const [flashcardModalTitle, setFlashcardModalTitle] = useState('Review Flashcard');

  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [quizMode, setQuizMode] = useState<'ai' | 'weekly'>('ai');
  const [quizTitle, setQuizTitle] = useState('Latihan TOEFL iBT');
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);

  const [isWeeklyScheduleOpen, setIsWeeklyScheduleOpen] = useState(false);
  const [isSpeedMatchOpen, setIsSpeedMatchOpen] = useState(false);
  const [isHandsFreeOpen, setIsHandsFreeOpen] = useState(false);
  const [isAudioSettingsOpen, setIsAudioSettingsOpen] = useState(false);
  const [isPrintSheetOpen, setIsPrintSheetOpen] = useState(false);

  // Pomodoro timer state
  const [isPomodoroExpanded, setIsPomodoroExpanded] = useState(false);
  const [pomodoroTime, setPomodoroTime] = useState('25:00');
  const [isPomodoroRunning, setIsPomodoroRunning] = useState(false);

  // Toast notifications
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 3500);
  }, []);

  // Sync initial state if empty words
  useEffect(() => {
    if (appState.words.length === 0) {
      const demoSaved: SavedWord = {
        ...INITIAL_DEMO_WORD,
        repetition: 0,
        easiness: 2.5,
        interval: 0,
        nextReviewDate: new Date().toISOString()
      };
      const updated = persistAppData({ words: [demoSaved], recentSearches: ['unprecedented'] });
      setAppState(updated);
    }
  }, []);

  // Global Keyboard Shortcuts (e.g. '/' for search, '?' for shortcuts modal)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement as HTMLElement;
      const isInput = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');

      if (e.key === '/' && !isInput && !isFlashcardModalOpen && !isQuizModalOpen) {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      } else if (e.key === '?' && !isInput) {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setIsApiModalOpen(false);
        setIsShortcutsOpen(false);
        setIsWeeklyScheduleOpen(false);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isFlashcardModalOpen, isQuizModalOpen]);

  // Check if current word is saved in user's flashcards
  const isCurrentWordSaved = Boolean(
    currentWordData &&
      appState.words.some((w) => w.word.toLowerCase() === currentWordData.word.toLowerCase())
  );

  // --- SEARCH / PROCESS WORD ---
  const handleSearch = async (wordToSearch?: string, isRandom = false) => {
    const target = (wordToSearch || inputValue).trim();
    if (!target && !isRandom) {
      showToast('Mohon masukkan kosakata atau frasa.', 'error');
      return;
    }

    setSearchedWord(target);

    // Fast Load: Check local flashcards first if not random
    if (!isRandom && target) {
      const existing = appState.words.find((w) => w.word.toLowerCase() === target.toLowerCase());
      if (existing) {
        setCurrentWordData(existing);
        setInputValue(existing.word);
        updateRecentSearches(existing.word);
        showToast(`Memuat "${existing.word}" dari Flashcards Anda!`);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }

    // Ensure API Key exists
    const apiKey = appState.apiKey;
    if (!apiKey) {
      setIsApiModalOpen(true);
      showToast('Silakan masukkan Gemini API Key Anda terlebih dahulu.', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const result = await processWordAI(target, isRandom, apiKey);
      setCurrentWordData(result);
      setInputValue(result.word);
      updateRecentSearches(result.word);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: unknown) {
      console.error(err);
      showToast((err as Error).message || 'Terjadi kesalahan saat memproses kata.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRandomAWL = () => {
    setInputValue('');
    handleSearch(undefined, true);
  };

  const updateRecentSearches = (word: string) => {
    const filtered = appState.recentSearches.filter((w) => w.toLowerCase() !== word.toLowerCase());
    const updatedSearches = [word, ...filtered].slice(0, 6);
    const updated = persistAppData({ recentSearches: updatedSearches });
    setAppState(updated);
  };

  // --- SAVE CURRENT WORD ---
  const handleSaveWord = () => {
    if (!currentWordData) return;
    if (isCurrentWordSaved) return;

    const newSaved: SavedWord = {
      ...currentWordData,
      repetition: 0,
      easiness: 2.5,
      interval: 0,
      nextReviewDate: new Date().toISOString()
    };

    const nextWords = [...appState.words, newSaved];
    const updated = persistAppData({ words: nextWords });
    setAppState(updated);
    showToast(`"${currentWordData.word}" berhasil disimpan ke Flashcards!`);
  };

  // --- REMOVE WORD ---
  const handleRemoveWord = (wordStr: string) => {
    const nextWords = appState.words.filter((w) => w.word.toLowerCase() !== wordStr.toLowerCase());
    const updated = persistAppData({ words: nextWords });
    setAppState(updated);
    showToast(`"${wordStr}" dihapus dari Flashcards.`);
  };

  // --- GENERATE CHUNKS FOR CURRENT WORD ---
  const handleGenerateChunks = async () => {
    if (!currentWordData?.word || isGeneratingChunks) return;
    const apiKey = appState.apiKey;
    if (!apiKey) {
      setIsApiModalOpen(true);
      showToast('Gemini API Key diperlukan untuk membuat chunk.', 'error');
      return;
    }

    setIsGeneratingChunks(true);
    try {
      const chunks = await generateChunksAI(currentWordData.word, apiKey);
      const updatedWord: WordData = { ...currentWordData, chunks };
      setCurrentWordData(updatedWord);

      const index = appState.words.findIndex(
        (w) => w.word.toLowerCase() === currentWordData.word.toLowerCase()
      );
      if (index !== -1) {
        const nextWords = [...appState.words];
        nextWords[index] = { ...nextWords[index], chunks };
        const updated = persistAppData({ words: nextWords });
        setAppState(updated);
      }
      showToast('Pola chunk berhasil dibuat otomatis!');
    } catch (err: unknown) {
      console.error(err);
      showToast((err as Error).message || 'Gagal membuat chunk.', 'error');
    } finally {
      setIsGeneratingChunks(false);
    }
  };

  // --- FLASHCARD REVIEW ---
  const handleStartReview = (mode: 'due' | 'learning' | 'new-learning' = 'due') => {
    const now = new Date();
    let candidates = appState.words;

    if (mode === 'learning') {
      candidates = candidates.filter((w) => getEnglishProficiency(w) === 'Sedang Dipelajari');
    } else if (mode === 'new-learning') {
      candidates = candidates.filter((w) => (w.repetition || 0) === 1);
    }

    const dueCards = candidates.filter(
      (c) => !c.nextReviewDate || new Date(c.nextReviewDate) <= now
    );

    if (dueCards.length === 0) {
      showToast(
        mode === 'learning'
          ? 'Belum ada kartu sedang dipelajari yang jatuh tempo.'
          : mode === 'new-learning'
          ? 'Belum ada kartu baru masuk yang jatuh tempo.'
          : 'Belum ada kartu yang jatuh tempo hari ini. Memori Anda masih prima! 🎉'
      );
      return;
    }

    const shuffled = [...dueCards].sort(() => Math.random() - 0.5);
    setFlashcardReviewQueue(shuffled);
    setFlashcardModalTitle(
      mode === 'learning'
        ? 'Review Sedang Dipelajari'
        : mode === 'new-learning'
        ? 'Review Baru Masuk Dipelajari'
        : 'Review Flashcard Jatuh Tempo'
    );
    setIsFlashcardModalOpen(true);
  };

  // --- RATE CARD (SM-2) ---
  const handleRateCard = (wordStr: string, quality: number) => {
    const updatedWords = updateSM2Schedule(appState.words, wordStr, quality);
    setAppState((prev) => ({ ...prev, words: updatedWords }));
    setStreakData(getStudyStreak());
    showToast('Jadwal review kartu diperbarui.');
  };

  // --- START AI TOEFL QUIZ ---
  const handleStartAIQuiz = async () => {
    const words = appState.words;
    if (words.length === 0) {
      showToast('Simpan kosa kata ke flashcard terlebih dahulu!', 'error');
      return;
    }

    const apiKey = appState.apiKey;
    if (!apiKey) {
      setIsApiModalOpen(true);
      showToast('Gemini API Key diperlukan untuk kuis.', 'error');
      return;
    }

    const now = new Date();
    const dueWords = words.filter((w) => !w.nextReviewDate || new Date(w.nextReviewDate) <= now);
    const pool = dueWords.length > 0 ? dueWords : words;
    const sampleWords = [...pool]
      .sort(() => Math.random() - 0.5)
      .slice(0, 5)
      .map((w) => w.word);

    showToast('AI sedang meracik soal kuis TOEFL...');
    try {
      const questions = await generateTOEFLQuizAI(sampleWords, apiKey);
      setQuizQuestions(questions);
      setQuizMode('ai');
      setQuizTitle('Latihan TOEFL iBT (AI Fill-in-the-Blank)');
      setIsQuizModalOpen(true);
    } catch (err: unknown) {
      showToast((err as Error).message || 'Gagal memuat kuis AI.', 'error');
    }
  };

  const handleAnswerAIQuiz = (wordStr: string, isCorrect: boolean) => {
    const quality = isCorrect ? 4 : 1;
    const updatedWords = updateSM2Schedule(appState.words, wordStr, quality);
    setAppState((prev) => ({ ...prev, words: updatedWords }));
    setStreakData(getStudyStreak());
  };

  // --- START WEEKLY MASTERY TEST ---
  const handleStartWeeklyTest = () => {
    const now = new Date();
    const candidates = appState.words.filter(
      (c) =>
        getEnglishProficiency(c) === 'Dikuasai' &&
        (!c.nextWeeklyTestDate || new Date(c.nextWeeklyTestDate) <= now)
    );

    if (candidates.length === 0) {
      showToast('Belum ada kartu Dikuasai yang jatuh tempo untuk dites.', 'error');
      return;
    }

    const selected = [...candidates].sort(() => Math.random() - 0.5).slice(0, 15);
    const allWords = appState.words;
    const makeOptions = (answer: string, distractors: string[]) => {
      const uniqueDistractors = [...new Map(
        distractors
          .map((option) => option.trim())
          .filter((option) => option && option.toLowerCase() !== answer.toLowerCase())
          .map((option) => [option.toLowerCase(), option])
      ).values()].slice(0, 3);
      return [...uniqueDistractors, answer].sort(() => Math.random() - 0.5);
    };
    const exerciseGroups = [
      selected.flatMap((card) =>
        (card.antonyms || []).filter(Boolean).map((antonym) => ({
          word: card.word,
          questionType: 'antonym' as const,
          question: `Pilih antonim yang tepat dari "${card.word}":`,
          answer: antonym,
          expectedTranslation: antonym,
          options: makeOptions(
            antonym,
            allWords.flatMap((word) => [...(word.antonyms || []), word.word])
          )
        }))
      ),
      ...(['noun', 'verb', 'adjective', 'adverb'] as const).map((partOfSpeech) =>
        selected.flatMap((card) => {
          const answer = card.word_family?.[partOfSpeech];
          if (!answer) return [];
          const partOfSpeechLabel = {
            noun: 'noun',
            verb: 'verb',
            adjective: 'adjective',
            adverb: 'adverb'
          }[partOfSpeech];
          return [{
            word: card.word,
            questionType: 'word-family' as const,
            question: `Pilih bentuk ${partOfSpeechLabel} dari "${card.word}":`,
            answer,
            expectedTranslation: answer,
            options: makeOptions(
              answer,
              allWords.flatMap((word) => [
                word.word_family?.[partOfSpeech] || '',
                word.word
              ])
            )
          }];
        })
      )
    ];
    const exerciseQuestions: QuizQuestion[] = [];
    const usedExerciseWords = new Set<string>();
    exerciseGroups.forEach((group) => {
      const available = group.filter((question) => !usedExerciseWords.has(question.word.toLowerCase()));
      if (available.length) {
        const question = available[Math.floor(Math.random() * available.length)];
        exerciseQuestions.push(question);
        usedExerciseWords.add(question.word.toLowerCase());
      }
    });
    const meaningQuestions: QuizQuestion[] = selected
      .filter((card) => !usedExerciseWords.has(card.word.toLowerCase()))
      .map((card) => ({
        word: card.word,
        questionType: 'meaning',
        question: `Tuliskan arti kata "${card.word}" dalam Bahasa Indonesia:`,
        expectedTranslation: card.translation
      }));
    const questions = [...exerciseQuestions, ...meaningQuestions];

    setQuizQuestions(questions);
    setQuizMode('weekly');
    setQuizTitle('Tes Mingguan Kosakata Dikuasai');
    setIsQuizModalOpen(true);
  };

  const handleSubmitWeeklyTest = async (
    answers: string[]
  ): Promise<WeeklyCorrectionResult> => {
    const apiKey = appState.apiKey;
    if (!apiKey) throw new Error('Gemini API Key diperlukan untuk mengoreksi tes.');

    const answerSheet = quizQuestions.map((q, idx) => ({
      questionNumber: idx + 1,
      word: q.word,
      questionType: q.questionType,
      question: q.question,
      expectedAnswer: q.expectedTranslation,
      userAnswer: answers[idx] || ''
    }));

    const result = await correctWeeklyMasteryTestAI(answerSheet, apiKey);
    result.items = result.items.map((item) => {
      const question = quizQuestions[item.questionNumber - 1];
      if (!question?.options) return item;
      const correct = (answers[item.questionNumber - 1] || '').toLowerCase() === question.answer?.toLowerCase();
      return {
        ...item,
        correct,
        note: correct ? 'Pilihan jawaban cocok dengan kunci.' : `Kunci jawaban: ${question.answer}`
      };
    }).sort((a, b) => a.questionNumber - b.questionNumber);
    result.score = result.items.filter((item) => item.correct).length;
    result.total = result.items.length;
    result.feedback = `Jawaban benar: ${result.score} dari ${result.total}.`;

    const now = new Date();
    const updatedWords = [...appState.words];

    answerSheet.forEach((ans, idx) => {
      const correction = result.items.find((item) => item.questionNumber === idx + 1);
      const isCorrect = correction?.correct === true;
      const cardIdx = updatedWords.findIndex(
        (w) => w.word.toLowerCase() === ans.word.toLowerCase()
      );
      if (cardIdx !== -1) {
        const card = updatedWords[cardIdx];
        if (isCorrect) {
          const prevInterval = Number(card.weeklyTestIntervalDays) || 0;
          const nextInterval = prevInterval ? prevInterval * 2 : 7;
          const nextDate = new Date(now);
          nextDate.setDate(nextDate.getDate() + nextInterval);
          updatedWords[cardIdx] = {
            ...card,
            weeklyTestPasses: (Number(card.weeklyTestPasses) || 0) + 1,
            weeklyTestIntervalDays: nextInterval,
            nextWeeklyTestDate: nextDate.toISOString()
          };
        } else {
          const {
            weeklyTestPasses,
            weeklyTestIntervalDays,
            nextWeeklyTestDate,
            ...rest
          } = card;
          updatedWords[cardIdx] = {
            ...rest,
            repetition: 1,
            interval: 1,
            nextReviewDate: now.toISOString()
          };
        }
      }
    });

    const persisted = persistAppData({ words: updatedWords });
    setAppState(persisted);
    setStreakData(getStudyStreak());

    try {
      localStorage.setItem(
        STORAGE_KEYS.WEEKLY_MASTERY,
        JSON.stringify({
          completedAt: new Date().toISOString(),
          score: result.score,
          total: result.total,
          feedback: result.feedback
        })
      );
    } catch {}

    return result;
  };

  // --- IMPORT JSON ---
  const handleImportJSON = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      let importedWords: SavedWord[] = [];
      if (Array.isArray(parsed.words)) importedWords = parsed.words;
      else if (Array.isArray(parsed.repetition_words)) importedWords = parsed.repetition_words;
      else if (Array.isArray(parsed.flashcards)) importedWords = parsed.flashcards;

      if (!importedWords.length) {
        showToast('Format JSON tidak memiliki daftar kata yang valid.', 'error');
        return;
      }

      const merged = persistAppData({
        words: importedWords,
        recentSearches: Array.isArray(parsed.recentSearches)
          ? parsed.recentSearches
          : appState.recentSearches
      });
      setAppState(merged);
      showToast(`${importedWords.length} kata berhasil diimpor!`);
    } catch {
      showToast('Gagal membaca file JSON. Pastikan format valid.', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 rounded-xl bg-slate-900/90 dark:bg-slate-800/95 text-white px-4 py-3 shadow-xl backdrop-blur-md animate-in slide-in-from-top-4 duration-200 border border-slate-700/50">
          {toast.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          ) : (
            <AlertCircle className="h-4 w-4 text-rose-400" />
          )}
          <span className="text-xs font-semibold">{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="ml-2 text-slate-400 hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Top Navigation */}
      <TopNav
        apiKey={appState.apiKey}
        onOpenApiSettings={() => setIsApiModalOpen(true)}
        onOpenPomodoro={() => setIsPomodoroExpanded(!isPomodoroExpanded)}
        isPomodoroRunning={isPomodoroRunning}
        pomodoroTime={pomodoroTime}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onOpenAudioSettings={() => setIsAudioSettingsOpen(true)}
        streakCount={streakData.streakCount}
      />

      {/* Main Container */}
      <main className="flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Content Column (8 cols on desktop) */}
          <section className="lg:col-span-8 space-y-6">
            {/* Search and Input Bar */}
            <SearchHeader
              ref={searchInputRef}
              inputValue={inputValue}
              setInputValue={setInputValue}
              onSearch={handleSearch}
              onRandom={handleRandomAWL}
              isLoading={isLoading}
              recentSearches={appState.recentSearches}
              onSelectRecent={(word) => {
                setInputValue(word);
                handleSearch(word);
              }}
            />

            {/* Quick Practice Actions */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleStartAIQuiz}
                className="flex items-center gap-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/60 px-4 py-2 text-xs font-bold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-all shadow-xs active:scale-95"
              >
                <Sparkles className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Kuis Pilihan Ganda TOEFL (AI Gen)</span>
              </button>

              <button
                type="button"
                onClick={() => handleStartReview('due')}
                className="flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-900/60 px-4 py-2 text-xs font-bold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-all shadow-xs active:scale-95"
              >
                <Brain className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Mulai Sesi Review Flashcard</span>
              </button>
            </div>

            {/* Skeleton loading view when analyzing */}
            {isLoading ? (
              <SkeletonResultView searchedWord={searchedWord} />
            ) : currentWordData ? (
              <WordResultView
                data={currentWordData}
                isSaved={isCurrentWordSaved}
                onSaveWord={handleSaveWord}
                onGenerateChunks={handleGenerateChunks}
                isGeneratingChunks={isGeneratingChunks}
                savedWords={appState.words}
                apiKey={appState.apiKey}
                onNeedApiKey={() => setIsApiModalOpen(true)}
              />
            ) : null}
          </section>

          {/* Sidebar Column (4 cols on desktop) */}
          <aside className="lg:col-span-4 space-y-6">
            <FlashcardSidebar
              words={appState.words}
              onSelectWord={(word) => {
                setCurrentWordData(word);
                setInputValue(word.word);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onRemoveWord={handleRemoveWord}
              onStartReview={handleStartReview}
              onStartWeeklyTest={handleStartWeeklyTest}
              onOpenWeeklySchedule={() => setIsWeeklyScheduleOpen(true)}
              onImportJSON={handleImportJSON}
              streakData={streakData}
              onOpenSpeedMatch={() => setIsSpeedMatchOpen(true)}
              onOpenHandsFree={() => setIsHandsFreeOpen(true)}
              onOpenPrintSheet={() => setIsPrintSheetOpen(true)}
              onUpdateDailyGoal={(goal) => {
                const updated = setDailyGoal(goal);
                setStreakData(updated);
                showToast(`Target harian berhasil disetel: ${goal} kata.`);
              }}
            />
          </aside>
        </div>
      </main>

      {/* Floating Pomodoro & Lo-Fi Suite */}
      <PomodoroWidget
        isExpanded={isPomodoroExpanded}
        setIsExpanded={setIsPomodoroExpanded}
        onTimerTick={(timeStr, running) => {
          setPomodoroTime(timeStr);
          setIsPomodoroRunning(running);
        }}
      />

      {/* Audio Settings & Accent Modal */}
      <AudioSettingsModal
        isOpen={isAudioSettingsOpen}
        onClose={() => setIsAudioSettingsOpen(false)}
      />

      {/* Printable Study Sheet & PDF Modal */}
      <PrintStudySheetModal
        isOpen={isPrintSheetOpen}
        onClose={() => setIsPrintSheetOpen(false)}
        words={appState.words}
      />

      {/* API Settings Modal */}
      <ApiSettingsModal
        isOpen={isApiModalOpen}
        onClose={() => setIsApiModalOpen(false)}
        apiKey={appState.apiKey}
        onSaveApiKey={(key) => {
          const updated = persistAppData({ apiKey: key });
          setAppState(updated);
          showToast('API Key Gemini berhasil disimpan.');
        }}
      />

      {/* Shortcuts Guide Modal */}
      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      {/* Speed Match Mini Game Modal (60s challenge) */}
      <SpeedMatchModal
        isOpen={isSpeedMatchOpen}
        onClose={() => setIsSpeedMatchOpen(false)}
        words={appState.words}
      />

      {/* Hands-Free Audio Player Modal (Podcast Mode) */}
      <HandsFreeAudioModal
        isOpen={isHandsFreeOpen}
        onClose={() => setIsHandsFreeOpen(false)}
        cards={appState.words}
      />

      {/* Flashcard Review Modal */}
      <FlashcardModal
        isOpen={isFlashcardModalOpen}
        onClose={() => setIsFlashcardModalOpen(false)}
        cards={flashcardReviewQueue}
        apiKey={appState.apiKey}
        onRateCard={handleRateCard}
        title={flashcardModalTitle}
      />

      {/* AI Quiz / Weekly Test Modal */}
      <QuizModal
        isOpen={isQuizModalOpen}
        onClose={() => setIsQuizModalOpen(false)}
        mode={quizMode}
        title={quizTitle}
        questions={quizQuestions}
        onAnswerAIQuiz={handleAnswerAIQuiz}
        onSubmitWeeklyTest={handleSubmitWeeklyTest}
      />

      {/* Weekly Test Schedule Modal */}
      <WeeklyScheduleModal
        isOpen={isWeeklyScheduleOpen}
        onClose={() => setIsWeeklyScheduleOpen(false)}
        words={appState.words}
      />
    </div>
  );
}
