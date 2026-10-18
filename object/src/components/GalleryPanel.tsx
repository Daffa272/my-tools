import React, { useState, useEffect } from 'react';
import {
  Search,
  Eye,
  EyeOff,
  Volume2,
  Trash2,
  Maximize2,
  Layers,
  Sparkles,
  Tag,
  Plus
} from 'lucide-react';
import { ObjectCard, Category } from '../types';
import { speakEnglish } from '../services/speech';
import { toIndonesianPhonetic } from '../services/gemini';

interface GalleryPanelProps {
  cards: ObjectCard[];
  categories: Category[];
  activeCategory: string;
  onSelectCategory: (cat: string) => void;
  onDeleteCard: (id: string, name: string) => Promise<void>;
  onOpenCardViewer: (card: ObjectCard) => void;
  onOpenUpload: () => void;
  hideEnglish: boolean;
  onToggleHideEnglish: () => void;
}

export const GalleryPanel: React.FC<GalleryPanelProps> = ({
  cards,
  categories,
  activeCategory,
  onSelectCategory,
  onDeleteCard,
  onOpenCardViewer,
  onOpenUpload,
  hideEnglish,
  onToggleHideEnglish
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [cardToDelete, setCardToDelete] = useState<ObjectCard | null>(null);

  // Filter cards by category and search query
  const filteredCards = cards.filter(card => {
    const matchesCategory = !activeCategory || card.category === activeCategory;
    if (!matchesCategory) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const eng = (card.english || '').toLowerCase();
    const indo = (card.indonesian || '').toLowerCase();
    const cat = (card.category || '').toLowerCase();
    const extraWords = (card.words || [])
      .map(w => `${w.english} ${w.indonesian || ''}`)
      .join(' ')
      .toLowerCase();

    return eng.includes(q) || indo.includes(q) || cat.includes(q) || extraWords.includes(q);
  });

  const handleSpeak = (e: React.MouseEvent, card: ObjectCard) => {
    e.stopPropagation();
    if (hideEnglish) return;
    setSpeakingId(card.id);
    speakEnglish(card.english, isSpeaking => {
      if (!isSpeaking) setSpeakingId(null);
    });
  };

  const handleDelete = (e: React.MouseEvent, card: ObjectCard) => {
    e.stopPropagation();
    setCardToDelete(card);
  };

  const handleConfirmDelete = async () => {
    if (!cardToDelete) return;
    const target = cardToDelete;
    setCardToDelete(null);
    await onDeleteCard(target.id, target.english);
  };

  // Pre-calculate category counts
  const categoryCounts = new Map<string, number>();
  cards.forEach(c => {
    categoryCounts.set(c.category, (categoryCounts.get(c.category) || 0) + 1);
  });

  return (
    <div className="flex flex-col gap-5">
      {/* Top Controls: Search & Learn Mode Toggle */}
      <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200/90 dark:border-stone-800 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between transition-colors">
        {/* Search */}
        <div className="relative w-full sm:flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
          <input
            type="search"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Cari kata benda, arti, atau kosakata..."
            className="w-full text-sm pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/15 outline-none bg-stone-50/50 dark:bg-stone-800/80 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-xs text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 p-1"
            >
              Hapus
            </button>
          )}
        </div>

        {/* Learn Mode: Hide English toggle */}
        <button
          type="button"
          onClick={onToggleHideEnglish}
          aria-pressed={hideEnglish}
          className={`w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all border shrink-0 ${
            hideEnglish
              ? 'bg-amber-500/15 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 border-amber-300 dark:border-amber-800 hover:bg-amber-500/25'
              : 'bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 border-stone-200 dark:border-stone-700'
          }`}
          title={hideEnglish ? 'Buka tutupan nama bahasa Inggris' : 'Tutup nama Inggris untuk uji hafalan'}
        >
          {hideEnglish ? (
            <>
              <Eye className="w-4 h-4 text-amber-700 dark:text-amber-400" />
              <span>Tampilkan English</span>
            </>
          ) : (
            <>
              <EyeOff className="w-4 h-4 text-stone-500 dark:text-stone-400" />
              <span>Sembunyikan English</span>
            </>
          )}
        </button>
      </div>

      {/* Category Filter Chips / Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => onSelectCategory('')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 border ${
            activeCategory === ''
              ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 border-stone-900 dark:border-stone-100 shadow-sm'
              : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800'
          }`}
        >
          <span>Semua Benda</span>
          <span className="opacity-75 font-mono text-[11px]">· {cards.length}</span>
        </button>

        {categories.map(cat => {
          const count = categoryCounts.get(cat.name) || 0;
          const isActive = activeCategory === cat.name;
          return (
            <button
              key={cat.name}
              type="button"
              onClick={() => onSelectCategory(cat.name)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 border ${
                isActive
                  ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                  : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800'
              }`}
            >
              <Tag className="w-3 h-3 opacity-60" />
              <span>{cat.name}</span>
              <span className="opacity-75 font-mono text-[11px]">· {count}</span>
            </button>
          );
        })}
      </div>

      {/* Gallery Cards Grid */}
      {filteredCards.length === 0 ? (
        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/90 dark:border-stone-800 p-12 text-center flex flex-col items-center justify-center transition-colors">
          <div className="w-14 h-14 rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-400 dark:text-stone-500 mb-3">
            <Layers className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-stone-800 dark:text-stone-100">
            {cards.length === 0 ? 'Koleksi Masih Kosong' : 'Tidak Ada Benda yang Cocok'}
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mt-1 mb-5">
            {cards.length === 0
              ? 'Unggah foto benda favoritmu berasio 2:3 dan bangun kamus visualmu sendiri.'
              : 'Coba ubah kata kunci pencarian atau pilih kategori lain.'}
          </p>
          {cards.length === 0 && (
            <button
              onClick={onOpenUpload}
              className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition-all shadow-sm shadow-emerald-700/20"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Benda Pertama</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredCards.map(card => {
            const hasExtraWords = Array.isArray(card.words) && card.words.length > 0;
            const isSpeaking = speakingId === card.id;

            return (
              <CardItem
                key={card.id}
                card={card}
                hideEnglish={hideEnglish}
                isSpeaking={isSpeaking}
                hasExtraWords={hasExtraWords}
                onCardClick={() => onOpenCardViewer(card)}
                onSpeak={e => handleSpeak(e, card)}
                onDelete={e => handleDelete(e, card)}
              />
            );
          })}
        </div>
      )}

      {/* In-App Delete Confirmation Modal (Replaces blocked window.confirm) */}
      {cardToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setCardToDelete(null)}
        >
          <div
            className="relative bg-white dark:bg-stone-900 w-full max-w-sm rounded-2xl p-5 shadow-2xl border border-stone-200 dark:border-stone-800 transition-colors"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start gap-3.5 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-base text-stone-900 dark:text-white leading-tight">
                  Hapus Foto Benda?
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                  Benda <span className="font-bold text-stone-800 dark:text-stone-200">"{cardToDelete.english}"</span> ({cardToDelete.indonesian}) beserta seluruh pin kosakata yang tersimpan akan dihapus dari koleksi Anda.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-stone-100 dark:border-stone-800">
              <button
                type="button"
                onClick={() => setCardToDelete(null)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Hapus Benda</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface CardItemProps {
  card: ObjectCard;
  hideEnglish: boolean;
  isSpeaking: boolean;
  hasExtraWords: boolean;
  onCardClick: () => void;
  onSpeak: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
}

const CardItem: React.FC<CardItemProps> = ({
  card,
  hideEnglish,
  isSpeaking,
  hasExtraWords,
  onCardClick,
  onSpeak,
  onDelete
}) => {
  const [imageUrl, setImageUrl] = useState<string>('');

  useEffect(() => {
    if (card.image instanceof Blob) {
      const url = URL.createObjectURL(card.image);
      setImageUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [card.image]);

  return (
    <article
      onClick={onCardClick}
      className="group bg-white dark:bg-stone-900 rounded-xl border border-stone-200/90 dark:border-stone-800 hover:border-emerald-500/80 dark:hover:border-emerald-500 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden cursor-pointer"
    >
      {/* 2:3 Aspect ratio container */}
      <div className="relative aspect-[2/3] w-full bg-stone-100 dark:bg-stone-950 overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={hideEnglish ? 'Benda untuk ditebak' : card.english}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center text-stone-400 dark:text-stone-500 text-xs">
            <span>Gambar hanya di perangkat asal</span>
          </div>
        )}

        {/* Category Pill Over Image */}
        <div className="absolute top-2.5 left-2.5 bg-stone-900/80 backdrop-blur-md text-white text-[10px] font-semibold tracking-wide px-2 py-0.5 rounded shadow-sm">
          {card.category}
        </div>

        {/* Extra Tagged Words Counter */}
        {hasExtraWords && (
          <div className="absolute top-2.5 right-2.5 bg-emerald-600/90 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm flex items-center gap-1 backdrop-blur-xs">
            <Sparkles className="w-2.5 h-2.5" />
            <span>+{card.words?.length} kata</span>
          </div>
        )}

        {/* Hover inspect overlay */}
        <div className="absolute inset-0 bg-stone-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-9 h-9 rounded-full bg-white/90 text-stone-900 flex items-center justify-center shadow-md backdrop-blur-xs transform scale-90 group-hover:scale-100 transition-transform">
            <Maximize2 className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Card Info */}
      <div className="p-3.5 flex flex-col flex-1 justify-between gap-3">
        <div>
          <h3 className="font-bold text-stone-900 dark:text-stone-50 text-sm sm:text-base leading-snug line-clamp-1">
            {hideEnglish ? (
              <span className="font-mono tracking-widest text-stone-400 dark:text-stone-500">••••••••</span>
            ) : (
              card.english
            )}
          </h3>
          <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
            <p className="text-xs text-stone-600 dark:text-stone-300 font-medium line-clamp-1">
              {card.indonesian || '—'}
            </p>
            {!hideEnglish && (card.pronunciation || toIndonesianPhonetic(card.english)) && (
              <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono">
                /{card.pronunciation || toIndonesianPhonetic(card.english)}/
              </span>
            )}
          </div>
        </div>

        {/* Card Actions */}
        <div className="flex items-center gap-1.5 pt-2 border-t border-stone-100 dark:border-stone-800">
          <button
            type="button"
            disabled={hideEnglish}
            onClick={onSpeak}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
              isSpeaking
                ? 'bg-emerald-600 text-white animate-pulse'
                : 'bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 disabled:opacity-40 disabled:pointer-events-none'
            }`}
            title="Dengarkan pengucapan bahasa Inggris"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Dengar</span>
          </button>

          <button
            type="button"
            onClick={onDelete}
            className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            title="Hapus benda ini"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </article>
  );
};
