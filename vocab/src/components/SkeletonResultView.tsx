import React, { useState, useEffect } from 'react';
import { Sparkles, Brain, Loader2 } from 'lucide-react';

interface SkeletonResultViewProps {
  searchedWord?: string;
}

export const SkeletonResultView: React.FC<SkeletonResultViewProps> = ({ searchedWord }) => {
  const [phaseIndex, setPhaseIndex] = useState(0);

  const phases = [
    'Menghubungi Google Gemini 3.5 Flash...',
    'Menganalisis fonetik IPA & arti akademik...',
    'Mengekstrak sinonim, antonim, dan morfologi...',
    'Menyusun pola ChunkSpeak & contoh kalimat 3 tenses...',
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setPhaseIndex((prev) => (prev + 1) % phases.length);
    }, 1200);
    return () => clearInterval(timer);
  }, [phases.length]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header skeleton */}
      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="space-y-3 w-full max-w-md">
            <div className="flex items-center gap-3">
              <div className="h-10 w-48 rounded-xl animate-shimmer" />
              <div className="h-10 w-10 rounded-xl animate-shimmer" />
            </div>
            <div className="h-6 w-32 rounded-lg animate-shimmer" />
            <div className="h-5 w-64 rounded-lg animate-shimmer" />
          </div>
          <div className="h-11 w-44 rounded-xl animate-shimmer" />
        </div>

        {/* Dynamic status pill */}
        <div className="flex items-center gap-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 p-4">
          <Loader2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400 animate-spin shrink-0" />
          <div>
            <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200 block">
              {searchedWord ? `Menganalisis "${searchedWord}"...` : 'Sedang menganalisis kosa kata...'}
            </span>
            <p className="text-xs text-indigo-700 dark:text-indigo-400 mt-0.5">
              {phases[phaseIndex]}
            </p>
          </div>
        </div>

        {/* Pronunciation & Paragraph skeleton boxes */}
        <div className="h-28 rounded-xl animate-shimmer" />
        <div className="h-32 rounded-xl animate-shimmer" />
      </div>

      {/* Bento grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="h-44 rounded-2xl animate-shimmer" />
        <div className="h-44 rounded-2xl animate-shimmer" />
        <div className="h-40 rounded-2xl animate-shimmer" />
        <div className="h-40 rounded-2xl animate-shimmer" />
      </div>

      {/* Chunks and Tenses skeleton */}
      <div className="h-48 rounded-2xl animate-shimmer" />
      <div className="h-48 rounded-2xl animate-shimmer" />
    </div>
  );
};
