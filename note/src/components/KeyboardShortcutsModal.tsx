import React from 'react';
import { X, Command, Keyboard } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Ctrl + K / ⌘K', desc: 'Buka Command Palette (Pencarian & Perintah Cepat)' },
    { key: 'Ctrl + N', desc: 'Buat catatan baru' },
    { key: 'Ctrl + Enter', desc: 'Periksa jawaban pada Review AI' },
    { key: '1', desc: 'Nilai "Tidak Ingat" saat memberi rating ingatan' },
    { key: '2', desc: 'Nilai "Ingat" saat memberi rating ingatan' },
    { key: 'Ctrl + B', desc: 'Format teks tebal (Bold)' },
    { key: 'Ctrl + I', desc: 'Format teks miring (Italic)' },
    { key: 'Ctrl + U', desc: 'Format garis bawah (Underline)' },
    { key: 'Win + Space / ⌃Space', desc: 'Ganti ke Keyboard Mandarin (Pinyin IME) pada Windows / Mac' },
    { key: 'Klik & Tahan Huruf Vokal', desc: 'Buka opsi 4 nada (ā, á, ǎ, à) pada huruf a, e, i, o, u, v' },
    { key: 'Badge ā / Angka 1-5', desc: 'Klik badge nada pada tuts vokal atau tekan 1-5 untuk memilih nada' },
    { key: 'Spasi / 1-9', desc: 'Pilih kandidat karakter Hanzi pada Keyboard Mandarin virtual' },
    { key: '?', desc: 'Tampilkan panduan pintasan keyboard ini' },
    { key: 'Esc', desc: 'Tutup modal / Keluar dari mode fokus (Zen mode)' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Keyboard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">Pintasan Keyboard</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Navigasi dan aksi cepat tanpa mouse</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-2.5 max-h-[70vh] overflow-y-auto">
          {shortcuts.map((s, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800"
            >
              <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">{s.desc}</span>
              <kbd className="px-2.5 py-1 text-[11px] font-mono font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg shadow-2xs">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-end px-6 py-3.5 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg shadow-sm transition-all"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
