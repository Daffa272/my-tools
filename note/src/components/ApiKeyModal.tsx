import React, { useState } from 'react';
import { Key, Check, AlertCircle, X, Sparkles, ExternalLink } from 'lucide-react';
import { getStoredApiKey, setStoredApiKey, MODEL } from '../utils/gemini';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeyUpdated: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onKeyUpdated }) => {
  const [apiKey, setApiKey] = useState(getStoredApiKey());
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSave = () => {
    setStoredApiKey(apiKey);
    onKeyUpdated();
    onClose();
  };

  const handleTestConnection = async () => {
    if (!apiKey.trim()) {
      setTestStatus('error');
      setErrorMessage('Masukkan API key terlebih dahulu.');
      return;
    }
    setTestStatus('testing');
    setErrorMessage('');
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(MODEL)}:generateContent?key=${encodeURIComponent(apiKey.trim())}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: 'Ping test. Reply only {"status":"ok"}' }] }],
            generationConfig: { responseMimeType: 'application/json', temperature: 0 }
          })
        }
      );
      if (!response.ok) {
        const errorText = await response.text();
        let message = '';
        try {
          message = JSON.parse(errorText)?.error?.message || '';
        } catch {
          // ignore
        }
        throw new Error(message || `Koneksi gagal (${response.status})`);
      }
      setTestStatus('success');
      setStoredApiKey(apiKey.trim());
      onKeyUpdated();
    } catch (err: unknown) {
      setTestStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'Koneksi ke Gemini gagal.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">Pengaturan Gemini AI</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Model: {MODEL}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label htmlFor="apiKeyInput" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Gemini API Key
            </label>
            <input
              id="apiKeyInput"
              type="password"
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                setTestStatus('idle');
              }}
              placeholder="AIzaSy..."
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-900 transition-all font-mono"
            />
            <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <span>Disimpan secara aman di browser local storage kamu.</span>
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 space-y-1.5">
            <div className="font-medium text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Dapatkan API Key Gratis</span>
            </div>
            <p>
              Dapatkan API Key dari Google AI Studio untuk mengaktifkan fitur otomatisasi translate, situasi, dan koreksi jawaban.
            </p>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold hover:underline pt-0.5"
            >
              Buka Google AI Studio <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {testStatus === 'success' && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs">
              <Check className="w-4 h-4 shrink-0" />
              <span>Koneksi berhasil! Model {MODEL} siap digunakan.</span>
            </div>
          )}

          {testStatus === 'error' && (
            <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950/70 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-6 py-4 bg-slate-50/80 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testStatus === 'testing'}
            className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition-all disabled:opacity-50"
          >
            {testStatus === 'testing' ? 'Memverifikasi...' : 'Tes Koneksi'}
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 px-3.5 py-2 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg shadow-sm transition-all"
            >
              Simpan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
