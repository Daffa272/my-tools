import { SavedWord, TOEFLTopic } from '../types';

export const STORAGE_KEYS = {
  APP_STATE: 'english_app_state_v1',
  REPETITION_WORDS: 'repetition_words',
  RECENT_SEARCHES: 'recent_searches',
  GEMINI_KEY: 'gemini_api_key',
  WEEKLY_MASTERY: 'english_weekly_mastery_test_v2',
  POMODORO_DURATIONS: 'english_pomodoro_durations',
  POMODORO_SESSIONS: 'english_pomodoro_completed_sessions',
  POMODORO_COLLAPSED: 'english_pomodoro_collapsed',
  POMODORO_YOUTUBE: 'english_pomodoro_youtube_url',
  THEME_MODE: 'english_theme_mode',
  STUDY_STREAK: 'english_study_streak_v1',
  HEATMAP: 'english_activity_heatmap_v1',
  SPEED_MATCH_HS: 'english_speed_match_highscore',
};

export interface AppStoredState {
  apiKey: string;
  words: SavedWord[];
  recentSearches: string[];
}

export interface StudyStreakData {
  lastDate: string; // YYYY-MM-DD
  streakCount: number;
  todayReviews: number;
  dailyGoal: number;
}

export interface HeatmapDay {
  dateStr: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export function getStoredAppData(): AppStoredState {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.APP_STATE);
    const parsed = raw ? JSON.parse(raw) : {};

    let legacyWords: SavedWord[] = [];
    try {
      legacyWords = JSON.parse(localStorage.getItem(STORAGE_KEYS.REPETITION_WORDS) || '[]');
    } catch {
      legacyWords = [];
    }

    let legacySearches: string[] = [];
    try {
      legacySearches = JSON.parse(localStorage.getItem(STORAGE_KEYS.RECENT_SEARCHES) || '[]');
    } catch {
      legacySearches = [];
    }

    const key =
      parsed.apiKey ||
      localStorage.getItem(STORAGE_KEYS.GEMINI_KEY) ||
      (typeof import.meta !== 'undefined' && (import.meta as unknown as { env?: { VITE_GEMINI_API_KEY?: string } }).env?.VITE_GEMINI_API_KEY) ||
      '';

    return {
      apiKey: key,
      words: Array.isArray(parsed.words) ? parsed.words : legacyWords,
      recentSearches: Array.isArray(parsed.recentSearches) ? parsed.recentSearches : legacySearches,
    };
  } catch {
    return {
      apiKey: localStorage.getItem(STORAGE_KEYS.GEMINI_KEY) || '',
      words: [],
      recentSearches: [],
    };
  }
}

export function persistAppData(partial: Partial<AppStoredState>): AppStoredState {
  const current = getStoredAppData();
  const next: AppStoredState = {
    apiKey: partial.apiKey !== undefined ? partial.apiKey : current.apiKey,
    words: Array.isArray(partial.words) ? partial.words : current.words,
    recentSearches: Array.isArray(partial.recentSearches) ? partial.recentSearches : current.recentSearches,
  };

  try {
    localStorage.setItem(STORAGE_KEYS.APP_STATE, JSON.stringify(next));
    localStorage.setItem(STORAGE_KEYS.REPETITION_WORDS, JSON.stringify(next.words));
    localStorage.setItem(STORAGE_KEYS.RECENT_SEARCHES, JSON.stringify(next.recentSearches));

    if (next.apiKey) {
      localStorage.setItem(STORAGE_KEYS.GEMINI_KEY, next.apiKey);
    } else {
      localStorage.removeItem(STORAGE_KEYS.GEMINI_KEY);
    }
  } catch (err) {
    console.error('Failed to persist app data:', err);
  }

  return next;
}

export function getEnglishProficiency(word: SavedWord): 'Dikuasai' | 'Sedang Dipelajari' | 'Baru' {
  if ((word.repetition || 0) >= 3 && (word.interval || 0) >= 14) return 'Dikuasai';
  if ((word.repetition || 0) > 0) return 'Sedang Dipelajari';
  return 'Baru';
}

export function getStudyStreak(): StudyStreakData {
  const todayStr = new Date().toISOString().slice(0, 10);
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STUDY_STREAK);
    if (!raw) {
      return { lastDate: todayStr, streakCount: 1, todayReviews: 0, dailyGoal: 10 };
    }
    const parsed = JSON.parse(raw) as StudyStreakData;
    if (parsed.lastDate !== todayStr) {
      const last = new Date(parsed.lastDate);
      const today = new Date(todayStr);
      const diffDays = Math.round((today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));

      let nextStreak = parsed.streakCount;
      if (diffDays === 1) {
        // Maintained
      } else if (diffDays > 1) {
        nextStreak = 1;
      }

      const updated: StudyStreakData = {
        lastDate: todayStr,
        streakCount: nextStreak,
        todayReviews: 0,
        dailyGoal: parsed.dailyGoal || 10,
      };
      localStorage.setItem(STORAGE_KEYS.STUDY_STREAK, JSON.stringify(updated));
      return updated;
    }
    return parsed;
  } catch {
    return { lastDate: todayStr, streakCount: 1, todayReviews: 0, dailyGoal: 10 };
  }
}

export function recordReviewIncrement(): StudyStreakData {
  const current = getStudyStreak();
  const todayStr = new Date().toISOString().slice(0, 10);
  const updated: StudyStreakData = {
    ...current,
    lastDate: todayStr,
    todayReviews: current.todayReviews + 1,
  };
  try {
    localStorage.setItem(STORAGE_KEYS.STUDY_STREAK, JSON.stringify(updated));
  } catch {}

  // Also increment heatmap
  recordHeatmapReview();

  return updated;
}

