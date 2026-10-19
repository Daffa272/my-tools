import { EvaluationResult } from '../types';

export const API_KEY_STORAGE_KEY = 'gemini_api_key';
export const MODEL = 'gemini-3.5-flash-lite';

export function getStoredApiKey(): string {
  let key = localStorage.getItem(API_KEY_STORAGE_KEY) || '';
  if (!key) {
    try {
      key = JSON.parse(localStorage.getItem('english_app_state_v1') || '{}').apiKey || '';
    } catch {
      // ignore
    }
  }
  if (!key) {
    try {
      key = (import.meta as unknown as { env: { VITE_GEMINI_API_KEY?: string } }).env?.VITE_GEMINI_API_KEY || '';
    } catch {
      // ignore
    }
  }
  return key;
}

export function setStoredApiKey(key: string): void {
  if (!key.trim()) {
    localStorage.removeItem(API_KEY_STORAGE_KEY);
  } else {
    localStorage.setItem(API_KEY_STORAGE_KEY, key.trim());
  }
}

export async function requestGeminiJSON<T>(systemPrompt: string, requestData: unknown): Promise<T> {
  const apiKey = getStoredApiKey();
  if (!apiKey) {
    throw new Error('Simpan Gemini API Key di menu pengaturan terlebih dahulu untuk mengaktifkan AI.');
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(MODEL)}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: JSON.stringify(requestData) }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0 }
      })
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    let detail = '';
    try {
      detail = JSON.parse(errorBody)?.error?.message || '';
    } catch {
      // ignore
    }
    throw new Error(detail || `Gemini API menolak permintaan (${response.status}). Pastikan API Key valid.`);
  }

  const payload = await response.json();
  const responseText = payload.candidates?.[0]?.content?.parts
    ?.map((part: { text?: string }) => part.text || '')
    .join('')
    .replace(/```json|```/g, '')
    .trim();

  if (!responseText) {
    throw new Error('Gemini tidak mengembalikan data yang valid.');
  }

  return JSON.parse(responseText) as T;
}

export async function generateConversationDetails(sentence: string): Promise<{
  translationId: string;
  situation: string;
  condition: string;
}> {
  return requestGeminiJSON<{
    translationId: string;
    situation: string;
    condition: string;
  }>(
    'Anda adalah pelatih percakapan bahasa Inggris. Untuk satu kalimat bahasa Inggris, buat terjemahan bahasa Indonesia yang setia pada makna, situasi percakapan singkat, dan kondisi atau konteks spesifik. Terjemahan Indonesia harus dapat dipakai sebagai petunjuk untuk mengingat kembali kalimat Inggris. Situasi menjelaskan tujuan/interaksi, kondisi menjelaskan detail atau batasan yang relevan. Balas hanya JSON: {"translationId":"terjemahan bahasa Indonesia","situation":"situasi percakapan","condition":"kondisi atau konteks"}.',
    { sentence }
  );
}

export async function evaluateAnswers(params: {
  translationInIndonesian: string;
  referenceSentence: string;
  situation: string;
  condition: string;
  expectedResponseType: 'answer' | 'question';
  translationAttempt: string;
  responseAttempt: string;
}): Promise<EvaluationResult> {
  const result = await requestGeminiJSON<EvaluationResult>(
    'Anda adalah pelatih bahasa Inggris. Nilai dua tugas secara terpisah. Pertama, tentukan apakah translationAttempt merupakan terjemahan bahasa Inggris yang akurat dan alami dari translationInIndonesian; berikan translationCorrection yang benar bila perlu. Kedua, evaluasi expectedResponseType berdasarkan referenceSentence, situation, dan condition. Jika tipenya "answer", nilai apakah responseAttempt menjawab pertanyaan acuan dengan relevan, alami, dan tata bahasa yang benar. Jika tipenya "question", nilai apakah responseAttempt merupakan pertanyaan alami yang cocok untuk memperoleh kalimat acuan sebagai jawabannya dan sesuai situasi/kondisi. Terima variasi yang wajar. Balas hanya JSON dengan bentuk: {"translationCorrect":true,"translationFeedback":"catatan singkat bahasa Indonesia","translationCorrection":"terjemahan bahasa Inggris yang tepat","responseCorrect":true,"responseFeedback":"catatan singkat bahasa Indonesia","responseCorrection":"respons bahasa Inggris yang tepat"}.',
    params
  );

  if (typeof result.translationCorrect !== 'boolean' || typeof result.responseCorrect !== 'boolean') {
    throw new Error('Format koreksi Gemini tidak valid.');
  }

  return {
    translationCorrect: result.translationCorrect,
    translationFeedback: String(result.translationFeedback || ''),
    translationCorrection: String(result.translationCorrection || params.referenceSentence),
    responseCorrect: result.responseCorrect,
    responseFeedback: String(result.responseFeedback || ''),
    responseCorrection: String(result.responseCorrection || params.referenceSentence)
  };
}

