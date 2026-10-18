let englishVoice: SpeechSynthesisVoice | null = null;

function loadVoices(): void {
  if (!('speechSynthesis' in window)) return;
  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return;

  // Prefer Google US English, Samantha, or natural en-US/en-GB voice
  englishVoice =
    voices.find(v => v.lang === 'en-US' && (v.name.includes('Google') || v.name.includes('Natural'))) ||
    voices.find(v => v.lang.startsWith('en-US')) ||
    voices.find(v => v.lang.startsWith('en')) ||
    null;
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  loadVoices();
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }
}

export function speakEnglish(text: string, onStateChange?: (speaking: boolean) => void): boolean {
  if (!('speechSynthesis' in window) || !text.trim()) {
    if (onStateChange) onStateChange(false);
    return false;
  }

  try {
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    // Workaround for Chrome bug where speech synthesis gets stuck if paused
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }

    const utterance = new SpeechSynthesisUtterance(text.trim());
    utterance.lang = 'en-US';
    utterance.rate = 0.92; // Clear, optimal pace for language learning
    utterance.pitch = 1.0;

    if (!englishVoice) {
      loadVoices();
    }
    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    if (onStateChange) {
      utterance.onstart = () => onStateChange(true);
      utterance.onend = () => onStateChange(false);
      utterance.onerror = () => onStateChange(false);
    }

    window.speechSynthesis.speak(utterance);
    return true;
  } catch (error) {
    console.error('Speech synthesis error:', error);
    if (onStateChange) onStateChange(false);
    return false;
  }
}
