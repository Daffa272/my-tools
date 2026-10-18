import React, { useState, useEffect, useMemo } from 'react';
import { KBBICard } from '../types';
import {
  X,
  Trophy,
  RotateCcw,
  Sparkles,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  BookOpen
} from 'lucide-react';

interface DailyPuzzleModalProps {
  cards: KBBICard[];
  onClose: () => void;
  onPuzzleSolved: () => void;
}

export const DailyPuzzleModal: React.FC<DailyPuzzleModalProps> = ({
  cards,
  onClose,
  onPuzzleSolved
}) => {
  // Filter cards with length between 4 and 8 for great gameplay
  const candidateCards = useMemo(() => {
    const list = cards.filter(c => c.word.trim().length >= 4 && c.word.trim().length <= 8 && !c.word.includes(' '));
    return list.length > 0 ? list : cards;
  }, [cards]);

  // Pick deterministic word of today
  const targetCard = useMemo(() => {
    if (candidateCards.length === 0) return null;
    const today = new Date().toISOString().slice(0, 10);
    let hash = 0;
    for (let i = 0; i < today.length; i++) {
      hash = (hash << 5) - hash + today.charCodeAt(i);
      hash |= 0;
    }
    const index = Math.abs(hash) % candidateCards.length;
    return candidateCards[index];
  }, [candidateCards]);

  const targetWord = (targetCard?.word || 'sastra').toLowerCase().trim();
  const wordLength = targetWord.length;
  const maxAttempts = 6;

  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState<string>('');
  const [gameStatus, setGameStatus] = useState<'playing' | 'won' | 'lost'>('playing');
  const [message, setMessage] = useState<string | null>(null);

  // Key status map: green | yellow | gray
  const keyStatuses = useMemo(() => {
    const map: Record<string, 'correct' | 'present' | 'absent'> = {};

    guesses.forEach(guess => {
      for (let i = 0; i < guess.length; i++) {
        const letter = guess[i];
        if (targetWord[i] === letter) {
          map[letter] = 'correct';
        } else if (targetWord.includes(letter) && map[letter] !== 'correct') {
          map[letter] = 'present';
        } else if (!targetWord.includes(letter) && !map[letter]) {
          map[letter] = 'absent';
        }
      }
    });

    return map;
  }, [guesses, targetWord]);

  // Handle typing letter
  const handleAddLetter = (char: string) => {
    if (gameStatus !== 'playing') return;
    if (currentGuess.length < wordLength) {
      setCurrentGuess(prev => prev + char.toLowerCase());
      setMessage(null);
    }
  };

  const handleDeleteLetter = () => {
    if (gameStatus !== 'playing') return;
    setCurrentGuess(prev => prev.slice(0, -1));
    setMessage(null);
  };

  const handleEnterGuess = () => {
    if (gameStatus !== 'playing') return;

    if (currentGuess.length !== wordLength) {
      setMessage(`Harus tepat ${wordLength} huruf.`);
      return;
    }

    const nextGuesses = [...guesses, currentGuess];
    setGuesses(nextGuesses);
    setCurrentGuess('');

    if (currentGuess === targetWord) {
      setGameStatus('won');
      setMessage('Luar biasa! Anda berhasil menebak kata misterius hari ini! 🎉');
      onPuzzleSolved();
    } else if (nextGuesses.length >= maxAttempts) {
      setGameStatus('lost');
      setMessage(`Kesempatan habis. Kata yang dimaksud adalah: "${targetWord.toUpperCase()}".`);
      onPuzzleSolved();
    }
  };

  // Physical keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Backspace') {
        handleDeleteLetter();
      } else if (e.key === 'Enter') {
        handleEnterGuess();
      } else if (/^[a-zA-Z]$/.test(e.key)) {
        handleAddLetter(e.key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentGuess, gameStatus, wordLength, targetWord, guesses]);

  const KEYBOARD_ROWS = [
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    ['ENTER', 'z', 'x', 'c', 'v', 'b', 'n', 'm', '⌫']
  ];

  if (!targetCard) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/70 p-3 sm:p-4 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-lg rounded-3xl bg-white p-5 sm:p-7 shadow-2xl ring-1 ring-stone-900/10 flex flex-col max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-900">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-stone-900">
                Teka-Teki Kata KBBI
              </h3>
              <p className="text-[11px] text-stone-500">
                Tebak kata misterius {wordLength} huruf dalam {maxAttempts} kesempatan
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

        {/* Message Alert */}
        {message && (
          <div className={`mt-3 rounded-xl p-2.5 text-xs text-center font-bold ${
            gameStatus === 'won'
              ? 'bg-emerald-100 text-emerald-950 border border-emerald-300'
              : gameStatus === 'lost'
              ? 'bg-rose-100 text-rose-950 border border-rose-300'
              : 'bg-amber-100 text-amber-950 border border-amber-200'
          }`}>
            {message}
          </div>
        )}

        {/* Puzzle Grid */}
        <div className="my-5 flex flex-col items-center gap-1.5">
          {Array.from({ length: maxAttempts }).map((_, rowIndex) => {
            const isCurrentRow = rowIndex === guesses.length;
            const guess = guesses[rowIndex] || (isCurrentRow ? currentGuess : '');

            return (
              <div key={rowIndex} className="flex gap-1.5">
                {Array.from({ length: wordLength }).map((_, colIndex) => {
                  const letter = guess[colIndex] || '';
                  const hasGuessed = rowIndex < guesses.length;

                  let cellStyle = 'border-stone-300 bg-white text-stone-900';
                  if (hasGuessed) {
                    if (targetWord[colIndex] === letter) {
                      cellStyle = 'bg-emerald-600 border-emerald-600 text-white font-black';
                    } else if (targetWord.includes(letter)) {
                      cellStyle = 'bg-amber-500 border-amber-500 text-white font-black';
                    } else {
                      cellStyle = 'bg-stone-300 border-stone-300 text-stone-700 font-bold';
                    }
                  } else if (isCurrentRow && letter) {
                    cellStyle = 'border-stone-800 bg-stone-50 text-stone-950 font-bold scale-105';
                  }

                  return (
                    <div
                      key={colIndex}
                      className={`h-11 w-11 sm:h-12 sm:w-12 rounded-xl border-2 flex items-center justify-center text-lg uppercase font-serif transition-all duration-200 ${cellStyle}`}
                    >
                      {letter}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Word Reveal Card on Win / Loss */}
        {gameStatus !== 'playing' && (
          <div className="mb-4 rounded-2xl bg-stone-50 p-4 border border-stone-200 text-xs">
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="h-4 w-4 text-emerald-700" />
              <strong className="font-serif text-base text-stone-900 uppercase">
                {targetCard.word}
              </strong>
              {targetCard.wordClass && (
                <span className="text-[10px] text-stone-600 italic">
                  [{targetCard.wordClass}]
                </span>
              )}
              {targetCard.etymology && (
                <span className="text-[10px] text-stone-500">
                  ({targetCard.etymology})
                </span>
              )}
            </div>
            <p className="text-stone-700 font-medium leading-relaxed">
              {targetCard.meaning}
            </p>
            {targetCard.example && (
              <p className="mt-1.5 text-stone-500 italic font-serif">
                "{targetCard.example}"
              </p>
            )}
          </div>
        )}

        {/* Virtual Keyboard */}
        <div className="mt-auto space-y-1.5">
          {KEYBOARD_ROWS.map((row, rIdx) => (
            <div key={rIdx} className="flex justify-center gap-1">
              {row.map(key => {
                const isEnter = key === 'ENTER';
                const isDelete = key === '⌫';
                const status = keyStatuses[key];

                let keyClass = 'bg-stone-100 text-stone-800 hover:bg-stone-200';
                if (status === 'correct') {
                  keyClass = 'bg-emerald-600 text-white font-bold';
                } else if (status === 'present') {
                  keyClass = 'bg-amber-500 text-white font-bold';
                } else if (status === 'absent') {
                  keyClass = 'bg-stone-300 text-stone-500 opacity-60';
                }

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      if (isEnter) handleEnterGuess();
                      else if (isDelete) handleDeleteLetter();
                      else handleAddLetter(key);
                    }}
                    className={`rounded-lg py-3 font-semibold uppercase text-xs transition-all active:scale-95 cursor-pointer ${
                      isEnter || isDelete ? 'px-2.5 text-[10px] font-bold bg-stone-200 text-stone-800' : 'w-8 sm:w-9'
                    } ${keyClass}`}
                  >
                    {key}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
