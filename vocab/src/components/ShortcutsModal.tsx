import React from 'react';
import { X, Command, Keyboard } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: '/', desc: 'Fokus ke kolom pencarian kosakata' },
    { key: 'Space / Enter', desc: 'Balik kartu flashcard (depan / belakang)' },
    { key: '1', desc: 'Beri nilai "Lupa" (Ulangi hari ini)' },
    { key: '2 / 3', desc: 'Beri nilai "Sulit" (Jadwal besok)' },
    { key: '4', desc: 'Beri nilai "Ingat" (Jadwal normal)' },
    { key: '5', desc: 'Beri nilai "Mudah" (Jadwal lebih lama)' },
    { key: 'R', desc: 'Putar ulang audio pengucapan (TTS)' },
    { key: 'M', desc: 'Mulai / berhenti tes pengucapan mikrofon' },
    { key: 'Esc', desc: 'Tutup jendela modal yang sedang aktif' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <Keyboard className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Pintasan Keyboard Pro</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Navigasi cepat tanpa mouse</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-3">
          {shortcuts.map((sc) => (
            <div
              key={sc.key}
              className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/60 text-xs"
            >
              <span className="text-slate-600 dark:text-slate-300 font-medium">{sc.desc}</span>
              <kbd className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-mono font-bold text-[11px] shadow-2xs">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
