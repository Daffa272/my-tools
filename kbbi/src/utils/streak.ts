import { StreakData, MasteryRank, KBBICard } from '../types';

export const STREAK_KEY = 'kbbi_streak_data_v1';
export const HIGHSCORE_KEY = 'kbbi_quiz_highscore_v1';

export const MASTERY_RANKS: MasteryRank[] = [
  {
    id: 'pemula',
    title: 'Penjelajah Kata',
    requiredMastered: 0,
    icon: '🌱',
    description: 'Memulai perjalanan memperkaya khazanah bahasa Indonesia.',
    color: 'from-stone-500 to-stone-700'
  },
  {
    id: 'pencinta',
    title: 'Pencinta Bahasa',
    requiredMastered: 3,
    icon: '📖',
    description: 'Berhasil menguasai 3 kosa kata dengan ingatan jangka panjang.',
    color: 'from-emerald-600 to-emerald-800'
  },
  {
    id: 'penutur',
    title: 'Penutur Cermat',
    requiredMastered: 10,
    icon: '🎯',
    description: 'Menguasai 10 kosa kata baku dalam berbagai konteks pemakaian.',
    color: 'from-blue-600 to-indigo-800'
  },
  {
    id: 'pujangga',
    title: 'Pujangga Muda',
    requiredMastered: 25,
    icon: '✨',
    description: 'Diksi kaya, mampu menyusun kalimat bernas dan berbobot sastra.',
    color: 'from-amber-500 to-orange-700'
  },
  {
    id: 'begawan',
    title: 'Begawan Leksikon',
    requiredMastered: 50,
    icon: '👑',
    description: 'Pakar kosa kata Nusantara dengan perbendaharaan kata luar biasa.',
    color: 'from-purple-600 to-amber-600'
  }
];

export const THEMATIC_CATEGORIES = [
  'Semua',
  'Sastra & Arkais',
  'Sains & Alam',
  'Umum & Sehari-hari',
  'Hukum & Filsafat',
  'Serapan & Budaya'
];

function getTodayStr(): string {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function getYesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function loadStreakData(): StreakData {
  const defaultData: StreakData = {
    currentStreak: 1,
    bestStreak: 1,
    lastActiveDate: getTodayStr(),
    todayCount: 0,
    dailyTarget: 10
  };

  try {
    const raw = localStorage.getItem(STREAK_KEY);
    if (!raw) return defaultData;
    const parsed = JSON.parse(raw);
    const today = getTodayStr();

    // Check if streak was reset
    if (parsed.lastActiveDate === today) {
      return parsed;
    } else if (parsed.lastActiveDate === getYesterdayStr()) {
      return {
        ...parsed,
        todayCount: 0
      };
    } else {
      // Broken streak
      return {
        ...parsed,
        currentStreak: 0,
        todayCount: 0
      };
    }
  } catch {
    return defaultData;
  }
}

export function recordReviewActivity(): StreakData {
  const current = loadStreakData();
  const today = getTodayStr();
  const yesterday = getYesterdayStr();

  let newStreak = current.currentStreak;
  let newTodayCount = current.todayCount + 1;

  if (current.lastActiveDate === today) {
    // Already active today
  } else if (current.lastActiveDate === yesterday) {
    newStreak += 1;
  } else {
    newStreak = 1;
  }

  const bestStreak = Math.max(current.bestStreak, newStreak);

  const updated: StreakData = {
    currentStreak: newStreak,
    bestStreak,
    lastActiveDate: today,
    todayCount: newTodayCount,
    dailyTarget: current.dailyTarget || 10
  };

  localStorage.setItem(STREAK_KEY, JSON.stringify(updated));
  return updated;
}

export function getCurrentMasteryRank(masteredCount: number) {
  const sorted = [...MASTERY_RANKS].sort((a, b) => b.requiredMastered - a.requiredMastered);
  const currentRank = sorted.find(r => masteredCount >= r.requiredMastered) || MASTERY_RANKS[0];

  const nextRank = MASTERY_RANKS.find(r => r.requiredMastered > masteredCount);
  const progressToNext = nextRank
    ? Math.min(100, Math.round(((masteredCount - currentRank.requiredMastered) / (nextRank.requiredMastered - currentRank.requiredMastered)) * 100))
    : 100;

  return {
    currentRank,
    nextRank,
    progressToNext
  };
}

/**
 * Standard Indonesian syllable splitter (Pola Pemenggalan Suku Kata Baku)
 */
export function divideIndonesianSyllables(word: string): string {
  const clean = word.toLowerCase().trim();
  if (clean.length <= 3) return clean;

  const vowels = new Set(['a', 'e', 'i', 'o', 'u']);
  const result: string[] = [];
  let current = '';

  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    const prev = i > 0 ? clean[i - 1] : '';
    const next = i < clean.length - 1 ? clean[i + 1] : '';
    const nextNext = i < clean.length - 2 ? clean[i + 2] : '';

    current += ch;

    // Indonesian syllable boundary rules:
    // 1. Two vowels in a row (unless diphthong ai, au, oi at the end)
    if (vowels.has(ch) && vowels.has(next)) {
      const pair = ch + next;
      if (!(pair === 'ai' || pair === 'au' || pair === 'oi')) {
        result.push(current);
        current = '';
        continue;
      }
    }

    // 2. Vowel followed by single consonant followed by vowel: V-CV (e.g., ma-ta)
    if (vowels.has(ch) && !vowels.has(next) && vowels.has(nextNext)) {
      result.push(current);
      current = '';
      continue;
    }

    // 3. Two consonants between vowels: VC-CV (e.g., arkais: ar-ka-is, saksama: sak-sa-ma)
    const isSpecialDigraph = (next === 'n' && nextNext === 'g') || (next === 'n' && nextNext === 'y') || (next === 's' && nextNext === 'y') || (next === 'k' && nextNext === 'h');
    if (!vowels.has(ch) && !vowels.has(next) && vowels.has(prev) && vowels.has(nextNext) && !isSpecialDigraph) {
      result.push(current);
      current = '';
      continue;
    }
  }

  if (current) result.push(current);
  return result.join('·');
}
