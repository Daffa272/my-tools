import React, { useState, useEffect } from 'react';
import { KBBICard } from '../types';
import { completeWordWithAI, generateFiveWordsAI } from '../utils/ai';
import { divideIndonesianSyllables, THEMATIC_CATEGORIES } from '../utils/streak';
import {
  Sparkles,
  Plus,
  Save,
  X,
  Wand2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Tag
} from 'lucide-react';

interface WordFormProps {
  editingCard: KBBICard | null;
  onSave: (card: Omit<KBBICard, 'repetition' | 'easiness' | 'interval' | 'nextReviewDate'>) => void;
  onCancelEdit: () => void;
  onAddMultiple: (cards: Array<Partial<KBBICard>>) => void;
  onSeedCards: () => void;
  apiKey: string;
  onShowKeyModal: () => void;
}

export const WordForm: React.FC<WordFormProps> = ({
  editingCard,
  onSave,
  onCancelEdit,
  onAddMultiple,
  onSeedCards,
  apiKey,
  onShowKeyModal,
}) => {
  const [word, setWord] = useState('');
  const [meaning, setMeaning] = useState('');
  const [example, setExample] = useState('');
  const [note, setNote] = useState('');
  const [synonyms, setSynonyms] = useState('');
  const [antonyms, setAntonyms] = useState('');
  const [category, setCategory] = useState('Umum & Sehari-hari');
  const [syllables, setSyllables] = useState('');
  const [wordClass, setWordClass] = useState('');
  const [etymology, setEtymology] = useState('');

  const [aiLoading, setAiLoading] = useState(false);
  const [generateLoading, setGenerateLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'info' | 'error' | 'success' } | null>(null);

  // Sync form when editingCard changes
  useEffect(() => {
    if (editingCard) {
      setWord(editingCard.word);
      setMeaning(editingCard.meaning);
      setExample(editingCard.example);
      setNote(editingCard.note || '');
      setSynonyms((editingCard.synonyms || []).join(', '));
      setAntonyms((editingCard.antonyms || []).join(', '));
      setCategory(editingCard.category || 'Umum & Sehari-hari');
      setSyllables(editingCard.syllables || divideIndonesianSyllables(editingCard.word));
      setWordClass(editingCard.wordClass || '');
      setEtymology(editingCard.etymology || '');
      setStatusMessage({ text: `Memuat "${editingCard.word}" untuk diedit.`, type: 'info' });
    } else {
      setWord('');
      setMeaning('');
      setExample('');
      setNote('');
      setSynonyms('');
      setAntonyms('');
      setCategory('Umum & Sehari-hari');
      setSyllables('');
      setWordClass('');
      setEtymology('');
      setStatusMessage(null);
    }
  }, [editingCard]);

  // Auto-generate syllables as word is typed if not manually edited
  const handleWordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setWord(val);
    if (!editingCard && val.trim()) {
      setSyllables(divideIndonesianSyllables(val));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!word.trim() || !meaning.trim() || !example.trim()) {
      setStatusMessage({ text: 'Kata, arti KBBI, dan contoh kalimat wajib diisi.', type: 'error' });
      return;
    }

    const cleanSynonyms = synonyms.split(',').map(s => s.trim()).filter(Boolean);
    const cleanAntonyms = antonyms.split(',').map(a => a.trim()).filter(Boolean);

    onSave({
      word: word.trim(),
      meaning: meaning.trim(),
      example: example.trim(),
      note: note.trim() || undefined,
      synonyms: cleanSynonyms,
      antonyms: cleanAntonyms,
      category: category || 'Umum & Sehari-hari',
      syllables: syllables.trim() || divideIndonesianSyllables(word.trim()),
      wordClass: wordClass.trim() || undefined,
      etymology: etymology.trim() || undefined
    });

    if (!editingCard) {
      setWord('');
      setMeaning('');
      setExample('');
      setNote('');
      setSynonyms('');
      setAntonyms('');
      setCategory('Umum & Sehari-hari');
      setSyllables('');
      setWordClass('');
      setEtymology('');
    }
    setStatusMessage({ text: 'Kartu berhasil disimpan!', type: 'success' });
  };

  const handleAIComplete = async () => {
    const trimmed = word.trim();
    if (!trimmed) {
      setStatusMessage({ text: 'Ketikkan nama kata terlebih dahulu.', type: 'error' });
      return;
    }
    if (!apiKey) {
      onShowKeyModal();
      setStatusMessage({ text: 'Harap masukkan Gemini API Key terlebih dahulu.', type: 'error' });
      return;
    }

    setAiLoading(true);
    setStatusMessage({ text: `AI sedang mencari definisi KBBI untuk "${trimmed}"...`, type: 'info' });

    try {
      const data = await completeWordWithAI(trimmed, apiKey);
      if (data.meaning) setMeaning(data.meaning);
      if (data.example) setExample(data.example);
      if (data.note) setNote(data.note);
      if (data.synonyms && data.synonyms.length > 0) {
        setSynonyms(data.synonyms.join(', '));
      }
      if (data.antonyms && data.antonyms.length > 0) {
        setAntonyms(data.antonyms.join(', '));
      }
      if (data.wordClass) setWordClass(data.wordClass);
      if (data.etymology) setEtymology(data.etymology);
      setSyllables(divideIndonesianSyllables(trimmed));
      setStatusMessage({ text: 'Definisi, kelas kata & etimologi berhasil dilengkapi AI.', type: 'success' });
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Gagal memproses AI.', type: 'error' });
    } finally {
      setAiLoading(false);
    }
  };

  const handleGenerateFive = async () => {
    if (!apiKey) {
      onShowKeyModal();
      setStatusMessage({ text: 'Harap masukkan Gemini API Key terlebih dahulu.', type: 'error' });
      return;
    }

    setGenerateLoading(true);
    setStatusMessage({ text: 'AI sedang menyusun 5 kosa kata KBBI baku yang menarik...', type: 'info' });

    try {
      const cards = await generateFiveWordsAI(apiKey);
      // Enrich with syllables & category
      const enriched = cards.map(c => ({
        ...c,
        category: 'Sastra & Arkais',
        syllables: c.word ? divideIndonesianSyllables(c.word) : undefined
      }));
      onAddMultiple(enriched);
      setStatusMessage({ text: `Berhasil menambahkan ${cards.length} kosa kata baru ke koleksi!`, type: 'success' });
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Gagal membuat kosa kata.', type: 'error' });
    } finally {
      setGenerateLoading(false);
    }
  };

  const formCategories = THEMATIC_CATEGORIES.filter(c => c !== 'Semua');

  return (
    <div className="rounded-3xl border border-stone-200/90 bg-white p-5 sm:p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-stone-100">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800">
            {editingCard ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          </div>
          <div>
            <h2 className="font-serif text-base font-bold text-stone-900">
              {editingCard ? `Edit: ${editingCard.word}` : 'Tambah Kosa Kata Baru'}
            </h2>
            <p className="text-[11px] text-stone-500">
              {editingCard ? 'Perbarui definisi, contoh, tema, atau suku kata' : 'Tambahkan leksikon atau gunakan generator AI'}
            </p>
          </div>
        </div>

        {editingCard && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-stone-600 hover:bg-stone-100 hover:text-stone-900 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
            <span>Batal</span>
          </button>
        )}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        {/* Word Field with Inline AI Assist */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="form-word" className="text-xs font-semibold text-stone-700">
              Kata / Frasa <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={handleAIComplete}
              disabled={aiLoading || !word.trim()}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100/80 px-2 py-0.5 rounded transition-colors disabled:opacity-50 cursor-pointer"
              title="Lengkapi otomatis dengan Gemini AI"
            >
              {aiLoading ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin text-emerald-700" />
                  <span>Menganalisis...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3 w-3 text-emerald-600" />
                  <span>AI Lengkapi Kata</span>
                </>
              )}
            </button>
          </div>
          <input
            id="form-word"
            type="text"
            required
            value={word}
            onChange={handleWordChange}
            placeholder="Contoh: arkais, nirmala, praduga..."
            className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm font-serif font-bold text-stone-900 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 placeholder:font-sans placeholder:font-normal"
          />
        </div>

        {/* Syllables & Category in Two Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="form-syllables" className="block text-xs font-semibold text-stone-700 mb-1.5">
              Pemenggalan Suku Kata
            </label>
            <input
              id="form-syllables"
              type="text"
              value={syllables}
              onChange={(e) => setSyllables(e.target.value)}
              placeholder="ar·ka·is"
              className="w-full rounded-xl border border-stone-300 px-3 py-2 text-xs font-mono text-stone-900 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
            />
          </div>

          <div>
            <label htmlFor="form-category" className="block text-xs font-semibold text-stone-700 mb-1.5">
              Tema / Kategori
            </label>
            <select
              id="form-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border border-stone-300 px-3 py-2 text-xs text-stone-900 bg-white shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
            >
              {formCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Word Class & Etymology in Two Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="form-wordclass" className="block text-xs font-semibold text-stone-700 mb-1.5">
              Kelas Kata <span className="text-stone-400 font-normal">(n, v, a, adv, dll.)</span>
            </label>
            <input
              id="form-wordclass"
              type="text"
              value={wordClass}
              onChange={(e) => setWordClass(e.target.value)}
              placeholder="Contoh: a (Adjektiva), n (Nomina)"
              className="w-full rounded-xl border border-stone-300 px-3 py-2 text-xs text-stone-900 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
            />
          </div>

          <div>
            <label htmlFor="form-etymology" className="block text-xs font-semibold text-stone-700 mb-1.5">
              Asal Bahasa / Etimologi <span className="text-stone-400 font-normal">(opsional)</span>
            </label>
            <input
              id="form-etymology"
              type="text"
              value={etymology}
              onChange={(e) => setEtymology(e.target.value)}
              placeholder="Contoh: Sanskerta, Arab, Melayu Klasik"
              className="w-full rounded-xl border border-stone-300 px-3 py-2 text-xs text-stone-900 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
            />
          </div>
        </div>

        {/* Meaning Field */}
        <div>
          <label htmlFor="form-meaning" className="block text-xs font-semibold text-stone-700 mb-1.5">
            Arti Menurut KBBI <span className="text-red-500">*</span>
          </label>
          <textarea
            id="form-meaning"
            required
            rows={3}
            value={meaning}
            onChange={(e) => setMeaning(e.target.value)}
            placeholder="Tuliskan arti atau definisi resmi KBBI..."
            className="w-full rounded-xl border border-stone-300 px-3.5 py-2 text-sm text-stone-900 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
          />
        </div>

        {/* Example Sentence Field */}
        <div>
          <label htmlFor="form-example" className="block text-xs font-semibold text-stone-700 mb-1.5">
            Contoh Kalimat <span className="text-red-500">*</span>
          </label>
          <textarea
            id="form-example"
            required
            rows={2}
            value={example}
            onChange={(e) => setExample(e.target.value)}
            placeholder="Kalimat yang membantu mengingat penggunaan kata dalam konteks nyata..."
            className="w-full rounded-xl border border-stone-300 px-3.5 py-2 text-sm text-stone-900 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
          />
        </div>

        {/* Note / Translation Field */}
        <div>
          <label htmlFor="form-note" className="block text-xs font-semibold text-stone-700 mb-1.5">
            Makna Kalimat / Catatan Tambahan <span className="text-stone-400 font-normal">(opsional)</span>
          </label>
          <input
            id="form-note"
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Konteks pemakaian, etimologi, atau makna kalimat di atas..."
            className="w-full rounded-xl border border-stone-300 px-3.5 py-2 text-sm text-stone-900 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
          />
        </div>

        {/* Synonyms & Antonyms in Two Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="form-synonyms" className="block text-xs font-semibold text-stone-700 mb-1.5">
              Sinonim <span className="text-stone-400 font-normal">(pisahkan koma)</span>
            </label>
            <input
              id="form-synonyms"
              type="text"
              value={synonyms}
              onChange={(e) => setSynonyms(e.target.value)}
              placeholder="kuno, kolot..."
              className="w-full rounded-xl border border-stone-300 px-3 py-2 text-xs text-stone-900 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
            />
          </div>

          <div>
            <label htmlFor="form-antonyms" className="block text-xs font-semibold text-stone-700 mb-1.5">
              Antonim <span className="text-stone-400 font-normal">(pisahkan koma)</span>
            </label>
            <input
              id="form-antonyms"
              type="text"
              value={antonyms}
              onChange={(e) => setAntonyms(e.target.value)}
              placeholder="modern, mutakhir..."
              className="w-full rounded-xl border border-stone-300 px-3 py-2 text-xs text-stone-900 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
            />
          </div>
        </div>

        {/* Status Alert */}
        {statusMessage && (
          <div
            className={`flex items-start gap-2 rounded-xl p-3 text-xs ${
              statusMessage.type === 'error'
                ? 'bg-rose-50 text-rose-800 border border-rose-200'
                : statusMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-amber-50 text-amber-800 border border-amber-200'
            }`}
          >
            {statusMessage.type === 'error' ? (
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
            ) : statusMessage.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600" />
            ) : (
              <Loader2 className="h-4 w-4 shrink-0 mt-0.5 animate-spin text-amber-600" />
            )}
            <span className="leading-snug">{statusMessage.text}</span>
          </div>
        )}

        {/* Actions */}
        <div className="pt-2 flex flex-col sm:flex-row gap-2">
          <button
            type="submit"
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-800 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-900 active:scale-98 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>{editingCard ? 'Perbarui Kartu' : '+ Simpan Kartu'}</span>
          </button>

          <button
            type="button"
            onClick={handleGenerateFive}
            disabled={generateLoading}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-stone-300 bg-stone-50 px-3.5 py-2.5 text-xs font-bold text-stone-700 hover:bg-stone-100 hover:text-stone-900 transition-colors cursor-pointer disabled:opacity-60"
            title="Biarkan AI menambahkan 5 kata baru berkualitas"
          >
            {generateLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-700" />
            ) : (
              <Wand2 className="h-3.5 w-3.5 text-amber-600" />
            )}
            <span>Generate 5 Kata AI</span>
          </button>

          <button
            type="button"
            onClick={onSeedCards}
            className="inline-flex items-center justify-center gap-1 rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-xs font-semibold text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition-colors"
            title="Isi contoh kartu kosa kata klasik"
          >
            <span>Contoh Kartu</span>
          </button>
        </div>

        <p className="text-[11px] text-stone-400 text-center pt-1">
          Data tersimpan di penyimpanan lokal peramban. Definisi merujuk pada standar KBBI.
        </p>
      </form>
    </div>
  );
};
