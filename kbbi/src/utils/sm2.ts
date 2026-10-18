import { KBBICard, ProficiencyLevel } from '../types';

export function calculateNextReview(card: KBBICard, quality: number): Partial<KBBICard> {
  let ease = card.easiness || 2.5;
  let repetition = card.repetition || 0;
  let interval = card.interval || 0;

  ease = Math.max(1.3, ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));

  if (quality < 3) {
    repetition = 0;
    interval = 0;
  } else {
    if (repetition === 0) {
      interval = quality === 5 ? 2 : 1;
    } else if (repetition === 1) {
      interval = quality === 5 ? 8 : 6;
    } else {
      interval = Math.max(1, Math.round(interval * ease * (quality === 5 ? 1.3 : quality === 3 ? 0.7 : 1)));
    }
    repetition += 1;
  }

  const next = new Date();
  next.setDate(next.getDate() + interval);

  return {
    easiness: ease,
    repetition,
    interval,
    nextReviewDate: next.toISOString()
  };
}

export function getProficiency(card: KBBICard): ProficiencyLevel {
  if ((card.repetition || 0) >= 3 && (card.interval || 0) >= 14) {
    return 'Dikuasai';
  }
  if ((card.repetition || 0) > 0) {
    return 'Sedang Dipelajari';
  }
  return 'Baru';
}

export function isDue(card: KBBICard): boolean {
  if (!card.nextReviewDate) return true;
  return new Date(card.nextReviewDate) <= new Date();
}

export function dueLabel(card: KBBICard): string {
  if (!card.nextReviewDate || isDue(card)) return 'Siap direview';
  const now = new Date();
  const target = new Date(card.nextReviewDate);
  const diffDays = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 0) return 'Siap hari ini';
  if (diffDays === 1) return 'Besok';
  return `Review ${diffDays} hari lagi`;
}

export function normalizePronunciation(value: string): string {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function speakIndonesian(text: string) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'id-ID';
  utterance.rate = 0.9;
  
  // Try to find Indonesian voice
  const voices = window.speechSynthesis.getVoices();
  const idVoice = voices.find(v => v.lang.startsWith('id') || v.lang.includes('ID'));
  if (idVoice) {
    utterance.voice = idVoice;
  }
  
  window.speechSynthesis.speak(utterance);
}
