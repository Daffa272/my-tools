import { WordData, ChunkItem, ChunkTestQuestion, QuizQuestion, WeeklyCorrectionResult } from '../types';

export const GEMINI_MODEL = 'gemini-3.5-flash-lite';

export function normalizeApiKey(key: string): string {
  return String(key || '').trim().replace(/^Bearer\s+/i, '');
}

export function cleanJsonOutput(text: string): string {
  return String(text || '')
    .replace(/^```json\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
}

export async function processWordAI(
  inputWord: string,
  isRandom: boolean,
  apiKey: string
): Promise<WordData> {
  const cleanKey = normalizeApiKey(apiKey);
  if (!cleanKey) {
    throw new Error('Gemini API Key diperlukan. Silakan masukkan API Key di menu pengaturan.');
  }

  const systemPrompt = `Anda adalah instruktur ahli persiapan TOEFL iBT. Tugas Anda adalah menganalisis kata, frasa, phrasal verb, atau klausa bahasa Inggris yang diberikan.
Jika pengguna meminta kata acak, berikan satu kata dari Academic Word List (AWL) tingkat lanjut.
Berikan transkripsi fonetik, terjemahan Indonesia, 3 sinonim atau padanan makna, 2 antonim atau lawan makna jika relevan, dan bentuk keluarganya (Word Family: noun, verb, adjective, adverb). Untuk frasa atau klausa, gunakan "-" pada bagian yang tidak relevan.
Lalu, berikan 3 sandingan kata yang sering digunakan bersama ekspresi ini (Common Collocations) dan bedah akar katanya (Morphology: prefix, root, suffix beserta artinya). Untuk phrasal verb, analisis makna gabungan dan gunakan "-" jika morphology tidak relevan.
Terakhir, berikan 3 contoh kalimat atau penggunaan yang tepat menggunakan ekspresi tersebut dalam present tense, past tense, dan present perfect tense. Jika target berupa klausa lengkap, sesuaikan contoh tanpa mengubah target secara tidak wajar.
Buat juga bagian "chunks": identifikasi semua pola atau aturan tata bahasa yang berbeda dan alami untuk menggunakan TARGET EKSPRESI, termasuk bentuk kata kerja seperti V1/Vs, V2, atau have/has + V3 hanya jika memang sesuai dengan pola tersebut. Jangan batasi array menjadi satu entri; buat satu entri untuk setiap aturan yang berbeda, tetapi jangan membuat beberapa contoh untuk aturan yang sama. Pisahkan bentuk waktu yang memiliki pola berbeda, jangan gabungkan menjadi satu pola. Setiap entri hanya memiliki satu pola (pattern), penjelasan singkat aturan dalam Bahasa Indonesia (rule), satu contoh kalimat akademik (example_en), dan terjemahan Bahasa Indonesia (example_id). Pertahankan TARGET EKSPRESI persis seperti yang diberikan; jangan memaksakan aturan atau bentuk kata yang tidak gramatikal. Jika ekspresi tidak dapat digunakan secara alami sebagai pola chunk, kembalikan array kosong.
PENTING: Semua contoh kalimat HARUS menggunakan KONTEKS AKADEMIK (seperti sains, sejarah, biologi, jurnalistik, perkuliahan) ala soal TOEFL Reading/Listening.

Untuk pencarian biasa, analisis HANYA target yang dikirim user. Target dapat terdiri dari satu kata, beberapa kata, frasa, phrasal verb, atau klausa. Jangan mengganti target dengan sinonim, kata lain, atau kata dari konteks. Nilai JSON "word" WAJIB sama persis dengan target user.

WAJIB KEMBALIKAN OUTPUT HANYA DALAM FORMAT JSON SEPERTI BERIKUT TANPA TEKS LAIN ATAU MARKDOWN:
{
  "word": "kata inggris", "phonetic": "/cara baca/", "translation": "terjemahan",
  "synonyms": ["sinonim1", "sinonim2", "sinonim3"], "antonyms": ["antonim1", "antonim2"],
  "word_family": { "noun": "...", "verb": "...", "adjective": "...", "adverb": "..." },
  "collocations": ["collocation 1", "collocation 2", "collocation 3"],
  "morphology": { "prefix": "awalan beserta artinya (atau -)", "root": "akar kata utama beserta artinya", "suffix": "akhiran beserta artinya (atau -)" },
  "chunks": [
    { "pattern": "pola chunk dengan slot seperti S + somehow + V1/Vs", "rule": "aturan penggunaan dalam Bahasa Indonesia", "example_en": "Satu contoh kalimat akademik.", "example_id": "Terjemahan contoh." }
  ],
  "tenses": {
    "present": { "form": "...", "example_en": "...", "example_id": "..." },
    "past": { "form": "...", "example_en": "...", "example_id": "..." },
    "present_perfect": { "form": "...", "example_en": "...", "example_id": "..." }
  }
}`;

  const userPrompt = isRandom
    ? 'Berikan satu kata tingkat lanjut dari AWL secara acak, lalu analisis.'
    : `TARGET EKSPRESI: "${inputWord}"\nAnalisis tepat TARGET EKSPRESI tersebut. Jangan memilih kata atau ekspresi lain. Pada JSON, field "word" harus berisi "${inputWord}" persis.`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent?key=${encodeURIComponent(cleanKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0, topK: 1 }
      })
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    let errorMessage = `Gemini API menolak permintaan (${response.status}).`;
    try {
      const errorData = JSON.parse(errorBody);
      const apiError = errorData?.error || errorData;
      const apiMessage = apiError?.message || errorData?.message;
      if (apiMessage) errorMessage += ` ${apiMessage}`;
    } catch {
      // ignore json parse error
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text || '').join('') || '';
  const cleaned = cleanJsonOutput(rawText);
  if (!cleaned) throw new Error('Gemini tidak mengembalikan data.');
  const parsed = JSON.parse(cleaned) as WordData;

  if (!isRandom && String(parsed.word || '').trim().toLowerCase() !== inputWord.trim().toLowerCase()) {
    throw new Error(`AI mengembalikan kata "${parsed.word || 'tidak diketahui'}", bukan "${inputWord}". Silakan tekan Analisis lagi.`);
  }

  return parsed;
}

export async function generateChunksAI(targetWord: string, apiKey: string): Promise<ChunkItem[]> {
  const cleanKey = normalizeApiKey(apiKey);
  if (!cleanKey) throw new Error('Gemini API Key diperlukan untuk membuat chunk.');

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent?key=${encodeURIComponent(cleanKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{
            text: `Anda adalah pengajar bahasa Inggris. Buat chunk grammar yang alami untuk target kata atau frasa yang diberikan. Identifikasi setiap aturan atau pola berbeda yang memang gramatikal; buat tepat satu contoh akademik beserta terjemahan Indonesia untuk setiap aturan, tanpa menggabungkan aturan yang berbeda atau mengulang contoh untuk pola yang sama. Gunakan placeholder seperti S, V1/Vs, V2, atau have/has + V3 hanya bila sesuai dengan pola. Pertahankan target persis dan jangan memaksakan bentuk yang tidak alami. Jika tidak ada pola chunk yang wajar, kembalikan array kosong. Kembalikan JSON saja dengan bentuk {"chunks":[{"pattern":"...","rule":"...","example_en":"...","example_id":"..."}]}.`
          }]
        },
        contents: [{
          role: 'user',
          parts: [{ text: `Buat chunk untuk target ini: "${targetWord}"` }]
        }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.2 }
      })
    }
  );

  if (!response.ok) throw new Error(`Gemini API menolak permintaan (${response.status}).`);
  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || '').join('') || '';
  const cleaned = cleanJsonOutput(rawText);
  if (!cleaned) throw new Error('Gemini tidak mengembalikan data chunk.');

  const parsed = JSON.parse(cleaned);
  const chunks = Array.isArray(parsed.chunks) ? parsed.chunks : [];
  const validChunks = chunks.filter((chunk: ChunkItem) =>
    chunk && typeof chunk.pattern === 'string' && chunk.pattern.trim() &&
    typeof chunk.rule === 'string' && chunk.rule.trim() &&
    typeof chunk.example_en === 'string' && chunk.example_en.trim() &&
    typeof chunk.example_id === 'string' && chunk.example_id.trim()
  );

  if (validChunks.length === 0) {
    throw new Error('AI tidak menemukan pola chunk yang sesuai untuk kata ini.');
  }

  return validChunks;
}

export async function generateChunkMiniTestAI(
  word: string,
  chunks: ChunkItem[],
  apiKey: string
): Promise<ChunkTestQuestion[]> {
  const cleanKey = normalizeApiKey(apiKey);
  if (!cleanKey) throw new Error('Gemini API Key diperlukan untuk membuat mini test chunk.');

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent?key=${encodeURIComponent(cleanKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{
            text: `Anda menyusun latihan bergaya TOEFL iBT untuk pembelajar bahasa Inggris tingkat menengah hingga lanjut. Buat tepat 3 soal pilihan ganda berdasarkan kata dan daftar chunks yang diberikan. Soal harus menguji pemahaman serta penggunaan chunk dalam konteks akademik alami, bukan sekadar hafalan pola atau terjemahan literal.

Buat variasi jenis soal berikut, masing-masing satu:
1. Makna atau fungsi chunk dalam kalimat akademik (vocabulary/phrase in context).
2. Melengkapi kalimat atau paragraf akademik dengan chunk yang paling tepat (sentence completion).
3. Memilih kalimat yang menggunakan chunk secara gramatikal dan alami (usage/collocation).

Ketentuan:
- Gunakan konteks akademik bervariasi, misalnya biologi, geologi, sejarah, psikologi, atau ekonomi. Tulis soal dan pilihan dalam bahasa Inggris yang alami dan ringkas; tulis explanation dalam Bahasa Indonesia.
- Gunakan chunk dari input dengan makna dan bentuk yang tetap tepat. Jika suatu jenis soal tidak dapat dibuat secara valid dari data, uji chunk lain atau fungsi chunk yang tersedia; jangan mengarang aturan atau makna.
- Setiap soal harus memiliki tepat 4 opsi berbeda yang sejenis secara gramatikal dan masuk akal. Hanya satu opsi benar; pengecoh harus masuk akal tetapi salah karena makna, kolokasi, atau tata bahasa.
- Hindari opsi yang jelas tidak masuk akal, jawaban yang tumpang tindih, petunjuk jawaban dari panjang atau format, terjemahan langsung, serta pertanyaan yang menguji pengetahuan di luar teks.
- Explanation menyebutkan petunjuk konteks atau aturan penggunaan yang mendukung jawaban benar.
- Jangan menyatakan soal ini sebagai soal resmi TOEFL.

Kembalikan JSON saja dengan bentuk {"questions":[{"question":"...","options":["...","...","...","..."],"answerIndex":0,"explanation":"..."}]}. answerIndex adalah indeks 0-based.`
          }]
        },
        contents: [{
          role: 'user',
          parts: [{ text: JSON.stringify({ word, chunks }) }]
        }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.2 }
      })
    }
  );

  if (!response.ok) throw new Error(`Gemini API menolak permintaan (${response.status}).`);
  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || '').join('') || '';
  const cleaned = cleanJsonOutput(rawText);
  if (!cleaned) throw new Error('Gemini tidak mengembalikan soal mini test.');

  const parsed = JSON.parse(cleaned);
  const questions = Array.isArray(parsed.questions) ? parsed.questions : [];
  const validQuestions: ChunkTestQuestion[] = questions.filter((q: ChunkTestQuestion) =>
    q && typeof q.question === 'string' && q.question.trim() &&
    Array.isArray(q.options) && q.options.length === 4 &&
    q.options.every((opt: string) => typeof opt === 'string' && opt.trim()) &&
    new Set(q.options.map((opt: string) => opt.trim().toLowerCase())).size === 4 &&
    Number.isInteger(q.answerIndex) && q.answerIndex >= 0 && q.answerIndex < 4 &&
    typeof q.explanation === 'string' && q.explanation.trim()
  ).slice(0, 3);

  if (validQuestions.length !== 3) {
    throw new Error('Soal mini test yang dibuat AI tidak valid. Silakan coba lagi.');
  }

  const correctPositions = [0, 1, 2, 3];
  for (let index = correctPositions.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [correctPositions[index], correctPositions[randomIndex]] = [correctPositions[randomIndex], correctPositions[index]];
  }

  return validQuestions.map((question, questionIndex) => {
    const correctOption = question.options[question.answerIndex];
    const options = question.options.filter((_, optionIndex) => optionIndex !== question.answerIndex);
    options.splice(correctPositions[questionIndex], 0, correctOption);
    return { ...question, options, answerIndex: correctPositions[questionIndex] };
  });
}

export async function generateTOEFLQuizAI(words: string[], apiKey: string): Promise<QuizQuestion[]> {
  const cleanKey = normalizeApiKey(apiKey);
  if (!cleanKey) throw new Error('Gemini API Key diperlukan.');

  const systemPrompt = `Anda adalah pembuat soal TOEFL iBT. Buatkan soal pilihan ganda (A, B, C, D) melengkapi kalimat rumpang (fill-in-the-blank) untuk menguji kosa kata berikut: [${words.join(', ')}].
Fokuskan pada penggunaan 'Word Family' yang tepat dalam konteks akademik (uji apakah kalimat butuh Noun, Verb, Adjective, atau Adverb dari kata dasar tersebut).

WAJIB KEMBALIKAN DALAM FORMAT JSON SEPERTI INI:
{
  "questions": [
    {
      "word": "kata_dasar",
      "question": "Kalimat soal dengan bagian rumpang ditandai ___",
      "options": ["A. opsi_pertama", "B. opsi_kedua", "C. opsi_ketiga", "D. opsi_keempat"],
      "answer": "A",
      "explanation": "Penjelasan grammar mengapa jawaban tersebut benar."
    }
  ]
}`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent?key=${encodeURIComponent(cleanKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: `Buat soal untuk: ${words.join(', ')}` }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.2 }
      })
    }
  );

  if (!response.ok) throw new Error('Gagal mengambil soal kuis.');
  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || '').join('') || '';
  const cleaned = cleanJsonOutput(rawText);
  if (!cleaned) throw new Error('Gemini tidak mengembalikan soal.');

  const parsed = JSON.parse(cleaned);
  return (parsed.questions || []).map((q: QuizQuestion) => ({ ...q, questionType: 'ai' }));
}

export async function correctWeeklyMasteryTestAI(
  answerSheet: Array<{
    questionNumber: number;
    word: string;
    questionType?: string;
    question: string;
    chunkPattern?: string;
    expectedAnswer?: string;
    userAnswer: string;
  }>,
  apiKey: string
): Promise<WeeklyCorrectionResult> {
  const cleanKey = normalizeApiKey(apiKey);
  if (!cleanKey) throw new Error('Gemini API Key diperlukan untuk mengoreksi tes.');

  const systemPrompt = `Anda adalah pemeriksa tes kosakata Bahasa Inggris. Untuk soal arti kata, koreksi terjemahan Bahasa Indonesia dengan toleransi terhadap sinonim dan makna yang setara. Terima variasi kecil pada tanda baca, kapitalisasi, dan kata yang setara; jangan memberi nilai benar jika maknanya tidak sesuai. Untuk soal pilihan ganda antonim atau word-family, anggap jawaban benar hanya jika sama dengan expectedAnswer setelah mengabaikan kapitalisasi. Nilai setiap soal secara terpisah dan pastikan score sama dengan jumlah item yang correct bernilai true.
Kembalikan JSON valid dengan format:
{"score": 0, "total": 0, "feedback": "ringkasan singkat dalam Bahasa Indonesia", "items": [{"questionNumber": 1, "correct": true, "note": "penjelasan singkat"}]}
Jangan menambahkan markdown atau teks di luar JSON.`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent?key=${encodeURIComponent(cleanKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: JSON.stringify(answerSheet) }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.1 }
      })
    }
  );

  if (!response.ok) throw new Error('Gagal mengoreksi tes.');
  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || '').join('') || '';
  const cleaned = cleanJsonOutput(rawText);
  const parsed = JSON.parse(cleaned);
  const total = answerSheet.length;

  if (!Array.isArray(parsed.items)) throw new Error('Rincian koreksi tes tidak lengkap.');
  const verifiedScore = parsed.items.filter((item: { correct: boolean }) => item.correct).length;

  return {
    score: verifiedScore,
    total,
    feedback: String(parsed.feedback || 'Koreksi selesai.'),
    items: parsed.items
  };
}

export async function generateReadingPassageAI(
  targetWord: string,
  otherWords: string[],
  apiKey: string
): Promise<import('../types').ReadingPassage> {
  const cleanKey = normalizeApiKey(apiKey);
  if (!cleanKey) throw new Error('Gemini API Key diperlukan untuk membuat simulasi teks bacaan.');

  const systemPrompt = `Anda adalah pembuat soal reading comprehension TOEFL iBT tingkat lanjut.
Tugas Anda adalah membuat satu paragraf teks bacaan akademik pendek (sekitar 110-150 kata) dalam konteks sains, sejarah, atau riset alam.
Wajib gunakan kata target "${targetWord}" secara alami di dalam teks (tandai kata tersebut dengan kurung siku [${targetWord}] dalam teks). Jika relevan, sertakan juga beberapa kosakata ini: [${otherWords.slice(0, 4).join(', ')}].
Setelah teks bacaan, buat tepat 1 soal pilihan ganda tipe "Vocabulary in Context" ala TOEFL Reading yang menanyakan makna kata [${targetWord}] dalam bacaan. Berikan 4 opsi pilihan dan indeks jawaban benar (0-based) serta penjelasan ringkas dalam Bahasa Indonesia.

WAJIB KEMBALIKAN OUTPUT HANYA DALAM FORMAT JSON SEPERTI BERIKUT TANPA TEKS LAIN:
{
  "title": "Judul Topik Akademik",
  "passage": "Teks bacaan lengkap...",
  "question": "In the passage, the word '[word]' is closest in meaning to:",
  "options": ["A. opsi1", "B. opsi2", "C. opsi3", "D. opsi4"],
  "answerIndex": 0,
  "explanation": "Penjelasan mengapa jawaban tersebut benar."
}`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent?key=${encodeURIComponent(cleanKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: `Buat simulasi bacaan TOEFL untuk kata: "${targetWord}"` }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.2 }
      })
    }
  );

  if (!response.ok) throw new Error('Gagal menghasilkan teks bacaan TOEFL.');
  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || '').join('') || '';
  const cleaned = cleanJsonOutput(rawText);
  if (!cleaned) throw new Error('Gemini tidak mengembalikan data bacaan.');

  const parsed = JSON.parse(cleaned);
  return {
    title: String(parsed.title || `Reading Context: ${targetWord}`),
    passage: String(parsed.passage || ''),
    question: String(parsed.question || `In the passage, the word '${targetWord}' is closest in meaning to:`),
    options: Array.isArray(parsed.options) && parsed.options.length === 4 ? parsed.options : ['A. option 1', 'B. option 2', 'C. option 3', 'D. option 4'],
    answerIndex: typeof parsed.answerIndex === 'number' ? parsed.answerIndex : 0,
    explanation: String(parsed.explanation || '')
  };
}

export async function evaluateUserSentenceAI(
  targetWord: string,
  userSentence: string,
  apiKey: string
): Promise<import('../types').WritingEvaluationResult> {
  const cleanKey = normalizeApiKey(apiKey);
  if (!cleanKey) throw new Error('Gemini API Key diperlukan untuk mengevaluasi kalimat.');

  const systemPrompt = `Anda adalah penilai esai ahli TOEFL iBT Writing (skala skor TOEFL 0 - 5.0).
Tugas Anda adalah mengevaluasi satu kalimat bahasa Inggris yang ditulis oleh pengguna menggunakan target kata/frasa "${targetWord}".
Periksa secara cermat:
1. Ketepatan tata bahasa (grammar, subject-verb agreement, tenses).
2. Ketepatan kolokasi dan preposisi yang bersanding dengan "${targetWord}".
3. Nada akademik (academic tone) dan kekayaan struktur kalimat.
Berikan skor (0.0 sampai 5.0), label band (contoh: "Band 4.5/5.0 · C1 Academic"), catatan kolokasi, catatan tata bahasa dalam Bahasa Indonesia, dan satu versi revisi kalimat tingkat lanjut (improved academic version ala skor 28+).

WAJIB KEMBALIKAN OUTPUT HANYA DALAM FORMAT JSON SEPERTI BERIKUT TANPA TEKS LAIN ATAU MARKDOWN:
{
  "score": 4.5,
  "bandLabel": "Band 4.5/5.0 · C1 Academic",
  "isGrammaticallyCorrect": true,
  "collocationFeedback": "Ulasan penggunaan kolokasi dan preposisi...",
  "grammarFeedback": "Ulasan tata bahasa dan struktur kalimat...",
  "improvedVersion": "Versi kalimat akademik yang disempurnakan..."
}`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent?key=${encodeURIComponent(cleanKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `Target kata: "${targetWord}"\nKalimat pengguna: "${userSentence}"`
              }
            ]
          }
        ],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.1 }
      })
    }
  );

  if (!response.ok) throw new Error('Gagal mengevaluasi kalimat dengan AI.');
  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || '').join('') || '';
  const cleaned = cleanJsonOutput(rawText);
  if (!cleaned) throw new Error('Gemini tidak mengembalikan evaluasi.');

  const parsed = JSON.parse(cleaned);
  return {
    score: typeof parsed.score === 'number' ? parsed.score : 4.0,
    bandLabel: String(parsed.bandLabel || 'Band 4.0/5.0 · B2 Academic'),
    isGrammaticallyCorrect: Boolean(parsed.isGrammaticallyCorrect),
    collocationFeedback: String(parsed.collocationFeedback || ''),
    grammarFeedback: String(parsed.grammarFeedback || ''),
    improvedVersion: String(parsed.improvedVersion || '')
  };
}
