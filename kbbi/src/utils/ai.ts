import { KBBICard } from '../types';

interface RawAICard {
  word?: string;
  meaning?: string;
  definition?: string;
  example?: string;
  example_sentence?: string;
  note?: string;
  translation?: string;
  synonyms?: string[];
  antonyms?: string[];
}

export async function requestAI(userPrompt: string, customApiKey?: string): Promise<any> {
  const apiKey = (customApiKey || localStorage.getItem('gemini_api_key') || '').trim();
  if (!apiKey) {
    throw new Error('Masukkan Gemini API Key terlebih dahulu.');
  }

  // Save key
  localStorage.setItem('gemini_api_key', apiKey);

  const payload = {
    systemInstruction: {
      parts: [
        {
          text: 'Anda adalah editor kosa kata bahasa Indonesia berbasis KBBI. Gunakan definisi ringkas dan contoh kalimat bahasa Indonesia yang alami. Kembalikan JSON valid saja tanpa markdown.'
        }
      ]
    },
    contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.2
    }
  };

  // Primary model requested by previous implementation: gemini-3.5-flash-lite
  let response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }
  );

  // Graceful fallback to gemini-2.5-flash if 3.5-flash-lite returns 404/not found
  if (!response.ok && response.status === 404) {
    response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }
    );
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || 'Gagal mengambil data dari Gemini.');
  }

  const data = await response.json();
  const raw = String(
    data.candidates?.[0]?.content?.parts?.map((part: any) => part.text || '').join('') || ''
  )
    .replace(/```json/g, '')
    .replace(/```/g, '')
    .trim();

  if (!raw) {
    throw new Error('Gemini tidak mengembalikan data.');
  }

  return JSON.parse(raw);
}

interface RawAICard {
  word?: string;
  meaning?: string;
  definition?: string;
  example?: string;
  example_sentence?: string;
  note?: string;
  translation?: string;
  synonyms?: string[];
  antonyms?: string[];
  wordClass?: string;
  word_class?: string;
  etymology?: string;
}

export function normalizeAICard(card: RawAICard): Partial<KBBICard> {
  return {
    word: String(card.word || '').trim(),
    meaning: String(card.meaning || card.definition || '').trim(),
    example: String(card.example || card.example_sentence || '').trim(),
    note: String(card.note || card.translation || '').trim(),
    synonyms: Array.isArray(card.synonyms) ? card.synonyms.filter(Boolean) : [],
    antonyms: Array.isArray(card.antonyms) ? card.antonyms.filter(Boolean) : [],
    wordClass: String(card.wordClass || card.word_class || '').trim() || undefined,
    etymology: String(card.etymology || '').trim() || undefined
  };
}

export async function completeWordWithAI(word: string, apiKey?: string): Promise<Partial<KBBICard>> {
  const result = await requestAI(
    `Analisis kata "${word}" berdasarkan KBBI. Kembalikan satu objek JSON dengan format: {"word":"...","meaning":"definisi","example":"contoh kalimat","note":"catatan makna kalimat","synonyms":["..."],"antonyms":["..."],"wordClass":"n/v/a/adv (lengkap)","etymology":"asal bahasa atau ragam"}.`,
    apiKey
  );
  return normalizeAICard(result.word ? result : result.card || {});
}

export async function generateFiveWordsAI(apiKey?: string): Promise<Array<Partial<KBBICard>>> {
  const result = await requestAI(
    'Buat tepat 5 kosa kata bahasa Indonesia yang menarik untuk dipelajari dan tercantum atau lazim digunakan dalam bahasa baku Indonesia. Kembalikan JSON dengan format {"words":[{"word":"...","meaning":"definisi","example":"contoh kalimat","note":"catatan makna kalimat","synonyms":["..."],"antonyms":["..."],"wordClass":"n/v/a/adv","etymology":"asal bahasa"}]} tanpa teks lain.',
    apiKey
  );
  const words = Array.isArray(result.words) ? result.words : [];
  return words.map(normalizeAICard);
}