export async function ensureReviewDetails(
  sentence: string,
  situation = '',
  condition = ''
): Promise<{ translationId: string; situation: string; condition: string }> {
  return requestGeminiJSON<{ translationId: string; situation: string; condition: string }>(
    'Buat terjemahan Indonesia yang setia pada kalimat Inggris, serta situasi percakapan dan kondisi/konteksnya. Terjemahan digunakan sebagai petunjuk review tanpa menampilkan kalimat Inggris. Balas hanya JSON: {"translationId":"terjemahan Indonesia","situation":"situasi percakapan","condition":"kondisi atau konteks"}.',
    { sentence, situation, condition }
  );
}

export function speakConversationSentence(sentence: string): void {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(sentence);
  utterance.lang = 'en-US';
  utterance.rate = 0.85;
  window.speechSynthesis.speak(utterance);
}

export function speakAvatarVoice(
  text: string,
  persona: { voiceGender?: 'female' | 'male'; accent?: string; rate?: number },
  onStart?: () => void,
  onEnd?: () => void
): void {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = persona.accent?.includes('UK') || persona.accent?.includes('British') ? 'en-GB' : 'en-US';
  utterance.rate = persona.rate || 0.92;
  utterance.pitch = persona.voiceGender === 'male' ? 0.95 : 1.08;

  const voices = window.speechSynthesis.getVoices();
  const isMale = persona.voiceGender === 'male';
  const targetVoice = voices.find(v => {
    const name = v.name.toLowerCase();
    const lang = v.lang.toLowerCase();
    const matchesLang = lang.startsWith('en');
    if (!matchesLang) return false;
    if (isMale) {
      return name.includes('male') || name.includes('david') || name.includes('george') || name.includes('daniel');
    }
    return name.includes('female') || name.includes('samantha') || name.includes('victoria') || name.includes('karen') || name.includes('zira');
  });

  if (targetVoice) {
    utterance.voice = targetVoice;
  }

  if (onStart) utterance.onstart = onStart;
  if (onEnd) utterance.onend = onEnd;
  utterance.onerror = () => onEnd?.();
  window.speechSynthesis.speak(utterance);
}

export async function generateAvatarReply(params: {
  personaName: string;
  personaRole: string;
  personaBio: string;
  scenarioTitle: string;
  scenarioContext: string;
  chatHistory: { sender: 'user' | 'avatar'; text: string }[];
  userMessage: string;
}): Promise<{
  englishReply: string;
  indonesianTranslation: string;
  quickTip?: string;
}> {
  const systemPrompt = `Anda adalah ${params.personaName}, ${params.personaRole} (${params.personaBio}). Anda sedang berbicara langsung dalam bahasa Inggris seperti manusia nyata dengan lawan bicara dalam skenario: "${params.scenarioTitle}" (${params.scenarioContext}).
Aturan:
1. Balas dengan bahasa Inggris yang santai, hangat, dan alami layaknya percakapan manusia asli (1-3 kalimat).
2. Tunjukkan reaksi terhadap pesan pengguna dan ajukan pertanyaan lanjutan yang membuat percakapan terus mengalir.
3. Jangan pernah membongkar bahwa Anda AI atau menyebut diri Anda model bahasa.
4. Sertakan terjemahan bahasa Indonesia ("indonesianTranslation") yang akurat dan alami.
5. Jika bahasa Inggris pengguna ada kesalahan tata bahasa atau bisa diungkapkan dengan idiom/frasa yang lebih luwes, sertakan tips singkat yang ramah pada "quickTip" (misal: "Tips: Lebih alami bilang 'I\\'m looking forward to...'"). Jika sudah bagus, kosongkan quickTip.
Balas HANYA dalam format JSON: {"englishReply": "...", "indonesianTranslation": "...", "quickTip": "..."}`;

  const requestPayload = {
    chatHistory: params.chatHistory.slice(-8),
    latestUserSpeech: params.userMessage
  };

  return requestGeminiJSON<{
    englishReply: string;
    indonesianTranslation: string;
    quickTip?: string;
  }>(systemPrompt, requestPayload);
}

