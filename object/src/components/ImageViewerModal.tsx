import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Volume2,
  Trash2,
  Plus,
  Sparkles,
  RefreshCw,
  Tag,
  BookOpen,
  MapPin,
  Scan,
  Check
} from 'lucide-react';
import { ObjectCard, CardWord } from '../types';
import { speakEnglish } from '../services/speech';
import {
  translateEnglishToIndonesian,
  generatePronunciationGuide,
  generateExampleSentence,
  detectObjectsInImage,
  toIndonesianPhonetic
} from '../services/gemini';

interface ImageViewerModalProps {
  card: ObjectCard | null;
  onClose: () => void;
  onUpdateWords: (cardId: string, updatedWords: CardWord[]) => Promise<void>;
  onDeleteCard?: (cardId: string, cardName: string) => Promise<void> | void;
  onToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const ImageViewerModal: React.FC<ImageViewerModalProps> = ({
  card,
  onClose,
  onUpdateWords,
  onDeleteCard,
  onToast
}) => {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [speakingWord, setSpeakingWord] = useState<string | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [isDeletingCard, setIsDeletingCard] = useState<boolean>(false);

  // Hotspot pin placement mode
  const [isPinModeActive, setIsPinModeActive] = useState<boolean>(false);
  const [stagedPin, setStagedPin] = useState<{ x: number; y: number } | null>(null);

  // Form states for new word
  const [englishInput, setEnglishInput] = useState('');
  const [indonesianInput, setIndonesianInput] = useState('');
  const [pronunciationInput, setPronunciationInput] = useState('');
  const [exampleSentenceInput, setExampleSentenceInput] = useState('');
  const [translationStatus, setTranslationStatus] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const debounceTransRef = useRef<NodeJS.Timeout | null>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!card) return;
    if (card.image instanceof Blob) {
      const url = URL.createObjectURL(card.image);
      setImageUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setImageUrl('');
    }
  }, [card]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!card) return null;

  const words = Array.isArray(card.words) ? card.words : [];

  const handleEnglishInputChange = (val: string) => {
    setEnglishInput(val);

    if (debounceTransRef.current) clearTimeout(debounceTransRef.current);

    if (!val.trim()) {
      setTranslationStatus('');
      return;
    }

    // Instantly provide local phonetic reading so it is never blank!
    const instantPhonetic = toIndonesianPhonetic(val);
    if (instantPhonetic && !pronunciationInput) {
      setPronunciationInput(instantPhonetic);
    }

    debounceTransRef.current = setTimeout(async () => {
      setIsTranslating(true);
      setTranslationStatus('Memproses AI...');
      try {
        // Run translation, pronunciation, and sentence independently
        const [transRes, pronRes, sentRes] = await Promise.allSettled([
          translateEnglishToIndonesian(val),
          generatePronunciationGuide(val),
          generateExampleSentence(val)
        ]);

        if (transRes.status === 'fulfilled' && transRes.value) {
          setIndonesianInput(transRes.value);
        }

        if (pronRes.status === 'fulfilled' && pronRes.value) {
          setPronunciationInput(pronRes.value);
        } else if (!pronunciationInput) {
          setPronunciationInput(toIndonesianPhonetic(val));
        }

        if (sentRes.status === 'fulfilled' && sentRes.value) {
          setExampleSentenceInput(sentRes.value);
        }

        setTranslationStatus('Arti & cara baca otomatis siap!');
      } catch {
        setTranslationStatus('Mode offline aktif');
      } finally {
        setIsTranslating(false);
      }
    }, 300);
  };

  const handleBlurEnglishInput = async () => {
    if (!englishInput.trim()) return;
    if (!indonesianInput.trim()) {
      const trans = await translateEnglishToIndonesian(englishInput);
      if (trans) setIndonesianInput(trans);
    }
    if (!pronunciationInput.trim()) {
      const pron = await generatePronunciationGuide(englishInput);
      if (pron) setPronunciationInput(pron);
    }
  };

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageContainerRef.current) return;
    const rect = imageContainerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));

    setStagedPin({ x: Math.round(x), y: Math.round(y) });
    setIsPinModeActive(true);
    onToast(`Pin ditandai pada koordinat (${Math.round(x)}%, ${Math.round(y)}%). Tuliskan nama kosakatanya!`, 'info');
  };

  const handleAddWordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const eng = englishInput.trim();
    if (!eng) return;

    setIsSubmitting(true);
    try {
      let indo = indonesianInput.trim();
      let pron = pronunciationInput.trim();
      let sent = exampleSentenceInput.trim();

      if (!indo) {
        try {
          indo = await translateEnglishToIndonesian(eng);
        } catch {
          indo = '';
        }
      }

      if (!pron) {
        try {
          pron = await generatePronunciationGuide(eng);
        } catch {
          pron = '';
        }
      }

      const newWord: CardWord = {
        english: eng,
        indonesian: indo,
        pronunciation: pron,
        exampleSentence: sent || undefined,
        x: stagedPin ? stagedPin.x : undefined,
        y: stagedPin ? stagedPin.y : undefined
      };

      const updatedWords = [...words, newWord];
      await onUpdateWords(card.id, updatedWords);

      // Reset form
      setEnglishInput('');
      setIndonesianInput('');
      setPronunciationInput('');
      setExampleSentenceInput('');
      setTranslationStatus('');
      setStagedPin(null);
      setIsPinModeActive(false);
      onToast(`Kosakata "${eng}" berhasil ditandai!`, 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menambah kosakata.';
      onToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteWord = async (indexToRemove: number) => {
    const wordToDelete = words[indexToRemove]?.english;
    const updated = words.filter((_, idx) => idx !== indexToRemove);
    try {
      await onUpdateWords(card.id, updated);
      onToast(`Kosakata "${wordToDelete}" dihapus.`, 'info');
    } catch {
      onToast('Gagal menghapus kosakata.', 'error');
    }
  };

  const handleDeleteCardConfirm = async () => {
    if (!card || !onDeleteCard) return;
    setIsDeletingCard(true);
    try {
      await onDeleteCard(card.id, card.english);
      setShowDeleteConfirm(false);
      onClose();
    } catch {
      onToast('Gagal menghapus kartu benda.', 'error');
    } finally {
      setIsDeletingCard(false);
    }
  };

  const handleSpeak = (text: string) => {
    setSpeakingWord(text);
    speakEnglish(text, speaking => {
      if (!speaking) setSpeakingWord(null);
    });
  };

  const handleScanImageForWords = async () => {
    if (!card.image) return;
    setIsScanning(true);
    try {
      const detected = await detectObjectsInImage(card.image);
      if (detected.length === 0) {
        onToast('Tidak ditemukan benda spesifik pada foto.', 'info');
        return;
      }

      // Add detected words that aren't already present
      const existingEng = new Set(words.map(w => w.english.toLowerCase()));
      existingEng.add(card.english.toLowerCase());

      const toAdd: CardWord[] = detected
        .filter(d => !existingEng.has(d.english.toLowerCase()))
        .map((d, i) => ({
          english: d.english,
          indonesian: d.indonesian,
          pronunciation: d.pronunciation,
          x: 25 + (i % 3) * 25,
          y: 35 + Math.floor(i / 3) * 30
        }));

      if (toAdd.length === 0) {
        onToast('Semua benda yang terdeteksi sudah ada dalam daftar.', 'info');
        return;
      }

      const merged = [...words, ...toAdd];
      await onUpdateWords(card.id, merged);
      onToast(`AI otomatis menambahkan ${toAdd.length} kosakata baru!`, 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Pemindaian AI gagal.';
      onToast(msg, 'error');
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-950/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative bg-white dark:bg-stone-900 w-full max-w-5xl max-h-[92vh] rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden flex flex-col md:flex-row transition-colors">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 z-20 w-8 h-8 rounded-full bg-stone-900/60 hover:bg-stone-900 dark:bg-stone-800/80 dark:hover:bg-stone-700 text-white flex items-center justify-center transition-colors backdrop-blur-xs cursor-pointer"
          title="Tutup (Esc)"
          aria-label="Tutup"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Left Side: High Res 2:3 Image with Hotspot Pins */}
        <div className="w-full md:w-1/2 bg-stone-950 flex flex-col items-center justify-center p-4 relative min-h-[300px] md:min-h-[520px] select-none">
          <div
            ref={imageContainerRef}
            onClick={handleImageClick}
            className="relative inline-block cursor-crosshair group max-h-[76vh] w-auto max-w-full rounded-lg overflow-hidden"
          >
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={card.english}
                className="max-h-[76vh] w-auto max-w-full object-contain rounded-lg shadow-lg block pointer-events-none"
              />
            ) : (
              <div className="text-stone-400 text-sm text-center p-6">
                Gambar tidak tersimpan di perangkat ini
              </div>
            )}

            {/* Hotspot Pins Rendered on Image */}
            {words.map((w, index) => {
              if (w.x === undefined || w.y === undefined) return null;
              const isHighlighted = highlightedIndex === index;

              return (
                <button
                  key={index}
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    setHighlightedIndex(index);
                    handleSpeak(w.english);
                  }}
                  style={{ left: `${w.x}%`, top: `${w.y}%` }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-md ${
                    isHighlighted
                      ? 'bg-emerald-400 text-stone-900 scale-125 ring-4 ring-emerald-400/50'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white hover:scale-110'
                  }`}
                  title={`${w.english} (${w.indonesian || ''}) - Klik untuk dengar`}
                >
                  {index + 1}
                </button>
              );
            })}

            {/* Currently staged pin being added */}
            {stagedPin && (
              <div
                style={{ left: `${stagedPin.x}%`, top: `${stagedPin.y}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-amber-400 text-stone-900 flex items-center justify-center text-xs font-bold animate-bounce ring-4 ring-amber-400/50 shadow-lg"
              >
                +
              </div>
            )}
          </div>

          {/* Bottom Bar on Left Panel */}
          <div className="w-full mt-3 flex items-center justify-between text-xs text-stone-300 px-2">
            <span className="flex items-center gap-1.5 text-stone-400">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>Klik pada foto untuk pasang pin kosakata</span>
            </span>

            <button
              type="button"
              onClick={handleScanImageForWords}
              disabled={isScanning}
              className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-emerald-400 rounded-lg font-medium flex items-center gap-1 transition-colors cursor-pointer"
            >
              {isScanning ? (
                <RefreshCw className="w-3 h-3 animate-spin" />
              ) : (
                <Scan className="w-3 h-3" />
              )}
              <span>Pindai AI</span>
            </button>
          </div>
        </div>

        {/* Right Side: Vocabulary & Tagging Inspector */}
        <div className="w-full md:w-1/2 flex flex-col max-h-[50vh] md:max-h-[92vh] bg-stone-50 dark:bg-stone-950 overflow-hidden transition-colors">
          {/* Main Card Header */}
          <div className="p-5 border-b border-stone-200/80 dark:border-stone-800 bg-white dark:bg-stone-900">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-1">
              <Tag className="w-3.5 h-3.5" />
              <span>Benda Utama · Folder {card.category}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-bold text-stone-900 dark:text-white">{card.english}</h2>
                  <span className="text-xs px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded font-mono border border-emerald-200/60 dark:border-emerald-800/60">
                    /{card.pronunciation || toIndonesianPhonetic(card.english)}/
                  </span>
                </div>
                <p className="text-sm text-stone-600 dark:text-stone-300 font-medium mt-0.5">{card.indonesian}</p>
                {card.exampleSentence && (
                  <p className="text-xs text-stone-500 dark:text-stone-400 italic mt-1 bg-stone-50 dark:bg-stone-800/80 p-2 rounded-lg border border-stone-200/60 dark:border-stone-700">
                    "{card.exampleSentence}"
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleSpeak(card.english)}
                  className={`py-2 px-3.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    speakingWord === card.english
                      ? 'bg-emerald-600 text-white animate-pulse'
                      : 'bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  }`}
                  title="Dengarkan pengucapan"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>Dengar</span>
                </button>

                {onDeleteCard && (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="p-2 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-stone-200 dark:border-stone-700 hover:border-rose-300 dark:hover:border-rose-900/60 transition-colors"
                    title="Hapus foto benda ini dari koleksi"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Tagged Vocabulary Words List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
                <span>Bagian & Kosakata Tambahan ({words.length})</span>
              </h3>
            </div>

            {words.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-stone-300 dark:border-stone-800 bg-white dark:bg-stone-900 text-center text-xs text-stone-500 dark:text-stone-400">
                Belum ada pin kosakata. Klik titik pada foto atau isi formulir di bawah untuk menambahkan!
              </div>
            ) : (
              <div className="space-y-2">
                {words.map((w, index) => {
                  const isSpeaking = speakingWord === w.english;
                  const isHighlighted = highlightedIndex === index;

                  return (
                    <div
                      key={index}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      onMouseLeave={() => setHighlightedIndex(null)}
                      className={`p-3 rounded-xl border transition-all flex items-start justify-between gap-3 shadow-2xs ${
                        isHighlighted
                          ? 'bg-emerald-50/70 dark:bg-emerald-950/60 border-emerald-400 shadow-sm'
                          : 'bg-white dark:bg-stone-900 border-stone-200/90 dark:border-stone-800 hover:border-emerald-300 dark:hover:border-emerald-700'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          {w.x !== undefined && (
                            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                              {index + 1}
                            </span>
                          )}
                          <strong className="text-sm font-bold text-stone-900 dark:text-white truncate">
                            {w.english}
                          </strong>
                          {w.pronunciation && (
                            <span className="text-[11px] px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded-md font-medium border border-emerald-200/60 dark:border-emerald-800/60 font-mono">
                              /{w.pronunciation}/
                            </span>
                          )}
                        </div>
                        {w.indonesian && (
                          <span className="text-xs text-stone-600 dark:text-stone-400 block truncate mt-0.5 ml-7">
                            {w.indonesian}
                          </span>
                        )}
                        {w.exampleSentence && (
                          <span className="text-[11px] text-stone-400 dark:text-stone-500 italic block mt-1 ml-7">
                            {w.exampleSentence}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleSpeak(w.english)}
                          className={`p-2 rounded-lg text-xs font-semibold transition-colors ${
                            isSpeaking
                              ? 'bg-emerald-600 text-white'
                              : 'text-stone-600 dark:text-stone-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                          }`}
                          title={`Dengarkan ${w.english}`}
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteWord(index)}
                          className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                          title="Hapus kata ini"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add New Word Form with Hotspot coordinate tag */}
            <form
              onSubmit={handleAddWordSubmit}
              className="p-4 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-3 mt-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Tambah Kosakata Bagian Benda</span>
                  {stagedPin && (
                    <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[10px] rounded font-bold">
                      Pin ({stagedPin.x}%, {stagedPin.y}%)
                    </span>
                  )}
                </span>
                {translationStatus && (
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-500" />
                    {translationStatus}
                  </span>
                )}
              </div>

              <div className="space-y-2">
                <div className="relative flex items-center gap-1.5">
                  <input
                    type="text"
                    required
                    maxLength={80}
                    value={englishInput}
                    onChange={e => handleEnglishInputChange(e.target.value)}
                    onBlur={handleBlurEnglishInput}
                    placeholder="Nama Inggris (mis: handle, spout, lid)"
                    className="flex-1 text-xs font-medium px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500 outline-none bg-stone-50/50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500"
                  />
                  {englishInput.trim() && (
                    <button
                      type="button"
                      onClick={() => handleSpeak(englishInput)}
                      className="p-2 text-stone-500 hover:text-emerald-700 dark:hover:text-emerald-300 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors shrink-0"
                      title="Dengarkan pengucapan kata ini"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {isTranslating && (
                    <RefreshCw className="w-3.5 h-3.5 text-emerald-600 animate-spin absolute right-10 top-2.5" />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    maxLength={100}
                    value={indonesianInput}
                    onChange={e => setIndonesianInput(e.target.value)}
                    placeholder="Arti bahasa Indonesia"
                    className="text-xs px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500 outline-none bg-stone-50/50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500"
                  />
                  <input
                    type="text"
                    maxLength={120}
                    value={pronunciationInput}
                    onChange={e => setPronunciationInput(e.target.value)}
                    placeholder="Cara baca (ejaan Indo)"
                    className="text-xs px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500 outline-none bg-emerald-50/40 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 font-mono"
                  />
                </div>

                <input
                  type="text"
                  maxLength={150}
                  value={exampleSentenceInput}
                  onChange={e => setExampleSentenceInput(e.target.value)}
                  placeholder="Contoh kalimat penggunaan (opsional)..."
                  className="w-full text-[11px] px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 outline-none bg-stone-50/30 dark:bg-stone-800/60 text-stone-600 dark:text-stone-300 placeholder:text-stone-400 dark:placeholder:text-stone-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !englishInput.trim()}
                className="w-full py-2 px-3 bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-white disabled:opacity-50 text-white dark:text-stone-900 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Plus className="w-3.5 h-3.5" />
                )}
                <span>Simpan Pin & Kosakata</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Delete Card Confirmation Modal */}
      {showDeleteConfirm && card && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setShowDeleteConfirm(false)}
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
                  Hapus Foto Benda Ini?
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                  Foto <span className="font-bold text-stone-800 dark:text-stone-200">"{card.english}"</span> ({card.indonesian}) beserta seluruh {words.length} kosakata pin yang ditandai akan dihapus secara permanen.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-stone-100 dark:border-stone-800">
              <button
                type="button"
                disabled={isDeletingCard}
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeletingCard}
                onClick={handleDeleteCardConfirm}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              >
                {isDeletingCard ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>Ya, Hapus Benda</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
