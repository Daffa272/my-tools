import { ConversationCard, Note, Badge } from '../types';

export const DAY_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', "Jum'at", 'Sabtu'];
export const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export function getTodayKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export function formatNoteDate(key: string, includeDay = false): string {
  if (!key) return '';
  const [year, month, day] = key.split('-').map(Number);
  if (!year || !month || !day) return key;
  const date = new Date(year, month - 1, day);
  return `${includeDay ? DAY_NAMES[date.getDay()] + ', ' : ''}${day} ${MONTH_NAMES[month - 1]} ${year}`;
}

export function isDue(card: ConversationCard): boolean {
  return !card.nextReviewDate || new Date(card.nextReviewDate).getTime() <= Date.now();
}

export function isMastered(card: ConversationCard): boolean {
  return (card.repetition || 0) >= 3 && (card.interval || 0) >= 14;
}

export function isWeeklyTestDue(card: ConversationCard): boolean {
  return isMastered(card) && (!card.nextWeeklyTestDate || new Date(card.nextWeeklyTestDate).getTime() <= Date.now());
}

export function getProficiency(card: ConversationCard): 'Dikuasai' | 'Sedang dipelajari' | 'Baru' {
  if (isMastered(card)) return 'Dikuasai';
  return (card.repetition || 0) > 0 ? 'Sedang dipelajari' : 'Baru';
}

export function getReviewScheduleLabel(card: ConversationCard): string {
  const schedules: { date: Date; label: string }[] = [];
  if (card.nextReviewDate) {
    schedules.push({ date: new Date(card.nextReviewDate), label: 'Review' });
  } else {
    schedules.push({ date: new Date(0), label: 'Review' });
  }

  if (isMastered(card)) {
    schedules.push({
      date: card.nextWeeklyTestDate ? new Date(card.nextWeeklyTestDate) : new Date(0),
      label: 'Tes mingguan'
    });
  }

  schedules.sort((first, second) => first.date.getTime() - second.date.getTime());
  const next = schedules.find(item => Number.isFinite(item.date.getTime()));
  if (!next || next.date.getTime() <= Date.now()) return 'Due Now';
  const days = Math.ceil((next.date.getTime() - Date.now()) / 86400000);
  return `${next.label}: ${days} hari lagi`;
}

export function updateCardRepetition(card: ConversationCard, isCorrect: boolean): void {
  const reviewedAt = new Date();
  const wasMastered = isMastered(card);
  const easiness = Number(card.easiness) || 2.5;

  if (!isCorrect) {
    card.repetition = 0;
    card.interval = 0;
    card.easiness = Math.max(1.3, easiness - 0.2);
    card.nextReviewDate = reviewedAt.toISOString();
    delete card.weeklyTestPasses;
    delete card.weeklyTestIntervalDays;
    delete card.nextWeeklyTestDate;
    return;
  }

  const repetition = Number(card.repetition) || 0;
  const previousInterval = Number(card.interval) || 0;
  const interval = repetition === 0 ? 1 : (repetition === 1 ? 6 : Math.max(1, Math.round(previousInterval * easiness)));
  card.repetition = repetition + 1;
  card.interval = interval;
  card.easiness = Math.max(1.3, easiness + 0.1 - (5 - 4) * (0.08 + (5 - 4) * 0.02));
  const nextReviewDate = new Date(reviewedAt);
  nextReviewDate.setDate(nextReviewDate.getDate() + interval);
  card.nextReviewDate = nextReviewDate.toISOString();

  if (!wasMastered && isMastered(card)) {
    card.weeklyTestPasses = 0;
    card.weeklyTestIntervalDays = 7;
    const weeklyDate = new Date(reviewedAt);
    weeklyDate.setDate(weeklyDate.getDate() + 7);
    card.nextWeeklyTestDate = weeklyDate.toISOString();
  }
}

export const ACTIVITY_LOG_KEY = 'english_activity_logs_v1';
export const HABIT_STATS_KEY = 'english_habit_stats_v1';

