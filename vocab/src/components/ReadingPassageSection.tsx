import React, { useState } from 'react';
import { BookOpen, Sparkles, CheckCircle2, XCircle, ArrowRight, Loader2 } from 'lucide-react';
import { ReadingPassage, SavedWord } from '../types';
import { generateReadingPassageAI } from '../services/gemini';

interface ReadingPassageSectionProps {
  targetWord: string;
  savedWords: SavedWord[];
  apiKey: string;
  onNeedApiKey: () => void;
}

export const ReadingPassageSection: React.FC<ReadingPassageSectionProps> = ({
  targetWord,
  savedWords,
  apiKey,
  onNeedApiKey,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [passageData, setPassageData] = useState<ReadingPassage | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isChecked, setIsChecked] = useState(false);

  const handleGenerate = async () => {
    if (!apiKey) {
      onNeedApiKey();
      return;
    }

    setIsLoading(true);
    setSelectedOption(null);
    setIsChecked(false);
    try {
      const otherWords = savedWords.map((w) => w.word).filter((w) => w.toLowerCase() !== targetWord.toLowerCase());
      const res = await generateReadingPassageAI(targetWord, otherWords, apiKey);
      setPassageData(res);
    } catch (err: unknown) {
      alert((err as Error).message || 'Gagal membuat teks bacaan TOEFL.');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to highlight target word in the passage text
  const renderPassageWithHighlights = (text: string) => {
    const parts = text.split(/(\[[^\]]+\])/g);
    return parts.map((part, i) => {
      if (part.startsWith('[') && part.endsWith(']')) {
        const wordClean = part.slice(1, -1);
        return (
          <mark
            key={i}
            className="rounded px-1.5 py-0.5 font-bold bg-amber-200 dark:bg-amber-900/80 text-amber-950 dark:text-amber-200"
          >
            {wordClean}
          </mark>
        );
      }
      return part;
    });
  };

  return (
    <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            Simulasi Bacaan TOEFL (*Reading Comprehension in Context*)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Baca paragraf artikel akademik utuh dan uji makna kata dalam konteks soal reading TOEFL iBT.
          </p>
        </div>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={isLoading}
          className="flex items-center gap-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/60 px-4 py-2 text-xs font-bold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900 active:scale-95 disabled:opacity-50 transition-all shadow-xs shrink-0"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Menyusun Paragraf...</span>
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>{passageData ? 'Buat Paragraf Lain' : '✨ Buat Paragraf Bacaan'}</span>
            </>
          )}
        </button>
      </div>

      {passageData ? (
        <div className="space-y-4 animate-in fade-in">
          {/* Passage Container */}
          <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850 p-4 sm:p-5 space-y-2">
            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
              TOEFL Reading Passage: {passageData.title}
            </span>
            <p className="text-sm leading-relaxed text-slate-800 dark:text-slate-200 font-serif">
              {renderPassageWithHighlights(passageData.passage)}
            </p>
          </div>

          {/* In-Context Question */}
          <div className="rounded-xl border border-indigo-100 dark:border-indigo-900/60 bg-white dark:bg-slate-800/80 p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between text-xs text-indigo-700 dark:text-indigo-300 font-bold">
              <span>Vocabulary in Context Question:</span>
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-relaxed">
              {passageData.question}
            </h4>

            {/* Options */}
            <div className="space-y-2">
              {passageData.options.map((opt, idx) => {
                const isSelected = selectedOption === idx;
                const isCorrect = idx === passageData.answerIndex;

                let btnStyle =
                  'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-indigo-300';

                if (isChecked) {
                  if (isCorrect) {
                    btnStyle =
                      'border-emerald-500 bg-emerald-50 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200 font-bold';
                  } else if (isSelected) {
                    btnStyle =
                      'border-rose-400 bg-rose-50 dark:bg-rose-950 text-rose-800 dark:text-rose-200';
                  }
                } else if (isSelected) {
                  btnStyle =
                    'border-indigo-600 bg-indigo-50 dark:bg-indigo-950 text-indigo-900 dark:text-indigo-200 font-bold';
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={isChecked}
                    onClick={() => setSelectedOption(idx)}
                    className={`w-full text-left rounded-xl border p-3 text-xs transition-all flex items-center justify-between ${btnStyle}`}
                  >
                    <span>{opt}</span>
                    {isChecked && isCorrect && (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 ml-2" />
                    )}
                    {isChecked && isSelected && !isCorrect && (
                      <XCircle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0 ml-2" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Feedback & Check */}
            {!isChecked ? (
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  disabled={selectedOption === null}
                  onClick={() => setIsChecked(true)}
                  className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 active:scale-95 disabled:opacity-40 transition-all"
                >
                  Periksa Jawaban
                </button>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 p-3.5 text-xs text-slate-700 dark:text-slate-300 space-y-1 animate-in fade-in">
                <span className="font-bold block text-slate-900 dark:text-slate-100">
                  {selectedOption === passageData.answerIndex ? '✅ Jawaban Benar!' : '❌ Belum Tepat!'}
                </span>
                <p>{passageData.explanation}</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="py-6 text-center text-xs text-slate-500 dark:text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-850">
          Klik tombol <strong>"Buat Paragraf Bacaan"</strong> untuk melihat bagaimana kata "{targetWord}" digunakan dalam konteks artikel ilmiah TOEFL utuh.
        </div>
      )}
    </div>
  );
};
