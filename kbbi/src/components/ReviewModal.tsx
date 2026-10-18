import React, { useState, useEffect, useMemo, useRef } from 'react';
import { KBBICard } from '../types';
import { calculateNextReview, speakIndonesian, normalizePronunciation } from '../utils/sm2';
import { divideIndonesianSyllables } from '../utils/streak';
import {
  X,
  Volume2,
  Mic,
  RotateCw,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Trophy,
  ArrowRight,
  HelpCircle,
  Smile,
  Meh,
  Frown,
  Zap
} from 'lucide-react';

interface ReviewModalProps {
  queue: KBBICard[];
  modeTitle: string;
  onClose: () => void;
  onCardRated: (card: KBBICard, updatedFields: Partial<KBBICard>) => void;
  allCards: KBBICard[];
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  queue,
  modeTitle,
  onClose,
  onCardRated,
  allCards
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [stats, setStats] = useState({ again: 0, hard: 0, good: 0, easy: 0 });

  // Current Card
  const currentCard = queue[currentIndex];

  // Quiz States for current card
  const [synonymAnswer, setSynonymAnswer] = useState<{ selected: string; isCorrect: boolean } | null>(null);
  const [antonymAnswer, setAntonymAnswer] = useState<{ selected: string; isCorrect: boolean } | null>(null);

  // Pronunciation states
  const [isRecording, setIsRecording] = useState(false);
  const [speechTranscript, setSpeechTranscript] = useState('');
  const [speechScore, setSpeechScore] = useState<number | null>(null);
  const [speechError, setSpeechError] = useState('');
  const recognitionRef = useRef<any>(null);

  // Generate options for Synonym & Antonim
  const synonymOptions = useMemo(() => {
    if (!currentCard || !currentCard.synonyms || currentCard.synonyms.length === 0) return [];
    const correct = currentCard.synonyms[0];
    
    // Distractor from antonym or another random word
    const otherWords = allCards.filter(c => c.word !== currentCard.word);
    const distractor1 = currentCard.antonyms?.[0] || otherWords[0]?.word || 'netral';
    const distractor2 = currentCard.word;

    const list = [correct, distractor1, distractor2].filter((v, i, a) => v && a.indexOf(v) === i);
    return list.sort(() => Math.random() - 0.5);
  }, [currentCard, allCards]);

  const antonymOptions = useMemo(() => {
    if (!currentCard || !currentCard.antonyms || currentCard.antonyms.length === 0) return [];
    const correct = currentCard.antonyms[0];
    
    const otherWords = allCards.filter(c => c.word !== currentCard.word);
    const distractor1 = currentCard.synonyms?.[0] || otherWords[0]?.word || 'identik';
    const distractor2 = currentCard.word;

    const list = [correct, distractor1, distractor2].filter((v, i, a) => v && a.indexOf(v) === i);
    return list.sort(() => Math.random() - 0.5);
  }, [currentCard, allCards]);

  // Reset states when moving to next card
  useEffect(() => {
    setIsFlipped(false);
    setSynonymAnswer(null);
    setAntonymAnswer(null);
    resetSpeechTest();
  }, [currentIndex]);

