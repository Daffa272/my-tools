import React, { useState, useRef, useEffect } from 'react';
import {
  UploadCloud,
  Sparkles,
  FolderPlus,
  ArrowRight,
  Download,
  Upload,
  FolderArchive,
  RefreshCw,
  Check,
  AlertCircle,
  Crop,
  Scan,
  BookOpen,
  Volume2,
  Trash2
} from 'lucide-react';
import { Category } from '../types';
import { prepareImage } from '../services/db';
import {
  translateEnglishToIndonesian,
  generatePronunciationGuide,
  generateExampleSentence,
  detectObjectsInImage,
  toIndonesianPhonetic
} from '../services/gemini';
import { speakEnglish } from '../services/speech';
import { ImageCropModal } from './ImageCropModal';

interface UploadPanelProps {
  categories: Category[];
  onSaveCard: (data: {
    english: string;
    indonesian: string;
    pronunciation?: string;
    category: string;
    imageBlob: Blob;
    exampleSentence?: string;
  }) => Promise<void>;
  onAddCategory: (name: string) => Promise<void>;
  onExportFolder: (categoryName: string) => Promise<void>;
  onDownloadBackup: () => Promise<void>;
  onImportBackup: (file: File) => Promise<void>;
  activeFilterCategory: string;
  onToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  isOpenAsModal?: boolean;
  onCloseModal?: () => void;
}

