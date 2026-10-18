import React, { useState, useEffect, useRef } from 'react';
import {
  Volume2,
  Bookmark,
  Check,
  Mic,
  MicOff,
  Sparkles,
  BookOpen,
  ArrowRight,
  GitBranch,
  Layers,
  FileText,
  Play,
  GraduationCap,
  Award
} from 'lucide-react';
import { WordData, SavedWord } from '../types';
import {
  speakEnglish,
  normalizeSpokenText,
  getSpeechRecognition,
  ISpeechRecognition,
  ISpeechRecognitionEvent,
  ISpeechRecognitionErrorEvent,
} from '../services/speech';
import { getEstimatedCEFR } from '../services/storage';
import { AudioWaveform } from './AudioWaveform';
import { MorphologyTreeGraph } from './MorphologyTreeGraph';
import { ReadingPassageSection } from './ReadingPassageSection';
import { SentenceWritingSandbox } from './SentenceWritingSandbox';

interface WordResultViewProps {
  data: WordData;
  isSaved: boolean;
  onSaveWord: () => void;
  onGenerateChunks: () => Promise<void>;
  isGeneratingChunks: boolean;
  savedWords?: SavedWord[];
  apiKey?: string;
  onNeedApiKey?: () => void;
}

export const WordResultView: React.FC<WordResultViewProps> = ({
  data,
  isSaved,
  onSaveWord,
  onGenerateChunks,
  isGeneratingChunks,
  savedWords,
  apiKey,
  onNeedApiKey,
}) => {
  // Pronunciation Test states
  const [isRecording, setIsRecording] = useState(false);
  const [pronunciationScore, setPronunciationScore] = useState<number | null>(null);
  const [pronunciationTranscript, setPronunciationTranscript] = useState('');
  const [pronunciationMessage, setPronunciationMessage] = useState('');
  const recognitionRef = useRef<ISpeechRecognition | null>(null);

  // Paragraph Reading Test states
  const [paragraphWords, setParagraphWords] = useState<string[]>([]);
  const [testedWordIndices, setTestedWordIndices] = useState<Set<number>>(new Set());
  const [currentTestingIndex, setCurrentTestingIndex] = useState<number | null>(null);
  const [isParagraphTestActive, setIsParagraphTestActive] = useState(false);
  const [paragraphStatusText, setParagraphStatusText] = useState('Tekan Mulai Tes untuk melatih pengucapan paragraf.');
  const paragraphRecognitionRef = useRef<ISpeechRecognition | null>(null);

  // CEFR & Academic Band
  const cefrInfo = getEstimatedCEFR(data.word);

  // Academic sentence for paragraph practice
  const academicSentence =
    data.tenses?.present?.example_en ||
    data.chunks?.[0]?.example_en ||
    data.tenses?.past?.example_en ||
    data.word;

  useEffect(() => {
    setIsRecording(false);
    setPronunciationScore(null);
    setPronunciationTranscript('');
    setPronunciationMessage('');
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }

    setIsParagraphTestActive(false);
    setCurrentTestingIndex(null);
    setTestedWordIndices(new Set());
    const words = String(academicSentence || '').match(/[A-Za-z]+(?:['-][A-Za-z]+)?/g) || [];
    setParagraphWords(words);
    setParagraphStatusText(`${words.length} kata siap dilatih.`);
  }, [data.word, academicSentence]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
      if (paragraphRecognitionRef.current) {
        try { paragraphRecognitionRef.current.stop(); } catch {}
      }
    };
  }, []);

  // --- SINGLE WORD PRONUNCIATION TEST ---
  const handleTogglePronunciationTest = () => {
    const RecognitionClass = getSpeechRecognition();
    if (!RecognitionClass) {
      setPronunciationMessage('Browser Anda belum mendukung Speech Recognition. Gunakan Google Chrome atau Edge.');
      setPronunciationScore(0);
      return;
    }

    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
      return;
    }

    try {
      const recognition = new RecognitionClass();
      recognitionRef.current = recognition;
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      let recognizedTranscript = '';
      let hasError = false;

      recognition.onstart = () => {
        setIsRecording(true);
        setPronunciationMessage(`Dengarkan... lalu ucapkan "${data.word}"`);
        setPronunciationScore(null);
        setPronunciationTranscript('');
      };

      recognition.onresult = (event: ISpeechRecognitionEvent) => {
        recognizedTranscript = Array.from(event.results)
          .map((res) => res[0].transcript)
          .join(' ');
      };

      recognition.onerror = (event: ISpeechRecognitionErrorEvent) => {
        hasError = true;
        setPronunciationMessage(
          event.error === 'not-allowed'
            ? 'Izin mikrofon diperlukan. Mohon izinkan mikrofon di browser Anda.'
            : 'Pemeriksaan suara belum berhasil. Silakan coba lagi.'
        );
      };

      recognition.onend = () => {
        setIsRecording(false);
        recognitionRef.current = null;

        const target = normalizeSpokenText(data.word);
        const spoken = normalizeSpokenText(recognizedTranscript);

        let score = 0;
        if (!hasError && spoken) {
          if (spoken === target) {
            score = 100;
          } else if (spoken.includes(target) || target.includes(spoken)) {
            score = 70;
          } else {
            score = 25;
          }
        }

        setPronunciationTranscript(recognizedTranscript || 'Tidak terdengar jelas');
        setPronunciationScore(score);

        if (score === 100) {
          setPronunciationMessage('Luar biasa! Pengucapan Anda sangat akurat dan jernih.');
        } else if (score >= 70) {
          setPronunciationMessage('Bagus! Pengucapan cukup jelas. Dengarkan sekali lagi untuk intonasi sempurna.');
        } else if (score > 0) {
          setPronunciationMessage('Hampir cocok. Perhatikan aksen dan suku kata penekanan.');
        } else {
          setPronunciationMessage('Suara belum terdeteksi jelas. Coba ulangi dengan suara lebih dekat ke mikrofon.');
        }
      };

      recognition.start();
    } catch (err) {
      console.error(err);
      setIsRecording(false);
      setPronunciationMessage('Gagal memulai mikrofon. Pastikan mikrofon terhubung.');
    }
  };

  // --- PARAGRAPH READING TEST ---
  const startParagraphTest = () => {
    const RecognitionClass = getSpeechRecognition();
    if (!RecognitionClass) {
      setParagraphStatusText('Browser Anda belum mendukung Speech Recognition.');
      return;
    }
    setIsParagraphTestActive(true);
    setTestedWordIndices(new Set());
    setCurrentTestingIndex(0);
    setParagraphStatusText('Klik kata pertama atau dengarkan contoh untuk mulai melatih.');
  };

  const handleParagraphWordClick = (index: number) => {
    const targetWord = paragraphWords[index];
    if (!targetWord) return;

    if (!isParagraphTestActive) {
      speakEnglish(targetWord);
      return;
    }

    const RecognitionClass = getSpeechRecognition();
    if (!RecognitionClass) {
      speakEnglish(targetWord);
      return;
    }

    if (paragraphRecognitionRef.current) {
      try { paragraphRecognitionRef.current.stop(); } catch {}
    }

    setCurrentTestingIndex(index);
    setParagraphStatusText(`Ucapkan kata: "${targetWord}"`);

    // First pronounce word for user reference
    speakEnglish(targetWord);

    setTimeout(() => {
      try {
        const recognition = new RecognitionClass();
        paragraphRecognitionRef.current = recognition;
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onresult = (event: ISpeechRecognitionEvent) => {
          const spoken = normalizeSpokenText(event.results[0][0].transcript);
          const expected = normalizeSpokenText(targetWord);

          if (spoken === expected || spoken.includes(expected)) {
            setTestedWordIndices((prev) => new Set([...prev, index]));
            setParagraphStatusText(`Benar! Kata "${targetWord}" terucap dengan tepat.`);
            if (index + 1 < paragraphWords.length) {
              setCurrentTestingIndex(index + 1);
            }
          } else {
            setParagraphStatusText(`Belum cocok (terdengar: "${spoken}"). Coba ulangi kata "${targetWord}".`);
          }
        };

        recognition.onerror = () => {
          setParagraphStatusText(`Suara tidak terdengar jelas. Coba klik "${targetWord}" lagi.`);
        };

        recognition.onend = () => {
          paragraphRecognitionRef.current = null;
        };

        recognition.start();
      } catch (err) {
        console.error(err);
      }
    }, 600);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Header Banner */}
      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 capitalize">
                {data.word}
              </h2>
              <button
                type="button"
                onClick={() => speakEnglish(data.word)}
                title="Dengarkan Pengucapan (US)"
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 dark:hover:bg-indigo-600 hover:text-white transition-all shadow-sm active:scale-95"
              >
                <Volume2 className="h-5 w-5" />
              </button>

              {/* CEFR Level Tag */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50/70 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/60 text-xs font-bold text-indigo-700 dark:text-indigo-300">
                <Award className="h-3.5 w-3.5 text-indigo-500" />
                <span>{cefrInfo.level}</span>
                <span className="text-slate-400 dark:text-slate-500">·</span>
                <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">{cefrInfo.band}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 mt-2.5">
              {data.phonetic && (
                <span
                  onClick={() => speakEnglish(data.word)}
                  title="Klik untuk mendengarkan"
                  className="cursor-pointer rounded-lg bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1 font-mono text-sm font-semibold text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 transition-colors"
                >
                  {data.phonetic}
                </span>
              )}
              <span className="text-lg font-medium text-slate-700 dark:text-slate-300">
                — {data.translation}
              </span>
            </div>
          </div>

          {/* Save Button */}
          <button
            type="button"
            onClick={onSaveWord}
            disabled={isSaved}
            className={`flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition-all shadow-sm active:scale-95 shrink-0 ${
              isSaved
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-default'
                : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-600/20'
            }`}
          >
            {isSaved ? (
              <>
                <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span>Tersimpan di Memori</span>
              </>
            ) : (
              <>
                <Bookmark className="h-4 w-4" />
                <span>Simpan ke Flashcard</span>
              </>
            )}
          </button>
        </div>

        {/* 2. Interactive Pronunciation Test */}
        <div className="mt-6 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-2 mb-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Mic className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              Test Pronunciation & Speech Score
            </h3>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              AI Voice Recognition
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
            Dengarkan contoh pengucapan audio penutur asli, lalu ucapkan kata dengan lantang ke mikrofon Anda.
          </p>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => speakEnglish(data.word)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-95 transition-all shadow-xs"
            >
              <Volume2 className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Dengarkan Contoh</span>
            </button>

            <button
              type="button"
              onClick={handleTogglePronunciationTest}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all shadow-sm active:scale-95 ${
                isRecording
                  ? 'bg-rose-600 text-white animate-pulse'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              {isRecording ? (
                <>
                  <MicOff className="h-3.5 w-3.5" />
                  <span>Berhenti Merekam</span>
                </>
              ) : (
                <>
                  <Mic className="h-3.5 w-3.5" />
                  <span>Mulai Tes Suara</span>
                </>
              )}
            </button>

            {/* Live Audio Waveform Animation */}
            <AudioWaveform isActive={isRecording} barCount={20} />
          </div>

          {/* Test results indicator */}
          {(pronunciationScore !== null || isRecording) && (
            <div className="mt-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 p-4 shadow-xs space-y-2">
              {isRecording ? (
                <div className="flex items-center gap-2 text-xs font-semibold text-rose-600 dark:text-rose-400">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                  </span>
                  <span>Mendengarkan... Silakan ucapkan kata target sekarang.</span>
                </div>
              ) : (
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3 min-w-[70px]">
                    <span
                      className={`text-2xl font-extrabold tabular-nums ${
                        (pronunciationScore || 0) >= 70
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {pronunciationScore}%
                    </span>
                    <span className="text-[10px] uppercase font-bold text-slate-400 mt-0.5">Akurasi</span>
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {pronunciationMessage}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Transkripsi terdengar:{' '}
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        "{pronunciationTranscript}"
                      </span>
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 3. Latihan Pengucapan Paragraf */}
        <div className="mt-6 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                Latihan Pengucapan Kalimat Akademik
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Klik kata untuk mendengarkan, atau aktifkan mode tes untuk membaca kalimat per kata.
              </p>
            </div>

            <button
              type="button"
              onClick={startParagraphTest}
              className="self-start sm:self-auto flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-95 transition-all shadow-xs"
            >
              <Play className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{isParagraphTestActive ? 'Mulai Ulang Tes' : 'Mulai Tes Kalimat'}</span>
            </button>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 p-4 shadow-xs">
            <div className="text-base leading-loose font-medium text-slate-800 dark:text-slate-200">
              {paragraphWords.map((word, idx) => {
                const isCorrect = testedWordIndices.has(idx);
                const isTesting = currentTestingIndex === idx;
                return (
                  <button
                    key={`${word}-${idx}`}
                    type="button"
                    onClick={() => handleParagraphWordClick(idx)}
                    className={`inline-block mx-1 px-1.5 py-0.5 rounded-md transition-all font-medium border-b-2 ${
                      isCorrect
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-500 font-bold'
                        : isTesting
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-600 animate-pulse font-bold'
                        : 'border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                    title="Klik untuk dengarkan atau uji pengucapan"
                  >
                    {word}
                  </button>
                );
              })}
            </div>

            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>{paragraphStatusText}</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {testedWordIndices.size} / {paragraphWords.length} kata terverifikasi
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Bento Grid: Vocab Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Synonyms & Antonyms */}
        <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Sinonim & Antonim</h3>
          </div>

          <div>
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-2">
              Sinonim (Padanan Makna)
            </span>
            <div className="flex flex-wrap gap-2">
              {data.synonyms && data.synonyms.length > 0 ? (
                data.synonyms.map((syn) => (
                  <button
                    key={syn}
                    type="button"
                    onClick={() => speakEnglish(syn)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-100 dark:border-indigo-900/60 bg-indigo-50/60 dark:bg-indigo-950/40 px-3 py-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors"
                  >
                    <Volume2 className="h-3 w-3 text-indigo-500" />
                    <span>{syn}</span>
                  </button>
                ))
              ) : (
                <span className="text-xs text-slate-400 italic">-</span>
              )}
            </div>
          </div>

          <div>
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-2">
              Antonim (Lawan Kata)
            </span>
            <div className="flex flex-wrap gap-2">
              {data.antonyms && data.antonyms.length > 0 ? (
                data.antonyms.map((ant) => (
                  <button
                    key={ant}
                    type="button"
                    onClick={() => speakEnglish(ant)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-rose-100 dark:border-rose-900/60 bg-rose-50/60 dark:bg-rose-950/40 px-3 py-1.5 text-xs font-semibold text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors"
                  >
                    <Volume2 className="h-3 w-3 text-rose-500" />
                    <span>{ant}</span>
                  </button>
                ))
              ) : (
                <span className="text-xs text-slate-400 italic">-</span>
              )}
            </div>
          </div>
        </div>

        {/* Word Family */}
        <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <GitBranch className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Word Family</h3>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            {(['noun', 'verb', 'adjective', 'adverb'] as const).map((type) => {
              const val = data.word_family?.[type];
              const exists = val && val !== '-';
              return (
                <div
                  key={type}
                  className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-3"
                >
                  <span className="font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block text-[10px]">
                    {type}
                  </span>
                  {exists ? (
                    <button
                      type="button"
                      onClick={() => speakEnglish(val)}
                      className="mt-1 text-sm font-bold text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1"
                    >
                      <span>{val}</span>
                      <Volume2 className="h-3 w-3 text-slate-400" />
                    </button>
                  ) : (
                    <span className="mt-1 block text-slate-400 italic">-</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Collocations */}
        <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <Layers className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Common Collocations</h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Sering bersanding dengan frasa berikut:</p>
          <div className="flex flex-wrap gap-2">
            {data.collocations && data.collocations.length > 0 ? (
              data.collocations.map((col) => (
                <button
                  key={col}
                  type="button"
                  onClick={() => speakEnglish(col)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-100 dark:border-emerald-900/60 bg-emerald-50/60 dark:bg-emerald-950/40 px-3 py-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors"
                >
                  <Volume2 className="h-3 w-3 text-emerald-600" />
                  <span>{col}</span>
                </button>
              ))
            ) : (
              <span className="text-xs text-slate-400 italic">Tidak ada collocation khusus.</span>
            )}
          </div>
        </div>

        {/* Morphology */}
        <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <GraduationCap className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Analisis Akar Kata (Morfologi)</h3>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            {(['prefix', 'root', 'suffix'] as const).map((part) => {
              const val = data.morphology?.[part];
              return (
                <div
                  key={part}
                  className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-2.5"
                >
                  <span className="font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block text-[10px]">
                    {part}
                  </span>
                  <span className="mt-1 block text-xs font-semibold text-slate-800 dark:text-slate-200 leading-snug">
                    {val && val !== '-' ? val : '-'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Visual Morphology & Tree Concept Map */}
      <MorphologyTreeGraph data={data} />

      {/* 5. Auto Generate Chunk Section (ChunkSpeak) */}
      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span className="text-lg">🧩</span>
              Auto Generate Chunk (Pola Penggunaan Kalimat)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Pola struktur tata bahasa alami untuk kata atau frasa ini dalam konteks akademik TOEFL.
            </p>
          </div>

          <button
            type="button"
            onClick={onGenerateChunks}
            disabled={isGeneratingChunks}
            className="flex items-center gap-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/60 px-4 py-2 text-xs font-bold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900 active:scale-95 disabled:opacity-50 transition-all shadow-xs shrink-0"
          >
            <Sparkles className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>{isGeneratingChunks ? 'Membuat Chunk...' : '✨ Generate Chunk Baru'}</span>
          </button>
        </div>

        {data.chunks && data.chunks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {data.chunks.map((chunk, idx) => (
              <div
                key={`${chunk.pattern}-${idx}`}
                className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-4 space-y-2 hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded-md">
                    {chunk.pattern}
                  </span>
                  <button
                    type="button"
                    onClick={() => speakEnglish(chunk.example_en)}
                    title="Dengarkan kalimat"
                    className="text-slate-400 hover:text-indigo-600 p-1"
                  >
                    <Volume2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">{chunk.rule}</p>
                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                  <p
                    onClick={() => speakEnglish(chunk.example_en)}
                    className="text-xs font-semibold text-slate-900 dark:text-slate-200 cursor-pointer hover:text-indigo-600"
                  >
                    "{chunk.example_en}"
                  </p>
                  <p className="text-xs text-slate-500 italic mt-0.5">{chunk.example_id}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 px-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
            <p className="text-xs text-slate-500 mb-3">
              Chunk pola bicara belum dibuat untuk kata ini.
            </p>
            <button
              type="button"
              onClick={onGenerateChunks}
              disabled={isGeneratingChunks}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition-all"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Buat Pola Chunk Otomatis</span>
            </button>
          </div>
        )}
      </div>

      {/* 6. Academic Tenses Grid */}
      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
        <div className="pb-2 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FileText className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            Penggunaan dalam Kalimat Akademik (3 Tenses)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Disesuaikan dengan konteks bacaan/percakapan ujian TOEFL iBT (Sains, Sejarah, Akademik).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Present */}
          {data.tenses?.present && (
            <div className="rounded-xl border border-emerald-200/80 dark:border-emerald-900/60 bg-gradient-to-br from-white dark:from-slate-900 to-emerald-50/30 dark:to-emerald-950/20 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400">Present Tense</span>
                <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-100/80 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                  {data.tenses.present.form}
                </span>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <p
                    onClick={() => speakEnglish(data.tenses?.present.example_en || '')}
                    className="text-xs font-semibold text-slate-900 dark:text-slate-200 leading-relaxed cursor-pointer hover:text-emerald-700 dark:hover:text-emerald-400"
                  >
                    {data.tenses.present.example_en}
                  </p>
                  <button
                    type="button"
                    onClick={() => speakEnglish(data.tenses?.present.example_en || '')}
                    className="text-slate-400 hover:text-emerald-600 shrink-0 mt-0.5"
                  >
                    <Volume2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 italic">{data.tenses.present.example_id}</p>
              </div>
            </div>
          )}

          {/* Past */}
          {data.tenses?.past && (
            <div className="rounded-xl border border-blue-200/80 dark:border-blue-900/60 bg-gradient-to-br from-white dark:from-slate-900 to-blue-50/30 dark:to-blue-950/20 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-800 dark:text-blue-400">Past Tense</span>
                <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-blue-100/80 dark:bg-blue-950 text-blue-800 dark:text-blue-300">
                  {data.tenses.past.form}
                </span>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <p
                    onClick={() => speakEnglish(data.tenses?.past.example_en || '')}
                    className="text-xs font-semibold text-slate-900 dark:text-slate-200 leading-relaxed cursor-pointer hover:text-blue-700 dark:hover:text-blue-400"
                  >
                    {data.tenses.past.example_en}
                  </p>
                  <button
                    type="button"
                    onClick={() => speakEnglish(data.tenses?.past.example_en || '')}
                    className="text-slate-400 hover:text-blue-600 shrink-0 mt-0.5"
                  >
                    <Volume2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 italic">{data.tenses.past.example_id}</p>
              </div>
            </div>
          )}

          {/* Present Perfect */}
          {data.tenses?.present_perfect && (
            <div className="rounded-xl border border-purple-200/80 dark:border-purple-900/60 bg-gradient-to-br from-white dark:from-slate-900 to-purple-50/30 dark:to-purple-950/20 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-800 dark:text-purple-400">Present Perfect</span>
                <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-purple-100/80 dark:bg-purple-950 text-purple-800 dark:text-purple-300">
                  {data.tenses.present_perfect.form}
                </span>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <p
                    onClick={() => speakEnglish(data.tenses?.present_perfect.example_en || '')}
                    className="text-xs font-semibold text-slate-900 dark:text-slate-200 leading-relaxed cursor-pointer hover:text-purple-700 dark:hover:text-purple-400"
                  >
                    {data.tenses.present_perfect.example_en}
                  </p>
                  <button
                    type="button"
                    onClick={() => speakEnglish(data.tenses?.present_perfect.example_en || '')}
                    className="text-slate-400 hover:text-purple-600 shrink-0 mt-0.5"
                  >
                    <Volume2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 italic">{data.tenses.present_perfect.example_id}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 7. Simulation of Reading Comprehension in Context */}
      <ReadingPassageSection
        targetWord={data.word}
        savedWords={savedWords || []}
        apiKey={apiKey || ''}
        onNeedApiKey={onNeedApiKey || (() => {})}
      />

      {/* 8. Sentence Writing Sandbox (TOEFL Writing Coach) */}
      <SentenceWritingSandbox
        targetWord={data.word}
        apiKey={apiKey || ''}
        onNeedApiKey={onNeedApiKey || (() => {})}
      />
    </div>
  );
};
