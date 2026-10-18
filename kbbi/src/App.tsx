import React, { useState, useEffect, useCallback } from 'react';
import { KBBICard, ReviewMode, ToastMessage, QuizMode } from './types';
import { loadCards, saveCards, exportKBBIData, parseImportFile, SAMPLE_CARDS } from './utils/storage';
import { isDue, getProficiency } from './utils/sm2';
import { loadStreakData, recordReviewActivity, getCurrentMasteryRank } from './utils/streak';
import { Navbar } from './components/Navbar';
import { StatsOverview } from './components/StatsOverview';
import { WordForm } from './components/WordForm';
import { WordList } from './components/WordList';
import { ReviewModal } from './components/ReviewModal';
import { QuizModal } from './components/QuizModal';
import { DailyPuzzleModal } from './components/DailyPuzzleModal';
import { PomodoroWidget } from './components/PomodoroWidget';
import { ToastContainer } from './components/Toast';
import { BookMarked } from 'lucide-react';

export default function App() {
  const [cards, setCards] = useState<KBBICard[]>(() => loadCards());
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem('gemini_api_key') || '');
  const [editingCard, setEditingCard] = useState<KBBICard | null>(null);
  
  // Gamification state
  const [streakData, setStreakData] = useState(() => loadStreakData());

  // Review session state
  const [reviewQueue, setReviewQueue] = useState<KBBICard[] | null>(null);
  const [reviewModeTitle, setReviewModeTitle] = useState<string>('Review Flashcard');

  // Quiz Mode state (Speed / Fill-in-the-blank)
  const [quizMode, setQuizMode] = useState<QuizMode | null>(null);

  // Filter state
  const [filterMode, setFilterMode] = useState<'all' | 'due' | 'learning' | 'mastered'>('all');

  // Pomodoro timer state
  const [showPomodoro, setShowPomodoro] = useState(false);
  const [isPomodoroActive, setIsPomodoroActive] = useState(false);
  const [pomodoroTimeLeft, setPomodoroTimeLeft] = useState('25:00');

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Persist cards whenever they change
  useEffect(() => {
    saveCards(cards);
  }, [cards]);

  const handleApiKeyChange = (newKey: string) => {
    setApiKey(newKey);
    localStorage.setItem('gemini_api_key', newKey);
    addToast(newKey ? 'Gemini API Key tersimpan.' : 'Gemini API Key dihapus.', 'info');
  };

  // Add / Edit Card
  const handleSaveCard = (cardData: Omit<KBBICard, 'repetition' | 'easiness' | 'interval' | 'nextReviewDate'>) => {
    const wordKey = cardData.word.toLowerCase();
    
    // Check if updating
    if (editingCard) {
      setCards((prev) =>
        prev.map((c) =>
          c.word.toLowerCase() === editingCard.word.toLowerCase()
            ? { ...c, ...cardData }
            : c
        )
      );
      setEditingCard(null);
      addToast(`Kosa kata "${cardData.word}" berhasil diperbarui.`);
      return;
    }

    // Check duplicate
    const exists = cards.some((c) => c.word.toLowerCase() === wordKey);
    if (exists) {
      addToast(`Kata "${cardData.word}" sudah ada dalam koleksi Anda.`, 'error');
      return;
    }

    // Add new card
    const newCard: KBBICard = {
      ...cardData,
      repetition: 0,
      easiness: 2.5,
      interval: 0,
      nextReviewDate: new Date().toISOString()
    };

    setCards((prev) => [newCard, ...prev]);
    addToast(`Kartu "${cardData.word}" berhasil ditambahkan.`);
  };

  const handleCancelEdit = () => {
    setEditingCard(null);
  };

  const handleDeleteCard = (word: string) => {
    if (editingCard && editingCard.word.toLowerCase() === word.toLowerCase()) {
      setEditingCard(null);
    }
    setCards((prev) => prev.filter((c) => c.word !== word));
    addToast(`Kata "${word}" telah dihapus dari koleksi.`, 'info');
  };

  const handleSeedCards = () => {
    let addedCount = 0;
    setCards((prev) => {
      const currentMap = new Set(prev.map((c) => c.word.toLowerCase()));
      const toAdd = SAMPLE_CARDS.filter((s) => !currentMap.has(s.word.toLowerCase()));
      addedCount = toAdd.length;
      return [...toAdd, ...prev];
    });

    if (addedCount > 0) {
      addToast(`${addedCount} kartu contoh kosa kata berhasil dimuat.`);
    } else {
      addToast('Semua contoh kartu sudah ada dalam koleksi.', 'info');
    }
  };

  const handleAddMultiple = (newItems: Array<Partial<KBBICard>>) => {
    let added = 0;
    setCards((prev) => {
      const currentMap = new Set(prev.map((c) => c.word.toLowerCase()));
      const validNew: KBBICard[] = [];

      for (const item of newItems) {
        if (!item.word || !item.meaning || !item.example) continue;
        if (currentMap.has(item.word.toLowerCase())) continue;

        validNew.push({
          word: item.word,
          meaning: item.meaning,
          example: item.example,
          note: item.note,
          synonyms: item.synonyms || [],
          antonyms: item.antonyms || [],
          category: item.category || 'Umum & Sehari-hari',
          syllables: item.syllables,
          repetition: 0,
          easiness: 2.5,
          interval: 0,
          nextReviewDate: new Date().toISOString()
        });
        currentMap.add(item.word.toLowerCase());
        added++;
      }

      return [...validNew, ...prev];
    });

    if (added > 0) {
      addToast(`${added} kosa kata baru berhasil ditambahkan oleh AI.`);
    } else {
      addToast('Tidak ada kata baru yang ditambahkan (mungkin duplikat).', 'info');
    }
  };

  const handleExport = () => {
    exportKBBIData(cards);
    addToast('Cadangan data KBBI berhasil diekspor.');
  };

  const handleImport = async (file: File) => {
    try {
      const imported = await parseImportFile(file);
      setCards(imported);
      addToast(`Berhasil mengimpor ${imported.length} kosa kata KBBI.`);
    } catch (err: any) {
      addToast(err.message || 'Gagal mengimpor file JSON.', 'error');
    }
  };

  // Start Review Session
  const handleStartReview = (mode: ReviewMode) => {
    let queue: KBBICard[] = [];
    let title = 'Review Jatuh Tempo';

    if (mode === 'due') {
      queue = cards.filter(isDue);
      title = 'Review Jatuh Tempo';
      if (queue.length === 0) {
        addToast('Hebat! Tidak ada kartu yang jatuh tempo saat ini.', 'info');
        return;
      }
    } else if (mode === 'learning') {
      queue = cards.filter((c) => getProficiency(c) === 'Sedang Dipelajari');
      title = 'Review Sedang Dipelajari';
      if (queue.length === 0) {
        addToast('Belum ada kartu dengan status Sedang Dipelajari.', 'info');
        return;
      }
    } else {
      queue = [...cards];
      title = 'Review Semua Kartu';
      if (queue.length === 0) {
        addToast('Koleksi Anda masih kosong. Tambahkan kosa kata terlebih dahulu.', 'error');
        return;
      }
    }

    // Shuffle queue
    const shuffled = [...queue].sort(() => Math.random() - 0.5);
    setReviewQueue(shuffled);
    setReviewModeTitle(title);
  };

  const handleReviewSingle = (card: KBBICard) => {
    setReviewQueue([card]);
    setReviewModeTitle(`Review: ${card.word}`);
  };

  const handleCardRated = (card: KBBICard, updatedFields: Partial<KBBICard>) => {
    setCards((prev) =>
      prev.map((c) => (c.word === card.word ? { ...c, ...updatedFields } : c))
    );
    // Record activity for streak and daily target
    const updatedStreak = recordReviewActivity();
    setStreakData(updatedStreak);
  };

  const handlePomodoroState = useCallback((active: boolean, timeStr: string) => {
    setIsPomodoroActive(active);
    setPomodoroTimeLeft(timeStr);
  }, []);

  const masteredCount = cards.filter((c) => getProficiency(c) === 'Dikuasai').length;
  const { currentRank } = getCurrentMasteryRank(masteredCount);

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-900 flex flex-col selection:bg-emerald-100 selection:text-emerald-950">
      {/* Top Navigation without external menus */}
      <Navbar
        apiKey={apiKey}
        onApiKeyChange={handleApiKeyChange}
        onOpenPomodoro={() => setShowPomodoro((v) => !v)}
        isPomodoroActive={isPomodoroActive}
        pomodoroTimeLeft={pomodoroTimeLeft}
        streakData={streakData}
        masteredCount={masteredCount}
        currentRank={currentRank}
        onStartQuiz={(mode) => setQuizMode(mode)}
      />

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex-1 space-y-6">
        {/* Statistics and Action Overview */}
        <StatsOverview
          cards={cards}
          streakData={streakData}
          onStartReview={handleStartReview}
          onFilterChange={setFilterMode}
          activeFilter={filterMode}
          onStartQuiz={(mode) => setQuizMode(mode)}
        />

        {/* Two-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Word Collection & Search */}
          <div className="lg:col-span-7 xl:col-span-8 order-2 lg:order-1">
            <WordList
              cards={cards}
              onEdit={(card) => {
                setEditingCard(card);
                window.scrollTo({ top: 120, behavior: 'smooth' });
              }}
              onDelete={handleDeleteCard}
              onExport={handleExport}
              onImport={handleImport}
              onReviewSingle={handleReviewSingle}
              filterMode={filterMode}
              onFilterChange={setFilterMode}
            />
          </div>

          {/* Right Column: Sticky Word Form */}
          <div className="lg:col-span-5 xl:col-span-4 order-1 lg:order-2 lg:sticky lg:top-24">
            <WordForm
              editingCard={editingCard}
              onSave={handleSaveCard}
              onCancelEdit={handleCancelEdit}
              onAddMultiple={handleAddMultiple}
              onSeedCards={handleSeedCards}
              apiKey={apiKey}
              onShowKeyModal={() => {
                const keyBtn = document.querySelector('button[title*="Gemini API Key"]') as HTMLButtonElement | null;
                keyBtn?.click();
              }}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-stone-200/80 bg-white py-6 text-center text-xs text-stone-500">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BookMarked className="h-4 w-4 text-emerald-800" />
            <span className="font-serif font-bold text-stone-800">
              Kosa Kata KBBI
            </span>
            <span>— Repetisi Spasi & Leksikon Indonesia</span>
          </div>
          <p className="text-[11px] text-stone-400">
            Definisi mengacu pada standar resmi Kamus Besar Bahasa Indonesia (KBBI). Algoritma repetisi spasi SM-2.
          </p>
        </div>
      </footer>

      {/* Spaced Repetition Review Modal */}
      {reviewQueue && (
        <ReviewModal
          queue={reviewQueue}
          modeTitle={reviewModeTitle}
          onClose={() => setReviewQueue(null)}
          onCardRated={handleCardRated}
          allCards={cards}
        />
      )}

      {/* Speed Challenge / Fill-in-the-blank Quiz Modal */}
      {quizMode === 'puzzle' ? (
        <DailyPuzzleModal
          cards={cards}
          onClose={() => setQuizMode(null)}
          onPuzzleSolved={() => {
            const updated = recordReviewActivity();
            setStreakData(updated);
            addToast('Teka-teki kata diselesaikan! Target & streak bertambah.');
          }}
        />
      ) : quizMode ? (
        <QuizModal
          mode={quizMode}
          cards={cards}
          onClose={() => setQuizMode(null)}
          onActivityDone={() => {
            const updated = recordReviewActivity();
            setStreakData(updated);
          }}
        />
      ) : null}

      {/* Pomodoro Timer Widget */}
      <PomodoroWidget
        isOpen={showPomodoro}
        onClose={() => setShowPomodoro(false)}
        onStateUpdate={handlePomodoroState}
      />

      {/* Toasts */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