export function setDailyGoal(goal: number): StudyStreakData {
  const current = getStudyStreak();
  const todayStr = new Date().toISOString().slice(0, 10);
  const updated: StudyStreakData = {
    ...current,
    lastDate: todayStr,
    dailyGoal: goal,
  };
  try {
    localStorage.setItem(STORAGE_KEYS.STUDY_STREAK, JSON.stringify(updated));
  } catch {}
  return updated;
}

// Heatmap functions
export function getRawHeatmapMap(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.HEATMAP) || '{}');
  } catch {
    return {};
  }
}

export function recordHeatmapReview(): void {
  const map = getRawHeatmapMap();
  const todayStr = new Date().toISOString().slice(0, 10);
  map[todayStr] = (map[todayStr] || 0) + 1;
  try {
    localStorage.setItem(STORAGE_KEYS.HEATMAP, JSON.stringify(map));
  } catch {}
}

export function getActivityHeatmap30Days(): HeatmapDay[] {
  const map = getRawHeatmapMap();
  const result: HeatmapDay[] = [];
  const now = new Date();

  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const count = map[dateStr] || 0;

    let level: 0 | 1 | 2 | 3 | 4 = 0;
    if (count >= 12) level = 4;
    else if (count >= 8) level = 3;
    else if (count >= 4) level = 2;
    else if (count >= 1) level = 1;

    result.push({ dateStr, count, level });
  }

  return result;
}

// Speed Match High Score
export function getSpeedMatchHighScore(): number {
  try {
    return Number(localStorage.getItem(STORAGE_KEYS.SPEED_MATCH_HS) || 0) || 0;
  } catch {
    return 0;
  }
}

export function saveSpeedMatchHighScore(score: number): void {
  try {
    const cur = getSpeedMatchHighScore();
    if (score > cur) {
      localStorage.setItem(STORAGE_KEYS.SPEED_MATCH_HS, String(score));
    }
  } catch {}
}

// Infer TOEFL topic domain
export function inferTOEFLTopic(word: string, translation?: string, context?: string): TOEFLTopic {
  const combined = `${word} ${translation || ''} ${context || ''}`.toLowerCase();
  if (/(bio|cell|gene|organism|species|flora|fauna|marine|botan|mammal|predator|ecosystem|habitat|parasite|enzyme)/.test(combined)) {
    return 'biology';
  }
  if (/(history|ancient|century|dynasty|artifact|civilization|colonial|medieval|empire|monarch|archaeol|fossil)/.test(combined)) {
    return 'history';
  }
  if (/(cognit|psychol|behavior|mental|perception|social|therapy|stimul|emotion|brain|neuron|memory|bias)/.test(combined)) {
    return 'psychology';
  }
  if (/(geol|earthquake|seismic|volcan|tectonic|astro|planet|star|galaxy|atmosphere|meteor|crust|glacier|sediment)/.test(combined)) {
    return 'geology';
  }
  if (/(econom|market|trade|capital|labor|fiscal|monetary|inflati|consumer|financ|policy|industr)/.test(combined)) {
    return 'economics';
  }
  return 'general';
}

export function updateSM2Schedule(words: SavedWord[], wordStr: string, quality: number): SavedWord[] {
  const index = words.findIndex((w) => w.word.toLowerCase() === wordStr.toLowerCase());
  if (index === -1) return words;

  const card = { ...words[index] };
  let easiness = card.easiness || 2.5;
  let repetition = card.repetition || 0;
  let interval = card.interval || 0;

  easiness = Math.max(1.3, easiness + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));

  if (quality < 3) {
    repetition = 0;
    interval = 0;
  } else {
    if (repetition === 0) interval = quality === 5 ? 2 : 1;
    else if (repetition === 1) interval = quality === 5 ? 8 : 6;
    else interval = Math.max(1, Math.round(interval * easiness * (quality === 5 ? 1.3 : quality === 3 ? 0.7 : 1)));
    repetition += 1;
  }

  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + interval);

  const updated = [...words];
  updated[index] = {
    ...card,
    easiness,
    repetition,
    interval,
    nextReviewDate: nextReviewDate.toISOString(),
  };

  persistAppData({ words: updated });
  recordReviewIncrement();
  return updated;
}

export function getEstimatedCEFR(word: string): { level: 'B2' | 'C1' | 'C2'; band: string } {
  const clean = word.toLowerCase().trim();
  const len = clean.length;
  if (len >= 11 || /(tion|sion|ology|phobia|cracy|scopic|tial|ious|ous)$/.test(clean)) {
    return { level: 'C2', band: 'AWL Sublist 1-3 · C2 Advanced Mastery' };
  }
  if (len >= 8 || /(ment|ence|ance|able|ible|icate|istic|ative)$/.test(clean)) {
    return { level: 'C1', band: 'AWL Sublist 4-7 · C1 Higher Academic' };
  }
  return { level: 'B2', band: 'AWL Sublist 8-10 · B2 Independent' };
}

export function exportBackupJSON(): void {
  const state = getStoredAppData();
  const backup = {
    app: 'english-learning-all-site-data',
    version: 1,
    exportedAt: new Date().toISOString(),
    storage: {
      [STORAGE_KEYS.APP_STATE]: JSON.stringify({ words: state.words, recentSearches: state.recentSearches }),
      [STORAGE_KEYS.REPETITION_WORDS]: JSON.stringify(state.words),
      [STORAGE_KEYS.RECENT_SEARCHES]: JSON.stringify(state.recentSearches),
    },
    words: state.words,
    recentSearches: state.recentSearches,
  };

  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `english-all-data-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
