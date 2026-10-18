import React from 'react';
import { X, CheckCircle2, AlertCircle, ArrowDown, ArrowUp } from 'lucide-react';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuideModal: React.FC<GuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-white rounded-2xl shadow-xl border border-slate-200 p-6 sm:p-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Panduan & Norma Tes Pauli-Kraepelin</h2>
            <p className="text-xs text-slate-500 mt-0.5">Standar psikotes kecepatan, ketelitian, dan daya tahan kerja</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-6 space-y-6 text-sm text-slate-600 leading-relaxed">
          {/* Differences Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-100">
              <div className="flex items-center gap-2 font-bold text-indigo-900 mb-1">
                <ArrowDown className="w-4 h-4 text-indigo-600" />
                <span>Tes Pauli</span>
              </div>
              <p className="text-xs text-indigo-950">
                Dikerjakan dari <strong>atas ke bawah</strong> secara vertikal. Saat ada aba-aba <em>"Garis!"</em>, peserta membuat garis di bawah angka terakhir dan langsung lanjut di kolom yang sama atau sebelahnya sesuai instruksi.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2 font-bold text-slate-900 mb-1">
                <ArrowUp className="w-4 h-4 text-slate-600" />
                <span>Tes Kraepelin</span>
              </div>
              <p className="text-xs text-slate-700">
                Dikerjakan dari <strong>bawah ke atas</strong>. Saat ada aba-aba <em>"Pindah!"</em>, peserta wajib langsung berpindah ke kolom baru di sebelah kanannya dari posisi paling bawah.
              </p>
            </div>
          </div>

          {/* How to calculate */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-2">Cara Menjumlahkan</h3>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Aturan Satuan:</strong> Ambil hanya 1 digit terakhir dari penjumlahan dua angka yang berdampingan.
                  <div className="mt-1 font-mono text-slate-700 bg-white p-2 rounded border border-slate-200">
                    7 + 8 = 15 → Jawaban: <strong>5</strong><br />
                    3 + 4 = 7 &nbsp;→ Jawaban: <strong>7</strong><br />
                    9 + 9 = 18 → Jawaban: <strong>8</strong>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2 pt-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Aturan Mode Genap / Ganjil:</strong> Jika memilih mode paritas, tentukan hasil penjumlahan apakah bilangan genap atau ganjil.
                  <div className="mt-1 space-y-1 font-mono text-slate-700 bg-white p-2 rounded border border-slate-200">
                    <div>4 + 6 = 10 → Hasil Genap: Tekan <strong>GENAP (A / F / 0 / ←)</strong></div>
                    <div>5 + 8 = 13 → Hasil Ganjil: Tekan <strong>GANJIL (B / J / 1 / →)</strong></div>
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500">
                    Tip: Gunakan tombol jari telunjuk <kbd className="px-1 py-0.2 bg-slate-100 rounded border">F</kbd> (Genap) dan <kbd className="px-1 py-0.2 bg-slate-100 rounded border">J</kbd> (Ganjil) untuk kecepatan maksimal dengan kedua tangan.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 4 Pillars Evaluated */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-2">4 Aspek Penilaian Psikologis</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg border border-slate-200 bg-white">
                <span className="font-bold text-slate-900 block mb-0.5">1. Kecepatan (Panker)</span>
                <span>Jumlah soal yang berhasil diselesaikan per menit. Menunjukkan kapasitas energi kerja & kecepatan pemrosesan data.</span>
              </div>
              <div className="p-3 rounded-lg border border-slate-200 bg-white">
                <span className="font-bold text-slate-900 block mb-0.5">2. Ketelitian</span>
                <span>Tingkat kebenaran hasil (rasio salah & lewati). Menunjukkan kepatuhan pada kualitas dan kehati-hatian.</span>
              </div>
              <div className="p-3 rounded-lg border border-slate-200 bg-white">
                <span className="font-bold text-slate-900 block mb-0.5">3. Stabilitas (Ritme)</span>
                <span>Kestabilan jumlah soal antar sesi. Grafik yang terlalu naik-turun ekstrem menandakan ketidakstabilan emosi / konsentrasi.</span>
              </div>
              <div className="p-3 rounded-lg border border-slate-200 bg-white">
                <span className="font-bold text-slate-900 block mb-0.5">4. Ketahanan (Daya Tahan)</span>
                <span>Kemampuan menjaga performa hingga sesi-sesi akhir tanpa penurunan drastis akibat kelelahan mental (fatigue).</span>
              </div>
            </div>
          </div>

          {/* Tips & Tricks */}
          <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 text-xs text-amber-950">
            <span className="font-bold block mb-1">Tips Sukses Psikotes Seleksi Kerja:</span>
            <ul className="list-disc pl-4 space-y-1">
              <li>Jangan terobsesi mengejar kecepatan tinggi di sesi 1 jika membuat Anda drop di sesi 4 ke atas.</li>
              <li>Jaga ritme yang konstan seperti detak metronom. Kurva kerja yang stabil atau sedikit menanjak (warm-up effect) dinilai sangat positif oleh rekruter.</li>
              <li>Gunakan tombol numpad tangan kanan atau jempol jika menggunakan smartphone.</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Mengerti & Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
