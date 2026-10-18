export interface KBBICard {
  word: string;
  meaning: string;
  example: string;
  note?: string;
  synonyms: string[];
  antonyms: string[];
  repetition: number;
  easiness: number;
  interval: number;
  nextReviewDate: string;
  category?: string;
  syllables?: string;
  wordClass?: string; // Nomina (n), Verba (v), Adjektiva (a), Adverbia (adv), etc.
  etymology?: string; // Sanskerta, Arab, Melayu Klasik, Belanda, etc.
}

export type ProficiencyLevel = 'Baru' | 'Sedang Dipelajari' | 'Dikuasai';

export type ReviewMode = 'due' | 'learning' | 'all';

export type SortOption =
  | 'date-desc'
  | 'date-asc'
  | 'alpha-asc'
  | 'alpha-desc'
  | 'due-soon'
  | 'hardest';

export interface ToastMessage {
  id: string;
  message: string;
  type?: 'success' | 'info' | 'error';
}

export interface StreakData {
  currentStreak: number;
  bestStreak: number;
  lastActiveDate: string; // YYYY-MM-DD
  todayCount: number;
  dailyTarget: number;
}

export interface MasteryRank {
  id: string;
  title: string;
  requiredMastered: number;
  icon: string;
  description: string;
  color: string;
}

export type QuizMode = 'speed' | 'fill-blank' | 'puzzle';
