import React from 'react';
import { HelpCircle, CheckCircle, Sparkles, Image, BookOpen, Volume2 } from 'lucide-react';

interface GuideSectionProps {
  onGoToUpload: () => void;
}

export const GuideSection: React.FC<GuideSectionProps> = ({ onGoToUpload }) => {
  return (
    <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/90 dark:border-stone-800 shadow-sm p-6 sm:p-10 max-w-4xl mx-auto space-y-8 transition-colors">
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-semibold mb-3 border border-emerald-200/60 dark:border-emerald-800/60">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Panduan Penggunaan</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 dark:text-white leading-tight">
          Cara Belajar Kosakata Efektif dari Benda
        </h2>
        <p className="text-sm text-stone-600 dark:text-stone-400 mt-2 max-w-2xl">
          ObjectEnglish didesain untuk menghubungkan memori visual secara langsung dengan nama benda dalam bahasa Inggris tanpa bergantung pada teks hafalan abstrak.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700 space-y-2">
          <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold text-sm">
            1
          </div>
          <h3 className="font-bold text-stone-900 dark:text-white text-base">Rasio Foto 2:3</h3>
          <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
            Format foto portrait berasio 2:3 (lebar 2 unit, tinggi 3 unit) adalah rasio standar fotografi kartu flashcard. Resolusi otomatis disimpan di 1024 × 1536 px.
          </p>
        </div>

        <div className="p-5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700 space-y-2">
          <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold text-sm">
            2
          </div>
          <h3 className="font-bold text-stone-900 dark:text-white text-base">Tag Kosakata Detail</h3>
          <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
            Satu foto bisa menyimpan banyak kosakata! Klik foto untuk memperbesar dan pasang pin koordinat nama bagian benda (misal: corong <em>spout</em>, pegangan <em>handle</em>, dan tutup <em>lid</em>).
          </p>
        </div>

        <div className="p-5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700 space-y-2">
          <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold text-sm">
            3
          </div>
          <h3 className="font-bold text-stone-900 dark:text-white text-base">Spaced Repetition (SM-2)</h3>
          <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
            Gunakan tab <strong>Review Hafalan</strong> untuk menguji daya ingat. Kosakata yang kamu anggap sulit akan otomatis diuji lebih sering, dan yang mudah dijadwalkan lebih lama.
          </p>
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-emerald-900 dark:bg-emerald-950 text-white flex flex-col sm:flex-row items-center justify-between gap-4 border border-emerald-800">
        <div>
          <h4 className="text-base font-bold text-white mb-1">
            Siap menambahkan foto benda sekitarmu?
          </h4>
          <p className="text-xs text-emerald-200">
            Foto meja belajar, dapur, taman, atau koleksi pribadimu dan mulailah belajar!
          </p>
        </div>
        <button
          onClick={onGoToUpload}
          className="px-5 py-2.5 bg-white text-stone-900 hover:bg-emerald-50 rounded-xl text-xs font-bold transition-all shadow-md shrink-0"
        >
          + Tambah Benda Baru
        </button>
      </div>
    </div>
  );
};