export async function evaluateConversationSession(params: {
  personaName: string;
  scenarioTitle: string;
  chatMessages: { sender: 'user' | 'avatar'; text: string }[];
}): Promise<{
  fluencyScore: number;
  vocabScore: number;
  grammarScore: number;
  overallScore: number;
  summary: string;
  strengths: string[];
  improvements: string[];
  goodPhrasesUsed: string[];
}> {
  const userTurns = params.chatMessages.filter(m => m.sender === 'user').map(m => m.text);
  if (userTurns.length === 0) {
    throw new Error('Belum ada pesan dari kamu untuk dievaluasi.');
  }

  const systemPrompt = `Anda adalah penilai kemampuan percakapan bahasa Inggris profesional (IELTS / CEFR Speaking Examiner).
Evaluasi performa speaking/chat pengguna dalam percakapan bersama ${params.personaName} di skenario "${params.scenarioTitle}".
Berikan skor 0-100 untuk:
1. fluencyScore (kelancaran, flow, dan daya respons)
2. vocabScore (variasi dan ketepatan kosakata)
3. grammarScore (tata bahasa dan struktur kalimat)
4. overallScore (rata-rata terbobot)
Sertakan juga:
- summary (ulasan ringkas 1-2 kalimat dalam bahasa Indonesia)
- strengths (2-3 poin kelebihan dalam bahasa Indonesia)
- improvements (2-3 poin saran perbaikan konkret dalam bahasa Indonesia)
- goodPhrasesUsed (daftar kata atau frasa bahasa Inggris bagus yang sudah berhasil digunakan pengguna)
Balas HANYA dalam JSON:
{"fluencyScore": 85, "vocabScore": 80, "grammarScore": 82, "overallScore": 82, "summary": "...", "strengths": ["..."], "improvements": ["..."], "goodPhrasesUsed": ["..."]}`;

  return requestGeminiJSON(systemPrompt, {
    conversationHistory: params.chatMessages
  });
}

export async function polishNoteContent(params: {
  title: string;
  contentHtml: string;
}): Promise<{
  polishedHtml: string;
  summaryOfChanges: string;
}> {
  const systemPrompt = `Anda adalah editor tulisan dan tata bahasa profesional. Perbaiki dan perhalus tata bahasa, ejaan (spelling), dan gaya bahasa Inggris/Indonesia pada isi catatan berikut.
Aturan Penting:
1. Tetap pertahankan struktur tag HTML aman (seperti <p>, <h2>, <h3>, <ul>, <ol>, <li>, <blockquote>, <table>, <input type="checkbox">).
2. Perbaiki kesalahan tata bahasa (grammar), typo, dan buat frasa lebih luwes dan alami.
3. Berikan ringkasan singkat perubahan dalam bahasa Indonesia (misal: "Memperbaiki 3 kesalahan tenses dan merapikan struktur kalimat").
Balas HANYA dalam JSON: {"polishedHtml": "...", "summaryOfChanges": "..."}`;

  return requestGeminiJSON(systemPrompt, {
    title: params.title,
    contentHtml: params.contentHtml
  });
}

export async function createStructuredNoteFromImage(params: {
  mimeType: string;
  base64Data: string;
  title?: string;
}): Promise<{
  title: string;
  contentHtml: string;
  summary: string;
}> {
  const apiKey = getStoredApiKey();
  if (!apiKey) {
    throw new Error('Simpan Gemini API Key di menu pengaturan terlebih dahulu untuk memindai gambar.');
  }

  const systemPrompt = `Anda adalah asisten pencatat yang menyalin dan merapikan informasi dari gambar catatan.
1. Baca teks yang terlihat pada gambar setepat mungkin, termasuk bahasa aslinya.
2. Susun ulang menjadi catatan terstruktur dengan judul bagian dan daftar bila sesuai; jangan mengubah maksud atau menambahkan informasi yang tidak ada di gambar.
3. Jika sebagian tulisan tidak terbaca, nyatakan dengan jelas sebagai "[tidak terbaca]" alih-alih menebak.
4. Kembalikan contentHtml hanya menggunakan tag aman: p, br, strong, em, h2, h3, ul, ol, li, blockquote, table, thead, tbody, tr, th, td.
5. Berikan ringkasan singkat dalam bahasa Indonesia.
Balas HANYA JSON: {"title":"judul catatan","contentHtml":"<h2>...</h2><ul><li>...</li></ul>","summary":"ringkasan singkat"}`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(MODEL)}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{
          role: 'user',
          parts: [
            { text: `Pindai gambar ini dan buat catatan terstruktur.${params.title ? ` Judul catatan yang sedang dibuka: "${params.title}".` : ''}` },
            { inlineData: { mimeType: params.mimeType, data: params.base64Data } }
          ]
        }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.2 }
      })
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    let detail = '';
    try {
      detail = JSON.parse(errorBody)?.error?.message || '';
    } catch {
      // Ignore non-JSON error bodies.
    }
    throw new Error(detail || `Gemini gagal memindai gambar (${response.status}).`);
  }

  const payload = await response.json();
  const responseText = payload.candidates?.[0]?.content?.parts
    ?.map((part: { text?: string }) => part.text || '')
    .join('')
    .replace(/```json|```/g, '')
    .trim();
  if (!responseText) throw new Error('Gemini tidak menemukan teks yang dapat dijadikan catatan.');

  const result = JSON.parse(responseText) as { title?: string; contentHtml?: string; summary?: string };
  if (!result.contentHtml?.trim()) {
    throw new Error('Gemini tidak mengembalikan isi catatan dari gambar tersebut.');
  }
  return {
    title: result.title?.trim() || 'Catatan hasil pindai',
    contentHtml: result.contentHtml,
    summary: result.summary?.trim() || 'Isi gambar dipindai dan disusun menjadi catatan.'
  };
}

