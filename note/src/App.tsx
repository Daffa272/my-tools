import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { NotesModule } from './components/NotesModule';
import { ConversationModule } from './components/ConversationModule';
import { AvatarChatModule } from './components/AvatarChatModule';
import { ChineseAvatarChatModule } from './components/ChineseAvatarChatModule';
import { ApiKeyModal } from './components/ApiKeyModal';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { CommandPaletteModal } from './components/CommandPaletteModal';
import { MilestonesModal } from './components/MilestonesModal';
import { Note, ConversationCard } from './types';
import { BACKUP_KEYS, readStoredJson } from './utils/backup';
import { getStoredApiKey } from './utils/gemini';
import { getTodayKey, getHabitStats, computeUserBadges } from './utils/srs';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

const DEFAULT_SAMPLE_NOTE: Note = {
  id: 'sample-welcome-note',
  date: getTodayKey(),
  title: 'Selamat Datang di Catatan & Latihan',
  content: `<h2>Ruang Produktivitas Pribadi</h2><p>Catatan ini dirancang untuk membantumu mencatat ide, rencana harian, serta melatih kalimat percakapan bahasa Inggris dengan bantuan koreksi cerdas kecerdasan buatan.</p><blockquote>Gunakan bilah alat di atas untuk format tebal, miring, daftar, kutipan, dan tabel terstruktur.</blockquote><table><thead><tr><th>Fitur</th><th>Keterangan</th></tr></thead><tbody><tr><td>Editor Terstruktur</td><td>Otomatis tersimpan dengan arsip tanggal</td></tr><tr><td>Conversation AI</td><td>Latihan terjemahan dan respons percakapan</td></tr><tr><td>Spaced Repetition</td><td>Penjadwalan review berbasis algoritma SM-2</td></tr></tbody></table><p>Setiap perubahan akan tersimpan secara otomatis di perambanmu.</p>`,
  createdAt: Date.now(),
  updatedAt: Date.now()
};

