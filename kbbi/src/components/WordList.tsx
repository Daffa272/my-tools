import React, { useState, useMemo } from 'react';
import { KBBICard, SortOption } from '../types';
import { getProficiency, isDue, dueLabel, speakIndonesian } from '../utils/sm2';
import { divideIndonesianSyllables, THEMATIC_CATEGORIES } from '../utils/streak';
import { exportKBBIData, exportAnkiTSV, exportSpreadsheetCSV } from '../utils/storage';
import {
  Search,
  Volume2,
  Edit2,
  Trash2,
  Download,
  Upload,
  Calendar,
  X,
  Play,
  Filter,
  Tag,
  BookOpen,
  ArrowUpDown,
  Music,
  FileSpreadsheet,
  FileText
} from 'lucide-react';

interface WordListProps {
  cards: KBBICard[];
  onEdit: (card: KBBICard) => void;
  onDelete: (word: string) => void;
  onExport: () => void;
  onImport: (file: File) => void;
  onReviewSingle: (card: KBBICard) => void;
  filterMode: 'all' | 'due' | 'learning' | 'mastered';
  onFilterChange: (mode: 'all' | 'due' | 'learning' | 'mastered') => void;
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export const WordList: React.FC<WordListProps> = ({
  cards,
  onEdit,
  onDelete,
  onExport,
  onImport,
  onReviewSingle,
  filterMode,
  onFilterChange
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');
  const [rhymeSuffix, setRhymeSuffix] = useState<string>('');
  const [showRhymeFinder, setShowRhymeFinder] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Available letters in collection
  const availableLetters = useMemo(() => {
    const letters = new Set<string>();
    cards.forEach(c => {
      const firstChar = c.word.trim()[0]?.toUpperCase();
      if (firstChar && /[A-Z]/.test(firstChar)) {
        letters.add(firstChar);
      }
    });
    return letters;
  }, [cards]);

  // Filter & Sort
  const processedCards = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const rhyme = rhymeSuffix.trim().toLowerCase().replace(/^-+/, '');

    // 1. Filtering
    const filtered = cards.filter((card) => {
      // Status filter
      if (filterMode === 'due' && !isDue(card)) return false;
      if (filterMode === 'learning' && getProficiency(card) !== 'Sedang Dipelajari') return false;
      if (filterMode === 'mastered' && getProficiency(card) !== 'Dikuasai') return false;

      // Category filter
      if (selectedCategory !== 'Semua' && (card.category || 'Umum & Sehari-hari') !== selectedCategory) {
        return false;
      }

      // Letter filter
      if (selectedLetter !== null) {
        const firstLetter = card.word.trim()[0]?.toUpperCase();
        if (firstLetter !== selectedLetter) return false;
      }

      // Rhyme suffix filter (ends with ...)
      if (rhyme) {
        if (!card.word.toLowerCase().endsWith(rhyme)) return false;
      }

      // Search query
      if (!q) return true;
      const haystack = [
        card.word,
        card.meaning,
        card.example,
        card.note || '',
        card.category || '',
        card.syllables || '',
        card.wordClass || '',
        card.etymology || '',
        ...(card.synonyms || []),
        ...(card.antonyms || [])
      ].join(' ').toLowerCase();

      return haystack.includes(q);
    });

    // 2. Sorting
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'alpha-asc':
          return a.word.localeCompare(b.word, 'id');
        case 'alpha-desc':
          return b.word.localeCompare(a.word, 'id');
        case 'due-soon': {
          const aTime = a.nextReviewDate ? new Date(a.nextReviewDate).getTime() : 0;
          const bTime = b.nextReviewDate ? new Date(b.nextReviewDate).getTime() : 0;
          return aTime - bTime;
        }
        case 'hardest': {
          // Low easiness and 0 repetition means harder
          const aDifficulty = (a.easiness || 2.5) + (a.repetition || 0) * 0.5;
          const bDifficulty = (b.easiness || 2.5) + (b.repetition || 0) * 0.5;
          return aDifficulty - bDifficulty;
        }
        case 'date-asc':
          return 0; // Natural reverse
        case 'date-desc':
        default:
          return 0; // Natural array order
      }
    });
  }, [cards, searchQuery, filterMode, selectedCategory, selectedLetter, rhymeSuffix, sortBy]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImport(file);
      e.target.value = '';
    }
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedCategory('Semua');
    setSelectedLetter(null);
    setRhymeSuffix('');
    setSortBy('date-desc');
    onFilterChange('all');
  };

  return (
    <div className="rounded-3xl border border-stone-200/90 bg-white p-5 sm:p-6 shadow-sm">
      {/* Title & Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-serif text-lg font-bold text-stone-900">
              Koleksi Kosa Kata
            </h2>
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-800 border border-emerald-200/60">
              {cards.length} kata
            </span>
          </div>
          <p className="text-xs text-stone-500">
            Daftar leksikon KBBI dengan kelas kata, etimologi, pencari rima, dan repetisi spasi
          </p>
        </div>

        {/* Export / Import Toolbar */}
        <div className="relative flex items-center gap-1.5">
          {/* Export Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-100 hover:text-stone-900 transition-colors cursor-pointer"
              title="Pilihan ekspor data"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Ekspor</span>
            </button>

            {showExportMenu && (
              <div className="absolute right-0 top-full mt-1.5 z-30 w-48 rounded-xl bg-white p-1.5 shadow-xl border border-stone-200 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    exportKBBIData(cards);
                    setShowExportMenu(false);
                  }}
                  className="w-full flex items-center gap-2 p-2 rounded-lg text-left hover:bg-stone-100 text-stone-700 cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5 text-stone-500" />
                  <span>Cadangan JSON</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    exportAnkiTSV(cards);
                    setShowExportMenu(false);
                  }}
                  className="w-full flex items-center gap-2 p-2 rounded-lg text-left hover:bg-emerald-50 text-emerald-900 cursor-pointer"
                >
                  <FileText className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Deck Kartu Anki (.txt)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    exportSpreadsheetCSV(cards);
                    setShowExportMenu(false);
                  }}
                  className="w-full flex items-center gap-2 p-2 rounded-lg text-left hover:bg-emerald-50 text-emerald-900 cursor-pointer"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Lembar Kerja Excel (.csv)</span>
                </button>
              </div>
            )}
          </div>

          {/* Import */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-100 hover:text-stone-900 transition-colors cursor-pointer"
            title="Pulihkan kosa kata dari file JSON"
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Impor</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </div>

      {/* Filter Tabs & Search & Sort */}
      <div className="mt-4 space-y-3">
        {/* Search bar and Sort selector */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari kata, suku kata, arti, kelas kata, etimologi..."
              className="w-full rounded-xl border border-stone-300 bg-stone-50/50 pl-10 pr-9 py-2 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:bg-white focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[11px] text-stone-500 font-semibold flex items-center gap-1">
              <ArrowUpDown className="h-3 w-3" /> Urutan:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="rounded-xl border border-stone-300 bg-white px-2.5 py-2 text-xs text-stone-800 shadow-xs focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
            >
              <option value="date-desc">Baru Ditambahkan</option>
              <option value="alpha-asc">Abjad (A → Z)</option>
              <option value="alpha-desc">Abjad (Z → A)</option>
              <option value="due-soon">Jadwal Review Terdekat</option>
              <option value="hardest">Kartu Paling Sulit</option>
            </select>
          </div>

          {/* Rhyme Finder Toggle Button */}
          <button
            type="button"
            onClick={() => setShowRhymeFinder(!showRhymeFinder)}
            className={`inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer shrink-0 ${
              showRhymeFinder || rhymeSuffix
                ? 'bg-purple-100 text-purple-900 border-purple-300'
                : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
            }`}
            title="Cari kata berima akhiran sama"
          >
            <Music className="h-3.5 w-3.5 text-purple-700" />
            <span>Pencari Rima</span>
          </button>
        </div>

        {/* Rhyme Finder Input Bar */}
        {showRhymeFinder && (
          <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-purple-50/80 border border-purple-200 animate-in fade-in text-xs">
            <span className="font-bold text-purple-900 shrink-0">
              Cari kata berakhiran:
            </span>
            <input
              type="text"
              value={rhymeSuffix}
              onChange={(e) => setRhymeSuffix(e.target.value)}
              placeholder="contoh: is, la, na, an, ah..."
              className="w-36 rounded-lg border border-purple-300 bg-white px-2.5 py-1 text-xs text-purple-950 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
            {rhymeSuffix && (
              <button
                onClick={() => setRhymeSuffix('')}
                className="text-xs text-purple-600 hover:text-purple-900 underline"
              >
                Reset Rima
              </button>
            )}
            <span className="text-[11px] text-purple-700/80 ml-auto hidden sm:inline">
              Cocok untuk rima puisi, pantun, dan karya sastra
            </span>
          </div>
        )}

        {/* Status Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <button
            onClick={() => onFilterChange('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              filterMode === 'all'
                ? 'bg-stone-900 text-white shadow-sm'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200/70 hover:text-stone-900'
            }`}
          >
            Semua ({cards.length})
          </button>
          <button
            onClick={() => onFilterChange('due')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              filterMode === 'due'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200/70 hover:text-stone-900'
            }`}
          >
            Jatuh Tempo ({cards.filter(isDue).length})
          </button>
          <button
            onClick={() => onFilterChange('learning')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              filterMode === 'learning'
                ? 'bg-amber-700 text-white shadow-sm'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200/70 hover:text-stone-900'
            }`}
          >
            Sedang Dipelajari ({cards.filter(c => getProficiency(c) === 'Sedang Dipelajari').length})
          </button>
          <button
            onClick={() => onFilterChange('mastered')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              filterMode === 'mastered'
                ? 'bg-emerald-800 text-white shadow-sm'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200/70 hover:text-stone-900'
            }`}
          >
            Dikuasai ({cards.filter(c => getProficiency(c) === 'Dikuasai').length})
          </button>
        </div>

        {/* Thematic Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
          <span className="text-stone-400 font-semibold flex items-center gap-1 shrink-0">
            <Tag className="h-3 w-3" /> Tema:
          </span>
          {THEMATIC_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`shrink-0 rounded-md px-2 py-0.5 font-medium transition-colors ${
                selectedCategory === cat
                  ? 'bg-emerald-100 text-emerald-900 font-bold border border-emerald-300'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Alphabet A-Z Index Toolbar */}
        <div className="flex items-center gap-0.5 overflow-x-auto pb-1 scrollbar-none text-[10px] border-t border-stone-100 pt-2">
          <button
            onClick={() => setSelectedLetter(null)}
            className={`px-1.5 py-0.5 rounded font-bold uppercase transition-colors shrink-0 ${
              selectedLetter === null
                ? 'bg-stone-800 text-white'
                : 'text-stone-500 hover:bg-stone-100'
            }`}
          >
            A-Z
          </button>
          {ALPHABET.map((letter) => {
            const hasWords = availableLetters.has(letter);
            const isSelected = selectedLetter === letter;

            return (
              <button
                key={letter}
                disabled={!hasWords}
                onClick={() => setSelectedLetter(isSelected ? null : letter)}
                className={`w-5 h-5 flex items-center justify-center rounded font-semibold transition-all shrink-0 ${
                  isSelected
                    ? 'bg-emerald-800 text-white font-bold'
                    : hasWords
                    ? 'text-stone-700 hover:bg-stone-200 font-bold'
                    : 'text-stone-300 cursor-not-allowed'
                }`}
                title={hasWords ? `Filter kata berawalan ${letter}` : `Tidak ada kata berawalan ${letter}`}
              >
                {letter}
              </button>
            );
          })}
        </div>
      </div>

      {/* Cards List */}
      <div className="mt-4 space-y-2.5 max-h-[680px] overflow-y-auto pr-1">
        {processedCards.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-300 p-8 text-center">
            <BookOpen className="mx-auto h-8 w-8 text-stone-300 mb-2" />
            <h4 className="font-serif text-sm font-semibold text-stone-700">
              Tidak ada kosa kata ditemukan
            </h4>
            <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
              Tidak ada kata yang sesuai dengan kriteria filter atau rima saat ini.
            </p>
            <button
              onClick={clearAllFilters}
              className="mt-3 inline-flex items-center gap-1 rounded-lg bg-stone-100 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-200 transition-colors"
            >
              Reset Semua Filter
            </button>
          </div>
        ) : (
          processedCards.map((card) => {
            const proficiency = getProficiency(card);
            const due = isDue(card);
            const syllablesFormatted = card.syllables || divideIndonesianSyllables(card.word);

            return (
              <div
                key={card.word}
                className="group relative rounded-2xl border border-stone-200/80 bg-stone-50/40 p-4 transition-all hover:bg-white hover:border-emerald-500/50 hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Main Word */}
                      <span className="font-serif text-lg font-bold text-stone-950 tracking-tight">
                        {card.word}
                      </span>

                      {/* Syllable divider badge */}
                      <span
                        className="text-[11px] font-mono text-stone-500 bg-stone-100/90 px-1.5 py-0.5 rounded border border-stone-200"
                        title="Pola Pemenggalan Suku Kata Baku"
                      >
                        {syllablesFormatted}
                      </span>

                      {/* Word Class Badge (Nomina / Adjektiva / Verba, etc.) */}
                      {card.wordClass && (
                        <span className="text-[10px] font-bold text-emerald-900 bg-emerald-100/70 px-1.5 py-0.5 rounded">
                          {card.wordClass}
                        </span>
                      )}

                      {/* Etymology / Origin Badge */}
                      {card.etymology && (
                        <span className="text-[10px] text-amber-900 bg-amber-100/80 px-1.5 py-0.5 rounded font-medium">
                          {card.etymology}
                        </span>
                      )}

                      {/* Audio pronunciation button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          speakIndonesian(card.word);
                        }}
                        className="text-stone-400 hover:text-emerald-700 p-1 rounded-md hover:bg-stone-200/50 transition-colors cursor-pointer"
                        title="Dengarkan pengucapan kata"
                      >
                        <Volume2 className="h-4 w-4" />
                      </button>

                      {/* Category Badge */}
                      {card.category && (
                        <span className="text-[10px] font-semibold text-stone-600 bg-stone-200/60 px-2 py-0.5 rounded-full">
                          {card.category}
                        </span>
                      )}

                      {/* Proficiency status */}
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          proficiency === 'Dikuasai'
                            ? 'bg-emerald-100 text-emerald-800'
                            : proficiency === 'Sedang Dipelajari'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-stone-200/70 text-stone-700'
                        }`}
                      >
                        {proficiency}
                      </span>

                      {/* Due countdown */}
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${
                          due
                            ? 'bg-rose-50 text-rose-700 border border-rose-200/60'
                            : 'bg-stone-100 text-stone-600'
                        }`}
                      >
                        <Calendar className="h-3 w-3" />
                        {dueLabel(card)}
                      </span>
                    </div>

                    {/* Meaning */}
                    <p className="mt-1.5 text-xs text-stone-800 font-medium leading-relaxed">
                      {card.meaning}
                    </p>

                    {/* Example sentence */}
                    {card.example && (
                      <div className="mt-2 rounded-xl bg-white/70 p-2.5 text-xs text-stone-600 border-l-2 border-amber-400/80 italic font-serif">
                        "{card.example}"
                        {card.note && (
                          <div className="mt-1 text-[11px] not-italic text-stone-500 font-sans">
                            Catatan: {card.note}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Synonyms & Antonyms */}
                    <div className="mt-2.5 flex flex-wrap gap-1 text-[11px]">
                      {card.synonyms && card.synonyms.length > 0 && (
                        <div className="flex items-center gap-1 text-stone-500">
                          <span className="font-semibold text-stone-600">Sin:</span>
                          {card.synonyms.map((s) => (
                            <span key={s} className="bg-stone-100 text-stone-700 px-1.5 py-0.5 rounded">
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                      {card.antonyms && card.antonyms.length > 0 && (
                        <div className="flex items-center gap-1 text-stone-500 ml-2">
                          <span className="font-semibold text-stone-600">Ant:</span>
                          {card.antonyms.map((a) => (
                            <span key={a} className="bg-rose-50 text-rose-800 px-1.5 py-0.5 rounded">
                              {a}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex items-center gap-1 opacity-90 sm:opacity-70 group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                      type="button"
                      onClick={() => onReviewSingle(card)}
                      className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                      title="Review kartu ini sekarang"
                    >
                      <Play className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onEdit(card)}
                      className="p-1.5 rounded-lg text-stone-500 hover:text-stone-800 hover:bg-stone-200/60 transition-colors cursor-pointer"
                      title="Edit kartu"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(card.word)}
                      className="p-1.5 rounded-lg text-stone-400 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Hapus kartu"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