export async function detectCefrLevel(sentence: string): Promise<'A1' | 'A2' | 'B1' | 'B2' | 'C1'> {
  const systemPrompt = `Tentukan perkiraan level CEFR (A1, A2, B1, B2, atau C1) dari kalimat percakapan bahasa Inggris berikut.
Balas HANYA dalam format JSON: {"level": "B1"}`;
  try {
    const res = await requestGeminiJSON<{ level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' }>(systemPrompt, { sentence });
    if (['A1', 'A2', 'B1', 'B2', 'C1'].includes(res.level)) return res.level;
  } catch {
    // fallback
  }
  return sentence.split(/\s+/).length > 8 ? 'B1' : 'A2';
}

export function speakChineseVoice(
  text: string,
  persona: { voiceGender?: 'female' | 'male'; rate?: number },
  onStart?: () => void,
  onEnd?: () => void
): void {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'zh-CN';
  utterance.rate = persona.rate || 0.88;
  utterance.pitch = persona.voiceGender === 'female' ? 1.05 : 0.95;

  const voices = window.speechSynthesis.getVoices();
  const isFemale = persona.voiceGender === 'female';
  const targetVoice = voices.find(v => {
    const lang = v.lang.toLowerCase();
    const name = v.name.toLowerCase();
    const isZh = lang.includes('zh') || lang.includes('cmn') || lang.includes('chinese');
    if (!isZh) return false;
    if (isFemale) {
      return name.includes('female') || name.includes('tingting') || name.includes('yaoyao') || name.includes('huihui') || name.includes('xiaoxiao');
    }
    return name.includes('male') || name.includes('kangkang') || name.includes('yunyang') || name.includes('yunxi');
  }) || voices.find(v => v.lang.toLowerCase().includes('zh'));

  if (targetVoice) {
    utterance.voice = targetVoice;
  }

  if (onStart) utterance.onstart = onStart;
  if (onEnd) utterance.onend = onEnd;
  utterance.onerror = () => onEnd?.();
  window.speechSynthesis.speak(utterance);
}

export async function generateChineseAvatarReply(params: {
  personaName: string;
  chineseName: string;
  personaRole: string;
  personaBio: string;
  scenarioTitle: string;
  scenarioContext: string;
  chatHistory: { sender: 'user' | 'avatar'; text: string }[];
  userMessage: string;
}): Promise<{
  hanzi: string;
  pinyin: string;
  indonesianTranslation: string;
  hskLevel?: string;
  vocabularyList?: { word: string; pinyin: string; meaning: string }[];
  quickTip?: string;
}> {
  const systemPrompt = `Anda adalah ${params.personaName} (${params.chineseName}), seorang ${params.personaRole} (${params.personaBio}). Anda sedang berbicara langsung dalam bahasa Mandarin standar (Putonghua / 普通话) seperti manusia nyata yang ramah dengan pembelajar bahasa China dalam skenario: "${params.scenarioTitle}" (${params.scenarioContext}).
Aturan Percakapan:
1. Balas dengan bahasa Mandarin percakapan yang alami, hangat, dan komunikatif (1-3 kalimat).
2. Sertakan karakter Mandarin sederhana (简体汉字) pada "hanzi".
3. Sertakan Pinyin lengkap dengan tanda nada (tone marks) yang akurat pada "pinyin" (contoh: "Nǐ hǎo! Qǐngwèn nǐ xiǎng hē shénme?").
4. Berikan terjemahan bahasa Indonesia yang jelas dan alami pada "indonesianTranslation".
5. Sertakan perkiraan tingkat HSK (misal "HSK 1-2" atau "HSK 2-3") pada "hskLevel".
6. Ambil 2-3 kosakata kunci dari balasan ini dan berikan dalam "vocabularyList" berupa array objek: [{"word": "奶茶", "pinyin": "nǎichá", "meaning": "teh susu / milk tea"}].
7. Jika input pengguna menggunakan ejaan/nada/pinyin atau tata bahasa yang kurang pas, berikan tips ramah pada "quickTip" dalam bahasa Indonesia. Jika input pengguna sudah bagus, berikan pujian atau tips ungkapan percakapan sehari-hari.
Balas HANYA dalam JSON:
{"hanzi": "...", "pinyin": "...", "indonesianTranslation": "...", "hskLevel": "HSK 1-2", "vocabularyList": [...], "quickTip": "..."}`;

  const requestPayload = {
    chatHistory: params.chatHistory.slice(-8),
    latestUserSpeech: params.userMessage
  };

  return requestGeminiJSON(systemPrompt, requestPayload);
}

export async function evaluateChineseConversationSession(params: {
  personaName: string;
  scenarioTitle: string;
  chatMessages: { sender: 'user' | 'avatar'; text: string }[];
}): Promise<{
  fluencyScore: number;
  vocabScore: number;
  grammarScore: number;
  overallScore: number;
  summary: string;
  strengths: string[];
  improvements: string[];
  goodPhrasesUsed: string[];
}> {
  const userTurns = params.chatMessages.filter(m => m.sender === 'user').map(m => m.text);
  if (userTurns.length === 0) {
    throw new Error('Belum ada pesan dari kamu untuk dievaluasi.');
  }

  const systemPrompt = `Anda adalah penguji dan pelatih bahasa Mandarin profesional (HSK / HSKK Speaking Examiner).
Evaluasi performa percakapan bahasa Mandarin pengguna bersama ${params.personaName} dalam skenario "${params.scenarioTitle}".
Pengguna mungkin menulis menggunakan Hanzi, Pinyin, atau kombinasi dengan bahasa Indonesia.
Berikan skor 0-100 untuk:
1. fluencyScore (kelancaran alur percakapan dan keaktifan menjawab)
2. vocabScore (penggunaan kosakata bahasa Mandarin dan akurasi HSK)
3. grammarScore (struktur kalimat Mandarin seperti urutan waktu, tempat, dan partikel 了/吗/呢/吧)
4. overallScore (rata-rata terbobot)
Sertakan juga dalam bahasa Indonesia:
- summary (ringkasan 1-2 kalimat tentang kemampuan berbicara bahasa China pengguna)
- strengths (2-3 poin kelebihan dalam bahasa Indonesia)
- improvements (2-3 saran konkret pengembangan seperti tips nada/pinyin atau tata bahasa)
- goodPhrasesUsed (daftar kata atau frasa Mandarin bagus yang sudah berhasil digunakan pengguna)
Balas HANYA dalam JSON:
{"fluencyScore": 85, "vocabScore": 80, "grammarScore": 82, "overallScore": 82, "summary": "...", "strengths": ["..."], "improvements": ["..."], "goodPhrasesUsed": ["..."]}`;

  return requestGeminiJSON(systemPrompt, {
    conversationHistory: params.chatMessages
  });
}

export async function convertPinyinToHanzi(pinyinOrText: string): Promise<{
  hanzi: string;
  pinyin: string;
  indonesianTranslation: string;
}> {
  const systemPrompt = `Anda adalah mesin konversi Pinyin dan penerjemah bahasa Mandarin cerdas dan presisi.
Tugas: Konversi teks Pinyin (bisa beraksen nada atau tanpa nada, seperti "ni hao", "wo xiang he kafei", "xiexie ni", atau kalimat bahasa China) menjadi Karakter Mandarin Sederhana (Simplified Hanzi / 简体汉字) yang paling alami dan tepat sesuai konteks kalimat.
Sertakan juga Pinyin standar bertanda nada (diacritic tones) dan terjemahan bahasa Indonesianya.

Balas HANYA dalam JSON:
{"hanzi": "你好", "pinyin": "Nǐ hǎo", "indonesianTranslation": "Halo"}`;

  return requestGeminiJSON(systemPrompt, {
    inputText: pinyinOrText
  });
}
