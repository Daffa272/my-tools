export type TestType = 'pauli' | 'kraepelin';
export type AnswerMode = 'digit' | 'parity';
export type PresetId = 'bumn' | 'banking' | 'sprint' | 'parity' | 'custom';
export type ThemeMode = 'modern' | 'paper' | 'dark';

export interface TestConfig {
  name: string;
  testType: TestType;
  answerMode: AnswerMode;
  sessionCount: number;
  sessionDurationSec: number;
  breakDurationSec: number;
  columns: number;
  rows: number;
  soundEnabled: boolean;
  voiceProctorEnabled: boolean;
  lineFocusGuide: boolean;
  hapticEnabled: boolean;
  showKeypad: boolean;
  theme: ThemeMode;
}

export interface QuestionColumn {
  colIndex: number;
  numbers: number[]; // e.g. rows count (e.g. 30)
}

export interface QuestionStep {
  colIndex: number;
  pairIndex: number; // 0 to rows - 2
  numA: number;
  numB: number;
  expectedAnswer: number; // 0-9 for digit, 0 (genap) or 1 (ganjil) for parity
  userAnswer?: number;
  isCorrect?: boolean;
}

export interface SessionResult {
  sessionNumber: number;
  answered: number;
  correct: number;
  wrong: number;
  skipped: number;
  accuracy: number;
  speedPerMin: number;
  durationSec: number;
  // Parity specific stats for this session
  evenAnswered?: number;
  evenCorrect?: number;
  oddAnswered?: number;
  oddCorrect?: number;
}

export interface PsychometricCharacteristic {
  score: number; // 0 - 100
  level: 'Sangat Tinggi' | 'Tinggi' | 'Cukup / Rata-rata' | 'Perlu Latihan';
  title: string;
  description: string;
}

export type WorkCurvePattern = 'Ascending' | 'Steady' | 'Descending' | 'Fluctuating';

export interface PsychometricAnalysis {
  totalAnswered: number;
  totalCorrect: number;
  totalWrong: number;
  totalSkipped: number;
  totalAccuracy: number;
  averageSpeedPerMin: number;
  stabilityScore: number; // 0-100
  stabilityStdDev: number; // standard deviation in answers per session
  enduranceRatio: number; // second half vs first half performance percentage
  fatigueIndex: number; // drop rate percentage or positive warmup
  stanineScore: number; // 1 to 9 standardized psychological score
  percentileRank: number; // estimated percentile (e.g. top 15% -> 85)
  curvePattern: WorkCurvePattern;
  curvePatternDescription: string;
  overallGrade: string;
  summaryDescription: string;
  characteristics: {
    speed: PsychometricCharacteristic;
    accuracy: PsychometricCharacteristic;
    stability: PsychometricCharacteristic;
    endurance: PsychometricCharacteristic;
  };
  parityBreakdown?: {
    evenTotal: number;
    evenCorrect: number;
    evenAccuracy: number;
    oddTotal: number;
    oddCorrect: number;
    oddAccuracy: number;
  };
  recommendations: string[];
}

export interface TestRecord {
  id: string;
  date: string;
  config: TestConfig;
  sessionResults: SessionResult[];
  analysis: PsychometricAnalysis;
}
