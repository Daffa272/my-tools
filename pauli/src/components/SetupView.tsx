import React, { useState } from 'react';
import { Play, Settings2, ShieldCheck, Zap, Sparkles, BookOpen, Clock, ArrowDown, ArrowUp, Mic, Eye, Divide } from 'lucide-react';
import { PresetId, TestConfig } from '../types';

interface SetupViewProps {
  config: TestConfig;
  onChangeConfig: (newConfig: TestConfig) => void;
  onStartTest: () => void;
  onOpenGuide: () => void;
}

export const SetupView: React.FC<SetupViewProps> = ({
  config,
  onChangeConfig,
  onStartTest,
  onOpenGuide,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<PresetId>(
    config.answerMode === 'parity' ? 'parity' : 'bumn'
  );
  const [showAdvanced, setShowAdvanced] = useState(false);

  const applyPreset = (preset: PresetId) => {
    setSelectedPreset(preset);
    if (preset === 'bumn') {
      onChangeConfig({
        ...config,
        testType: 'pauli',
        sessionCount: 10,
        sessionDurationSec: 60,
        breakDurationSec: 5,
        columns: 8,
        rows: 35,
        answerMode: 'digit',
      });
    } else if (preset === 'banking') {
      onChangeConfig({
        ...config,
        testType: 'pauli',
        sessionCount: 5,
        sessionDurationSec: 60,
        breakDurationSec: 5,
        columns: 8,
        rows: 35,
        answerMode: 'digit',
      });
    } else if (preset === 'parity') {
      onChangeConfig({
        ...config,
        testType: 'pauli',
        sessionCount: 5,
        sessionDurationSec: 60,
        breakDurationSec: 5,
        columns: 8,
        rows: 35,
        answerMode: 'parity',
      });
    } else if (preset === 'sprint') {
      onChangeConfig({
        ...config,
        testType: 'pauli',
        sessionCount: 3,
        sessionDurationSec: 30,
        breakDurationSec: 5,
        columns: 6,
        rows: 25,
        answerMode: 'digit',
      });
    } else if (preset === 'custom') {
      setShowAdvanced(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStartTest();
  };

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 py-5 sm:py-10 pb-28 sm:pb-12">
      {/* Intro Hero */}
      <div className="text-center max-w-2xl mx-auto mb-6 sm:mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-[11px] sm:text-xs font-semibold text-indigo-700 mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Simulasi Psikotes Pauli & Kraepelin</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight text-balance">
          Latih Kecepatan, Ketelitian & Ketahanan Konsentrasi
        </h1>
        <p className="mt-2 text-slate-600 text-xs sm:text-base leading-relaxed">
          Uji kerja monoton berulang standar seleksi BUMN, Kedinasan, CPNS, dan Bank. Mode <strong>Digit Terakhir</strong> dan <strong>Genap / Ganjil</strong>.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Presets Cards (Responsive 2x2 grid on mobile) */}
        <div>
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500">
              Pilih Paket Latihan
            </span>
            <button
              type="button"
              onClick={onOpenGuide}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Petunjuk</span>
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3.5">
            {/* Preset 1: Genap / Ganjil */}
            <button
              type="button"
              onClick={() => applyPreset('parity')}
              className={`p-3 sm:p-4 rounded-xl border text-left transition-all ${
                selectedPreset === 'parity' || config.answerMode === 'parity'
                  ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1">
                  <Divide className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="font-bold text-slate-900 text-xs sm:text-sm">Genap/Ganjil</span>
                </div>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-500 mb-2 line-clamp-2">
                Uji paritas: Genap (A) atau Ganjil (B).
              </p>
              <div className="text-[10px] sm:text-xs text-slate-600 font-semibold">
                5 Sesi · Paritas
              </div>
            </button>

            {/* Preset 2: BUMN */}
            <button
              type="button"
              onClick={() => applyPreset('bumn')}
              className={`p-3 sm:p-4 rounded-xl border text-left transition-all ${
                selectedPreset === 'bumn' && config.answerMode === 'digit'
                  ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-1 mb-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span className="font-bold text-slate-900 text-xs sm:text-sm">BUMN / CPNS</span>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-500 mb-2 line-clamp-2">
                Simulasi penuh untuk daya tahan stamina.
              </p>
              <div className="text-[10px] sm:text-xs text-slate-600 font-semibold">
                10 Sesi @60s
              </div>
            </button>

            {/* Preset 3: Banking / Swasta */}
            <button
              type="button"
              onClick={() => applyPreset('banking')}
              className={`p-3 sm:p-4 rounded-xl border text-left transition-all ${
                selectedPreset === 'banking' && config.answerMode === 'digit'
                  ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-1 mb-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-700" />
                <span className="font-bold text-slate-900 text-xs sm:text-sm">Bank & Swasta</span>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-500 mb-2 line-clamp-2">
                Format standar rekruitmen profesional.
              </p>
              <div className="text-[10px] sm:text-xs text-slate-600 font-semibold">
                5 Sesi @60s
              </div>
            </button>

            {/* Preset 4: Sprint */}
            <button
              type="button"
              onClick={() => applyPreset('sprint')}
              className={`p-3 sm:p-4 rounded-xl border text-left transition-all ${
                selectedPreset === 'sprint'
                  ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-1 mb-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-600" />
                <span className="font-bold text-slate-900 text-xs sm:text-sm">Sprint Kilat</span>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-500 mb-2 line-clamp-2">
                Pemanasan 1.5 menit aktifkan refleks.
              </p>
              <div className="text-[10px] sm:text-xs text-slate-600 font-semibold">
                3 Sesi @30s
              </div>
            </button>
          </div>
        </div>

        {/* Primary Mode Switcher (Digit vs Parity) */}
        <div className="p-3.5 sm:p-5 rounded-2xl bg-indigo-50/40 border border-indigo-100 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-indigo-900">
              Jenis Soal (Mode Utama)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            {/* Mode Digit */}
            <button
              type="button"
              onClick={() => onChangeConfig({ ...config, answerMode: 'digit' })}
              className={`p-3 sm:p-4 rounded-xl border text-left transition-all ${
                config.answerMode === 'digit'
                  ? 'bg-white border-indigo-600 shadow-sm ring-2 ring-indigo-500/20'
                  : 'bg-white/70 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-xs sm:text-sm text-slate-900">1. Digit Terakhir (0–9)</span>
                {config.answerMode === 'digit' && <span className="w-2 h-2 rounded-full bg-indigo-600" />}
              </div>
              <p className="text-[11px] text-slate-500">
                Ambil 1 digit satuan: 7 + 8 = 15 → <strong>5</strong>
              </p>
            </button>

            {/* Mode Paritas (Genap / Ganjil) */}
            <button
              type="button"
              onClick={() => onChangeConfig({ ...config, answerMode: 'parity' })}
              className={`p-3 sm:p-4 rounded-xl border text-left transition-all ${
                config.answerMode === 'parity'
                  ? 'bg-white border-indigo-600 shadow-sm ring-2 ring-indigo-500/20'
                  : 'bg-white/70 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-xs sm:text-sm text-slate-900">2. Genap / Ganjil (A / B)</span>
                {config.answerMode === 'parity' && <span className="w-2 h-2 rounded-full bg-indigo-600" />}
              </div>
              <p className="text-[11px] text-slate-500">
                Tentukan paritas: 7 + 8 = 15 → <strong>GANJIL (B)</strong>
              </p>
            </button>
          </div>
        </div>

        {/* Core Parameters Box */}
        <div className="p-4 sm:p-6 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Participant Name */}
            <div>
              <label htmlFor="name" className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Nama Peserta
              </label>
              <input
                id="name"
                type="text"
                placeholder="Contoh: Ardaffa (opsional)"
                value={config.name}
                onChange={(e) => onChangeConfig({ ...config, name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all bg-white"
              />
            </div>

            {/* Test Direction / Type */}
            <div>
              <label className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Arah Penjumlahan
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onChangeConfig({ ...config, testType: 'pauli' })}
                  className={`py-2 px-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                    config.testType === 'pauli'
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <ArrowDown className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span>Pauli (Atas-Bawah)</span>
                </button>

                <button
                  type="button"
                  onClick={() => onChangeConfig({ ...config, testType: 'kraepelin' })}
                  className={`py-2 px-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                    config.testType === 'kraepelin'
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <ArrowUp className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span>Kraepelin (Bawah-Atas)</span>
                </button>
              </div>
            </div>

            {/* Sessions count slider */}
            <div className="sm:col-span-2">
              <label htmlFor="sessionCount" className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Jumlah Sesi ({config.sessionCount} Sesi)
              </label>
              <div className="flex items-center gap-3">
                <input
                  id="sessionCount"
                  type="range"
                  min="1"
                  max="15"
                  step="1"
                  value={config.sessionCount}
                  onChange={(e) => {
                    setSelectedPreset('custom');
                    onChangeConfig({ ...config, sessionCount: Number(e.target.value) });
                  }}
                  className="w-full accent-indigo-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                />
                <span className="font-mono text-xs font-bold px-2.5 py-1.5 rounded-md bg-slate-100 text-slate-800 shrink-0">
                  {config.sessionCount} Sesi
                </span>
              </div>
            </div>
          </div>

          {/* Quick Toggles: Voice Proctor & Line Focus Guide */}
          <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4">
            <label className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-2">
                <Mic className="w-4 h-4 text-indigo-600 shrink-0" />
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Suara Proktor ("GARIS!")</span>
                  <span className="text-[10px] text-slate-500">Aba-aba suara instruktur</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={config.voiceProctorEnabled}
                onChange={(e) => onChangeConfig({ ...config, voiceProctorEnabled: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600 accent-indigo-600"
              />
            </label>

            <label className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-indigo-600 shrink-0" />
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Garis Pembatas Fokus</span>
                  <span className="text-[10px] text-slate-500">Mencegah mata lelah</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={config.lineFocusGuide}
                onChange={(e) => onChangeConfig({ ...config, lineFocusGuide: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600 accent-indigo-600"
              />
            </label>
          </div>

          {/* Advanced toggle */}
          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 cursor-pointer"
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>{showAdvanced ? 'Tutup Pengaturan Lanjutan' : 'Buka Pengaturan Kustom Lanjutan'}</span>
            </button>

            {showAdvanced && (
              <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label htmlFor="sessionDurationSec" className="block text-xs font-medium text-slate-600 mb-1">
                    Durasi Tiap Sesi
                  </label>
                  <select
                    id="sessionDurationSec"
                    value={config.sessionDurationSec}
                    onChange={(e) => {
                      setSelectedPreset('custom');
                      onChangeConfig({ ...config, sessionDurationSec: Number(e.target.value) });
                    }}
                    className="w-full p-2 text-xs rounded-lg border border-slate-300 bg-white"
                  >
                    <option value={15}>15 Detik (Sprint Cepat)</option>
                    <option value={30}>30 Detik (Standar Pendek)</option>
                    <option value={45}>45 Detik</option>
                    <option value={60}>60 Detik (1 Menit - Standar)</option>
                    <option value={90}>90 Detik</option>
                    <option value={120}>120 Detik (2 Menit)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="breakDurationSec" className="block text-xs font-medium text-slate-600 mb-1">
                    Jeda Garis / Istirahat
                  </label>
                  <select
                    id="breakDurationSec"
                    value={config.breakDurationSec}
                    onChange={(e) => {
                      setSelectedPreset('custom');
                      onChangeConfig({ ...config, breakDurationSec: Number(e.target.value) });
                    }}
                    className="w-full p-2 text-xs rounded-lg border border-slate-300 bg-white"
                  >
                    <option value={3}>3 Detik (Cepat)</option>
                    <option value={5}>5 Detik (Rekomendasi)</option>
                    <option value={10}>10 Detik</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="theme" className="block text-xs font-medium text-slate-600 mb-1">
                    Tampilan / Gaya Lembar
                  </label>
                  <select
                    id="theme"
                    value={config.theme}
                    onChange={(e) => onChangeConfig({ ...config, theme: e.target.value as TestConfig['theme'] })}
                    className="w-full p-2 text-xs rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="modern">Modern Clean (Putih & Slate)</option>
                    <option value="paper">Kertas Ujian Asli (Warm Paper)</option>
                    <option value="dark">Dark Focus (Mode Gelap)</option>
                  </select>
                </div>

                <div className="sm:col-span-3 flex flex-wrap gap-4 pt-1">
                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.soundEnabled}
                      onChange={(e) => onChangeConfig({ ...config, soundEnabled: e.target.checked })}
                      className="rounded text-indigo-600 accent-indigo-600"
                    />
                    <span>Audio klik keyboard & chime</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.showKeypad}
                      onChange={(e) => onChangeConfig({ ...config, showKeypad: e.target.checked })}
                      className="rounded text-indigo-600 accent-indigo-600"
                    />
                    <span>Keypad sentuh di bawah papan</span>
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Regular Desktop Summary Box */}
        <div className="hidden sm:flex items-center justify-between gap-4 p-4 rounded-xl bg-slate-100/70 border border-slate-200">
          <div className="text-xs text-slate-600">
            <span className="font-semibold text-slate-900 block">Ringkasan Konfigurasi:</span>
            <span>
              {config.answerMode === 'parity' ? 'Mode Genap/Ganjil' : 'Mode Digit Satuan'} ·{' '}
              {config.testType === 'pauli' ? 'Tes Pauli' : 'Tes Kraepelin'} ·{' '}
              {config.sessionCount} Sesi @{config.sessionDurationSec}s
            </span>
          </div>

          <button
            type="submit"
            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 group cursor-pointer"
          >
            <span>Mulai Ujian</span>
            <Play className="w-4 h-4 fill-white" />
          </button>
        </div>

        {/* Mobile Fixed Bottom CTA Bar (Thumb zone reach) */}
        <div className="sm:hidden fixed bottom-0 left-0 right-0 z-30 p-3 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wide">
              {config.answerMode === 'parity' ? 'Genap/Ganjil' : 'Digit 0–9'} · {config.sessionCount} Sesi
            </span>
            <span className="text-xs font-bold text-slate-900 truncate block">
              {config.name || 'Peserta Mandiri'}
            </span>
          </div>

          <button
            type="submit"
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
          >
            <span>Mulai</span>
            <Play className="w-4 h-4 fill-white" />
          </button>
        </div>
      </form>
    </div>
  );
};
