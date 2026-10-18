// Type declarations for Web Speech Recognition API
export interface ISpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

export interface ISpeechRecognitionErrorEvent extends Event {
  error: string;
}

export interface ISpeechRecognition extends EventTarget {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((this: ISpeechRecognition, ev: Event) => void) | null;
  onresult: ((this: ISpeechRecognition, ev: ISpeechRecognitionEvent) => void) | null;
  onerror: ((this: ISpeechRecognition, ev: ISpeechRecognitionErrorEvent) => void) | null;
  onend: ((this: ISpeechRecognition, ev: Event) => void) | null;
}

export interface ISpeechRecognitionConstructor {
  new (): ISpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition?: ISpeechRecognitionConstructor;
    webkitSpeechRecognition?: ISpeechRecognitionConstructor;
  }
}

export type EnglishAccent = 'en-US' | 'en-GB' | 'en-AU';

export interface AudioSettings {
  accent: EnglishAccent;
  rate: number;
}

export function getAudioSettings(): AudioSettings {
  try {
    const savedAccent = localStorage.getItem('english_audio_accent') as EnglishAccent;
    const savedRate = Number(localStorage.getItem('english_audio_speed'));
    return {
      accent: ['en-US', 'en-GB', 'en-AU'].includes(savedAccent) ? savedAccent : 'en-US',
      rate: savedRate && [0.75, 1.0, 1.25].includes(savedRate) ? savedRate : 0.85,
    };
  } catch {
    return { accent: 'en-US', rate: 0.85 };
  }
}

export function setAudioSettings(settings: Partial<AudioSettings>): void {
  try {
    if (settings.accent) {
      localStorage.setItem('english_audio_accent', settings.accent);
    }
    if (settings.rate !== undefined) {
      localStorage.setItem('english_audio_speed', String(settings.rate));
    }
  } catch {}
}

// Keep a persistent reference to the active utterance so browser garbage collection
// (especially Chromium V8 bug) does not prematurely cut off speech playback.
let activeUtterance: SpeechSynthesisUtterance | null = null;

export function cancelSpeech(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    activeUtterance = null;
  }
}

export function speakEnglish(
  text: string,
  customRate?: number,
  customAccent?: EnglishAccent,
  onEnd?: () => void
): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const settings = getAudioSettings();
    const utterance = new SpeechSynthesisUtterance(text);
    activeUtterance = utterance;

    const accent = customAccent || settings.accent;
    utterance.lang = accent;
    utterance.rate = customRate !== undefined ? customRate : settings.rate;

    // Pick a matching voice if browser has voices loaded
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      const matchedVoice = voices.find((v) => v.lang.replace('_', '-').startsWith(accent));
      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }
    }

    let isFinished = false;
    const finish = () => {
      if (!isFinished) {
        isFinished = true;
        if (activeUtterance === utterance) {
          activeUtterance = null;
        }
        onEnd?.();
      }
    };

    utterance.onend = finish;
    utterance.onerror = finish;

    window.speechSynthesis.speak(utterance);
  } else {
    onEnd?.();
  }
}

export function speakIndonesian(
  text: string,
  onEnd?: () => void
): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();

    // Clean up text: replace '/' with ' atau ', clean parentheses, remove excessive punctuation
    const cleaned = text
      .replace(/\s*\/\s*/g, ' atau ')
      .replace(/[\(\)\[\]]/g, ' ')
      .replace(/\s*;\s*/g, ', ')
      .replace(/\s+/g, ' ')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleaned);
    activeUtterance = utterance;

    utterance.lang = 'id-ID';
    utterance.rate = 0.95;

    // Look for Indonesian voice if available in the browser
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      const idVoice = voices.find((v) => {
        const l = v.lang.toLowerCase().replace('_', '-');
        return l === 'id-id' || l.startsWith('id');
      });
      if (idVoice) {
        utterance.voice = idVoice;
      }
    }

    let isFinished = false;
    const finish = () => {
      if (!isFinished) {
        isFinished = true;
        if (activeUtterance === utterance) {
          activeUtterance = null;
        }
        onEnd?.();
      }
    };

    utterance.onend = finish;
    utterance.onerror = finish;

    window.speechSynthesis.speak(utterance);
  } else {
    onEnd?.();
  }
}

export function normalizeSpokenText(text: string): string {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z\s]/g, '')
    .replace(/\s+/g, ' ');
}

export function getSpeechRecognition(): ISpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}
