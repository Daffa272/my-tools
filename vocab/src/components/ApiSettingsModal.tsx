import React, { useState, useEffect } from 'react';
import { X, Key, ExternalLink, ShieldCheck, Sparkles, HelpCircle } from 'lucide-react';
import { GEMINI_MODEL } from '../services/gemini';

interface ApiSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  onSaveApiKey: (key: string) => void;
}

export const ApiSettingsModal: React.FC<ApiSettingsModalProps> = ({
  isOpen,
  onClose,
  apiKey,
  onSaveApiKey,
}) => {
  const [localKey, setLocalKey] = useState(apiKey);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    setLocalKey(apiKey);
  }, [apiKey, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveApiKey(localKey.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-100 dark:border-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <Key className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Pengaturan AI & API Key</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Konfigurasi Google Gemini Flash</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Model info banner */}
          <div className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 p-3.5">
            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                AI Provider & Model
              </span>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 mt-0.5">
                <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                Google Gemini ({GEMINI_MODEL})
              </span>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              Optimal & Cepat
            </span>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="modalApiKey"
                className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1.5"
              >
                Gemini API Key
              </label>
              <div className="relative">
                <input
                  id="modalApiKey"
                  type="password"
                  value={localKey}
                  onChange={(e) => setLocalKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm text-slate-800 dark:text-slate-100 font-mono placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                />
              </div>
              <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                API Key disimpan di peramban (localStorage) Anda dan tidak dibagikan ke server lain.
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setShowGuide(!showGuide)}
                className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700"
              >
                <HelpCircle className="h-4 w-4" />
                <span>{showGuide ? 'Sembunyikan panduan' : 'Cara mendapatkan API Key'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 active:scale-95 transition-all"
                >
                  Simpan Perubahan
                </button>
              </div>
            </div>
          </form>

          {/* Guide section */}
          {showGuide && (
            <div className="rounded-2xl border border-blue-100 dark:border-blue-900/60 bg-blue-50/70 dark:bg-blue-950/40 p-4 text-slate-700 dark:text-slate-300 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                  <Key className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  Cara Mendapatkan Kunci API Gemini Gratis
                </h4>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs font-bold text-blue-700 dark:text-blue-300 hover:underline"
                >
                  <span>Buka AI Studio</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Anda memerlukan Kunci API dari Google AI Studio agar aplikasi ini dapat menganalisis kosakata TOEFL dan membuat latihan AI. Prosesnya gratis dan cepat.
              </p>
              <ol className="list-decimal pl-5 text-xs space-y-1.5 text-slate-700 dark:text-slate-300">
                <li>Buka <strong>Google AI Studio</strong> dan login dengan akun Google Anda.</li>
                <li>Klik tombol <strong>Create API key</strong>.</li>
                <li>Pilih <strong>Select a Cloud Project</strong>, lalu pilih atau buat project baru.</li>
                <li>Kunci API baru akan dibuat. Klik ikon salin untuk menyalin kunci.</li>
                <li>Tempel kunci ke kolom formulir di atas lalu tekan <strong>Simpan Perubahan</strong>.</li>
              </ol>
              <div className="pt-2 border-t border-blue-200/60 dark:border-blue-900/60 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span>Panduan oleh Daffa Aulia Rahman</span>
                <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium">
                  <ShieldCheck className="h-3.5 w-3.5" /> Resmi Google AI
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
