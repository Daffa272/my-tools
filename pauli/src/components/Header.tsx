import React from 'react';
import { Volume2, VolumeX, History, BookOpen, RotateCcw } from 'lucide-react';
import { TestConfig } from '../types';

interface HeaderProps {
  currentView: 'setup' | 'test' | 'result';
  config: TestConfig;
  onToggleSound: () => void;
  onOpenGuide: () => void;
  onOpenHistory: () => void;
  onNewTest: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  config,
  onToggleSound,
  onOpenGuide,
  onOpenHistory,
  onNewTest,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-8">
        {/* Zone 1: Single text element wordmark */}
        <button
          onClick={onNewTest}
          className="text-left font-bold text-base sm:text-lg tracking-tight text-slate-900 whitespace-nowrap shrink-0 hover:text-indigo-600 transition-colors cursor-pointer"
        >
          Tes Pauli & Kraepelin
        </button>

        {/* Zone 2: Navigation controls (Desktop text links, Mobile compact touch icons) */}
        <nav className="flex items-center gap-1 sm:gap-6 text-sm font-medium text-slate-600">
          <button
            onClick={onOpenGuide}
            title="Panduan & Norma"
            className="p-2 sm:px-3 sm:py-1.5 rounded-lg hover:text-slate-900 hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer text-xs"
          >
            <BookOpen className="w-4 h-4 text-slate-500" />
            <span className="hidden md:inline">Panduan & Norma</span>
          </button>

          <button
            onClick={onOpenHistory}
            title="Riwayat Latihan"
            className="p-2 sm:px-3 sm:py-1.5 rounded-lg hover:text-slate-900 hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer text-xs"
          >
            <History className="w-4 h-4 text-slate-500" />
            <span className="hidden md:inline">Riwayat</span>
          </button>

          <button
            onClick={onToggleSound}
            title={config.soundEnabled ? 'Matikan Suara' : 'Aktifkan Suara'}
            className="p-2 sm:px-3 sm:py-1.5 rounded-lg hover:text-slate-900 hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer text-xs"
          >
            {config.soundEnabled ? (
              <>
                <Volume2 className="w-4 h-4 text-emerald-600" />
                <span className="hidden lg:inline text-slate-600">Audio Aktif</span>
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4 text-slate-400" />
                <span className="hidden lg:inline text-slate-400">Audio Bisu</span>
              </>
            )}
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-2 shrink-0">
          {currentView === 'test' ? (
            <button
              onClick={onNewTest}
              className="px-2.5 sm:px-3.5 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Keluar</span>
            </button>
          ) : (
            <button
              onClick={onNewTest}
              className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {currentView === 'result' ? 'Tes Baru' : 'Mulai'}
            </button>
          )}
        </div>
      </div>
      <nav aria-label="Menu aplikasi" className="mx-auto flex max-w-6xl gap-1 overflow-x-auto border-t border-slate-200/60 px-3 py-2 text-xs sm:px-6">
        {[
          { id: 'vocab', label: 'Vocab', href: 'https://my-tools-eyy1.vercel.app/' },
          { id: 'object', label: 'Object', href: 'https://my-tools-mzmj.vercel.app/' },
          { id: 'note', label: 'Note', href: 'https://my-tools-ulry.vercel.app/' },
          { id: 'listening', label: 'Listening', href: 'https://my-tools-n9a3.vercel.app/' },
          { id: 'kbbi', label: 'KBBI', href: 'https://my-tools-hdof.vercel.app/' },
          { id: 'pauli', label: 'Pauli', href: 'https://my-tools-dz2c.vercel.app/' },
        ].map((app) => (
          <a
            key={app.id}
            href={app.href}
            aria-current={app.id === 'pauli' ? 'page' : undefined}
            className={`shrink-0 rounded-lg px-3 py-1.5 font-semibold transition-colors ${
              app.id === 'pauli'
                ? 'bg-indigo-100 text-indigo-800'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {app.label}
          </a>
        ))}
      </nav>
    </header>
  );
};
