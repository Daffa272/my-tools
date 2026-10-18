import React from 'react';
import { Delete, FastForward, Check, Sparkles } from 'lucide-react';
import { AnswerMode } from '../types';

interface KeypadProps {
  answerMode: AnswerMode;
  onNumberPress: (digit: number) => void;
  onBackspace: () => void;
  onSkip: () => void;
}

export const Keypad: React.FC<KeypadProps> = ({
  answerMode,
  onNumberPress,
  onBackspace,
  onSkip,
}) => {
  if (answerMode === 'parity') {
    return (
      <div className="w-full max-w-md mx-auto p-2 sm:p-3 bg-white/95 backdrop-blur rounded-2xl border border-slate-200 shadow-sm select-none">
        <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-1.5 sm:mb-2">
          {/* GENAP Button */}
          <button
            type="button"
            onClick={() => onNumberPress(0)}
            className="h-16 sm:h-20 flex flex-col items-center justify-center rounded-xl sm:rounded-2xl bg-indigo-50/80 border-2 border-indigo-200 hover:bg-indigo-100 hover:border-indigo-400 active:scale-[0.98] transition-all cursor-pointer group shadow-sm"
          >
            <div className="flex items-center gap-1 mb-0.5">
              <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-widest px-1.5 py-0.5 rounded bg-white border border-indigo-200">
                A / 0 / F
              </span>
            </div>
            <span className="text-xl sm:text-2xl font-black text-indigo-900 tracking-tight group-hover:scale-105 transition-transform">
              GENAP
            </span>
            <span className="text-[9px] sm:text-[10px] text-indigo-600 font-medium">
              Hasil 0, 2, 4, 6, 8...
            </span>
          </button>

          {/* GANJIL Button */}
          <button
            type="button"
            onClick={() => onNumberPress(1)}
            className="h-16 sm:h-20 flex flex-col items-center justify-center rounded-xl sm:rounded-2xl bg-amber-50/80 border-2 border-amber-200 hover:bg-amber-100 hover:border-amber-400 active:scale-[0.98] transition-all cursor-pointer group shadow-sm"
          >
            <div className="flex items-center gap-1 mb-0.5">
              <span className="text-[10px] font-bold text-amber-700 uppercase tracking-widest px-1.5 py-0.5 rounded bg-white border border-amber-200">
                B / 1 / J
              </span>
            </div>
            <span className="text-xl sm:text-2xl font-black text-amber-900 tracking-tight group-hover:scale-105 transition-transform">
              GANJIL
            </span>
            <span className="text-[9px] sm:text-[10px] text-amber-600 font-medium">
              Hasil 1, 3, 5, 7, 9...
            </span>
          </button>
        </div>

        {/* Action Controls: Skip & Backspace */}
        <div className="flex items-center justify-between gap-2 px-1">
          <button
            type="button"
            onClick={onSkip}
            title="Lewati soal (Spasi)"
            className="flex-1 py-2 px-3 flex items-center justify-center gap-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold active:scale-[0.98] transition-all"
          >
            <FastForward className="w-3.5 h-3.5" />
            <span>Lewati (Spasi)</span>
          </button>

          <button
            type="button"
            onClick={onBackspace}
            title="Mundur / Koreksi (Backspace)"
            className="flex-1 py-2 px-3 flex items-center justify-center gap-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold active:scale-[0.98] transition-all"
          >
            <Delete className="w-3.5 h-3.5" />
            <span>Koreksi (Backspace)</span>
          </button>
        </div>

        <div className="mt-2 text-center text-[11px] text-slate-500 font-medium">
          Dua Tangan: Tekan <kbd className="px-1.5 py-0.5 bg-slate-100 rounded border border-slate-200 font-mono text-[10px]">F</kbd> (Genap) & <kbd className="px-1.5 py-0.5 bg-slate-100 rounded border border-slate-200 font-mono text-[10px]">J</kbd> (Ganjil) atau panah <kbd className="px-1.5 py-0.5 bg-slate-100 rounded border border-slate-200 font-mono text-[10px]">←</kbd> / <kbd className="px-1.5 py-0.5 bg-slate-100 rounded border border-slate-200 font-mono text-[10px]">→</kbd>
        </div>
      </div>
    );
  }

  // Standard 0-9 Keypad
  const rows = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9],
  ];

  return (
    <div className="w-full max-w-xs mx-auto p-2.5 bg-white/95 backdrop-blur rounded-2xl border border-slate-200 shadow-sm select-none">
      <div className="grid grid-cols-3 gap-2">
        {rows.map((row) =>
          row.map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => onNumberPress(digit)}
              className="h-12 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-200 text-xl font-bold text-slate-800 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-300 active:scale-[0.96] transition-all font-mono cursor-pointer"
            >
              {digit}
            </button>
          ))
        )}

        {/* Bottom row: Skip, 0, Backspace */}
        <button
          type="button"
          onClick={onSkip}
          title="Lewati soal (Spasi)"
          className="h-12 flex items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 active:scale-[0.96] transition-all cursor-pointer"
        >
          <FastForward className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={() => onNumberPress(0)}
          className="h-12 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-200 text-xl font-bold text-slate-800 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-300 active:scale-[0.96] transition-all font-mono cursor-pointer"
        >
          0
        </button>

        <button
          type="button"
          onClick={onBackspace}
          title="Koreksi / Mundur (Backspace)"
          className="h-12 flex items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 active:scale-[0.96] transition-all cursor-pointer"
        >
          <Delete className="w-5 h-5" />
        </button>
      </div>
      <div className="mt-2 text-center text-[11px] text-slate-500 font-medium">
        Keyboard: Numpad / Angka 0–9 · Spasi untuk lewati
      </div>
    </div>
  );
};