  const resetSpeechTest = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch (e) {}
    }
    recognitionRef.current = null;
    setIsRecording(false);
    setSpeechTranscript('');
    setSpeechScore(null);
    setSpeechError('');
  };

  // Flip card
  const handleFlip = () => {
    setIsFlipped(prev => !prev);
  };

  // Rate card with SM-2
  const handleRate = (quality: number) => {
    if (!currentCard) return;

    if (quality === 1) setStats(s => ({ ...s, again: s.again + 1 }));
    else if (quality === 3) setStats(s => ({ ...s, hard: s.hard + 1 }));
    else if (quality === 4) setStats(s => ({ ...s, good: s.good + 1 }));
    else if (quality === 5) setStats(s => ({ ...s, easy: s.easy + 1 }));

    const updated = calculateNextReview(currentCard, quality);
    onCardRated(currentCard, updated);

    if (currentIndex + 1 >= queue.length) {
      setSessionCompleted(true);
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (sessionCompleted) return;

      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleFlip();
      } else if (e.key === 'Escape') {
        onClose();
      } else if (isFlipped) {
        if (e.key === '1') handleRate(1);
        else if (e.key === '2') handleRate(3);
        else if (e.key === '3') handleRate(4);
        else if (e.key === '4') handleRate(5);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFlipped, currentIndex, sessionCompleted, currentCard]);

  // Speech Recognition
  const handleToggleSpeech = () => {
    const Recognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!Recognition) {
      setSpeechError('Peramban ini belum mendukung Speech Recognition suara.');
      return;
    }

    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      return;
    }

    resetSpeechTest();
    setIsRecording(true);
    setSpeechError('');

    try {
      const recognition = new Recognition();
      recognition.lang = 'id-ID';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognitionRef.current = recognition;

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((item: any) => item[0].transcript)
          .join(' ');
        setSpeechTranscript(transcript);

        const target = normalizePronunciation(currentCard.word);
        const spoken = normalizePronunciation(transcript);

        let score = 25;
        if (spoken === target) {
          score = 100;
        } else if (spoken.includes(target) || target.includes(spoken)) {
          score = 70;
        } else if (!spoken) {
          score = 0;
        }
        setSpeechScore(score);
      };

      recognition.onerror = (event: any) => {
        setSpeechError(event.error === 'not-allowed' ? 'Izin mikrofon diperlukan.' : 'Gagal merekam suara.');
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
    } catch (e: any) {
      setSpeechError('Gagal menginisialisasi rekaman.');
      setIsRecording(false);
    }
  };

  if (sessionCompleted) {
    const totalReviewed = queue.length;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 p-4 backdrop-blur-md animate-in fade-in">
        <div className="w-full max-w-md rounded-3xl bg-white p-7 text-center shadow-2xl ring-1 ring-stone-900/10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-lg shadow-amber-500/20 mb-4">
            <Trophy className="h-8 w-8" />
          </div>

          <h3 className="font-serif text-2xl font-bold text-stone-900">
            Sesi Review Selesai!
          </h3>
          <p className="mt-1 text-xs text-stone-500">
            Hebat! Anda telah menuntaskan seluruh kartu pada sesi {modeTitle}.
          </p>

          <div className="my-6 grid grid-cols-4 gap-2 rounded-2xl bg-stone-50 p-4 border border-stone-200/80">
            <div>
              <div className="text-rose-600 font-bold text-lg">{stats.again}</div>
              <div className="text-[10px] text-stone-500 font-medium">Lupa</div>
            </div>
            <div>
              <div className="text-amber-600 font-bold text-lg">{stats.hard}</div>
              <div className="text-[10px] text-stone-500 font-medium">Sulit</div>
            </div>
            <div>
              <div className="text-emerald-600 font-bold text-lg">{stats.good}</div>
              <div className="text-[10px] text-stone-500 font-medium">Ingat</div>
            </div>
            <div>
              <div className="text-blue-600 font-bold text-lg">{stats.easy}</div>
              <div className="text-[10px] text-stone-500 font-medium">Mudah</div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-800 py-3 text-sm font-bold text-white shadow-md hover:bg-emerald-900 transition-all cursor-pointer"
          >
            <span>Kembali ke Koleksi</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/70 p-3 sm:p-4 backdrop-blur-md overflow-y-auto animate-in fade-in">
      <div className="w-full max-w-2xl rounded-3xl bg-white p-5 sm:p-7 shadow-2xl ring-1 ring-stone-900/10 flex flex-col max-h-[92vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div>
            <span className="text-[11px] font-bold tracking-wider text-emerald-800 uppercase bg-emerald-50 px-2 py-0.5 rounded">
              {modeTitle}
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-semibold text-stone-800">
                Kartu {currentIndex + 1} dari {queue.length}
              </span>
              <span className="text-stone-300">·</span>
              <span className="text-xs text-stone-500">
                {currentCard.repetition ? `Review ke-${currentCard.repetition}` : 'Kartu Baru'}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors"
            title="Tutup (Esc)"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-stone-100 h-1.5 rounded-full my-3 overflow-hidden">
          <div
            className="bg-emerald-700 h-full rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / queue.length) * 100}%` }}
          />
        </div>

        {/* 3D Flashcard Container */}
        <div className="perspective-1000 my-2 min-h-[380px] sm:min-h-[420px] cursor-pointer" onClick={handleFlip}>
          <div
            className={`relative w-full h-full min-h-[380px] sm:min-h-[420px] transform-style-preserve-3d transition-transform duration-500 rounded-2xl ${
              isFlipped ? 'rotate-y-180' : ''
            }`}
          >
            {/* FRONT FACE */}
            <div className="absolute inset-0 backface-hidden rounded-2xl border-2 border-stone-200/80 bg-gradient-to-b from-stone-50 to-[#F9F7F2] p-6 sm:p-8 flex flex-col justify-between items-center text-center shadow-inner">
              <div className="w-full flex justify-between items-center text-xs text-stone-400">
                <span>Kosakata KBBI</span>
                <span>Spasi / Klik untuk membalik</span>
              </div>

              <div className="my-auto py-6">
                <div className="flex flex-wrap items-center justify-center gap-1.5 mb-2">
                  {currentCard.category && (
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/70 px-2.5 py-0.5 rounded-full">
                      {currentCard.category}
                    </span>
                  )}
                  {currentCard.wordClass && (
                    <span className="text-[10px] font-bold text-stone-700 bg-stone-200/80 px-2 py-0.5 rounded-full">
                      {currentCard.wordClass}
                    </span>
                  )}
                  {currentCard.etymology && (
                    <span className="text-[10px] font-medium text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-full">
                      {currentCard.etymology}
                    </span>
                  )}
                </div>
                <h2 className="font-serif text-4xl sm:text-5xl font-extrabold text-stone-900 tracking-tight">
                  {currentCard.word}
                </h2>
                <div className="text-xs font-mono text-stone-500 mt-1">
                  [{currentCard.syllables || divideIndonesianSyllables(currentCard.word)}]
                </div>
                <div className="mt-4 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      speakIndonesian(currentCard.word);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-semibold text-emerald-800 shadow-sm border border-stone-200 hover:bg-emerald-50 transition-colors"
                  >
                    <Volume2 className="h-3.5 w-3.5 text-emerald-700" />
                    <span>Dengar Lafal</span>
                  </button>
                </div>
              </div>

              <div className="w-full rounded-xl bg-white/70 py-2.5 px-4 text-xs font-medium text-stone-600 border border-stone-200/60">
                💡 Coba ingat arti, sinonim, antonim, dan buat kalimat dalam benak Anda
              </div>
            </div>

            {/* BACK FACE */}
            <div
              className="absolute inset-0 backface-hidden rotate-y-180 rounded-2xl border-2 border-emerald-700/30 bg-white p-5 sm:p-6 overflow-y-auto flex flex-col justify-between shadow-inner"
              onClick={(e) => e.stopPropagation()}
            >
              <div>
                {/* Word & Pronounce */}
                <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-serif text-2xl sm:text-3xl font-extrabold text-stone-950">
                      {currentCard.word}
                    </span>
                    <span className="text-xs font-mono text-stone-400">
                      [{currentCard.syllables || divideIndonesianSyllables(currentCard.word)}]
                    </span>
                    {currentCard.wordClass && (
                      <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                        {currentCard.wordClass}
                      </span>
                    )}
                    {currentCard.etymology && (
                      <span className="text-[11px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded font-medium">
                        {currentCard.etymology}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => speakIndonesian(currentCard.word)}
                      className="text-emerald-700 hover:bg-emerald-50 p-1.5 rounded-lg transition-colors"
                      title="Dengarkan pengucapan"
                    >
                      <Volume2 className="h-4 w-4" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={handleFlip}
                    className="inline-flex items-center gap-1 text-xs text-stone-400 hover:text-stone-700"
                  >
                    <RotateCw className="h-3.5 w-3.5" />
                    <span>Balik</span>
                  </button>
                </div>

                {/* Definition */}
                <div className="mt-3 rounded-xl bg-emerald-50/70 p-3.5 border border-emerald-100">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block mb-1">
                    Definisi KBBI
                  </span>
                  <p className="text-sm font-semibold text-emerald-950 leading-relaxed">
                    {currentCard.meaning}
                  </p>
                </div>

                {/* Example sentence */}
                {currentCard.example && (
                  <div className="mt-3 rounded-xl bg-stone-50 p-3 border-l-3 border-amber-500 text-xs text-stone-700">
                    <strong className="block text-[11px] font-bold text-stone-900 mb-0.5">
                      Contoh Kalimat:
                    </strong>
                    <p className="italic font-serif leading-relaxed text-stone-800">
                      "{currentCard.example}"
                    </p>
                    {currentCard.note && (
                      <p className="mt-1 text-[11px] not-italic text-stone-500 font-sans">
                        Catatan: {currentCard.note}
                      </p>
                    )}
                  </div>
                )}

                {/* Interactive Quiz 1: Sinonim */}
                {synonymOptions.length > 0 && (
                  <div className="mt-3 rounded-xl border border-stone-200/90 p-3 bg-stone-50/40">
                    <span className="text-[11px] font-bold text-stone-700 block mb-1.5">
                      🎯 Kuis Sinonim (Pilih yang paling dekat artinya):
                    </span>
                    <div className="grid grid-cols-3 gap-1.5">
                      {synonymOptions.map((opt) => {
                        const isChosen = synonymAnswer?.selected === opt;
                        const isCorrectOption = opt === currentCard.synonyms[0];
                        let btnStyle = 'bg-white border-stone-200 text-stone-800 hover:bg-stone-100';

                        if (synonymAnswer) {
                          if (isCorrectOption) {
                            btnStyle = 'bg-emerald-100 border-emerald-400 text-emerald-900 font-bold';
                          } else if (isChosen && !isCorrectOption) {
                            btnStyle = 'bg-rose-100 border-rose-400 text-rose-900';
                          }
                        }

                        return (
                          <button
                            key={opt}
                            disabled={!!synonymAnswer}
                            onClick={() => {
                              const correct = opt === currentCard.synonyms[0];
                              setSynonymAnswer({ selected: opt, isCorrect: correct });
                            }}
                            className={`rounded-lg border px-2 py-1.5 text-xs text-center transition-all truncate ${btnStyle}`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                    {synonymAnswer && (
                      <span className={`text-[11px] font-semibold mt-1.5 block ${synonymAnswer.isCorrect ? 'text-emerald-700' : 'text-rose-600'}`}>
                        {synonymAnswer.isCorrect ? '✓ Tepat sekali!' : `✕ Jawaban tepat: ${currentCard.synonyms[0]}`}
                      </span>
                    )}
                  </div>
                )}

                {/* Interactive Quiz 2: Antonim */}
                {antonymOptions.length > 0 && (
                  <div className="mt-2.5 rounded-xl border border-stone-200/90 p-3 bg-stone-50/40">
                    <span className="text-[11px] font-bold text-stone-700 block mb-1.5">
                      ⚔️ Kuis Antonim (Pilih lawan kata):
                    </span>
                    <div className="grid grid-cols-3 gap-1.5">
                      {antonymOptions.map((opt) => {
                        const isChosen = antonymAnswer?.selected === opt;
                        const isCorrectOption = opt === currentCard.antonyms[0];
                        let btnStyle = 'bg-white border-stone-200 text-stone-800 hover:bg-stone-100';

                        if (antonymAnswer) {
                          if (isCorrectOption) {
                            btnStyle = 'bg-emerald-100 border-emerald-400 text-emerald-900 font-bold';
                          } else if (isChosen && !isCorrectOption) {
                            btnStyle = 'bg-rose-100 border-rose-400 text-rose-900';
                          }
                        }

                        return (
                          <button
                            key={opt}
                            disabled={!!antonymAnswer}
                            onClick={() => {
                              const correct = opt === currentCard.antonyms[0];
                              setAntonymAnswer({ selected: opt, isCorrect: correct });
                            }}
                            className={`rounded-lg border px-2 py-1.5 text-xs text-center transition-all truncate ${btnStyle}`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                    {antonymAnswer && (
                      <span className={`text-[11px] font-semibold mt-1.5 block ${antonymAnswer.isCorrect ? 'text-emerald-700' : 'text-rose-600'}`}>
                        {antonymAnswer.isCorrect ? '✓ Tepat sekali!' : `✕ Lawan kata: ${currentCard.antonyms[0]}`}
                      </span>
                    )}
                  </div>
                )}

                {/* Interactive Pronunciation Test */}
                <div className="mt-2.5 rounded-xl border border-stone-200/90 p-3 bg-stone-50/40">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-bold text-stone-700">
                      🎙️ Uji Pelafalan / Pronunciation:
                    </span>
                    {speechScore !== null && (
                      <span className={`text-xs font-black ${speechScore >= 70 ? 'text-emerald-700' : 'text-rose-600'}`}>
                        Skor: {speechScore}%
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleToggleSpeech}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                        isRecording
                          ? 'bg-rose-600 text-white animate-pulse'
                          : 'bg-emerald-800 text-white hover:bg-emerald-900'
                      }`}
                    >
                      <Mic className="h-3.5 w-3.5" />
                      <span>{isRecording ? '■ Berhenti' : 'Mulai Bicara'}</span>
                    </button>
                    <span className="text-[11px] text-stone-500">
                      {isRecording
                        ? `Ucapkan kata: "${currentCard.word}"`
                        : speechTranscript
                        ? `Terdengar: "${speechTranscript}"`
                        : 'Klik untuk cek ketepatan vokal'}
                    </span>
                  </div>
                  {speechError && (
                    <span className="text-[11px] text-rose-600 font-medium block mt-1">
                      {speechError}
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-stone-100 text-center text-[11px] text-stone-400">
                Pilih evaluasi daya ingat Anda di bawah ini
              </div>
            </div>
          </div>
        </div>

        {/* Rating Bar (SM-2 Spaced Repetition) */}
        {isFlipped ? (
          <div className="mt-3 pt-3 border-t border-stone-200">
            <div className="text-[11px] text-stone-500 font-semibold mb-2 flex items-center justify-between">
              <span>Tingkat kemudahan mengingat kata ini:</span>
              <span className="text-stone-400">Tombol pintas: [1] [2] [3] [4]</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handleRate(1)}
                className="group flex flex-col items-center justify-center rounded-xl bg-rose-50 border border-rose-200/80 p-2.5 text-rose-800 hover:bg-rose-100 hover:border-rose-300 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-1 font-bold text-xs">
                  <Frown className="h-3.5 w-3.5" />
                  <span>Lupa (1)</span>
                </div>
                <span className="text-[10px] text-rose-600/80 mt-0.5">Ulangi hari ini</span>
              </button>

              <button
                type="button"
                onClick={() => handleRate(3)}
                className="group flex flex-col items-center justify-center rounded-xl bg-amber-50 border border-amber-200/80 p-2.5 text-amber-800 hover:bg-amber-100 hover:border-amber-300 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-1 font-bold text-xs">
                  <Meh className="h-3.5 w-3.5" />
                  <span>Sulit (2)</span>
                </div>
                <span className="text-[10px] text-amber-600/80 mt-0.5">Review besok</span>
              </button>

              <button
                type="button"
                onClick={() => handleRate(4)}
                className="group flex flex-col items-center justify-center rounded-xl bg-emerald-50 border border-emerald-200/80 p-2.5 text-emerald-800 hover:bg-emerald-100 hover:border-emerald-300 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-1 font-bold text-xs">
                  <Smile className="h-3.5 w-3.5" />
                  <span>Ingat (3)</span>
                </div>
                <span className="text-[10px] text-emerald-600/80 mt-0.5">Sesuai jadwal</span>
              </button>

              <button
                type="button"
                onClick={() => handleRate(5)}
                className="group flex flex-col items-center justify-center rounded-xl bg-blue-50 border border-blue-200/80 p-2.5 text-blue-800 hover:bg-blue-100 hover:border-blue-300 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-1 font-bold text-xs">
                  <Zap className="h-3.5 w-3.5" />
                  <span>Mudah (4)</span>
                </div>
                <span className="text-[10px] text-blue-600/80 mt-0.5">Interval lebih lama</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-3 text-center">
            <button
              type="button"
              onClick={handleFlip}
              className="inline-flex items-center gap-1.5 rounded-xl bg-stone-900 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-stone-800 transition-all cursor-pointer"
            >
              <span>Balik Kartu untuk Jawaban</span>
              <span className="text-stone-400 font-mono text-[10px]">[Spasi]</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
