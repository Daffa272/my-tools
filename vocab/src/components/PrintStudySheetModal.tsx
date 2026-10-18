import React, { useState, useMemo } from 'react';
import {
  X,
  Printer,
  Copy,
  Check,
  Download,
  Filter,
  FileSpreadsheet,
  Grid,
  Sparkles,
  BookOpen,
  Layers,
  GraduationCap
} from 'lucide-react';
import { SavedWord, TOEFLTopic } from '../types';
import { getEnglishProficiency, getEstimatedCEFR, inferTOEFLTopic } from '../services/storage';

interface PrintStudySheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  words: SavedWord[];
}

export const PrintStudySheetModal: React.FC<PrintStudySheetModalProps> = ({
  isOpen,
  onClose,
  words,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'learning' | 'mastered'>('all');
  const [topicFilter, setTopicFilter] = useState<TOEFLTopic | 'all'>('all');
  const [sheetLayout, setSheetLayout] = useState<'table' | 'cards' | 'matrix'>('table');
  const [copied, setCopied] = useState(false);

  // Filter words
  const filteredWords = useMemo(() => {
    return words.filter((w) => {
      if (filterMode === 'learning' && getEnglishProficiency(w) !== 'Sedang Dipelajari') return false;
      if (filterMode === 'mastered' && getEnglishProficiency(w) !== 'Dikuasai') return false;

      if (topicFilter !== 'all') {
        const t = w.topic || inferTOEFLTopic(w.word, w.translation, w.tenses?.present?.example_en);
        if (t !== topicFilter) return false;
      }
      return true;
    });
  }, [words, filterMode, topicFilter]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyMarkdown = () => {
    if (!filteredWords.length) return;
    const header = '| No | Kosakata (TOEFL) | Level | Terjemahan Indonesia | Pola Chunk TOEFL | Kalimat Contoh Akademik |\n|---|---|---|---|---|---|\n';
    const rows = filteredWords.map((w, idx) => {
      const cefr = getEstimatedCEFR(w.word).level;
      const chunk = w.chunks?.[0]?.pattern || '-';
      const example = (w.tenses?.present?.example_en || w.chunks?.[0]?.example_en || '-').replace(/\|/g, '/');
      const trans = w.translation.replace(/\|/g, '/');
      return `| ${idx + 1} | **${w.word}** | ${cefr} | ${trans} | \`${chunk}\` | *${example}* |`;
    }).join('\n');

    navigator.clipboard.writeText(header + rows);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadTxt = () => {
    if (!filteredWords.length) return;
    const title = `LEMBAR BELAJAR KOSAKATA TOEFL iBT\nTanggal Cetak: ${new Date().toLocaleDateString('id-ID')}\nTotal Kosakata: ${filteredWords.length}\n${'='.repeat(70)}\n\n`;
    const content = filteredWords.map((w, idx) => {
      const cefr = getEstimatedCEFR(w.word);
      const chunks = (w.chunks || []).map((c) => `   - Pola: ${c.pattern}\n     Contoh: ${c.example_en}\n     Arti: ${c.example_id}`).join('\n');
      const wf = w.word_family;
      const familyStr = wf ? `   - Turunan: Noun (${wf.noun || '-'}), Verb (${wf.verb || '-'}), Adj (${wf.adjective || '-'}), Adv (${wf.adverb || '-'})` : '';

      return `${idx + 1}. ${w.word.toUpperCase()} [${w.phonetic || ''}] (${cefr.level})\n` +
        `   Arti: ${w.translation}\n` +
        (w.synonyms?.length ? `   Sinonim: ${w.synonyms.join(', ')}\n` : '') +
        (chunks ? `   Pola Chunk:\n${chunks}\n` : '') +
        (familyStr ? `${familyStr}\n` : '') +
        `   Contoh Kalimat: "${w.tenses?.present?.example_en || w.chunks?.[0]?.example_en || '-'}"\n` +
        `   [ ] Review 1   [ ] Review 2   [ ] Review 3 (Mastered)\n` +
        `${'-'.repeat(50)}`;
    }).join('\n\n');

    const blob = new Blob([title + content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `toefl-study-sheet-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/70 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-200 print:p-0 print:bg-white print:static print:z-0">
      <div className="relative w-full max-w-5xl h-[92vh] flex flex-col rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden print:border-none print:shadow-none print:h-auto print:max-w-none print:w-full print:rounded-none">
        {/* Header - Screen only */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 px-6 py-4 bg-slate-50/70 dark:bg-slate-800/50 print:hidden shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20">
              <Printer className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Cetak Lembar Studi & PDF Cheatsheet
                </h3>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  {filteredWords.length} Kata Siap Cetak
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Format dokumen siap cetak A4 atau ekspor ke PDF untuk belajar offline tanpa gadget.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyMarkdown}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-xs"
              title="Salin tabel format Markdown untuk Notion / Obsidian"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5 text-slate-400" />}
              <span>{copied ? 'Tersalin!' : 'Salin MD'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadTxt}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-xs"
              title="Unduh file teks sederhana (.txt)"
            >
              <Download className="h-3.5 w-3.5 text-slate-400" />
              <span>Unduh TXT</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 active:scale-95 transition-all"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Cetak / Simpan PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300 transition-colors ml-2"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Filter & Layout Bar - Screen only */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800 px-6 py-2.5 bg-white dark:bg-slate-900 print:hidden shrink-0 text-xs">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px] mr-1">Status:</span>
            {(['all', 'learning', 'mastered'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setFilterMode(mode)}
                className={`rounded-lg px-2.5 py-1 font-semibold transition-all ${
                  filterMode === mode
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {mode === 'all' ? 'Semua' : mode === 'learning' ? 'Sedang Dipelajari' : 'Dikuasai'}
              </button>
            ))}
          </div>

          {/* Topic Filter */}
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px] mr-1">Topik:</span>
            <select
              value={topicFilter}
              onChange={(e) => setTopicFilter(e.target.value as TOEFLTopic | 'all')}
              className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-slate-700 dark:text-slate-200 font-medium focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">Semua Domain TOEFL</option>
              <option value="biology">Biology & Life Science</option>
              <option value="history">History & Archaeology</option>
              <option value="psychology">Psychology & Behavior</option>
              <option value="geology">Geology & Earth Science</option>
              <option value="economics">Economics & Trade</option>
              <option value="general">General Academic</option>
            </select>
          </div>

          {/* Layout Options */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setSheetLayout('table')}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-semibold transition-all ${
                sheetLayout === 'table'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
              }`}
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span>Tabel Cheatsheet</span>
            </button>

            <button
              type="button"
              onClick={() => setSheetLayout('cards')}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-semibold transition-all ${
                sheetLayout === 'cards'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
              }`}
            >
              <Grid className="h-3.5 w-3.5" />
              <span>Kartu Saku (Pocket Cards)</span>
            </button>

            <button
              type="button"
              onClick={() => setSheetLayout('matrix')}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-semibold transition-all ${
                sheetLayout === 'matrix'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Matriks Morfologi</span>
            </button>
          </div>
        </div>

        {/* Printable Preview Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-slate-100/50 dark:bg-slate-950/60 print:bg-white print:p-0 print:overflow-visible">
          <div className="max-w-4xl mx-auto bg-white print:bg-white text-slate-900 print:text-black p-8 sm:p-10 rounded-2xl shadow-sm border border-slate-200/80 print:border-none print:shadow-none print:p-0 print:max-w-none">
            {/* Document Header */}
            <div className="border-b-2 border-slate-900 pb-4 mb-6 flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-black tracking-tight uppercase text-slate-950">
                  TOEFL iBT Academic Vocabulary Master Sheet
                </h1>
                <p className="text-xs text-slate-600 mt-1 font-medium">
                  Spaced Repetition & Academic Word List (AWL) Study Guide · Dicetak pada {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
              <div className="text-right">
                <span className="inline-block border border-slate-900 px-3 py-1 font-mono text-xs font-bold uppercase">
                  Total: {filteredWords.length} Words
                </span>
                <p className="text-[10px] text-slate-500 mt-1">VocabMaster Suite</p>
              </div>
            </div>

            {filteredWords.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                Tidak ada kata yang sesuai dengan filter yang dipilih.
              </div>
            ) : sheetLayout === 'table' ? (
              /* LAYOUT 1: Table Cheatsheet */
              <div className="space-y-4">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b-2 border-slate-800 bg-slate-100 font-bold text-slate-900">
                      <th className="py-2.5 px-2 w-8 text-center">#</th>
                      <th className="py-2.5 px-3 w-40">Kata & Fonetik</th>
                      <th className="py-2.5 px-2 w-14 text-center">Level</th>
                      <th className="py-2.5 px-3 w-48">Arti Indonesia</th>
                      <th className="py-2.5 px-3">Pola Chunk & Contoh TOEFL</th>
                      <th className="py-2.5 px-2 w-24 text-center">Checklist</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredWords.map((w, idx) => {
                      const cefr = getEstimatedCEFR(w.word);
                      const chunk = w.chunks?.[0];
                      const academicEx = w.tenses?.present?.example_en || chunk?.example_en || '-';

                      return (
                        <tr key={w.word} className="hover:bg-slate-50/80 transition-colors break-inside-avoid">
                          <td className="py-2.5 px-2 text-center text-slate-400 font-mono text-[11px] align-top">
                            {idx + 1}
                          </td>
                          <td className="py-2.5 px-3 align-top">
                            <span className="font-extrabold text-sm text-slate-950 block capitalize">
                              {w.word}
                            </span>
                            {w.phonetic && (
                              <span className="font-mono text-[11px] text-indigo-700 font-medium">
                                {w.phonetic}
                              </span>
                            )}
                            {w.synonyms && w.synonyms.length > 0 && (
                              <p className="text-[10px] text-slate-500 mt-0.5">
                                Syn: {w.synonyms.slice(0, 2).join(', ')}
                              </p>
                            )}
                          </td>
                          <td className="py-2.5 px-2 text-center align-top">
                            <span className="inline-block px-1.5 py-0.5 rounded font-mono font-bold text-[10px] bg-slate-100 border border-slate-300">
                              {cefr.level}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 align-top font-medium text-slate-800">
                            {w.translation}
                          </td>
                          <td className="py-2.5 px-3 align-top space-y-1">
                            {chunk && (
                              <div className="font-mono text-[11px] font-bold text-indigo-900 bg-indigo-50/60 px-2 py-0.5 rounded border border-indigo-100">
                                {chunk.pattern}
                              </div>
                            )}
                            <p className="italic text-slate-700 text-[11px] leading-relaxed">
                              "{academicEx}"
                            </p>
                          </td>
                          <td className="py-2.5 px-2 align-top text-center">
                            <div className="flex items-center justify-center gap-1.5 pt-1">
                              <span className="w-4 h-4 border border-slate-400 rounded-sm inline-block" title="Review 1"></span>
                              <span className="w-4 h-4 border border-slate-400 rounded-sm inline-block" title="Review 2"></span>
                              <span className="w-4 h-4 border border-slate-400 rounded-sm inline-block" title="Review 3"></span>
                            </div>
                            <span className="text-[9px] text-slate-400 block mt-1">1 · 2 · 3</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : sheetLayout === 'cards' ? (
              /* LAYOUT 2: Printable Pocket Flashcards */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredWords.map((w, idx) => {
                  const cefr = getEstimatedCEFR(w.word);
                  const chunk = w.chunks?.[0];
                  const example = w.tenses?.present?.example_en || chunk?.example_en || '-';

                  return (
                    <div
                      key={w.word}
                      className="border-2 border-dashed border-slate-300 p-4 rounded-xl space-y-3 break-inside-avoid relative"
                    >
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <span className="text-[10px] font-mono font-bold text-slate-400">
                          #{idx + 1} · {cefr.level}
                        </span>
                        <div className="flex items-center gap-1">
                          <span className="w-3.5 h-3.5 border border-slate-400 rounded-xs"></span>
                          <span className="w-3.5 h-3.5 border border-slate-400 rounded-xs"></span>
                          <span className="w-3.5 h-3.5 border border-slate-400 rounded-xs"></span>
                        </div>
                      </div>

                      <div className="text-center py-2">
                        <h3 className="text-xl font-black capitalize tracking-tight text-slate-900">
                          {w.word}
                        </h3>
                        {w.phonetic && (
                          <span className="font-mono text-xs text-indigo-700 font-semibold block mt-0.5">
                            {w.phonetic}
                          </span>
                        )}
                      </div>

                      <div className="border-t border-slate-200 pt-2 space-y-1.5 text-xs">
                        <div>
                          <span className="font-bold text-slate-500 text-[10px] uppercase tracking-wider block">
                            Arti:
                          </span>
                          <p className="font-semibold text-slate-900">{w.translation}</p>
                        </div>

                        {chunk && (
                          <div>
                            <span className="font-bold text-slate-500 text-[10px] uppercase tracking-wider block">
                              Pola Chunk:
                            </span>
                            <span className="font-mono text-[11px] font-bold text-indigo-900">
                              {chunk.pattern}
                            </span>
                          </div>
                        )}

                        <div>
                          <span className="font-bold text-slate-500 text-[10px] uppercase tracking-wider block">
                            Contoh Kalimat:
                          </span>
                          <p className="italic text-slate-700 text-[11px]">"{example}"</p>
                        </div>
                      </div>

                      <span className="absolute bottom-1 right-2 text-[9px] text-slate-300 font-mono">
                        ✂ gunting di sini
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* LAYOUT 3: Morphology Matrix */
              <div className="space-y-4">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b-2 border-slate-800 bg-slate-100 font-bold text-slate-900">
                      <th className="py-2.5 px-3 w-36">Kosakata Utama</th>
                      <th className="py-2.5 px-3">Morfologi (Akar / Prefiks / Sufiks)</th>
                      <th className="py-2.5 px-3">Word Family (Noun, Verb, Adj, Adv)</th>
                      <th className="py-2.5 px-3">Academic Collocations</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredWords.map((w) => {
                      const m = w.morphology;
                      const wf = w.word_family;
                      return (
                        <tr key={w.word} className="hover:bg-slate-50/80 break-inside-avoid">
                          <td className="py-3 px-3 align-top">
                            <span className="font-extrabold text-sm text-slate-950 block capitalize">
                              {w.word}
                            </span>
                            <span className="text-xs text-slate-600 block">{w.translation}</span>
                          </td>
                          <td className="py-3 px-3 align-top space-y-1">
                            {m ? (
                              <div className="text-[11px] space-y-0.5">
                                <div><strong className="text-slate-500">Prefix:</strong> {m.prefix || '-'}</div>
                                <div><strong className="text-slate-500">Root:</strong> {m.root || '-'}</div>
                                <div><strong className="text-slate-500">Suffix:</strong> {m.suffix || '-'}</div>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">-</span>
                            )}
                          </td>
                          <td className="py-3 px-3 align-top">
                            {wf ? (
                              <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px]">
                                <div><span className="text-slate-400 text-[10px]">Noun:</span> {wf.noun || '-'}</div>
                                <div><span className="text-slate-400 text-[10px]">Verb:</span> {wf.verb || '-'}</div>
                                <div><span className="text-slate-400 text-[10px]">Adj:</span> {wf.adjective || '-'}</div>
                                <div><span className="text-slate-400 text-[10px]">Adv:</span> {wf.adverb || '-'}</div>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">-</span>
                            )}
                          </td>
                          <td className="py-3 px-3 align-top">
                            {w.collocations && w.collocations.length > 0 ? (
                              <ul className="list-disc list-inside text-[11px] text-slate-700 space-y-0.5">
                                {w.collocations.map((c) => (
                                  <li key={c}>{c}</li>
                                ))}
                              </ul>
                            ) : (
                              <span className="text-slate-400 italic">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Document Footer */}
            <div className="mt-8 pt-4 border-t border-slate-300 flex items-center justify-between text-[10px] text-slate-500">
              <span>Metode Spaced Repetition SM-2: Ulangi kotak [1] besok, [2] dalam 3 hari, dan [3] dalam 1 minggu.</span>
              <span>Disusun untuk Persiapan TOEFL iBT & IELTS Academic</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
