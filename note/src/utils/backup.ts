import { BackupData, ConversationCard, Note, WeeklyTestRecord } from '../types';

export const BACKUP_KEYS = {
  notes: 'english-notes-v1',
  conversations: 'english_note_conversations_v1',
  legacyConversations: 'english_note_vocabulary_v1',
  weeklyTest: 'english_note_conversation_weekly_test_v1'
};

export const BACKUP_FORMAT = 'english-note-backup';

export function readStoredJson<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : JSON.parse(value);
  } catch {
    return fallback;
  }
}

export function buildBackupData(): BackupData {
  return {
    format: BACKUP_FORMAT,
    version: 1,
    exportedAt: new Date().toISOString(),
    notes: readStoredJson<Note[]>(BACKUP_KEYS.notes, []),
    conversations: readStoredJson<ConversationCard[]>(BACKUP_KEYS.conversations, []),
    legacyConversations: readStoredJson<unknown[]>(BACKUP_KEYS.legacyConversations, []),
    weeklyTest: readStoredJson<WeeklyTestRecord | null>(BACKUP_KEYS.weeklyTest, null)
  };
}

export function validateBackupData(data: unknown): asserts data is BackupData {
  if (!data || typeof data !== 'object') {
    throw new Error('File JSON tidak valid.');
  }

  const payload = data as Partial<BackupData>;
  if (payload.format !== BACKUP_FORMAT || payload.version !== 1) {
    throw new Error('Format backup Note tidak dikenali atau versi tidak kompatibel.');
  }

  if (
    !Array.isArray(payload.notes) ||
    !payload.notes.every(
      note => note && typeof note.id === 'string' && typeof note.date === 'string' && typeof note.title === 'string'
    )
  ) {
    throw new Error('Data catatan tidak valid atau tidak lengkap.');
  }

  if (
    !Array.isArray(payload.conversations) ||
    !payload.conversations.every(
      card => card && typeof card.id === 'string' && typeof card.sentence === 'string'
    )
  ) {
    throw new Error('Data kalimat conversation tidak valid atau tidak lengkap.');
  }
}

export function exportBackupToFile(): void {
  const backup = buildBackupData();
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const dateStr = new Date().toISOString().slice(0, 10);
  link.download = `catatan-backup-${dateStr}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function applyBackupData(backup: BackupData): void {
  validateBackupData(backup);
  localStorage.setItem(BACKUP_KEYS.notes, JSON.stringify(backup.notes));
  localStorage.setItem(BACKUP_KEYS.conversations, JSON.stringify(backup.conversations));
  if (Array.isArray(backup.legacyConversations)) {
    localStorage.setItem(BACKUP_KEYS.legacyConversations, JSON.stringify(backup.legacyConversations));
  }
  if (backup.weeklyTest) {
    localStorage.setItem(BACKUP_KEYS.weeklyTest, JSON.stringify(backup.weeklyTest));
  } else {
    localStorage.removeItem(BACKUP_KEYS.weeklyTest);
  }
}