export const UploadPanel: React.FC<UploadPanelProps> = ({
  categories,
  onSaveCard,
  onAddCategory,
  onExportFolder,
  onDownloadBackup,
  onImportBackup,
  activeFilterCategory,
  onToast,
  isOpenAsModal = false,
  onCloseModal
}) => {
  const [englishName, setEnglishName] = useState('');
  const [indonesianName, setIndonesianName] = useState('');
  const [pronunciation, setPronunciation] = useState('');
  const [exampleSentence, setExampleSentence] = useState('');
  const [categoryName, setCategoryName] = useState(activeFilterCategory || '');
  const [newCatInput, setNewCatInput] = useState('');
  const [showNewCatInput, setShowNewCatInput] = useState(false);

  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>('');
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  // Crop modal state
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);

  // AI Scan state
  const [isScanningImage, setIsScanningImage] = useState(false);
  const [detectedCandidates, setDetectedCandidates] = useState<
    Array<{ english: string; indonesian: string; pronunciation: string }>
  >([]);

  const [translationStatus, setTranslationStatus] = useState<string>('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [autoTranslatedValue, setAutoTranslatedValue] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formStatus, setFormStatus] = useState<{ text: string; isError: boolean } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (activeFilterCategory && !categoryName) {
      setCategoryName(activeFilterCategory);
    }
  }, [activeFilterCategory]);

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  const handleSpeak = (textToSpeak: string) => {
    if (!textToSpeak.trim()) return;
    setIsSpeaking(true);
    speakEnglish(textToSpeak, speaking => {
      if (!speaking) setIsSpeaking(false);
    });
  };

  const handleEnglishChange = (value: string) => {
    setEnglishName(value);
    setFormStatus(null);

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    if (!value.trim()) {
      setTranslationStatus('');
      setPronunciation('');
      return;
    }

    // Instantly generate high-quality Indonesian phonetic ejaan bunyi so it is never empty!
    const instantPhonetic = toIndonesianPhonetic(value);
    if (instantPhonetic) {
      setPronunciation(instantPhonetic);
    }

    debounceTimerRef.current = setTimeout(async () => {
      setIsTranslating(true);
      setTranslationStatus('Menerjemahkan...');
      try {
        const [transRes, pronRes, sentRes] = await Promise.allSettled([
          translateEnglishToIndonesian(value),
          generatePronunciationGuide(value),
          generateExampleSentence(value)
        ]);

        if (transRes.status === 'fulfilled' && transRes.value) {
          setIndonesianName(transRes.value);
          setAutoTranslatedValue(transRes.value);
        }

        if (pronRes.status === 'fulfilled' && pronRes.value) {
          setPronunciation(pronRes.value);
        } else if (instantPhonetic) {
          setPronunciation(instantPhonetic);
        }

        if (sentRes.status === 'fulfilled' && sentRes.value && !exampleSentence) {
          setExampleSentence(sentRes.value);
        }

        setTranslationStatus('Arti & cara baca otomatis siap');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Terjemahan gagal.';
        setTranslationStatus(msg);
      } finally {
        setIsTranslating(false);
      }
    }, 280);
  };

  const handleBlurEnglish = async () => {
    if (!englishName.trim()) return;
    if (!indonesianName.trim()) {
      setIsTranslating(true);
      try {
        const trans = await translateEnglishToIndonesian(englishName);
        if (trans) {
          setIndonesianName(trans);
          setAutoTranslatedValue(trans);
          setTranslationStatus('Arti & cara baca otomatis siap');
        }
      } catch {
        // ignore
      } finally {
        setIsTranslating(false);
      }
    }
    if (!pronunciation.trim()) {
      const pron = await generatePronunciationGuide(englishName);
      if (pron) {
        setPronunciation(pron);
      } else {
        setPronunciation(toIndonesianPhonetic(englishName));
      }
    }
  };

  const handleFileSelected = async (file: File) => {
    setFormStatus(null);
    if (!file) return;

    setIsProcessingImage(true);
    try {
      // First attempt direct 2:3 check
      const processedBlob = await prepareImage(file);
      applyImageBlob(processedBlob);
      onToast('Gambar 2:3 siap (1024×1536 px)', 'success');
    } catch {
      // If ratio is not 2:3, open interactive crop tool!
      setCropFile(file);
      setIsCropModalOpen(true);
      onToast('Sesuaikan area pemotongan foto rasio 2:3', 'info');
    } finally {
      setIsProcessingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const applyImageBlob = (blob: Blob) => {
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    const preview = URL.createObjectURL(blob);
    setImageBlob(blob);
    setImagePreviewUrl(preview);
    setDetectedCandidates([]);
  };

  const handleClearImage = () => {
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setImageBlob(null);
    setImagePreviewUrl('');
    setDetectedCandidates([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onToast('Foto telah dihapus dari formulir.', 'info');
  };

  const handleScanObjects = async () => {
    if (!imageBlob) return;
    setIsScanningImage(true);
    try {
      const candidates = await detectObjectsInImage(imageBlob);
      if (candidates.length > 0) {
        setDetectedCandidates(candidates);
        // If english name is empty, auto-select first one
        if (!englishName.trim()) {
          setEnglishName(candidates[0].english);
          setIndonesianName(candidates[0].indonesian);
        }
        onToast(`Ditemukan ${candidates.length} benda dalam gambar!`, 'success');
      } else {
        onToast('Tidak ada benda spesifik yang terdeteksi. Silakan isi manual.', 'info');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memindai gambar.';
      onToast(msg, 'error');
    } finally {
      setIsScanningImage(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus(null);

    const eng = englishName.trim();
    let indo = indonesianName.trim();
    const cat = (showNewCatInput ? newCatInput : categoryName).trim();

    if (!imageBlob) {
      setFormStatus({ text: 'Pilih gambar berasio 2:3 terlebih dahulu.', isError: true });
      return;
    }

    if (!eng) {
      setFormStatus({ text: 'Masukkan nama benda dalam bahasa Inggris.', isError: true });
      return;
    }

    if (!cat) {
      setFormStatus({ text: 'Tentukan folder kategori untuk benda ini.', isError: true });
      return;
    }

    setIsSubmitting(true);
    try {
      if (!indo) {
        try {
          indo = await translateEnglishToIndonesian(eng);
          setIndonesianName(indo);
        } catch {
          indo = eng;
        }
      }

      let pron = pronunciation.trim();
      if (!pron && eng) {
        pron = toIndonesianPhonetic(eng);
      }

      await onSaveCard({
        english: eng,
        indonesian: indo || eng,
        pronunciation: pron || undefined,
        category: cat,
        imageBlob,
        exampleSentence: exampleSentence.trim() || undefined
      });

      // Reset form
      setEnglishName('');
      setIndonesianName('');
      setPronunciation('');
      setExampleSentence('');
      setAutoTranslatedValue('');
      setTranslationStatus('');
      setImageBlob(null);
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
      setImagePreviewUrl('');
      setShowNewCatInput(false);
      setNewCatInput('');
      setDetectedCandidates([]);

      setFormStatus({ text: 'Benda berhasil disimpan ke koleksi!', isError: false });
      onToast(`"${eng}" berhasil ditambahkan!`, 'success');

      if (isOpenAsModal && onCloseModal) {
        setTimeout(onCloseModal, 500);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan benda.';
      setFormStatus({ text: msg, isError: true });
      onToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddNewCategory = async () => {
    const trimmed = newCatInput.trim();
    if (!trimmed) {
      onToast('Tulis nama folder kategori baru terlebih dahulu.', 'error');
      return;
    }
    await onAddCategory(trimmed);
    setCategoryName(trimmed);
    setNewCatInput('');
    setShowNewCatInput(false);
    onToast(`Folder "${trimmed}" dibuat!`, 'success');
  };

  return (
    <>
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/90 dark:border-stone-800 shadow-sm overflow-hidden flex flex-col transition-colors">
        {/* Header */}
        <div className="p-5 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <span>Tambah Benda Baru</span>
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Unggah foto benda apapun (otomatis dipotong ke rasio 2:3)
            </p>
          </div>
        </div>

        <form onSubmit={handleFormSubmit} className="p-5 flex-1 flex flex-col gap-4">
          {/* Upload Zone */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                Foto Benda (Rasio 2:3)
              </label>
              {imageBlob && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleScanObjects}
                    disabled={isScanningImage}
                    className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 flex items-center gap-1 transition-colors"
                  >
                    {isScanningImage ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Scan className="w-3.5 h-3.5" />
                    )}
                    <span>Pindai AI</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleClearImage}
                    className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 flex items-center gap-1 transition-colors px-1.5 py-0.5 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    title="Hapus foto saat ini"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Foto</span>
                  </button>
                </div>
              )}
            </div>

            <div
              onDragOver={e => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative group cursor-pointer border-2 border-dashed rounded-xl transition-all overflow-hidden flex flex-col items-center justify-center text-center p-4 aspect-[2/3] max-h-72 w-full mx-auto ${
                imagePreviewUrl
                  ? 'border-emerald-500 bg-stone-900'
                  : 'border-stone-300 dark:border-stone-700 hover:border-emerald-500 bg-stone-50/70 dark:bg-stone-800/40 hover:bg-emerald-50/20'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileSelected(e.target.files[0]);
                  }
                }}
              />

              {imagePreviewUrl ? (
                <>
                  <img
                    src={imagePreviewUrl}
                    alt="Pratinjau gambar"
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-stone-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white backdrop-blur-[2px] p-2">
                    <Crop className="w-6 h-6 mb-1 text-white" />
                    <span className="text-xs font-semibold">Ganti atau potong foto</span>
                    <span className="text-[10px] text-stone-300 mt-0.5">1024 × 1536 px (2:3)</span>
                  </div>
                  <div className="absolute top-2 right-2 bg-emerald-600/90 text-white text-[10px] font-mono font-medium px-2 py-0.5 rounded shadow-sm backdrop-blur-sm">
                    2:3 Siap
                  </div>
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      handleClearImage();
                    }}
                    className="absolute top-2 left-2 z-10 bg-rose-600/90 hover:bg-rose-700 text-white px-2 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 shadow-md transition-all hover:scale-105"
                    title="Hapus foto ini"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Hapus</span>
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center gap-2 p-3">
                  <div className="w-11 h-11 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                    {isProcessingImage ? (
                      <RefreshCw className="w-5 h-5 animate-spin text-emerald-600" />
                    ) : (
                      <UploadCloud className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-stone-800 dark:text-stone-200 block">
                      {isProcessingImage ? 'Memeriksa...' : 'Pilih atau Geser Foto'}
                    </span>
                    <span className="text-[11px] text-stone-500 dark:text-stone-400 block mt-0.5">
                      Bisa foto apa saja (crop otomatis 2:3)
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* AI Candidate Suggestions if scanned */}
            {detectedCandidates.length > 0 && (
              <div className="mt-2.5 p-2.5 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl border border-emerald-200 dark:border-emerald-800">
                <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 block mb-1.5 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Saran Benda dari AI (Klik untuk memilih):</span>
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {detectedCandidates.map((cand, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setEnglishName(cand.english);
                        setIndonesianName(cand.indonesian);
                        setPronunciation(cand.pronunciation || toIndonesianPhonetic(cand.english));
                        setAutoTranslatedValue(cand.indonesian);
                        setTranslationStatus('Arti & cara baca terisi');
                      }}
                      className="px-2 py-1 bg-white dark:bg-stone-800 hover:bg-emerald-600 hover:text-white text-emerald-900 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-700 text-xs font-medium rounded-lg transition-colors shadow-2xs"
                    >
                      {cand.english} ({cand.indonesian})
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* English Name Input with Pronounce Test Button */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="english-input" className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
                Nama Benda (Bahasa Inggris)
              </label>
              {englishName.trim() && (
                <button
                  type="button"
                  onClick={() => handleSpeak(englishName)}
                  className={`text-xs font-semibold flex items-center gap-1 transition-colors px-2 py-0.5 rounded ${
                    isSpeaking
                      ? 'bg-emerald-600 text-white animate-pulse'
                      : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50'
                  }`}
                  title="Dengarkan pengucapan audio"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Dengar Suara</span>
                </button>
              )}
            </div>
            <div className="relative">
              <input
                id="english-input"
                type="text"
                required
                maxLength={80}
                value={englishName}
                onChange={e => handleEnglishChange(e.target.value)}
                onBlur={handleBlurEnglish}
                placeholder="Contoh: watering can, desk lamp, coffee mug"
                className="w-full text-sm font-medium px-3.5 py-2.5 rounded-lg border border-stone-200 dark:border-stone-700 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/15 outline-none transition-all bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500"
              />
              {isTranslating && (
                <div className="absolute right-3 top-3 text-stone-400 animate-spin">
                  <RefreshCw className="w-4 h-4 text-emerald-600" />
                </div>
              )}
            </div>
          </div>

          {/* Meaning (Indonesian) & Pronunciation (Cara Baca) Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Indonesian Meaning */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="indonesian-input" className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                  Artinya (Bahasa Indonesia)
                </label>
              </div>
              <input
                id="indonesian-input"
                type="text"
                maxLength={100}
                value={indonesianName}
                onChange={e => setIndonesianName(e.target.value)}
                placeholder="Terisi otomatis..."
                className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-stone-200 dark:border-stone-700 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/15 outline-none transition-all bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500"
              />
            </div>

            {/* Cara Baca (Ejaan Bunyi) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="pronunciation-input" className="text-xs font-semibold text-stone-700 dark:text-stone-300 flex items-center gap-1">
                  <span>Cara Baca (Ejaan Bunyi)</span>
                </label>
                {pronunciation && (
                  <button
                    type="button"
                    onClick={() => handleSpeak(englishName)}
                    className="text-[11px] text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1 font-medium"
                  >
                    <Volume2 className="w-3 h-3" />
                    <span>Uji Bunyi</span>
                  </button>
                )}
              </div>
              <input
                id="pronunciation-input"
                type="text"
                maxLength={100}
                value={pronunciation}
                onChange={e => setPronunciation(e.target.value)}
                placeholder="Misal: wotering ken..."
                className="w-full text-sm font-mono px-3.5 py-2.5 rounded-lg border border-stone-200 dark:border-stone-700 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/15 outline-none transition-all bg-emerald-50/30 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 placeholder:text-stone-400 dark:placeholder:text-stone-500"
              />
            </div>
          </div>

          {/* Translation Status Badge */}
          {translationStatus && (
            <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium flex items-center justify-between px-1 -mt-1">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-500" />
                <span>{translationStatus}</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  if (englishName.trim()) {
                    handleEnglishChange(englishName.trim());
                  }
                }}
                className="text-stone-500 hover:text-emerald-700 dark:hover:text-emerald-400 text-[10px] flex items-center gap-1 hover:underline"
              >
                <RefreshCw className="w-2.5 h-2.5" />
                <span>Perbarui Terjemahan & Bunyi</span>
              </button>
            </div>
          )}

          {/* Example Sentence Input */}
          <div>
            <label htmlFor="sentence-input" className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1 flex items-center justify-between">
              <span>Contoh Kalimat Penggunaan (Opsional)</span>
              <span className="text-[10px] text-stone-400 dark:text-stone-500">Otomatis dari AI</span>
            </label>
            <input
              id="sentence-input"
              type="text"
              value={exampleSentence}
              onChange={e => setExampleSentence(e.target.value)}
              placeholder="Contoh: She filled the watering can with water..."
              className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-stone-200 dark:border-stone-700 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500 outline-none bg-stone-50/40 dark:bg-stone-800/60 text-stone-700 dark:text-stone-300 placeholder:text-stone-400 dark:placeholder:text-stone-500"
            />
          </div>

          {/* Category Selector */}
          <div>
            <label htmlFor="category-select" className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
              Folder Kategori
            </label>

            {!showNewCatInput ? (
              <div className="flex gap-2">
                <select
                  id="category-select"
                  required
                  value={categoryName}
                  onChange={e => setCategoryName(e.target.value)}
                  className="flex-1 text-sm px-3.5 py-2 rounded-lg border border-stone-200 dark:border-stone-700 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/15 outline-none bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-medium"
                >
                  <option value="" disabled>
                    Pilih folder kategori...
                  </option>
                  {categories.map(cat => (
                    <option key={cat.name} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowNewCatInput(true)}
                  className="px-3 py-2 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 border border-stone-200/80 dark:border-stone-700"
                  title="Buat folder baru"
                >
                  <FolderPlus className="w-4 h-4" />
                  <span>Baru</span>
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  autoFocus
                  maxLength={40}
                  value={newCatInput}
                  onChange={e => setNewCatInput(e.target.value)}
                  placeholder="Nama folder baru..."
                  className="flex-1 text-sm px-3.5 py-2 rounded-lg border border-emerald-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/15 outline-none bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                />
                <button
                  type="button"
                  onClick={handleAddNewCategory}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewCatInput(false)}
                  className="px-2.5 py-2 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 text-xs font-medium"
                >
                  Batal
                </button>
              </div>
            )}
          </div>

          {/* Form Status Notification */}
          {formStatus && (
            <div
              className={`p-2.5 rounded-lg text-xs font-medium flex items-center gap-2 ${
                formStatus.isError
                  ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
              }`}
            >
              {formStatus.isError ? (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              ) : (
                <Check className="w-4 h-4 shrink-0 text-emerald-600" />
              )}
              <span>{formStatus.text}</span>
            </div>
          )}

          {/* Save CTA */}
          <button
            type="submit"
            disabled={isSubmitting || !imageBlob || !englishName.trim()}
            className="w-full mt-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none text-white font-semibold rounded-xl transition-all shadow-sm shadow-emerald-700/20 text-sm flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Menyimpan ke Koleksi...</span>
              </>
            ) : (
              <>
                <span>Simpan ke Koleksi</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Action Footer: Folder Export, Backup, Import */}
        <div className="p-4 bg-stone-50 dark:bg-stone-950 border-t border-stone-200/70 dark:border-stone-800 flex flex-wrap gap-2 text-xs">
          <button
            type="button"
            onClick={() => onExportFolder(categoryName || activeFilterCategory || '')}
            className="flex-1 min-w-[120px] py-2 px-2.5 bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 font-medium rounded-lg border border-stone-200 dark:border-stone-700 flex items-center justify-center gap-1.5 transition-colors"
            title="Ekspor gambar folder ini ke hard drive komputer"
          >
            <FolderArchive className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
            <span>Ekspor Folder</span>
          </button>

          <button
            type="button"
            onClick={onDownloadBackup}
            className="py-2 px-2.5 bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 font-medium rounded-lg border border-stone-200 dark:border-stone-700 flex items-center justify-center gap-1.5 transition-colors"
            title="Unduh file backup JSON lengkap"
          >
            <Download className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
            <span>Backup</span>
          </button>

          <button
            type="button"
            onClick={() => importInputRef.current?.click()}
            className="py-2 px-2.5 bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 font-medium rounded-lg border border-stone-200 dark:border-stone-700 flex items-center justify-center gap-1.5 transition-colors"
            title="Pulihkan koleksi dari backup JSON"
          >
            <Upload className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
            <span>Import</span>
          </button>
          <input
            ref={importInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={e => {
              if (e.target.files && e.target.files[0]) {
                onImportBackup(e.target.files[0]);
                e.target.value = '';
              }
            }}
          />
        </div>
      </div>

      {/* Image Crop Modal */}
      <ImageCropModal
        imageFile={cropFile}
        isOpen={isCropModalOpen}
        onClose={() => setIsCropModalOpen(false)}
        onCropComplete={croppedBlob => {
          applyImageBlob(croppedBlob);
          onToast('Foto berhasil dipotong ke rasio 2:3!', 'success');
        }}
      />
    </>
  );
};
