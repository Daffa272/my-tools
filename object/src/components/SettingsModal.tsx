import React, { useState, useEffect } from 'react';
import {
  X,
  KeyRound,
  HardDrive,
  Download,
  Upload,
  FolderArchive,
  Check,
  PackageOpen,
  Sparkles,
  Wifi,
  WifiOff,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { Category } from '../types';
import { checkGeminiApiStatus, ApiStatusResult } from '../services/gemini';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  cardsCount: number;
  onExportFolder: (categoryName: string) => Promise<void>;
  onDownloadBackup: () => Promise<void>;
  onImportBackup: (file: File) => Promise<void>;
  onLoadStarterPack: () => Promise<void>;
  onToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  categories,
  cardsCount,
  onExportFolder,
  onDownloadBackup,
  onImportBackup,
  onLoadStarterPack,
  onToast
}) => {
  const [apiKey, setApiKey] = useState(
    () => localStorage.getItem('gemini_api_key') || ''
  );
  const [selectedModel, setSelectedModel] = useState(
    () => localStorage.getItem('english_ai_model_gemini') || 'gemini-2.5-flash'
  );
  const [selectedExportCategory, setSelectedExportCategory] = useState(
    categories[0]?.name || ''
  );
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [loadingStarter, setLoadingStarter] = useState(false);

  // Connection testing state
  const [apiStatus, setApiStatus] = useState<ApiStatusResult | null>(null);
  const [isTestingApi, setIsTestingApi] = useState(false);

  useEffect(() => {
    if (isOpen) {
      testConnection();
    }
  }, [isOpen]);

  const testConnection = async () => {
    setIsTestingApi(true);
    try {
      const res = await checkGeminiApiStatus(true);
      setApiStatus(res);
    } catch {
      setApiStatus({
        ok: false,
        message: 'Endpoint server tidak merespons. Mode Cadangan Kamus Cerdas aktif.',
        model: selectedModel,
        source: 'none'
      });
    } finally {
      setIsTestingApi(false);
    }
  };

  if (!isOpen) return null;

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('gemini_api_key', apiKey.trim());
    localStorage.setItem('english_ai_model_gemini', selectedModel);
    setSavedSuccess(true);
    onToast('Pengaturan API Gemini berhasil disimpan.', 'success');
    testConnection();
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleClearApiKey = () => {
    localStorage.removeItem('gemini_api_key');
    setApiKey('');
    onToast('API Key kustom browser dihapus.', 'info');
    setTimeout(() => testConnection(), 200);
  };

  const handleStarterPack = async () => {
    setLoadingStarter(true);
    try {
      await onLoadStarterPack();
      onToast('Koleksi contoh (Starter Pack) berhasil dimuat!', 'success');
    } catch {
      onToast('Gagal memuat koleksi contoh.', 'error');
    } finally {
      setLoadingStarter(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative bg-white dark:bg-stone-900 w-full max-w-lg rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden transition-colors">
        {/* Header */}
        <div className="p-5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-400 flex items-center justify-center">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-stone-900 dark:text-white">Pengaturan Aplikasi</h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">Konfigurasi Gemini AI, Contoh Data & Penyimpanan</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Live API Connectivity Status Box */}
          <div
            className={`p-4 rounded-xl border flex flex-col gap-3 ${
              apiStatus?.ok
                ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
                : 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                {apiStatus?.ok ? (
                  <Wifi className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <WifiOff className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold block text-stone-900 dark:text-stone-100">
                      {apiStatus?.ok ? 'Status API: Terhubung Aktif' : 'Status API: Siaga Cadangan Cerdas'}
                    </span>
                    {apiStatus?.latencyMs !== undefined && (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                        {apiStatus.latencyMs}ms
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-stone-600 dark:text-stone-400 block mt-0.5 leading-tight">
                    {apiStatus?.message || 'Memeriksa status koneksi API...'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                disabled={isTestingApi}
                onClick={testConnection}
                className="py-1.5 px-3 bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 border border-stone-200 dark:border-stone-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 shadow-2xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTestingApi ? 'animate-spin' : ''}`} />
                <span>Tes Koneksi</span>
              </button>
            </div>

            {/* Smart Fallback Resilience Notice */}
            <div className="pt-2 border-t border-stone-200/60 dark:border-stone-800 text-[11px] text-stone-600 dark:text-stone-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>
                  Sistem Cadangan Cerdas siap: terjemahan & cara baca otomatis tetap aktif 100% meskipun koneksi API mengalami kendala.
                </span>
              </span>
            </div>
          </div>

          {/* Starter Pack CTA */}
          <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800 rounded-xl flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 dark:text-emerald-200 mb-0.5">
                <PackageOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Paket Contoh Kosakata (Starter Pack)</span>
              </div>
              <p className="text-[11px] text-emerald-800 dark:text-emerald-300 leading-snug">
                Muat 3 kartu contoh (Watering Can, Coffee Mug, Desk Lamp) lengkap dengan pin bagian benda dan cara baca.
              </p>
            </div>
            <button
              type="button"
              disabled={loadingStarter}
              onClick={handleStarterPack}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors shrink-0 shadow-xs"
            >
              {loadingStarter ? 'Memuat...' : 'Muat Contoh'}
            </button>
          </div>

          {/* AI Settings Form */}
          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                  Gemini API Key (Opsional)
                </label>
                {apiKey && (
                  <button
                    type="button"
                    onClick={handleClearApiKey}
                    className="text-[10px] text-rose-600 dark:text-rose-400 hover:underline"
                  >
                    Hapus Kunci Kustom
                  </button>
                )}
              </div>
              <input
                type="password"
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="AIzaSy... (kosongkan jika menggunakan sistem server otomatis)"
                className="w-full text-xs font-mono px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/15 outline-none bg-stone-50/50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500"
              />
              <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
                Kunci API digunakan untuk terjemahan kontekstual, cara baca fonetik, dan pemindaian benda di foto.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                Model Gemini AI
              </label>
              <select
                value={selectedModel}
                onChange={e => setSelectedModel(e.target.value)}
                className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/15 outline-none bg-stone-50/50 dark:bg-stone-800 text-stone-900 dark:text-stone-100"
              >
                <option value="gemini-flash-latest">Gemini Flash (Cepat & Direkomendasikan)</option>
                <option value="gemini-3.8-flash">Gemini 3.8 Flash (Akurasi Tinggi & Terbaru)</option>
                <option value="gemini-3.1-flash-lite">Gemini Flash Lite (Ringan)</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-200" />
                  <span>Pengaturan Tersimpan!</span>
                </>
              ) : (
                <span>Simpan Pengaturan AI</span>
              )}
            </button>
          </form>

          {/* Storage & Data Management */}
          <div className="pt-4 border-t border-stone-200 dark:border-stone-800">
            <h4 className="text-xs font-bold text-stone-900 dark:text-stone-200 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
              <span>Penyimpanan & Cadangan Data</span>
            </h4>

            <div className="bg-stone-50 dark:bg-stone-800/60 p-3.5 rounded-xl border border-stone-200/80 dark:border-stone-700 mb-4 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-stone-500 dark:text-stone-400">Database Lokal:</span>
                <span className="font-semibold text-stone-800 dark:text-stone-200">IndexedDB (object_english_library)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500 dark:text-stone-400">Jumlah Benda:</span>
                <span className="font-semibold text-stone-800 dark:text-stone-200">{cardsCount} kartu</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500 dark:text-stone-400">Folder Kategori:</span>
                <span className="font-semibold text-stone-800 dark:text-stone-200">{categories.length} folder</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onDownloadBackup}
                  className="flex-1 py-2 px-3 bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 font-semibold text-xs rounded-xl border border-stone-200 dark:border-stone-700 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
                  <span>Unduh File Backup JSON</span>
                </button>

                <label className="flex-1 py-2 px-3 bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 font-semibold text-xs rounded-xl border border-stone-200 dark:border-stone-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-center">
                  <Upload className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
                  <span>Pulihkan dari JSON</span>
                  <input
                    type="file"
                    accept="application/json"
                    className="hidden"
                    onChange={e => {
                      if (e.target.files && e.target.files[0]) {
                        onImportBackup(e.target.files[0]);
                        e.target.value = '';
                      }
                    }}
                  />
                </label>
              </div>

              {categories.length > 0 && (
                <div className="p-3 bg-stone-50 dark:bg-stone-800/60 rounded-xl border border-stone-200 dark:border-stone-700 flex flex-col gap-2 mt-2">
                  <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                    Ekspor satu folder ke disk komputer:
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={selectedExportCategory}
                      onChange={e => setSelectedExportCategory(e.target.value)}
                      className="flex-1 text-xs px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                    >
                      {categories.map(c => (
                        <option key={c.name} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => onExportFolder(selectedExportCategory)}
                      className="px-3 py-1.5 bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-white text-white dark:text-stone-900 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <FolderArchive className="w-3.5 h-3.5" />
                      <span>Ekspor</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-50 dark:bg-stone-950 border-t border-stone-100 dark:border-stone-800 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-white text-white dark:text-stone-900 text-xs font-semibold rounded-xl transition-colors"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
