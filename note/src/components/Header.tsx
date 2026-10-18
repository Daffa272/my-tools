import React, { useRef } from 'react';
import { Download, Upload, Key, FileText, MessageSquareQuote, LayoutGrid, Sun, Moon, Keyboard, Flame, Trophy, Search } from 'lucide-react';
import { exportBackupToFile, applyBackupData } from '../utils/backup';
import { BackupData } from '../types';

interface HeaderProps {
  activeTab: 'notes' | 'conversations' | 'avatar' | 'chinese' | 'split';
  setActiveTab: (tab: 'notes' | 'conversations' | 'avatar' | 'chinese' | 'split') => void;
  hasApiKey: boolean;
  onOpenApiKeyModal: () => void;
  onDataImported: () => void;
  onShowToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenShortcutsModal: () => void;
  onOpenCommandPalette?: () => void;
  onOpenMilestones?: () => void;
  streakCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  hasApiKey,
  onOpenApiKeyModal,
  onDataImported,
  onShowToast,
  isDarkMode,
  onToggleDarkMode,
  onOpenShortcutsModal,
  onOpenCommandPalette,
  onOpenMilestones,
  streakCount
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    try {
      exportBackupToFile();
      onShowToast('Data berhasil diekspor ke file JSON.', 'success');
    } catch {
      onShowToast('Gagal mengekspor data.', 'error');
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const content = await file.text();
      const parsed = JSON.parse(content) as unknown;
      if (!window.confirm('Impor akan mengganti catatan dan data latihan conversation di aplikasi ini. Lanjutkan?')) {
        return;
      }
      applyBackupData(parsed as BackupData);
      onDataImported();
      onShowToast('Data backup berhasil diimpor.', 'success');
    } catch (err: unknown) {
      onShowToast(err instanceof Error ? err.message : 'File JSON tidak valid.', 'error');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 sm:gap-8">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center shadow-sm font-serif font-bold text-lg select-none">
            C
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap">
              Catatan & Latihan
            </h1>
          </div>
        </div>

        {/* Zone 2: Navigation Links / Segmented Switcher */}
        <nav className="flex items-center p-1 bg-slate-100/90 dark:bg-slate-800/90 rounded-xl border border-slate-200/60 dark:border-slate-700 shadow-inner overflow-x-auto">
          <button
            onClick={() => setActiveTab('notes')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'notes'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Catatan</span>
          </button>
          <button
            onClick={() => setActiveTab('conversations')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'conversations'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <MessageSquareQuote className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Flashcard SRS</span>
          </button>
          <button
            onClick={() => setActiveTab('avatar')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'avatar'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <span className="text-emerald-600 dark:text-emerald-400 text-sm leading-none">👤</span>
            <span>English AI</span>
          </button>
          <button
            onClick={() => setActiveTab('chinese')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'chinese'
                ? 'bg-white dark:bg-slate-700 text-rose-700 dark:text-rose-300 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-300'
            }`}
          >
            <span className="text-rose-600 dark:text-rose-400 font-bold text-xs leading-none">中</span>
            <span>Mandarin AI</span>
          </button>
          <button
            onClick={() => setActiveTab('split')}
            className={`hidden xl:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'split'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Gabungan</span>
          </button>
        </nav>

        {/* Zone 3: Actions (Streak, Backup, Restore, Dark Mode, Shortcuts, API Key) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {streakCount > 0 && (
            <div
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-amber-700 bg-amber-50 dark:bg-amber-950/70 dark:text-amber-400 border border-amber-200 dark:border-amber-800 rounded-lg shadow-2xs"
              title={`${streakCount} hari aktif beruntun!`}
            >
              <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              <span className="font-mono tabular-nums">{streakCount}d</span>
            </div>
          )}

          {onOpenMilestones && (
            <button
              type="button"
              onClick={onOpenMilestones}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/70 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800 rounded-lg shadow-2xs transition-colors"
              title="Lencana & Prestasi Belajar"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden lg:inline">Prestasi</span>
            </button>
          )}

          {onOpenCommandPalette && (
            <button
              type="button"
              onClick={onOpenCommandPalette}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg shadow-2xs transition-colors"
              title="Cari & Perintah Cepat (Ctrl+K)"
            >
              <Search className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span className="hidden md:inline font-mono text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-700 px-1 py-0.5 rounded">
                ⌘K
              </span>
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleFileChange}
            className="hidden"
          />

          <button
            type="button"
            onClick={handleExport}
            title="Ekspor JSON"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg shadow-2xs transition-colors whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span className="hidden sm:inline">Export</span>
          </button>

          <button
            type="button"
            onClick={handleImportClick}
            title="Impor JSON"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg shadow-2xs transition-colors whitespace-nowrap"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span className="hidden sm:inline">Import</span>
          </button>

          <button
            type="button"
            onClick={onToggleDarkMode}
            className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors"
            title={isDarkMode ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          <button
            type="button"
            onClick={onOpenShortcutsModal}
            className="hidden md:flex p-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors"
            title="Pintasan Keyboard (?)"
          >
            <Keyboard className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          </button>

          <button
            type="button"
            onClick={onOpenApiKeyModal}
            className="relative flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg shadow-2xs transition-colors whitespace-nowrap"
            title="Pengaturan API Key Gemini"
          >
            <Key className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
            <span className="hidden sm:inline">AI Key</span>
            <span
              className={`w-2 h-2 rounded-full ${
                hasApiKey ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'
              }`}
              title={hasApiKey ? 'API Key aktif' : 'API Key belum diset'}
            />
          </button>
        </div>
      </div>
    </header>
  );
};
