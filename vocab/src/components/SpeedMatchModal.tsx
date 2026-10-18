import React, { useState, useEffect } from 'react';
import { X, Zap, Trophy, RotateCcw, Flame, CheckCircle2 } from 'lucide-react';
import { SavedWord, SpeedMatchCard } from '../types';
import { getSpeedMatchHighScore, saveSpeedMatchHighScore } from '../services/storage';

interface SpeedMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  words: SavedWord[];
}

export const SpeedMatchModal: React.FC<SpeedMatchModalProps> = ({ isOpen, onClose, words }) => {
  const [timeLeft, setTimeLeft] = useState(60);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [highScore, setHighScore] = useState(getSpeedMatchHighScore);

  const [cards, setCards] = useState<SpeedMatchCard[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [wrongPairIds, setWrongPairIds] = useState<string[]>([]);

  // Initialize game cards
  const startNewGame = () => {
    const pool = words.length >= 5 ? words : [
      { word: 'unprecedented', translation: 'belum pernah terjadi sebelumnya' },
      { word: 'ubiquitous', translation: 'ada di mana-mana' },
      { word: 'detrimental', translation: 'merugikan / berbahaya' },
      { word: 'resilient', translation: 'tangguh / lentur' },
      { word: 'pragmatic', translation: 'praktis / realistis' },
      { word: 'ambiguous', translation: 'bermakna ganda / rancu' },
    ];

    const chosen = [...pool].sort(() => Math.random() - 0.5).slice(0, 6);
    const newCards: SpeedMatchCard[] = [];

    chosen.forEach((item, idx) => {
      const pairId = `pair-${idx}`;
      newCards.push({
        id: `en-${idx}`,
        text: item.word,
        pairId,
        type: 'en',
        isMatched: false,
      });
      newCards.push({
        id: `id-${idx}`,
        text: item.translation,
        pairId,
        type: 'id',
        isMatched: false,
      });
    });

    setCards(newCards.sort(() => Math.random() - 0.5));
    setTimeLeft(60);
    setScore(0);
    setCombo(0);
    setSelectedCardId(null);
    setWrongPairIds([]);
    setIsPlaying(true);
    setIsGameOver(false);
    setHighScore(getSpeedMatchHighScore());
  };

  // Timer countdown
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isOpen && isPlaying && !isGameOver) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleGameOver();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isOpen, isPlaying, isGameOver]);

  const handleGameOver = () => {
    setIsPlaying(false);
    setIsGameOver(true);
    saveSpeedMatchHighScore(score);
    setHighScore(getSpeedMatchHighScore());
  };

  // Card click handler
  const handleCardClick = (card: SpeedMatchCard) => {
    if (!isPlaying || isGameOver || card.isMatched) return;
    if (selectedCardId === card.id) {
      setSelectedCardId(null);
      return;
    }

    if (!selectedCardId) {
      setSelectedCardId(card.id);
      return;
    }

    const firstCard = cards.find((c) => c.id === selectedCardId);
    if (!firstCard) {
      setSelectedCardId(card.id);
      return;
    }

    // Check match
    if (firstCard.pairId === card.pairId && firstCard.type !== card.type) {
      // MATCH!
      const nextCombo = combo + 1;
      const points = 100 + nextCombo * 20;
      setScore((prev) => prev + points);
      setCombo(nextCombo);

      const updated = cards.map((c) =>
        c.pairId === card.pairId ? { ...c, isMatched: true } : c
      );
      setCards(updated);
      setSelectedCardId(null);

      // Check if all matched
      if (updated.every((c) => c.isMatched)) {
        setTimeout(() => {
          startNewGame(); // load fresh set to keep earning points within 60s!
        }, 500);
      }
    } else {
      // WRONG PAIR
      setCombo(0);
      setWrongPairIds([firstCard.id, card.id]);
      setSelectedCardId(null);
      setTimeout(() => {
        setWrongPairIds([]);
      }, 500);
    }
  };

  useEffect(() => {
    if (isOpen) {
      startNewGame();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400">
              <Zap className="h-4 w-4 fill-amber-500 text-amber-500" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Speed Match (Tantangan 60 Detik)</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Cocokkan kata bahasa Inggris dan artinya secepat mungkin</p>
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

        {/* Score & Timer Strip */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-3 bg-white dark:bg-slate-900 text-xs">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Waktu</span>
              <span className={`text-xl font-black font-mono tabular-nums ${timeLeft <= 10 ? 'text-rose-600 animate-pulse' : 'text-slate-900 dark:text-slate-100'}`}>
                {timeLeft}s
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Skor</span>
              <span className="text-xl font-black font-mono text-indigo-600 dark:text-indigo-400 tabular-nums">
                {score}
              </span>
            </div>
            {combo > 1 && (
              <div className="flex items-center gap-1 rounded-lg bg-orange-50 dark:bg-orange-950/60 px-2.5 py-1 text-orange-700 dark:text-orange-400 font-bold animate-bounce">
                <Flame className="h-3.5 w-3.5 fill-orange-500" />
                <span>{combo}x Combo!</span>
              </div>
            )}
          </div>

          <div className="text-right">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Rekor Terbaik</span>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 tabular-nums">
              🏆 {highScore} Poin
            </span>
          </div>
        </div>

        {/* Game Canvas */}
        <div className="flex-1 overflow-y-auto p-6">
          {isGameOver ? (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-4 animate-in zoom-in-95">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-950 text-amber-600">
                <Trophy className="h-9 w-9" />
              </div>
              <div>
                <h4 className="text-xl font-black text-slate-900 dark:text-slate-100">Waktu Habis!</h4>
                <p className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1 tabular-nums">
                  {score} Poin
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  {score >= highScore && score > 0 ? '🎉 Rekor baru tercatat!' : 'Terus latih kecepatan refleks kosa kata Anda!'}
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={startNewGame}
                  className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-700 active:scale-95 transition-all"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>Main Lagi</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Tutup
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {cards.map((card) => {
                const isSelected = selectedCardId === card.id;
                const isWrong = wrongPairIds.includes(card.id);

                let cardStyle =
                  'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:border-indigo-400';

                if (card.isMatched) {
                  cardStyle =
                    'border-emerald-300 dark:border-emerald-800 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 opacity-60 cursor-default pointer-events-none scale-95';
                } else if (isWrong) {
                  cardStyle =
                    'border-rose-400 bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 animate-shake';
                } else if (isSelected) {
                  cardStyle =
                    'border-indigo-600 bg-indigo-50 dark:bg-indigo-950 text-indigo-900 dark:text-indigo-200 font-bold shadow-md scale-102';
                }

                return (
                  <button
                    key={card.id}
                    type="button"
                    disabled={card.isMatched}
                    onClick={() => handleCardClick(card)}
                    className={`min-h-[75px] rounded-xl border p-3.5 text-xs text-center flex items-center justify-center font-semibold transition-all duration-150 active:scale-95 leading-snug ${cardStyle}`}
                  >
                    <span>{card.text}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
