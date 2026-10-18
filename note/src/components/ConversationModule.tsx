import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Volume2,
  Sparkles,
  Play,
  X,
  Search,
  BookOpen,
  Calendar,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Clock,
  Layers,
  TrendingUp,
  Award,
  Bell,
  Flame,
  Target
} from 'lucide-react';
import { ConversationCard, EvaluationResult, FirstReviewEvaluation } from '../types';
import {
  generateConversationDetails,
  evaluateAnswers,
  ensureReviewDetails,
  speakConversationSentence
} from '../utils/gemini';
import {
  isDue,
  isMastered,
  isWeeklyTestDue,
  getProficiency,
  getReviewScheduleLabel,
  updateCardRepetition,
  getTodayKey,
  getHabitStats,
  logActivity,
  getRecentActivityLogs,
  requestNotificationPermission,
  sendLocalNotification
} from '../utils/srs';

interface ConversationModuleProps {
  cards: ConversationCard[];
  onCardsChange: (cards: ConversationCard[]) => void;
  onShowToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  onOpenApiKeyModal: () => void;
  hasApiKey: boolean;
  onActivityLogged?: () => void;
}

export const ConversationModule: React.FC<ConversationModuleProps> = ({
  cards,
  onCardsChange,
  onShowToast,
  onOpenApiKeyModal,
  hasApiKey,
  onActivityLogged
}) => {
  // Tabs & Views
  const [activeTab, setActiveTab] = useState<'review' | 'today'>('review');
  const [cardSearch, setCardSearch] = useState('');

  // Form states
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [sentenceInput, setSentenceInput] = useState('');
  const [translationIdInput, setTranslationIdInput] = useState('');
  const [situationInput, setSituationInput] = useState('');
  const [conditionInput, setConditionInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [formStatus, setFormStatus] = useState<{ message: string; type: 'idle' | 'success' | 'error' }>({
    message: '',
    type: 'idle'
  });

  // Review states
  const [reviewMode, setReviewMode] = useState<'due' | 'learning' | 'weekly' | 'all'>('due');
  const [reviewQueue, setReviewQueue] = useState<ConversationCard[]>([]);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [isReviewActive, setIsReviewActive] = useState(false);
  const [translationAttempt, setTranslationAttempt] = useState('');
  const [responseAttempt, setResponseAttempt] = useState('');
  const [isCheckingAnswers, setIsCheckingAnswers] = useState(false);
  const [feedbackResult, setFeedbackResult] = useState<EvaluationResult | null>(null);
  const [hasRatedMemory, setHasRatedMemory] = useState(false);
  const [weeklyScore, setWeeklyScore] = useState(0);
  const [reviewStatus, setReviewStatus] = useState<{ message: string; type: 'idle' | 'success' | 'error' }>({
    message: '',
    type: 'idle'
  });

  // Habit & streak state
  const [habitStats, setHabitStats] = useState(() => getHabitStats());
  const [activityLogs, setActivityLogs] = useState(() => getRecentActivityLogs(14));
  const [notificationEnabled, setNotificationEnabled] = useState(
    () => typeof Notification !== 'undefined' && Notification.permission === 'granted'
  );

  const generateDebounceRef = useRef<number | null>(null);
  const activeCard = reviewQueue[reviewIndex] || null;

  // Stats calculation
  const totalCards = cards.length;
  const dueCards = cards.filter(isDue);
  const learningCards = cards.filter(c => (c.repetition || 0) > 0 && !isMastered(c));
  const masteredCards = cards.filter(isMastered);
  const weeklyReady = masteredCards.filter(isWeeklyTestDue);

  const learningCount = learningCards.length;
  const masteredCount = masteredCards.length;

  const todayKeyStr = getTodayKey();
  const todayReviewsCount = activityLogs.find(l => l.date === todayKeyStr)?.reviewsCount || 0;
  const dailyGoalProgress = Math.min(100, Math.round((todayReviewsCount / habitStats.dailyGoal) * 100));

  // Request browser notifications
  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission();
    setNotificationEnabled(granted);
    if (granted) {
      onShowToast('Notifikasi pengingat berhasil diaktifkan.', 'success');
      if (dueCards.length > 0) {
        sendLocalNotification('Catatan & Latihan', {
          body: `Ada ${dueCards.length} kalimat percakapan yang jatuh tempo untuk direview!`
        });
      }
    } else {
      onShowToast('Izin notifikasi tidak diberikan di browser.', 'info');
    }
  };

  // Auto-generate details with debounce when sentence changes
  const triggerGenerateDetails = async (sentenceToUse?: string) => {
    const text = (sentenceToUse !== undefined ? sentenceToUse : sentenceInput).trim();
    if (!text) {
      setFormStatus({ message: 'Isi kalimat bahasa Inggris terlebih dahulu.', type: 'error' });
      return;
    }
    if (!hasApiKey) {
      onOpenApiKeyModal();
      return;
    }

    setIsGenerating(true);
    setFormStatus({ message: 'Gemini sedang menerjemahkan dan membuat situasi/kondisi...', type: 'idle' });
    try {
      const details = await generateConversationDetails(text);
      setTranslationIdInput(details.translationId || '');
      setSituationInput(details.situation || '');
      setConditionInput(details.condition || '');
      setFormStatus({
        message: 'Arti, situasi, dan kondisi berhasil dibuat oleh Gemini.',
        type: 'success'
      });
    } catch (err: unknown) {
      setFormStatus({
        message: err instanceof Error ? err.message : 'Gagal membuat arti dengan AI.',
        type: 'error'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSentenceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSentenceInput(val);
    if (editingCardId) return;

    if (generateDebounceRef.current) window.clearTimeout(generateDebounceRef.current);
    if (val.trim().length > 4 && hasApiKey) {
      generateDebounceRef.current = window.setTimeout(() => {
        triggerGenerateDetails(val);
      }, 900);
    }
  };

  const handleSaveSentence = (e: React.FormEvent) => {
    e.preventDefault();
    const sentence = sentenceInput.trim();
    if (!sentence) return;

    const translationId = translationIdInput.trim();
    const situation = situationInput.trim();
    const condition = conditionInput.trim();

    if (!translationId || !situation || !condition) {
      setFormStatus({
        message: 'Mohon isi atau generate arti, situasi, dan kondisi terlebih dahulu.',
        type: 'error'
      });
      return;
    }

    // Check duplicate
    if (cards.some(c => c.id !== editingCardId && c.sentence.toLowerCase() === sentence.toLowerCase())) {
      setFormStatus({ message: 'Kalimat ini sudah ada di daftar Anda.', type: 'error' });
      return;
    }

    if (editingCardId) {
      const updated = cards.map(c => {
        if (c.id !== editingCardId) return c;
        const changed =
          c.sentence !== sentence ||
          c.translationId !== translationId ||
          c.situation !== situation ||
          c.condition !== condition;
        return {
          ...c,
          sentence,
          translationId,
          situation,
          condition,
          ...(changed
            ? {
                repetition: 0,
                interval: 0,
                easiness: 2.5,
                nextReviewDate: new Date().toISOString(),
                firstReviewEvaluation: undefined,
                weeklyTestPasses: undefined,
                weeklyTestIntervalDays: undefined,
                nextWeeklyTestDate: undefined
              }
            : {})
        };
      });
      onCardsChange(updated);
      onShowToast('Kalimat berhasil diperbarui.', 'success');
    } else {
      const newCard: ConversationCard = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        sentence,
        translationId,
        situation,
        condition,
        repetition: 0,
        interval: 0,
        easiness: 2.5,
        nextReviewDate: new Date().toISOString()
      };
      onCardsChange([...cards, newCard]);
      onShowToast('Kalimat baru berhasil disimpan.', 'success');
    }

    // Reset form
    handleCancelEdit();
  };

  const handleEditCard = (card: ConversationCard) => {
    setEditingCardId(card.id);
    setSentenceInput(card.sentence);
    setTranslationIdInput(card.translationId || '');
    setSituationInput(card.situation || '');
    setConditionInput(card.condition || '');
    setFormStatus({ message: 'Mode edit kalimat aktif.', type: 'idle' });
  };

  const handleCancelEdit = () => {
    setEditingCardId(null);
    setSentenceInput('');
    setTranslationIdInput('');
    setSituationInput('');
    setConditionInput('');
    setFormStatus({ message: '', type: 'idle' });
  };

  const handleDeleteCard = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Hapus kalimat ini dari koleksi latihan?')) return;
    const updated = cards.filter(c => c.id !== id);
    onCardsChange(updated);
    if (editingCardId === id) handleCancelEdit();
    onShowToast('Kalimat dihapus.', 'info');
  };

  // Start Review Session
  const startReviewSession = async () => {
    let queue: ConversationCard[] = [];
    if (reviewMode === 'due') {
      queue = cards.filter(isDue);
    } else if (reviewMode === 'learning') {
      queue = cards.filter(c => (c.repetition || 0) > 0);
    } else if (reviewMode === 'weekly') {
      queue = cards.filter(isWeeklyTestDue).slice(0, 15);
    } else {
      queue = [...cards];
    }

    if (queue.length === 0) {
      setReviewStatus({
        message:
          reviewMode === 'due'
            ? 'Tidak ada kalimat yang jatuh tempo saat ini. Hebat!'
            : reviewMode === 'weekly'
            ? 'Belum ada kalimat berstatus Dikuasai yang siap dites mingguan.'
            : 'Tidak ada kartu untuk mode ini.',
        type: 'idle'
      });
      return;
    }

    setReviewQueue(queue);
    setReviewIndex(0);
    setIsReviewActive(true);
    setWeeklyScore(0);
    setFeedbackResult(null);
    setHasRatedMemory(false);
    setTranslationAttempt('');
    setResponseAttempt('');
    setReviewStatus({ message: 'Isi terjemahan dan respons percakapan di bawah ini.', type: 'idle' });

    // Make sure first card has Indonesian details
    const first = queue[0];
    if (!first.translationId || !first.situation || !first.condition) {
      try {
        const details = await ensureReviewDetails(first.sentence, first.situation, first.condition);
        first.translationId = first.translationId || details.translationId;
        first.situation = first.situation || details.situation;
        first.condition = first.condition || details.condition;
        onCardsChange([...cards]);
      } catch {
        // ignore
      }
    }
  };

  // Check answers via Gemini AI
  const handleCheckAnswers = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeCard || isCheckingAnswers) return;

    const tAttempt = translationAttempt.trim();
    const rAttempt = responseAttempt.trim();
    if (!tAttempt || !rAttempt) {
      setReviewStatus({ message: 'Harap isi kedua kolom jawaban.', type: 'error' });
      return;
    }

    if (!hasApiKey) {
      onOpenApiKeyModal();
      return;
    }

    setIsCheckingAnswers(true);
    setReviewStatus({ message: 'Gemini sedang mengevaluasi terjemahan dan respons...', type: 'idle' });

    const isQuestion = /\?\s*["'”’)]*$/.test(activeCard.sentence.trim());
    const expectedResponseType = isQuestion ? 'answer' : 'question';

    try {
      const evaluation = await evaluateAnswers({
        translationInIndonesian: activeCard.translationId,
        referenceSentence: activeCard.sentence,
        situation: activeCard.situation,
        condition: activeCard.condition,
        expectedResponseType,
        translationAttempt: tAttempt,
        responseAttempt: rAttempt
      });

      setFeedbackResult(evaluation);
      setHasRatedMemory(false);

      // Save first review evaluation of the day
      if (!activeCard.firstReviewEvaluation) {
        const now = new Date();
        const firstEval: FirstReviewEvaluation = {
          reviewedAt: now.toISOString(),
          reviewDate: getTodayKey(),
          translationAttempt: tAttempt,
          translationCorrect: evaluation.translationCorrect,
          translationFeedback: evaluation.translationFeedback,
          translationCorrection: evaluation.translationCorrection,
          responseType: expectedResponseType,
          responseAttempt: rAttempt,
          responseCorrect: evaluation.responseCorrect,
          responseFeedback: evaluation.responseFeedback,
          responseCorrection: evaluation.responseCorrection
        };
        activeCard.firstReviewEvaluation = firstEval;
        onCardsChange([...cards]);
      }

      // Log activity and update streak
      logActivity('review');
      setHabitStats(getHabitStats());
      setActivityLogs(getRecentActivityLogs(14));
      onActivityLogged?.();

      const bothCorrect = evaluation.translationCorrect && evaluation.responseCorrect;
      setReviewStatus({
        message: bothCorrect
          ? 'Jawaban kamu sangat baik! Nilai daya ingatmu (1: Tidak Ingat, 2: Ingat).'
          : 'Periksa catatan koreksi dari AI di bawah, lalu nilai daya ingatmu (1: Tidak Ingat, 2: Ingat).',
        type: bothCorrect ? 'success' : 'idle'
      });
    } catch (err: unknown) {
      setReviewStatus({
        message: err instanceof Error ? err.message : 'Koreksi AI gagal. Periksa koneksi atau API Key.',
        type: 'error'
      });
    } finally {
      setIsCheckingAnswers(false);
    }
  };

  // Rate memory (Ingat vs Tidak ingat)
  const handleRateMemory = useCallback(
    (remembered: boolean) => {
      if (!activeCard) return;

      const now = new Date();
      const bothCorrect = Boolean(feedbackResult?.translationCorrect && feedbackResult?.responseCorrect);

      if (reviewMode === 'weekly') {
        const passed = remembered && bothCorrect;
        if (passed) {
          const nextInterval = (Number(activeCard.weeklyTestIntervalDays) || 7) * 2;
          activeCard.weeklyTestPasses = (Number(activeCard.weeklyTestPasses) || 0) + 1;
          activeCard.weeklyTestIntervalDays = nextInterval;
          const nextDate = new Date(now);
          nextDate.setDate(nextDate.getDate() + nextInterval);
          activeCard.nextWeeklyTestDate = nextDate.toISOString();
          setWeeklyScore(prev => prev + 1);
        } else {
          delete activeCard.weeklyTestPasses;
          delete activeCard.weeklyTestIntervalDays;
          delete activeCard.nextWeeklyTestDate;
          activeCard.repetition = 1;
          activeCard.interval = 1;
          activeCard.nextReviewDate = now.toISOString();
        }
      } else {
        updateCardRepetition(activeCard, remembered);
      }

      onCardsChange([...cards]);
      setHasRatedMemory(true);
      setReviewStatus({
        message: remembered
          ? 'Ditandai Ingat. Tekan Enter atau klik tombol untuk kartu berikutnya.'
          : 'Ditandai Tidak Ingat. Kartu akan dijadwalkan ulang lebih cepat.',
        type: remembered ? 'success' : 'idle'
      });
    },
    [activeCard, feedbackResult, reviewMode, cards, onCardsChange]
  );

  // Next card in review session
  const handleNextCard = useCallback(async () => {
    const nextIdx = reviewIndex + 1;
    if (nextIdx >= reviewQueue.length) {
      // Completed review
      setIsReviewActive(false);
      onShowToast(
        reviewMode === 'weekly'
          ? `Tes mingguan selesai! Skor: ${weeklyScore + (hasRatedMemory ? 1 : 0)}/${reviewQueue.length}.`
          : `Sesi review selesai! ${reviewQueue.length} kalimat dipelajari.`,
        'success'
      );
      return;
    }

    setReviewIndex(nextIdx);
    setFeedbackResult(null);
    setHasRatedMemory(false);
    setTranslationAttempt('');
    setResponseAttempt('');
    setReviewStatus({ message: 'Isi terjemahan dan respons percakapan.', type: 'idle' });

    const nextCard = reviewQueue[nextIdx];
    if (!nextCard.translationId || !nextCard.situation || !nextCard.condition) {
      try {
        const details = await ensureReviewDetails(nextCard.sentence, nextCard.situation, nextCard.condition);
        nextCard.translationId = nextCard.translationId || details.translationId;
        nextCard.situation = nextCard.situation || details.situation;
        nextCard.condition = nextCard.condition || details.condition;
        onCardsChange([...cards]);
      } catch {
        // ignore
      }
    }
  }, [reviewIndex, reviewQueue, reviewMode, weeklyScore, hasRatedMemory, cards, onCardsChange, onShowToast]);

  // Keyboard shortcut listener for Review session
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isReviewActive) return;

      // Ctrl + Enter to check answers
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if (!feedbackResult && !isCheckingAnswers) {
          e.preventDefault();
          handleCheckAnswers();
        }
      }

      // 1 or 2 for memory rating
      if (feedbackResult && !hasRatedMemory) {
        if (e.key === '1') {
          e.preventDefault();
          handleRateMemory(false);
        } else if (e.key === '2') {
          e.preventDefault();
          handleRateMemory(true);
        }
      } else if (hasRatedMemory && e.key === 'Enter') {
        e.preventDefault();
        handleNextCard();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isReviewActive, feedbackResult, hasRatedMemory, isCheckingAnswers, handleRateMemory, handleNextCard]);

  // Today reviewed cards
  const todaySentences = cards
    .filter(c => c.firstReviewEvaluation?.reviewDate === todayKeyStr)
    .sort((a, b) =>
      (a.firstReviewEvaluation?.reviewedAt || '').localeCompare(b.firstReviewEvaluation?.reviewedAt || '')
    );

  // Filtered cards list for the repository view
  const filteredCards = cards.filter(c => {
    const q = cardSearch.toLowerCase();
    return (
      c.sentence.toLowerCase().includes(q) ||
      (c.translationId || '').toLowerCase().includes(q) ||
      (c.situation || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Banner: Stats Grid & Habit / Streak Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Cards */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex items-center justify-between transition-colors">
          <div>
            <p className="text-[11px] font-semibold tracking-wider uppercase text-slate-400 dark:text-slate-500">Total Kalimat</p>
            <h3 className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100 mt-0.5 tabular-nums">{totalCards}</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Tersimpan dalam SRS</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        {/* Due for Review */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex items-center justify-between transition-colors">
          <div>
            <p className="text-[11px] font-semibold tracking-wider uppercase text-amber-600 dark:text-amber-400">Jatuh Tempo</p>
            <h3 className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-0.5 tabular-nums">{dueCards.length}</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Siap direview hari ini</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Learning */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex items-center justify-between transition-colors">
          <div>
            <p className="text-[11px] font-semibold tracking-wider uppercase text-blue-600 dark:text-blue-400">Sedang Dipelajari</p>
            <h3 className="text-2xl font-bold font-mono text-blue-600 dark:text-blue-400 mt-0.5 tabular-nums">{learningCount}</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Dalam siklus repetisi</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Mastered */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex items-center justify-between transition-colors">
          <div>
            <p className="text-[11px] font-semibold tracking-wider uppercase text-emerald-600 dark:text-emerald-400">Dikuasai</p>
            <h3 className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5 tabular-nums">{masteredCount}</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Interval ≥ 14 hari</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Habit, Streak & Daily Goal Strip */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-wrap items-center justify-between gap-4 transition-colors">
        {/* Streak & Goal */}
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Flame className="w-5 h-5 fill-amber-500 text-amber-500" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase">Streak Belajar</p>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {habitStats.streak > 0 ? `${habitStats.streak} Hari Beruntun` : 'Mulai Hari Ini!'}
              </h4>
            </div>
          </div>

          <div className="h-8 w-px bg-slate-200 dark:bg-slate-800" />

          {/* Daily Goal Progress */}
          <div>
            <div className="flex items-center gap-2">
              <Target className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                Target Harian: <span className="font-mono text-emerald-600 dark:text-emerald-400">{todayReviewsCount}/{habitStats.dailyGoal}</span>
              </p>
            </div>
            <div className="w-32 sm:w-44 h-2 bg-slate-100 dark:bg-slate-800 rounded-full mt-1.5 overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                style={{ width: `${dailyGoalProgress}%` }}
              />
            </div>
          </div>
        </div>

        {/* 14-day Heatmap Dots */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase mr-1 hidden sm:inline">
            14 Hari Terakhir:
          </span>
          <div className="flex items-center gap-1">
            {activityLogs.map((log, idx) => (
              <div
                key={idx}
                title={`${log.date}: ${log.reviewsCount} review`}
                className={`w-3 h-3 rounded-sm transition-all ${
                  log.reviewsCount >= 5
                    ? 'bg-emerald-600'
                    : log.reviewsCount > 0
                    ? 'bg-emerald-400 dark:bg-emerald-600'
                    : log.hasActivity
                    ? 'bg-emerald-200 dark:bg-emerald-900'
                    : 'bg-slate-100 dark:bg-slate-800'
                }`}
              />
            ))}
          </div>

          {/* Browser Notification Toggle */}
          <button
            type="button"
            onClick={handleEnableNotifications}
            className={`ml-2 p-1.5 rounded-lg border text-xs font-medium flex items-center gap-1 transition-colors ${
              notificationEnabled
                ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
            title={notificationEnabled ? 'Notifikasi aktif' : 'Aktifkan pengingat review lokal'}
          >
            <Bell className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{notificationEnabled ? 'Pengingat Aktif' : 'Aktifkan Pengingat'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Add/Edit Form & Flashcard / Review Studio */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form to Add/Edit Sentence */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-5 transition-colors">
          <form onSubmit={handleSaveSentence} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif font-bold text-slate-900 dark:text-slate-100 text-lg flex items-center gap-2">
                <span>{editingCardId ? 'Edit Kalimat Percakapan' : 'Tambah Kalimat Baru'}</span>
              </h3>
              {editingCardId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                >
                  Batal Edit
                </button>
              )}
            </div>

            {/* Sentence Input */}
            <div>
              <label htmlFor="sentenceInput" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Kalimat percakapan bahasa Inggris
              </label>
              <div className="relative">
                <input
                  id="sentenceInput"
                  type="text"
                  maxLength={500}
                  required
                  placeholder="Contoh: Could I get a glass of water, please?"
                  value={sentenceInput}
                  onChange={handleSentenceChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-900 transition-all"
                />
                {sentenceInput && (
                  <button
                    type="button"
                    onClick={() => speakConversationSentence(sentenceInput)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-emerald-600 rounded-lg transition-colors"
                    title="Dengarkan pengucapan"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* AI Generate Button */}
            <button
              type="button"
              disabled={isGenerating || !sentenceInput.trim()}
              onClick={() => triggerGenerateDetails(sentenceInput)}
              className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold border border-slate-200/80 dark:border-slate-700 transition-all disabled:opacity-50"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin text-emerald-600' : 'text-emerald-600'}`} />
              <span>{isGenerating ? 'Gemini sedang menganalisis...' : 'Generate Arti, Situasi & Kondisi (AI)'}</span>
            </button>

            {/* Indonesian Translation Input */}
            <div>
              <label htmlFor="translationIdInput" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Arti kalimat dalam bahasa Indonesia
              </label>
              <input
                id="translationIdInput"
                type="text"
                maxLength={500}
                required
                placeholder="Dibuat otomatis dari kalimat Inggris"
                value={translationIdInput}
                onChange={e => setTranslationIdInput(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-900 transition-all"
              />
            </div>

            {/* Situation Input */}
            <div>
              <label htmlFor="situationInput" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Situasi percakapan
              </label>
              <input
                id="situationInput"
                type="text"
                maxLength={300}
                required
                placeholder="Contoh: memesan minuman di kafe"
                value={situationInput}
                onChange={e => setSituationInput(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-900 transition-all"
              />
            </div>

            {/* Condition Input */}
            <div>
              <label htmlFor="conditionInput" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Kondisi atau konteks
              </label>
              <input
                id="conditionInput"
                type="text"
                maxLength={300}
                required
                placeholder="Contoh: berbicara sopan kepada pelayan"
                value={conditionInput}
                onChange={e => setConditionInput(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-900 transition-all"
              />
            </div>

            {/* Status Message */}
            {formStatus.message && (
              <p
                className={`text-xs p-2.5 rounded-xl ${
                  formStatus.type === 'error'
                    ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                    : formStatus.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                }`}
              >
                {formStatus.message}
              </p>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs font-semibold rounded-xl shadow-xs transition-all"
              >
                {editingCardId ? 'Perbarui Kalimat' : 'Simpan Kalimat'}
              </button>
            </div>
          </form>

          {/* Quick List Preview */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
              <span className="font-semibold text-slate-700 dark:text-slate-200">Daftar Tersimpan</span>
              <span className="tabular-nums font-mono">{filteredCards.length} kartu</span>
            </div>
            <div className="relative mb-2">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                placeholder="Filter kartu tersimpan..."
                value={cardSearch}
                onChange={e => setCardSearch(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
              {filteredCards.length === 0 ? (
                <p className="text-xs text-slate-400 dark:text-slate-500 py-3 text-center">Belum ada kalimat yang cocok.</p>
              ) : (
                filteredCards.map(c => (
                  <div
                    key={c.id}
                    onClick={() => handleEditCard(c)}
                    className="p-2.5 bg-slate-50/70 dark:bg-slate-800/60 hover:bg-slate-100/80 dark:hover:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-700 cursor-pointer flex items-center justify-between gap-2 group transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            speakConversationSentence(c.sentence);
                          }}
                          className="text-slate-400 hover:text-emerald-600 shrink-0"
                          title="Dengarkan pengucapan"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">{c.sentence}</p>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">{c.translationId || c.situation}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                        {getProficiency(c)}
                      </span>
                      <button
                        type="button"
                        onClick={e => handleDeleteCard(c.id, e)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Hapus kalimat"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Review Studio & Today's Study Tabs */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col transition-colors">
          {/* Top Tabs */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 mb-5">
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveTab('review')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === 'review'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Review Latihan AI
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('today')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === 'today'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Hasil Hari Ini ({todaySentences.length})
              </button>
            </div>

            {activeTab === 'review' && !isReviewActive && (
              <button
                type="button"
                onClick={startReviewSession}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all active:scale-95"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Mulai Review</span>
              </button>
            )}
          </div>

          {activeTab === 'review' ? (
            isReviewActive && activeCard ? (
              /* Active Review Card Interface */
              <div className="space-y-5 flex-1 flex flex-col justify-between">
                {/* Review Header Progress */}
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      Kartu {reviewIndex + 1} dari {reviewQueue.length}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">{getReviewScheduleLabel(activeCard)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsReviewActive(false)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
                  >
                    Akhiri Sesi
                  </button>
                </div>

                {/* Prompt & Context Box */}
                <div className="bg-slate-50/80 dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-2">
                  <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                    Terjemahkan ke Bahasa Inggris:
                  </div>
                  <h4 className="text-lg sm:text-xl font-serif font-bold text-slate-900 dark:text-slate-100 leading-snug">
                    {activeCard.translationId}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 pt-1">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Situasi:</span> {activeCard.situation} ·{' '}
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Kondisi:</span> {activeCard.condition}
                  </p>
                </div>

                {/* Dual Inputs Form */}
                <form onSubmit={handleCheckAnswers} className="space-y-4">
                  <div>
                    <label htmlFor="translationAttemptInput" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      1. Terjemahan situasi bahasa Inggris
                    </label>
                    <input
                      id="translationAttemptInput"
                      type="text"
                      maxLength={500}
                      autoComplete="off"
                      required
                      disabled={Boolean(feedbackResult)}
                      placeholder="Tulis kalimat terjemahan bahasa Inggris..."
                      value={translationAttempt}
                      onChange={e => setTranslationAttempt(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:bg-slate-100 dark:disabled:bg-slate-800/50 transition-all"
                    />
                  </div>

                  <div>
                    <label htmlFor="responseAttemptInput" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      2. {/\?\s*["'”’)]*$/.test(activeCard.sentence.trim()) ? 'Jawaban bahasa Inggris' : 'Pertanyaan bahasa Inggris yang sesuai'}
                    </label>
                    <input
                      id="responseAttemptInput"
                      type="text"
                      maxLength={500}
                      autoComplete="off"
                      required
                      disabled={Boolean(feedbackResult)}
                      placeholder="Tulis respons percakapan yang cocok..."
                      value={responseAttempt}
                      onChange={e => setResponseAttempt(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:bg-slate-100 dark:disabled:bg-slate-800/50 transition-all"
                    />
                  </div>

                  {!feedbackResult && (
                    <button
                      type="submit"
                      disabled={isCheckingAnswers || !translationAttempt.trim() || !responseAttempt.trim()}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs font-semibold rounded-xl shadow-xs transition-all disabled:opacity-50"
                    >
                      {isCheckingAnswers ? 'Gemini sedang memeriksa...' : 'Periksa Dua Jawaban (Ctrl+Enter)'}
                    </button>
                  )}
                </form>

                {/* AI Feedback Display */}
                {feedbackResult && (
                  <div className="space-y-3 pt-2">
                    {/* Translation Feedback */}
                    <div
                      className={`p-4 rounded-xl border ${
                        feedbackResult.translationCorrect
                          ? 'bg-emerald-50/60 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                          : 'bg-rose-50/60 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {feedbackResult.translationCorrect ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                        )}
                        <h5 className="font-semibold text-xs">
                          {feedbackResult.translationCorrect ? 'Terjemahan tepat!' : 'Periksa terjemahan'}
                        </h5>
                      </div>
                      <p className="text-xs opacity-90 mb-2">{feedbackResult.translationFeedback}</p>
                      <div className="flex items-center gap-2 bg-white/70 dark:bg-slate-800/70 p-2 rounded-lg border border-slate-200/50 dark:border-slate-700 text-xs">
                        <span className="font-semibold shrink-0">Saran:</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200 flex-1">
                          {feedbackResult.translationCorrection}
                        </span>
                        <button
                          type="button"
                          onClick={() => speakConversationSentence(feedbackResult.translationCorrection)}
                          className="text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-300 p-1"
                          title="Dengarkan pengucapan saran"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Response Feedback */}
                    <div
                      className={`p-4 rounded-xl border ${
                        feedbackResult.responseCorrect
                          ? 'bg-emerald-50/60 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                          : 'bg-rose-50/60 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {feedbackResult.responseCorrect ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                        )}
                        <h5 className="font-semibold text-xs">
                          {feedbackResult.responseCorrect ? 'Respons sesuai!' : 'Periksa respons'}
                        </h5>
                      </div>
                      <p className="text-xs opacity-90 mb-2">{feedbackResult.responseFeedback}</p>
                      <div className="flex items-center gap-2 bg-white/70 dark:bg-slate-800/70 p-2 rounded-lg border border-slate-200/50 dark:border-slate-700 text-xs">
                        <span className="font-semibold shrink-0">Saran:</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200 flex-1">{feedbackResult.responseCorrection}</span>
                        <button
                          type="button"
                          onClick={() => speakConversationSentence(feedbackResult.responseCorrection)}
                          className="text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-300 p-1"
                          title="Dengarkan pengucapan saran"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Spaced Repetition Rating Action */}
                    {!hasRatedMemory ? (
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                          Nilai daya ingatmu (Shortcut: 1 & 2):
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleRateMemory(false)}
                            className="px-3.5 py-1.5 bg-rose-100 hover:bg-rose-200 dark:bg-rose-950/70 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold rounded-lg transition-colors"
                          >
                            [1] Tidak Ingat
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRateMemory(true)}
                            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
                          >
                            [2] Ingat
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-end pt-2">
                        <button
                          type="button"
                          onClick={handleNextCard}
                          className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all active:scale-95"
                        >
                          <span>Kartu Berikutnya (Enter)</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* Pre-Review Setup Screen */
              <div className="space-y-6 my-auto py-8">
                <div className="text-center max-w-md mx-auto space-y-2">
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <h4 className="font-serif text-xl font-bold text-slate-800 dark:text-slate-100">Review Kalimat dengan AI</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Pilih kategori review yang ingin kamu latih. Gemini akan menilai ketepatan terjemahan dan respons percakapan secara terpisah.
                  </p>
                </div>

                {/* Filter Mode Selector */}
                <div className="max-w-md mx-auto grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setReviewMode('due')}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      reviewMode === 'due'
                        ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700'
                    }`}
                  >
                    <p className="text-xs font-bold">Jatuh Tempo</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{dueCards.length} kartu</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewMode('learning')}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      reviewMode === 'learning'
                        ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700'
                    }`}
                  >
                    <p className="text-xs font-bold">Dipelajari</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{learningCount} kartu</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewMode('weekly')}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      reviewMode === 'weekly'
                        ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700'
                    }`}
                  >
                    <p className="text-xs font-bold">Tes Mingguan</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{weeklyReady.length} siap</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewMode('all')}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      reviewMode === 'all'
                        ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700'
                    }`}
                  >
                    <p className="text-xs font-bold">Semua</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{totalCards} kartu</p>
                  </button>
                </div>

                {reviewStatus.message && (
                  <p className="text-xs text-center text-slate-500 dark:text-slate-400 max-w-md mx-auto">{reviewStatus.message}</p>
                )}

                <div className="flex justify-center pt-2">
                  <button
                    type="button"
                    onClick={startReviewSession}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Mulai Latihan Sekarang</span>
                  </button>
                </div>
              </div>
            )
          ) : (
            /* Tab: Kalimat Baru Hari Ini (Today's Study) */
            <div className="space-y-4 flex-1 overflow-y-auto max-h-[600px] pr-1">
              <div className="flex items-center justify-between pb-2">
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">Evaluasi Hari Ini</h4>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                  {todaySentences.length} kalimat
                </span>
              </div>

              {todaySentences.length === 0 ? (
                <div className="text-center py-12 px-4 bg-slate-50/50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                  <Calendar className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">Belum ada evaluasi hari ini.</p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                    Evaluasi dari review pertama kamu hari ini akan otomatis tersimpan di sini.
                  </p>
                </div>
              ) : (
                todaySentences.map(c => {
                  const evalData = c.firstReviewEvaluation;
                  if (!evalData) return null;

                  return (
                    <article
                      key={c.id}
                      className="p-4 bg-slate-50/60 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => speakConversationSentence(c.sentence)}
                              className="text-slate-400 hover:text-emerald-600 shrink-0"
                              title="Dengarkan kalimat"
                            >
                              <Volume2 className="w-4 h-4" />
                            </button>
                            <h5 className="font-bold text-slate-900 dark:text-slate-100 text-sm">{c.sentence}</h5>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                            {c.translationId} · <span className="text-slate-500 dark:text-slate-400">Situasi:</span> {c.situation} ·{' '}
                            <span className="text-slate-500 dark:text-slate-400">Kondisi:</span> {c.condition}
                          </p>
                        </div>
                        <span className="text-[10px] font-semibold px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-full shrink-0">
                          {getReviewScheduleLabel(c)}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                        {/* Translation Eval */}
                        <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200/80 dark:border-slate-700 space-y-1.5">
                          <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-100">
                            {evalData.translationCorrect ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                              <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                            )}
                            <span>
                              Terjemahan {evalData.translationCorrect ? 'Tepat' : 'Perlu Dipelajari'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">Jawaban: {evalData.translationAttempt}</p>
                          <p className="text-[11px] text-slate-600 dark:text-slate-300">{evalData.translationFeedback}</p>
                          <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/50 p-1.5 rounded">
                            <span className="font-semibold">Saran:</span>
                            <span className="flex-1">{evalData.translationCorrection}</span>
                            <button
                              type="button"
                              onClick={() => speakConversationSentence(evalData.translationCorrection)}
                              className="text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-300"
                            >
                              <Volume2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {/* Response Eval */}
                        <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200/80 dark:border-slate-700 space-y-1.5">
                          <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-100">
                            {evalData.responseCorrect ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                              <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                            )}
                            <span>
                              Respons {evalData.responseCorrect ? 'Sesuai' : 'Perlu Dipelajari'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">Jawaban: {evalData.responseAttempt}</p>
                          <p className="text-[11px] text-slate-600 dark:text-slate-300">{evalData.responseFeedback}</p>
                          <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/50 p-1.5 rounded">
                            <span className="font-semibold">Saran:</span>
                            <span className="flex-1">{evalData.responseCorrection}</span>
                            <button
                              type="button"
                              onClick={() => speakConversationSentence(evalData.responseCorrection)}
                              className="text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-300"
                            >
                              <Volume2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
