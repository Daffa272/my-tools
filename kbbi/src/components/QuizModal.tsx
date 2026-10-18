import React, { useState, useEffect, useMemo, useRef } from 'react';
import { KBBICard, QuizMode } from '../types';
import { HIGHSCORE_KEY } from '../utils/streak';
import {
  X,
  Zap,
  PenTool,
  Clock,
  Trophy,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Flame
} from 'lucide-react';

interface QuizModalProps {
  mode: QuizMode;
  cards: KBBICard[];
  onClose: () => void;
  onActivityDone: () => void;
}

interface Question {
  card: KBBICard;
  type: 'meaning' | 'blank';
  prompt: string;
  options: string[];
  correctAnswer: string;
}

export const QuizModal: React.FC<QuizModalProps> = ({
  mode,
  cards,
  onClose,
  onActivityDone
}) => {
  // Speed Challenge states
  const [timeLeft, setTimeLeft] = useState(60);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [currentQIndex, setCurrentQIndex] = useState(0);

  // Selected feedback
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrectFeedback, setIsCorrectFeedback] = useState<boolean | null>(null);

  // High score
  const [highScore, setHighScore] = useState(() => {
    try {
      return Number(localStorage.getItem(HIGHSCORE_KEY)) || 0;
    } catch {
      return 0;
    }
  });

  // Prepare questions pool
  const questions: Question[] = useMemo(() => {
    if (cards.length < 2) return [];

    const shuffledCards = [...cards].sort(() => Math.random() - 0.5);
    const list: Question[] = [];

    shuffledCards.forEach((card) => {
      // For Speed mode: ask definition
      if (mode === 'speed') {
        // Collect 3 wrong definitions from other cards
        const otherCards = cards.filter(c => c.word !== card.word);
        const wrongOpts = [...otherCards]
          .sort(() => Math.random() - 0.5)
          .slice(0, 3)
          .map(c => c.meaning);

        const options = [card.meaning, ...wrongOpts].sort(() => Math.random() - 0.5);

        list.push({
          card,
          type: 'meaning',
          prompt: `Apa arti kata "${card.word}" menurut KBBI?`,
          options,
          correctAnswer: card.meaning
        });
      } else {
        // For Fill-in-the-blank mode
        if (card.example) {
          // Replace target word in example with [ ... ]
          const regex = new RegExp(`\\b${card.word}\\b`, 'gi');
          const masked = card.example.replace(regex, '[ . . . ]');

          // If regex didn't match whole word, do simple replace
          const promptText = masked.includes('[ . . . ]')
            ? masked
            : card.example.replace(new RegExp(card.word, 'i'), '[ . . . ]');

          // Options are words
          const otherCards = cards.filter(c => c.word !== card.word);
          const wrongOpts = [...otherCards]
            .sort(() => Math.random() - 0.5)
            .slice(0, 3)
            .map(c => c.word);

          const options = [card.word, ...wrongOpts].sort(() => Math.random() - 0.5);

          list.push({
            card,
            type: 'blank',
            prompt: promptText,
            options,
            correctAnswer: card.word
          });
        }
      }
    });

    return list;
  }, [cards, mode]);

  // Timer for Speed Mode
  useEffect(() => {
    if (mode !== 'speed' || isFinished) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          finishQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [mode, isFinished]);

  const finishQuiz = () => {
    setIsFinished(true);
    onActivityDone();

    if (mode === 'speed') {
      setHighScore(prev => {
        const nextHigh = Math.max(prev, score);
        try {
          localStorage.setItem(HIGHSCORE_KEY, String(nextHigh));
        } catch {}
        return nextHigh;
      });
    }
  };

  const currentQ = questions[currentQIndex % (questions.length || 1)];

  const handleSelectOption = (option: string) => {
    if (selectedOption !== null || !currentQ) return;

    setSelectedOption(option);
    const correct = option === currentQ.correctAnswer;
    setIsCorrectFeedback(correct);

    if (correct) {
      const nextCombo = combo + 1;
      setCombo(nextCombo);
      setMaxCombo(prev => Math.max(prev, nextCombo));
      setScore(s => s + (10 + nextCombo * 2));
    } else {
      setCombo(0);
    }

    // Move to next question after brief pause
    setTimeout(() => {
      setSelectedOption(null);
      setIsCorrectFeedback(null);

      if (mode === 'fill-blank') {
        if (currentQIndex + 1 >= Math.min(10, questions.length)) {
          finishQuiz();
        } else {
          setCurrentQIndex(i => i + 1);
        }
      } else {
        // Speed mode keeps going until time runs out
        setCurrentQIndex(i => i + 1);
      }
    }, 850);
  };

  const restartQuiz = () => {
    setTimeLeft(60);
    setScore(0);
    setCombo(0);
    setIsFinished(false);
    setCurrentQIndex(0);
    setSelectedOption(null);
    setIsCorrectFeedback(null);
  };

  if (cards.length < 3) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 p-4 backdrop-blur-sm animate-in fade-in">
        <div className="w-full max-w-md rounded-3xl bg-white p-7 text-center shadow-2xl ring-1 ring-stone-900/10">
          <AlertCircle className="mx-auto h-12 w-12 text-amber-500 mb-3" />
          <h3 className="font-serif text-lg font-bold text-stone-900">
            Koleksi Masih Sedikit
          </h3>
          <p className="mt-2 text-xs text-stone-600 leading-relaxed">
            Mode kuis membutuhkan minimal 3 kosa kata untuk menyusun pilihan ganda. Tambahkan kosa kata atau muat contoh kartu terlebih dahulu.
          </p>
          <button
            onClick={onClose}
            className="mt-6 w-full rounded-xl bg-stone-900 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-stone-800"
          >
            Kembali
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/70 p-4 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-2xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl ring-1 ring-stone-900/10 flex flex-col max-h-[92vh] overflow-y-auto">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-xl ${mode === 'speed' ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'}`}>
              {mode === 'speed' ? <Zap className="h-5 w-5 fill-current" /> : <PenTool className="h-5 w-5" />}
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-stone-900">
                {mode === 'speed' ? 'Kuis Kilat 60 Detik' : 'Latihan Kalimat Rumpang'}
              </h3>
              <p className="text-xs text-stone-500">
                {mode === 'speed'
                  ? 'Jawab sebanyak mungkin sebelum waktu habis!'
                  : 'Lengkapi kalimat dengan kosakata baku yang paling tepat'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Dashboard Status Bar */}
        <div className="my-4 flex items-center justify-between rounded-2xl bg-stone-50 p-3.5 border border-stone-200/80 text-xs">
          {mode === 'speed' ? (
            <>
              <div className="flex items-center gap-2">
                <Clock className={`h-4 w-4 ${timeLeft <= 10 ? 'text-rose-600 animate-pulse' : 'text-stone-500'}`} />
                <span className={`font-mono text-base font-bold ${timeLeft <= 10 ? 'text-rose-600' : 'text-stone-900'}`}>
                  {timeLeft}s
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Flame className={`h-4 w-4 ${combo > 1 ? 'text-amber-500 fill-amber-500 animate-bounce' : 'text-stone-300'}`} />
                <span className="font-bold text-amber-700">
                  Combo: x{combo}
                </span>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-stone-400 block">Skor</span>
                <span className="font-mono text-base font-bold text-emerald-700">
                  {score}
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="font-semibold text-stone-700">
                Pertanyaan {currentQIndex + 1} dari {Math.min(10, questions.length)}
              </div>
              <div className="font-mono font-bold text-emerald-800">
                Skor: {score}
              </div>
            </>
          )}
        </div>

        {/* Active Question or Finished Screen */}
        {isFinished ? (
          <div className="my-auto py-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-lg mb-4">
              <Trophy className="h-8 w-8" />
            </div>

            <h4 className="font-serif text-2xl font-bold text-stone-900">
              Tantangan Selesai!
            </h4>
            <p className="text-xs text-stone-500 mt-1">
              {mode === 'speed'
                ? `Waktu habis! Anda berhasil mengumpulkan skor total ${score}.`
                : `Latihan selesai! Skor akhir Anda adalah ${score}.`}
            </p>

            <div className="my-6 grid grid-cols-2 gap-3 max-w-xs mx-auto">
              <div className="rounded-2xl bg-stone-50 p-3 border border-stone-200">
                <span className="text-[11px] text-stone-400 block">Skor Akhir</span>
                <span className="font-mono text-2xl font-black text-emerald-700">{score}</span>
              </div>
              <div className="rounded-2xl bg-stone-50 p-3 border border-stone-200">
                <span className="text-[11px] text-stone-400 block">Rekor Terbaik</span>
                <span className="font-mono text-2xl font-black text-amber-600">{highScore}</span>
              </div>
            </div>

            <div className="flex gap-2 justify-center max-w-sm mx-auto">
              <button
                onClick={restartQuiz}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-stone-300 bg-white py-2.5 text-xs font-bold text-stone-800 hover:bg-stone-50 shadow-xs cursor-pointer"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Coba Lagi</span>
              </button>
              <button
                onClick={onClose}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-800 py-2.5 text-xs font-bold text-white hover:bg-emerald-900 shadow-md cursor-pointer"
              >
                <span>Selesai</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : currentQ ? (
          <div className="my-auto py-2">
            {/* Prompt Box */}
            <div className="rounded-2xl bg-gradient-to-br from-stone-50 to-[#F9F7F2] p-5 sm:p-6 border border-stone-200/90 text-center mb-5">
              <span className="text-[11px] font-bold tracking-wider text-emerald-800 uppercase block mb-2">
                {mode === 'speed' ? 'Tebak Makna KBBI' : 'Lengkapi Kalimat'}
              </span>
              <p className="font-serif text-lg sm:text-xl font-bold text-stone-900 leading-relaxed">
                {currentQ.prompt}
              </p>
            </div>

            {/* Multiple Choice Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {currentQ.options.map((opt) => {
                const isSelected = selectedOption === opt;
                const isCorrect = opt === currentQ.correctAnswer;

                let btnClass = 'bg-white border-stone-200 hover:border-emerald-600 hover:bg-emerald-50/30 text-stone-800';

                if (selectedOption !== null) {
                  if (isCorrect) {
                    btnClass = 'bg-emerald-100 border-emerald-500 text-emerald-950 font-bold';
                  } else if (isSelected && !isCorrect) {
                    btnClass = 'bg-rose-100 border-rose-400 text-rose-950';
                  } else {
                    btnClass = 'bg-stone-50 border-stone-200 opacity-40 text-stone-600';
                  }
                }

                return (
                  <button
                    key={opt}
                    disabled={selectedOption !== null}
                    onClick={() => handleSelectOption(opt)}
                    className={`rounded-2xl border p-4 text-xs text-left transition-all font-medium leading-relaxed shadow-xs flex items-center justify-between gap-3 ${btnClass} cursor-pointer active:scale-98`}
                  >
                    <span>{opt}</span>
                    {selectedOption !== null && isCorrect && (
                      <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
