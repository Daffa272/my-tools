import React, { useState } from 'react';
import { X, Search, MessageSquareQuote, Check } from 'lucide-react';
import { ConversationCard } from '../types';

interface InsertConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  cards: ConversationCard[];
  onInsert: (card: ConversationCard, format: 'blockquote' | 'table') => void;
}

export const InsertConversationModal: React.FC<InsertConversationModalProps> = ({
  isOpen,
  onClose,
  cards,
  onInsert
}) => {
  const [search, setSearch] = useState('');
  const [insertFormat, setInsertFormat] = useState<'blockquote' | 'table'>('blockquote');

  if (!isOpen) return null;

  const filtered = cards.filter(c =>
    c.sentence.toLowerCase().includes(search.toLowerCase()) ||
    (c.translationId || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.situation || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <MessageSquareQuote className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">Sisipkan Kalimat ke Catatan</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Pilih kalimat percakapan untuk dimasukkan ke dokumen</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search and format options */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              placeholder="Cari kalimat Inggris atau terjemahan..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">Format penyisipan:</span>
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg">
              <button
                type="button"
                onClick={() => setInsertFormat('blockquote')}
                className={`px-2.5 py-1 rounded-md font-medium text-xs transition-colors ${
                  insertFormat === 'blockquote'
                    ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-400 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Kutipan (Blockquote)
              </button>
              <button
                type="button"
                onClick={() => setInsertFormat('table')}
                className={`px-2.5 py-1 rounded-md font-medium text-xs transition-colors ${
                  insertFormat === 'table'
                    ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-400 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Tabel Referensi
              </button>
            </div>
          </div>
        </div>

        {/* List of cards */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filtered.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-8">Tidak ada kalimat yang cocok.</p>
          ) : (
            filtered.map(card => (
              <div
                key={card.id}
                onClick={() => {
                  onInsert(card, insertFormat);
                  onClose();
                }}
                className="p-3 bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50/70 dark:hover:bg-emerald-950/40 rounded-xl border border-slate-200/80 dark:border-slate-700/80 cursor-pointer transition-all group"
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-semibold text-xs text-slate-900 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400">
                    {card.sentence}
                  </h4>
                  <span className="text-[10px] font-semibold px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300 rounded-full shrink-0">
                    Sisipkan
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                  {card.translationId}
                </p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                  Situasi: {card.situation} · Kondisi: {card.condition}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
