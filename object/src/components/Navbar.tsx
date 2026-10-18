import React from 'react';
import { BookOpen, Sparkles, Settings2, Layers, HelpCircle, Moon, Sun } from 'lucide-react';

interface NavbarProps {
  activeTab: 'library' | 'review' | 'guide';
  setActiveTab: (tab: 'library' | 'review' | 'guide') => void;
  cardsCount: number;
  dueCount: number;
  categoriesCount: number;
  onOpenSettings: () => void;
  onOpenUpload: () => void;
  storageStatusText: string;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  cardsCount,
  dueCount,
  categoriesCount,
  onOpenSettings,
  onOpenUpload,
  storageStatusText,
  isDarkMode,
  onToggleDarkMode
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-stone-900/90 backdrop-blur-md border-b border-stone-200/80 dark:border-stone-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Zone 1: Single Brand Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setActiveTab('library')}
              className="flex items-center gap-2.5 text-left group"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm shadow-emerald-700/20 group-hover:bg-emerald-700 transition-colors">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight text-stone-900 dark:text-stone-50 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                  ObjectEnglish
                </span>
                <span className="hidden sm:inline-block ml-2 text-xs font-medium text-stone-400 dark:text-stone-500">
                  Visual Vocabulary
                </span>
              </div>
            </button>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setActiveTab('library')}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
                activeTab === 'library'
                  ? 'bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900 shadow-sm'
                  : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Koleksi Benda</span>
              <span className="text-xs px-1.5 py-0.2 bg-stone-700/50 dark:bg-stone-300/60 text-stone-200 dark:text-stone-800 rounded font-mono">
                {cardsCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('review')}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
                activeTab === 'review'
                  ? 'bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900 shadow-sm'
                  : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              <Sparkles className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
              <span>Review Hafalan</span>
              {dueCount > 0 ? (
                <span className="text-xs px-2 py-0.5 bg-emerald-600 text-white rounded-full font-mono animate-pulse">
                  {dueCount}
                </span>
              ) : (
                <span className="text-xs px-1.5 py-0.2 bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-300 rounded font-mono">
                  0
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('guide')}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
                activeTab === 'guide'
                  ? 'bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900 shadow-sm'
                  : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              <span>Panduan 2:3</span>
            </button>
          </nav>

          {/* Zone 3: Actions & Settings */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Dark Mode Toggle */}
            <button
              type="button"
              onClick={onToggleDarkMode}
              className="p-2 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors border border-stone-200/70 dark:border-stone-800"
              title={isDarkMode ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
              aria-label="Mode Gelap"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              onClick={onOpenSettings}
              className="p-2 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors border border-stone-200/70 dark:border-stone-800"
              title="Pengaturan API Gemini & Backup"
              aria-label="Pengaturan"
            >
              <Settings2 className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenUpload}
              className="px-3.5 py-2 text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-lg transition-all shadow-sm shadow-emerald-700/20 whitespace-nowrap shrink-0"
            >
              + Tambah Benda
            </button>
          </div>
        </div>

        {/* Mobile Subnav for tabs */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-stone-200/60 dark:border-stone-800 text-xs">
          <button
            onClick={() => setActiveTab('library')}
            className={`py-1.5 px-3 rounded-md font-semibold ${
              activeTab === 'library'
                ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900'
                : 'text-stone-600 dark:text-stone-300'
            }`}
          >
            Koleksi ({cardsCount})
          </button>
          <button
            onClick={() => setActiveTab('review')}
            className={`py-1.5 px-3 rounded-md font-semibold flex items-center gap-1.5 ${
              activeTab === 'review'
                ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900'
                : 'text-stone-600 dark:text-stone-300'
            }`}
          >
            Review
            {dueCount > 0 && <span className="w-2 h-2 rounded-full bg-emerald-500" />}
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`py-1.5 px-3 rounded-md font-semibold ${
              activeTab === 'guide'
                ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900'
                : 'text-stone-600 dark:text-stone-300'
            }`}
          >
            Panduan 2:3
          </button>
        </div>
      </div>
    </header>
  );
};
