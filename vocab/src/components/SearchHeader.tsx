import React, { forwardRef } from 'react';
import { Search, Dices, Loader2, History } from 'lucide-react';

interface SearchHeaderProps {
  inputValue: string;
  setInputValue: (val: string) => void;
  onSearch: (word?: string) => void;
  onRandom: () => void;
  isLoading: boolean;
  recentSearches: string[];
  onSelectRecent: (word: string) => void;
  onClearRecent?: () => void;
}

export const SearchHeader = forwardRef<HTMLInputElement, SearchHeaderProps>(
  (
    {
      inputValue,
      setInputValue,
      onSearch,
      onRandom,
      isLoading,
      recentSearches,
      onSelectRecent,
    },
    ref
  ) => {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        onSearch();
      }
    };

    return (
      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-sm shadow-slate-100 dark:shadow-none transition-colors">
        <div className="flex flex-col gap-1.5 mb-4">
          <div className="flex items-center justify-between">
            <label
              htmlFor="vocabSearchInput"
              className="text-sm font-bold text-slate-800 dark:text-slate-200"
            >
              Kata, frasa, atau klausa Bahasa Inggris:
            </label>
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500 font-mono">
              Tekan <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-[10px]">/</kbd> untuk fokus
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Ketik kosakata TOEFL akademik (contoh:{' '}
            <span className="font-semibold text-indigo-600 dark:text-indigo-400">
              unprecedented
            </span>
            ,{' '}
            <span className="font-semibold text-indigo-600 dark:text-indigo-400">
              narrow down
            </span>
            , atau{' '}
            <span className="font-semibold text-indigo-600 dark:text-indigo-400">
              I have been studying
            </span>
            )
          </p>
        </div>

        {/* Main search bar */}
        <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
          <div className="relative flex-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
              <Search className="h-5 w-5" />
            </div>
            <input
              ref={ref}
              id="vocabSearchInput"
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              placeholder="Contoh: unprecedented, ubiquitous, detrimental..."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-800/60 py-3.5 pl-11 pr-4 text-base text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all disabled:opacity-60"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onSearch()}
              disabled={isLoading || !inputValue.trim()}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition-all"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Menganalisis...</span>
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  <span>Analisis</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onRandom}
              disabled={isLoading}
              title="Pilih kata TOEFL AWL secara acak"
              className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 active:scale-95 disabled:opacity-50 transition-all"
            >
              <Dices className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <span className="hidden sm:inline">Acak AWL</span>
            </button>
          </div>
        </div>

        {/* Recent searches */}
        {recentSearches.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 dark:text-slate-500 mr-1">
              <History className="h-3.5 w-3.5" />
              <span>Terakhir dicari:</span>
            </div>
            {recentSearches.map((word) => (
              <button
                key={word}
                type="button"
                onClick={() => onSelectRecent(word)}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/80 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 hover:border-indigo-200 dark:hover:border-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-700 dark:hover:text-indigo-300 transition-all"
              >
                <span>{word}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }
);
SearchHeader.displayName = 'SearchHeader';
