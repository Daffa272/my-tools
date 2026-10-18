import React, { useState } from 'react';
import { X, Volume2, Globe, Gauge, Check } from 'lucide-react';
import {
  getAudioSettings,
  setAudioSettings,
  speakEnglish,
  EnglishAccent,
  AudioSettings
} from '../services/speech';

interface AudioSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AudioSettingsModal: React.FC<AudioSettingsModalProps> = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState<AudioSettings>(getAudioSettings);

  if (!isOpen) return null;

  const accents: { id: EnglishAccent; label: string; desc: string; flag: string }[] = [
    { id: 'en-US', label: 'American (US)', desc: 'Standar TOEFL iBT utama', flag: '🇺🇸' },
    { id: 'en-GB', label: 'British (UK)', desc: 'Aksen kuliah akademik Eropa', flag: '🇬🇧' },
    { id: 'en-AU', label: 'Australian (AU)', desc: 'Sering muncul di TOEFL Listening terbaru', flag: '🇦🇺' },
  ];

  const rates: { rate: number; label: string; desc: string }[] = [
    { rate: 0.75, label: '0.75x', desc: 'Pelan & artikulasi fonetik detail' },
    { rate: 0.85, label: 'Normal (0.85x)', desc: 'Tempo belajar ideal' },
    { rate: 1.0, label: '1.0x', desc: 'Kecepatan penutur asli natural' },
    { rate: 1.25, label: '1.25x', desc: 'Melatih telinga untuk tempo cepat' },
  ];

  const handleSelectAccent = (accent: EnglishAccent) => {
    const next = { ...settings, accent };
    setSettings(next);
    setAudioSettings({ accent });
  };

  const handleSelectRate = (rate: number) => {
    const next = { ...settings, rate };
    setSettings(next);
    setAudioSettings({ rate });
  };

  const handleTestAudio = () => {
    speakEnglish(
      'The archaeological evidence confirms unprecedented migration patterns in early civilization.',
      settings.rate,
      settings.accent
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-100 dark:border-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <Volume2 className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Pengaturan Audio & Aksen TOEFL
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Multi-accent (US, UK, AU) dan kecepatan suara
              </p>
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
        <div className="p-6 space-y-5">
          {/* Accent Options */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5" /> Pilih Aksen Penutur
            </span>
            <div className="space-y-1.5">
              {accents.map((acc) => {
                const isSelected = settings.accent === acc.id;
                return (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => handleSelectAccent(acc.id)}
                    className={`w-full flex items-center justify-between rounded-xl border p-3 text-left transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-950 dark:text-indigo-200'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{acc.flag}</span>
                      <div>
                        <span className="text-xs font-bold block">{acc.label}</span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">{acc.desc}</span>
                      </div>
                    </div>
                    {isSelected && <Check className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Speed Options */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Gauge className="h-3.5 w-3.5" /> Kecepatan Pemutaran Audio
            </span>
            <div className="grid grid-cols-2 gap-2">
              {rates.map((r) => {
                const isSelected = settings.rate === r.rate;
                return (
                  <button
                    key={r.rate}
                    type="button"
                    onClick={() => handleSelectRate(r.rate)}
                    className={`rounded-xl border p-2.5 text-center transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950 text-indigo-900 dark:text-indigo-200 font-bold'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-xs font-bold block">{r.label}</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">{r.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Test and Save */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={handleTestAudio}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-95 transition-all"
            >
              <Volume2 className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Tes Audio Suara</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 active:scale-95 transition-all"
            >
              Simpan & Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
