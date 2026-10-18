import React, { useState } from 'react';
import {
  PenTool,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Volume2,
  Copy,
  Check,
  Loader2,
  ArrowRight
} from 'lucide-react';
import { WritingEvaluationResult } from '../types';
import { evaluateUserSentenceAI } from '../services/gemini';
import { speakEnglish } from '../services/speech';

interface SentenceWritingSandboxProps {
  targetWord: string;
  apiKey: string;
  onNeedApiKey: () => void;
}

export const SentenceWritingSandbox: React.FC<SentenceWritingSandboxProps> = ({
  targetWord,
  apiKey,
  onNeedApiKey,
}) => {
  const [userSentence, setUserSentence] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<WritingEvaluationResult | null>(null);
  const [copied, setCopied] = useState(false);

  const handleEvaluate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userSentence.trim()) return;

    if (!apiKey) {
      onNeedApiKey();
      return;
    }

    setIsLoading(true);
    setResult(null);
    try {
      const evaluation = await evaluateUserSentenceAI(targetWord, userSentence.trim(), apiKey);
      setResult(evaluation);
    } catch (err: unknown) {
      alert((err as Error).message || 'Gagal mengevaluasi kalimat.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyImproved = () => {
    if (!result?.improvedVersion) return;
    navigator.clipboard.writeText(result.improvedVersion);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <PenTool className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            Sandbox Latihan Menulis Kalimat (*TOEFL Writing Coach*)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Latih kemampuan merangkai kalimat esai Anda dengan kata "{targetWord}" dan dapatkan koreksi instan.
          </p>
        </div>
      </div>

      {/* Writing Form */}
      <form onSubmit={handleEvaluate} className="space-y-3">
        <div className="relative">
          <textarea
            rows={3}
            value={userSentence}
            onChange={(e) => setUserSentence(e.target.value)}
            disabled={isLoading}
            placeholder={`Tulis kalimat bahasa Inggris yang memuat kata "${targetWord}"... (contoh: Scientists have observed unprecedented climatic shifts in polar regions.)`}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60 p-3.5 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all leading-relaxed"
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[11px] text-slate-400 dark:text-slate-500">
            {userSentence.length} karakter
          </span>

          <button
            type="submit"
            disabled={isLoading || !userSentence.trim()}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 active:scale-95 disabled:opacity-40 transition-all"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>AI Sedang Memeriksa...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                <span>Koreksi Tata Bahasa & Gaya TOEFL</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Evaluation Results */}
      {result && (
        <div className="rounded-xl border border-indigo-100 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/20 p-4 sm:p-5 space-y-4 animate-in fade-in duration-300">
          {/* Score Header */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-indigo-100 dark:border-indigo-900/50">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Skor Penilaian Esai TOEFL:
              </span>
              <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-indigo-600 text-white shadow-xs">
                {result.bandLabel}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              {result.isGrammaticallyCorrect ? (
                <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Tata Bahasa Benar
                </span>
              ) : (
                <span className="flex items-center gap-1 text-amber-700 dark:text-amber-400">
                  <AlertCircle className="h-3.5 w-3.5" /> Perlu Penyempurnaan
                </span>
              )}
            </div>
          </div>

          {/* Feedback Blocks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 space-y-1">
              <span className="font-bold text-slate-900 dark:text-slate-100 block">
                Ulasan Tata Bahasa & Struktur
              </span>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                {result.grammarFeedback}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 space-y-1">
              <span className="font-bold text-slate-900 dark:text-slate-100 block">
                Ulasan Kolokasi & Nada Akademik
              </span>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                {result.collocationFeedback}
              </p>
            </div>
          </div>

          {/* Upgraded Revision (TOEFL 28+) */}
          {result.improvedVersion && (
            <div className="rounded-xl border border-emerald-200/80 dark:border-emerald-900/60 bg-emerald-50/70 dark:bg-emerald-950/40 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-emerald-600" />
                  Versi Tingkat Lanjut (*Academic Model Revision*)
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => speakEnglish(result.improvedVersion)}
                    title="Dengarkan pengucapan versi revisi"
                    className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-bold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors"
                  >
                    <Volume2 className="h-3.5 w-3.5" />
                    <span>Dengarkan</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyImproved}
                    title="Salin kalimat ke clipboard"
                    className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-bold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copied ? 'Tersalin!' : 'Salin'}</span>
                  </button>
                </div>
              </div>

              <p className="text-xs sm:text-sm font-semibold text-emerald-950 dark:text-emerald-100 leading-relaxed font-serif">
                "{result.improvedVersion}"
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
