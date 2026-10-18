export interface ChunkItem {
  pattern: string;
  rule: string;
  example_en: string;
  example_id: string;
}

export interface TenseDetail {
  form: string;
  example_en: string;
  example_id: string;
}

export interface WordFamily {
  noun?: string;
  verb?: string;
  adjective?: string;
  adverb?: string;
}

export interface Morphology {
  prefix?: string;
  root?: string;
  suffix?: string;
}

export type TOEFLTopic = 'biology' | 'history' | 'psychology' | 'geology' | 'economics' | 'general';

export interface WordData {
  word: string;
  phonetic?: string;
  translation: string;
  synonyms?: string[];
  antonyms?: string[];
  word_family?: WordFamily;
  collocations?: string[];
  morphology?: Morphology;
  chunks?: ChunkItem[];
  topic?: TOEFLTopic;
  tenses?: {
    present: TenseDetail;
    past: TenseDetail;
    present_perfect: TenseDetail;
  };
}

export interface SavedWord extends WordData {
  repetition?: number;
  easiness?: number;
  interval?: number;
  nextReviewDate?: string;
  weeklyTestPasses?: number;
  weeklyTestIntervalDays?: number;
  nextWeeklyTestDate?: string;
}

export interface QuizQuestion {
  word: string;
  question: string;
  options?: string[];
  answer?: string;
  explanation?: string;
  questionType?: 'meaning' | 'chunk-translation' | 'ai';
  chunkPattern?: string;
  expectedTranslation?: string;
}

export interface ChunkTestQuestion {
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

export interface WeeklyCorrectionItem {
  questionNumber: number;
  correct: boolean;
  note?: string;
}

export interface WeeklyCorrectionResult {
  score: number;
  total: number;
  feedback: string;
  items: WeeklyCorrectionItem[];
}

export interface ReadingPassage {
  title: string;
  passage: string;
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

export interface SpeedMatchCard {
  id: string;
  text: string;
  pairId: string;
  type: 'en' | 'id';
  isMatched: boolean;
}

export interface WritingEvaluationResult {
  score: number;
  bandLabel: string;
  isGrammaticallyCorrect: boolean;
  collocationFeedback: string;
  grammarFeedback: string;
  improvedVersion: string;
}

