import React, { useState } from 'react';
import {
  X,
  Sparkles,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Loader2,
  Trophy
} from 'lucide-react';
import { QuizQuestion, WeeklyCorrectionResult } from '../types';

interface QuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'ai' | 'weekly';
  title: string;
  questions: QuizQuestion[];
  onAnswerAIQuiz: (word: string, isCorrect: boolean) => void;
  onSubmitWeeklyTest: (answers: string[]) => Promise<WeeklyCorrectionResult>;
}

export const QuizModal: React.FC<QuizModalProps> = ({
  isOpen,
  onClose,
  mode,
  title,
  questions,
  onAnswerAIQuiz,
  onSubmitWeeklyTest,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  // Weekly test state
  const [weeklyAnswers, setWeeklyAnswers] = useState<string[]>([]);
  const [currentWeeklyInput, setCurrentWeeklyInput] = useState('');
  const [isEvaluatingWeekly, setIsEvaluatingWeekly] = useState(false);
  const [weeklyResult, setWeeklyResult] = useState<WeeklyCorrectionResult | null>(null);

  // Reset when opened
  React.useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
      setSelectedOption(null);
      setShowFeedback(false);
      setWeeklyAnswers([]);
      setCurrentWeeklyInput('');
      setIsEvaluatingWeekly(false);
      setWeeklyResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentQ = questions[currentIndex];

  // AI Quiz answer handler
  const handleSelectOption = (opt: string) => {
    if (showFeedback || !currentQ) return;
    setSelectedOption(opt);
    setShowFeedback(true);

    const isCorrect =
      Boolean(currentQ.answer) &&
      (opt.startsWith(currentQ.answer!) || opt.includes(currentQ.answer + '.'));

    onAnswerAIQuiz(currentQ.word, isCorrect);
  };

  const handleNextQuestion = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setShowFeedback(false);
    } else {
      setCurrentIndex(questions.length);
    }
  };

  // Weekly open-ended answer handler
  const handleSaveWeeklyAnswer = async () => {
    if (!currentWeeklyInput.trim()) return;
    const nextAnswers = [...weeklyAnswers];
    nextAnswers[currentIndex] = currentWeeklyInput.trim();
    setWeeklyAnswers(nextAnswers);
    setCurrentWeeklyInput('');

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsEvaluatingWeekly(true);
      try {
        const res = await onSubmitWeeklyTest(nextAnswers);
        setWeeklyResult(res);
      } catch (err: unknown) {
        alert((err as Error).message || 'Gagal mengevaluasi jawaban mingguan.');
      } finally {
        setIsEvaluatingWeekly(false);
      }
    }
  };

  const isCompleted = currentIndex >= questions.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{title}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isCompleted
                  ? 'Selesai'
                  : `Soal ${currentIndex + 1} dari ${questions.length}`}
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
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Evaluation Loader */}
          {isEvaluatingWeekly ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <Loader2 className="h-8 w-8 text-indigo-600 dark:text-indigo-400 animate-spin" />
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                AI sedang mengoreksi jawaban Anda...
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs">
                Mengevaluasi akurasi makna Bahasa Indonesia dan sinonim yang setara.
              </p>
            </div>
          ) : weeklyResult ? (
            /* Weekly Result Breakdown */
            <div className="space-y-4 animate-in fade-in">
              <div className="flex flex-col items-center justify-center text-center p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-100 dark:border-emerald-900/60">
                <Trophy className="h-10 w-10 text-emerald-600 dark:text-emerald-400 mb-2" />
                <h4 className="text-lg font-bold text-emerald-950 dark:text-emerald-200">Tes Mingguan Selesai!</h4>
                <p className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400 mt-1">
                  {weeklyResult.score} / {weeklyResult.total}
                </p>
                <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-1 leading-relaxed">
                  {weeklyResult.feedback}
                </p>
              </div>

              {/* Items detail */}
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {weeklyResult.items.map((item, i) => {
                  const q = questions[i];
                  const ans = weeklyAnswers[i];
                  return (
                    <div
                      key={i}
                      className={`rounded-xl border p-3 text-xs space-y-1 ${
                        item.correct
                          ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/30'
                          : 'border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/30'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          {item.correct ? '✅' : '❌'} {q?.word || `Soal ${i + 1}`}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-400">
                          Kunci: {q?.expectedTranslation}
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300">Jawaban Anda: "{ans || '-'}"</p>
                      {item.note && <p className="text-slate-500 dark:text-slate-400 italic text-[11px]">{item.note}</p>}
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 transition-all"
              >
                Tutup & Simpan Hasil
              </button>
            </div>
          ) : isCompleted ? (
            /* AI Quiz Completed */
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                <Trophy className="h-8 w-8" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100">Latihan Soal Selesai!</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm leading-relaxed">
                  Jadwal review memori Anda telah diperbarui sesuai algoritma Spaced Repetition.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition-all"
              >
                Tutup Latihan
              </button>
            </div>
          ) : mode === 'weekly' ? (
            /* Weekly Open-Ended Question */
            <div className="space-y-4">
              <div>
                <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block mb-1">
                  Tes Arti Kata (Mastery Check)
                </span>
                <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Tuliskan arti kata <span className="text-indigo-600 dark:text-indigo-400 underline">"{currentQ.word}"</span> dalam Bahasa Indonesia:
                </h4>
              </div>

              <input
                type="text"
                autoFocus
                value={currentWeeklyInput}
                onChange={(e) => setCurrentWeeklyInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveWeeklyAnswer();
                }}
                placeholder="Ketik terjemahan atau arti kata..."
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3.5 text-sm text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
              />

              <div className="flex items-center justify-end">
                <button
                  type="button"
                  disabled={!currentWeeklyInput.trim()}
                  onClick={handleSaveWeeklyAnswer}
                  className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 active:scale-95 disabled:opacity-40 transition-all"
                >
                  {currentIndex === questions.length - 1 ? 'Kirim untuk Dikoreksi AI' : 'Simpan & Lanjut'}
                </button>
              </div>
            </div>
          ) : (
            /* AI Multiple Choice Quiz */
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 p-4">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                  Target Kata: {currentQ.word}
                </span>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-relaxed">
                  {currentQ.question}
                </p>
              </div>

              {/* Options */}
              <div className="space-y-2">
                {currentQ.options?.map((opt, i) => {
                  const isSelected = selectedOption === opt;
                  const isCorrectAnswer =
                    Boolean(currentQ.answer) &&
                    (opt.startsWith(currentQ.answer!) || opt.includes(currentQ.answer + '.'));

                  let btnStyle = 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 hover:border-indigo-300';
                  if (showFeedback) {
                    if (isCorrectAnswer) {
                      btnStyle = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200 font-bold';
                    } else if (isSelected) {
                      btnStyle = 'border-rose-400 bg-rose-50 dark:bg-rose-950 text-rose-800 dark:text-rose-200';
                    }
                  }

                  return (
                    <button
                      key={i}
                      type="button"
                      disabled={showFeedback}
                      onClick={() => handleSelectOption(opt)}
                      className={`w-full text-left rounded-xl border p-3.5 text-xs transition-all flex items-center justify-between ${btnStyle}`}
                    >
                      <span>{opt}</span>
                      {showFeedback && isCorrectAnswer && (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 ml-2" />
                      )}
                      {showFeedback && isSelected && !isCorrectAnswer && (
                        <XCircle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0 ml-2" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Feedback */}
              {showFeedback && (
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 p-4 text-xs space-y-2 animate-in fade-in">
                  <span className="font-bold block text-slate-900 dark:text-slate-100">
                    {Boolean(currentQ.answer) &&
                    (selectedOption?.startsWith(currentQ.answer!) || selectedOption?.includes(currentQ.answer + '.'))
                      ? '✅ Jawaban Benar!'
                      : '❌ Belum Tepat!'}
                  </span>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{currentQ.explanation}</p>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={handleNextQuestion}
                      className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition-all"
                    >
                      <span>Soal Berikutnya</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
