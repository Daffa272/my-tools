import { TestConfig, TestRecord } from '../types';

const STORAGE_KEY_HISTORY = 'pauli_kraepelin_history_v2';
const STORAGE_KEY_CONFIG = 'pauli_kraepelin_config_v2';

export const DEFAULT_CONFIG: TestConfig = {
  name: '',
  testType: 'pauli',
  answerMode: 'digit',
  sessionCount: 5,
  sessionDurationSec: 60,
  breakDurationSec: 5,
  columns: 8,
  rows: 35,
  soundEnabled: true,
  voiceProctorEnabled: true,
  lineFocusGuide: true,
  hapticEnabled: true,
  showKeypad: true,
  theme: 'modern',
};

export function loadStoredConfig(): TestConfig {
  if (typeof window === 'undefined') return DEFAULT_CONFIG;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (!raw) return DEFAULT_CONFIG;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_CONFIG, ...parsed };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function saveStoredConfig(config: TestConfig) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
  } catch {
    // Ignore storage errors
  }
}

export function loadHistory(): TestRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_HISTORY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveTestRecord(record: TestRecord): TestRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const existing = loadHistory();
    const updated = [record, ...existing].slice(0, 30);
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export function deleteHistoryItem(id: string): TestRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const existing = loadHistory();
    const updated = existing.filter((item) => item.id !== id);
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export function clearAllHistory(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY_HISTORY);
  } catch {
    // Ignore
  }
}
