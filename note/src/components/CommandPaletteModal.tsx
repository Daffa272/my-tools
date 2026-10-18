import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  FileText,
  MessageSquareQuote,
  LayoutGrid,
  Sun,
  Moon,
  Key,
  Keyboard,
  Award,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { Note, ConversationCard } from '../types';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  notes: Note[];
  cards: ConversationCard[];
  onSelectNote: (id: string) => void;
  onNavigateTab: (tab: 'notes' | 'conversations' | 'avatar' | 'chinese' | 'split') => void;
  onToggleDarkMode: () => void;
  onOpenApiKeyModal: () => void;
  onOpenMilestones: () => void;
  isDarkMode: boolean;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  notes,
  cards,
  onSelectNote,
  onNavigateTab,
  onToggleDarkMode,
  onOpenApiKeyModal,
  onOpenMilestones,
  isDarkMode
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();

  // Filter notes
  const matchedNotes = notes
    .filter(n => n.title.toLowerCase().includes(q) || (n.content || '').toLowerCase().includes(q))
    .slice(0, 4);

  // Filter cards
  const matchedCards = cards
    .filter(c => c.sentence.toLowerCase().includes(q) || (c.translationId || '').toLowerCase().includes(q))
    .slice(0, 4);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[75vh]">
        {/* Search Header */}
        <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-slate-400 shrink-0 ml-1.5" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Cari catatan, kalimat, atau jalankan perintah... (Esc untuk tutup)"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full bg-transparent border-0 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
          />
          <kbd className="px-2 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 rounded">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="p-3 overflow-y-auto space-y-3">
          {/* Quick Actions Navigation */}
          <div>
            <span className="text-[10px] font-semibold tracking-wider uppercase text-slate-400 dark:text-slate-500 px-2 block mb-1">
              Navigasi Cepat
            </span>
            <div className="space-y-0.5">
              <button
                type="button"
                onClick={() => {
                  onNavigateTab('notes');
                  onClose();
                }}
                className="w-full flex items-center justify-between p-2 rounded-xl text-xs hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span>Buka Workspace Catatan</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => {
                  onNavigateTab('conversations');
                  onClose();
                }}
                className="w-full flex items-center justify-between p-2 rounded-xl text-xs hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <MessageSquareQuote className="w-4 h-4 text-emerald-600" />
                  <span>Buka Flashcard Spaced Repetition</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => {
                  onNavigateTab('avatar');
                  onClose();
                }}
                className="w-full flex items-center justify-between p-2 rounded-xl text-xs hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base leading-none">👤</span>
                  <span>Ngobrol English AI (Emma, David, Maya)</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => {
                  onNavigateTab('chinese');
                  onClose();
                }}
                className="w-full flex items-center justify-between p-2 rounded-xl text-xs hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-rose-600 dark:text-rose-400 font-bold text-sm">中</span>
                  <span>Ngobrol Mandarin AI (林老师 & 李伟)</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => {
                  onNavigateTab('chinese');
                  try {
                    localStorage.setItem('chinese_virtual_keyboard_open', 'true');
                  } catch {
                    // ignore
                  }
                  onClose();
                }}
                className="w-full flex items-center justify-between p-2 rounded-xl text-xs hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Keyboard className="w-4 h-4 text-rose-600" />
                  <span>Buka Keyboard Khusus Mandarin (IME Pinyin & Hanzi)</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => {
                  onOpenMilestones();
                  onClose();
                }}
                className="w-full flex items-center justify-between p-2 rounded-xl text-xs hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Award className="w-4 h-4 text-amber-500" />
                  <span>Lihat Lencana & Prestasi Belajar</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Quick Commands */}
          <div>
            <span className="text-[10px] font-semibold tracking-wider uppercase text-slate-400 dark:text-slate-500 px-2 block mb-1">
              Perintah Cepat
            </span>
            <div className="space-y-0.5">
              <button
                type="button"
                onClick={() => {
                  onToggleDarkMode();
                  onClose();
                }}
                className="w-full flex items-center justify-between p-2 rounded-xl text-xs hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  {isDarkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-slate-600" />}
                  <span>Beralih ke {isDarkMode ? 'Mode Terang' : 'Mode Gelap'}</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  onOpenApiKeyModal();
                  onClose();
                }}
                className="w-full flex items-center justify-between p-2 rounded-xl text-xs hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Key className="w-4 h-4 text-slate-500" />
                  <span>Pengaturan Gemini API Key</span>
                </div>
              </button>
            </div>
          </div>

          {/* Matched Notes */}
          {matchedNotes.length > 0 && (
            <div>
              <span className="text-[10px] font-semibold tracking-wider uppercase text-slate-400 dark:text-slate-500 px-2 block mb-1">
                Catatan ({matchedNotes.length})
              </span>
              <div className="space-y-1">
                {matchedNotes.map(n => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => {
                      onSelectNote(n.id);
                      onNavigateTab('notes');
                      onClose();
                    }}
                    className="w-full text-left p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-xs transition-colors"
                  >
                    <div className="font-semibold text-slate-900 dark:text-slate-100">
                      {n.title.trim() || 'Catatan tanpa judul'}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate mt-0.5">
                      {n.date} · {n.category || 'Umum'}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Matched Cards */}
          {matchedCards.length > 0 && (
            <div>
              <span className="text-[10px] font-semibold tracking-wider uppercase text-slate-400 dark:text-slate-500 px-2 block mb-1">
                Kalimat Percakapan ({matchedCards.length})
              </span>
              <div className="space-y-1">
                {matchedCards.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      onNavigateTab('conversations');
                      onClose();
                    }}
                    className="w-full text-left p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-xs transition-colors"
                  >
                    <div className="font-semibold text-slate-900 dark:text-slate-100">{c.sentence}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {c.translationId} · Level: {c.cefrLevel || 'B1'}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