const DEFAULT_SAMPLE_CARD: ConversationCard = {
  id: 'sample-welcome-card',
  sentence: 'Could I get a glass of water, please?',
  translationId: 'Bolehkah saya minta segelas air?',
  situation: 'memesan minuman di kafe atau restoran',
  condition: 'berbicara sopan kepada pelayan',
  repetition: 0,
  interval: 0,
  easiness: 2.5,
  nextReviewDate: new Date().toISOString()
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'notes' | 'conversations' | 'avatar' | 'chinese' | 'split'>('notes');
  const [notes, setNotes] = useState<Note[]>(() => {
    const stored = readStoredJson<Note[]>(BACKUP_KEYS.notes, []);
    return stored.length > 0 ? stored : [DEFAULT_SAMPLE_NOTE];
  });

  const [cards, setCards] = useState<ConversationCard[]>(() => {
    // Check main key
    const current = localStorage.getItem(BACKUP_KEYS.conversations);
    if (current !== null) {
      try {
        const parsed = JSON.parse(current);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {
        // ignore
      }
    }
    // Check legacy key
    const legacy = localStorage.getItem(BACKUP_KEYS.legacyConversations);
    if (legacy !== null) {
      try {
        const parsedLegacy = JSON.parse(legacy);
        if (Array.isArray(parsedLegacy) && parsedLegacy.length > 0) {
          const migrated = parsedLegacy.map(c => ({
            ...c,
            sentence: c.sentence || c.word,
            translationId: c.translationId || c.indonesianTranslation || '',
            situation: c.situation || c.context || c.meaning || '',
            condition: c.condition || ''
          }));
          localStorage.setItem(BACKUP_KEYS.conversations, JSON.stringify(migrated));
          return migrated;
        }
      } catch {
        // ignore
      }
    }
    return [DEFAULT_SAMPLE_CARD];
  });

  const [hasApiKey, setHasApiKey] = useState<boolean>(() => Boolean(getStoredApiKey()));
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isMilestonesOpen, setIsMilestonesOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Dark Mode State
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('theme_mode');
    if (saved) return saved === 'dark';
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [streakCount, setStreakCount] = useState<number>(() => getHabitStats().streak);

  // Sync Dark Mode class to <html>
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme_mode', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme_mode', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      // Command Palette (Ctrl+K or Cmd+K)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
        return;
      }

      // If user is currently typing in an input or contentEditable, ignore single character shortcuts
      const activeEl = document.activeElement;
      const isInput = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || (activeEl as HTMLElement).isContentEditable);

      if (e.key === '?' && !isInput && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setIsShortcutsModalOpen(true);
      }

      if (e.key === 'Escape') {
        setIsShortcutsModalOpen(false);
        setIsApiKeyModalOpen(false);
        setIsCommandPaletteOpen(false);
        setIsMilestonesOpen(false);
      }
    };

    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, []);

  // Sync notes to localStorage
  const handleNotesChange = (updatedNotes: Note[]) => {
    setNotes(updatedNotes);
    localStorage.setItem(BACKUP_KEYS.notes, JSON.stringify(updatedNotes));
  };

  // Sync cards to localStorage
  const handleCardsChange = (updatedCards: ConversationCard[]) => {
    setCards(updatedCards);
    localStorage.setItem(BACKUP_KEYS.conversations, JSON.stringify(updatedCards));
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleDataImported = () => {
    const reloadedNotes = readStoredJson<Note[]>(BACKUP_KEYS.notes, []);
    const reloadedCards = readStoredJson<ConversationCard[]>(BACKUP_KEYS.conversations, []);
    setNotes(reloadedNotes);
    setCards(reloadedCards);
    setStreakCount(getHabitStats().streak);
  };

  const handleKeyUpdated = () => {
    setHasApiKey(Boolean(getStoredApiKey()));
    showToast('Pengaturan API Key diperbarui.', 'success');
  };

  const handleInsertAvatarSentenceToNotes = (sentence: string, translation: string) => {
    if (notes.length === 0) return;
    const targetNote = notes[0];
    const newBlockquote = `<blockquote><strong>"${sentence}"</strong><br><em>${translation}</em></blockquote><p><br></p>`;
    const updated = notes.map((n, idx) => {
      if (idx !== 0) return n;
      return {
        ...n,
        content: (n.content || '') + newBlockquote,
        updatedAt: Date.now()
      };
    });
    handleNotesChange(updated);
  };

  const refreshStreak = () => {
    setStreakCount(getHabitStats().streak);
  };

  const badges = computeUserBadges(notes, cards);

  return (
    <div className="min-h-screen bg-slate-100/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        hasApiKey={hasApiKey}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
        onDataImported={handleDataImported}
        onShowToast={showToast}
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleDarkMode}
        onOpenShortcutsModal={() => setIsShortcutsModalOpen(true)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenMilestones={() => setIsMilestonesOpen(true)}
        streakCount={streakCount}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'notes' && (
          <NotesModule
            notes={notes}
            onNotesChange={handleNotesChange}
            onShowToast={showToast}
            conversationCards={cards}
          />
        )}

        {activeTab === 'conversations' && (
          <ConversationModule
            cards={cards}
            onCardsChange={handleCardsChange}
            onShowToast={showToast}
            onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
            hasApiKey={hasApiKey}
            onActivityLogged={refreshStreak}
          />
        )}

        {activeTab === 'avatar' && (
          <AvatarChatModule
            hasApiKey={hasApiKey}
            onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
            onShowToast={showToast}
            onSaveToCards={card => handleCardsChange([card, ...cards])}
            onInsertToNotes={handleInsertAvatarSentenceToNotes}
            onActivityLogged={refreshStreak}
          />
        )}

        {activeTab === 'chinese' && (
          <ChineseAvatarChatModule
            hasApiKey={hasApiKey}
            onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
            onShowToast={showToast}
            onSaveToCards={card => handleCardsChange([card, ...cards])}
            onInsertToNotes={handleInsertAvatarSentenceToNotes}
            onActivityLogged={refreshStreak}
          />
        )}

        {activeTab === 'split' && (
          <div className="space-y-8">
            <NotesModule
              notes={notes}
              onNotesChange={handleNotesChange}
              onShowToast={showToast}
              conversationCards={cards}
            />
            <div className="pt-2">
              <ConversationModule
                cards={cards}
                onCardsChange={handleCardsChange}
                onShowToast={showToast}
                onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
                hasApiKey={hasApiKey}
                onActivityLogged={refreshStreak}
              />
            </div>
          </div>
        )}
      </main>

      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        onKeyUpdated={handleKeyUpdated}
      />

      <KeyboardShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
      />

      <CommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        notes={notes}
        cards={cards}
        onSelectNote={() => {
          setActiveTab('notes');
        }}
        onNavigateTab={tab => setActiveTab(tab)}
        onToggleDarkMode={toggleDarkMode}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
        onOpenMilestones={() => setIsMilestonesOpen(true)}
        isDarkMode={isDarkMode}
      />

      <MilestonesModal
        isOpen={isMilestonesOpen}
        onClose={() => setIsMilestonesOpen(false)}
        badges={badges}
      />

      {/* Floating Toast Notifications */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-2.5 p-3.5 rounded-xl shadow-lg border text-xs font-medium animate-in slide-in-from-bottom-3 duration-200 ${
              toast.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/90 text-emerald-900 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800'
                : toast.type === 'error'
                ? 'bg-rose-50 dark:bg-rose-950/90 text-rose-900 dark:text-rose-200 border-rose-200 dark:border-rose-800'
                : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            ) : toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            ) : (
              <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            )}
            <p className="flex-1 leading-snug">{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