export function getHabitStats(): { streak: number; lastActiveDate: string; dailyGoal: number } {
  try {
    const raw = localStorage.getItem(HABIT_STATS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return { streak: 0, lastActiveDate: '', dailyGoal: 5 };
}

export function logActivity(type: 'review' | 'note'): { streak: number; reviewsToday: number } {
  const today = getTodayKey();
  let logs: Record<string, { reviewsCount: number; notesCreatedCount: number }> = {};
  try {
    const rawLogs = localStorage.getItem(ACTIVITY_LOG_KEY);
    if (rawLogs) logs = JSON.parse(rawLogs);
  } catch {
    // ignore
  }

  if (!logs[today]) {
    logs[today] = { reviewsCount: 0, notesCreatedCount: 0 };
  }

  if (type === 'review') {
    logs[today].reviewsCount += 1;
  } else {
    logs[today].notesCreatedCount += 1;
  }
  localStorage.setItem(ACTIVITY_LOG_KEY, JSON.stringify(logs));

  // Compute streak
  const stats = getHabitStats();
  let streak = stats.streak;
  if (!stats.lastActiveDate) {
    streak = 1;
  } else if (stats.lastActiveDate !== today) {
    const lastDate = new Date(stats.lastActiveDate);
    const currentDate = new Date(today);
    const diffDays = Math.round((currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      streak += 1;
    } else if (diffDays > 1) {
      streak = 1;
    }
  }

  const updatedStats = {
    ...stats,
    streak,
    lastActiveDate: today
  };
  localStorage.setItem(HABIT_STATS_KEY, JSON.stringify(updatedStats));

  return { streak, reviewsToday: logs[today].reviewsCount };
}

export function getRecentActivityLogs(days = 14): { date: string; reviewsCount: number; hasActivity: boolean }[] {
  let logs: Record<string, { reviewsCount: number; notesCreatedCount: number }> = {};
  try {
    const rawLogs = localStorage.getItem(ACTIVITY_LOG_KEY);
    if (rawLogs) logs = JSON.parse(rawLogs);
  } catch {
    // ignore
  }

  const result = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const entry = logs[key];
    const count = entry ? entry.reviewsCount : 0;
    result.push({
      date: key,
      reviewsCount: count,
      hasActivity: count > 0 || (entry ? entry.notesCreatedCount > 0 : false)
    });
  }
  return result;
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
}

export function sendLocalNotification(title: string, options?: NotificationOptions): void {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  try {
    new Notification(title, {
      icon: '/favicon.ico',
      ...options
    });
  } catch {
    // ignore
  }
}

export function computeUserBadges(notes: Note[], cards: ConversationCard[]): Badge[] {
  const stats = getHabitStats();
  const streak = stats.streak || 0;
  
  // Total reviews count from all activity logs
  let totalReviews = 0;
  try {
    const rawLogs = localStorage.getItem(ACTIVITY_LOG_KEY);
    if (rawLogs) {
      const logs = JSON.parse(rawLogs);
      totalReviews = Object.values(logs).reduce((acc: number, cur: any) => acc + (cur.reviewsCount || 0), 0);
    }
  } catch {
    // ignore
  }

  // Avatar chat messages count
  let avatarMsgCount = 0;
  try {
    avatarMsgCount = Number(localStorage.getItem('avatar_messages_count_v1') || 0);
  } catch {
    // ignore
  }

  // Mastered cards count
  const masteredCount = cards.filter(c => (c.repetition || 0) >= 2).length;

  return [
    {
      id: 'first_review',
      title: 'Langkah Pertama',
      description: 'Menyelesaikan review flashcard pertama kamu.',
      icon: '🌱',
      unlocked: totalReviews >= 1,
      progress: Math.min(1, totalReviews),
      maxProgress: 1
    },
    {
      id: 'streak_3',
      title: 'Konsisten 3 Hari',
      description: 'Menjaga rutinitas belajar selama 3 hari beruntun.',
      icon: '🔥',
      unlocked: streak >= 3,
      progress: Math.min(3, streak),
      maxProgress: 3
    },
    {
      id: 'streak_7',
      title: 'Juara Rutinitas',
      description: 'Mencapai rekor streak aktif 7 hari berturut-turut.',
      icon: '⚡',
      unlocked: streak >= 7,
      progress: Math.min(7, streak),
      maxProgress: 7
    },
    {
      id: 'cards_master',
      title: 'Penguasa Memori',
      description: 'Berhasil menguasai minimal 3 kalimat hingga fase pengulangan tinggi.',
      icon: '🧠',
      unlocked: masteredCount >= 3,
      progress: Math.min(3, masteredCount),
      maxProgress: 3
    },
    {
      id: 'avatar_friend',
      title: 'Sahabat Avatar',
      description: 'Aktif berlatih percakapan langsung bersama Avatar AI (5 interaksi).',
      icon: '🗣️',
      unlocked: avatarMsgCount >= 5,
      progress: Math.min(5, avatarMsgCount),
      maxProgress: 5
    },
    {
      id: 'notes_author',
      title: 'Penulis Berdedikasi',
      description: 'Menulis minimal 3 dokumen catatan di editor produktivitas.',
      icon: '📝',
      unlocked: notes.length >= 3,
      progress: Math.min(3, notes.length),
      maxProgress: 3
    }
  ];
}


