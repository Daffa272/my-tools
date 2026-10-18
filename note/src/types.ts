export interface Note {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  content: string;
  category?: 'Pribadi' | 'Belajar' | 'Kerja' | 'Ide';
  createdAt: number;
  updatedAt: number;
}

export interface FirstReviewEvaluation {
  reviewedAt: string;
  reviewDate: string; // YYYY-MM-DD
  translationAttempt: string;
  translationCorrect: boolean;
  translationFeedback: string;
  translationCorrection: string;
  responseType: 'answer' | 'question';
  responseAttempt: string;
  responseCorrect: boolean;
  responseFeedback: string;
  responseCorrection: string;
}

export interface ConversationCard {
  id: string;
  sentence: string;
  translationId: string;
  situation: string;
  condition: string;
  cefrLevel?: 'A1' | 'A2' | 'B1' | 'B2' | 'C1';
  repetition: number;
  interval: number;
  easiness: number;
  nextReviewDate: string;
  weeklyTestPasses?: number;
  weeklyTestIntervalDays?: number;
  nextWeeklyTestDate?: string;
  firstReviewEvaluation?: FirstReviewEvaluation;
}

export interface WeeklyTestRecord {
  completedAt: string;
  score: number;
  total: number;
}

export interface BackupData {
  format: 'english-note-backup';
  version: number;
  exportedAt: string;
  notes: Note[];
  conversations: ConversationCard[];
  legacyConversations: unknown[];
  weeklyTest: WeeklyTestRecord | null;
}

export interface EvaluationResult {
  translationCorrect: boolean;
  translationFeedback: string;
  translationCorrection: string;
  responseCorrect: boolean;
  responseFeedback: string;
  responseCorrection: string;
}

export interface DailyActivityLog {
  date: string; // YYYY-MM-DD
  reviewsCount: number;
  notesCreatedCount: number;
}

export interface HabitStats {
  streak: number;
  lastActiveDate: string; // YYYY-MM-DD
  dailyGoal: number; // e.g. 5
}

export interface AvatarPersona {
  id: string;
  name: string;
  role: string;
  accent: string;
  voiceGender: 'female' | 'male';
  bio: string;
  imagePath: string;
  defaultGreeting: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'avatar';
  text: string;
  translation?: string;
  quickTip?: string;
  timestamp: number;
}

export interface ScenarioOption {
  id: string;
  title: string;
  category: string;
  description: string;
  starterPrompt: string;
  isCustom?: boolean;
}

export interface FluencyScorecard {
  fluencyScore: number;
  vocabScore: number;
  grammarScore: number;
  overallScore: number;
  summary: string;
  strengths: string[];
  improvements: string[];
  goodPhrasesUsed: string[];
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress: number;
  maxProgress: number;
}

export interface ChineseChatMessage {
  id: string;
  sender: 'user' | 'avatar';
  hanzi: string;
  pinyin?: string;
  translation?: string;
  hskLevel?: string;
  vocabularyList?: { word: string; pinyin: string; meaning: string }[];
  quickTip?: string;
  timestamp: number;
}

export interface ChineseAvatarPersona {
  id: string;
  name: string;
  chineseName: string;
  role: string;
  accent: string;
  voiceGender: 'female' | 'male';
  bio: string;
  imagePath: string;
  defaultGreetingHanzi: string;
  defaultGreetingPinyin: string;
  defaultGreetingTranslation: string;
}

export interface ChineseScenarioOption {
  id: string;
  title: string;
  chineseTitle: string;
  category: string;
  description: string;
  starterPromptHanzi: string;
  starterPromptPinyin: string;
  starterPromptTranslation: string;
  isCustom?: boolean;
}



