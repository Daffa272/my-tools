import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '20mb' }));

// Helper to get Gemini API key
function resolveApiKey(req: Request): string {
  const custom = req.headers['x-gemini-api-key'] as string;
  if (custom && custom.trim()) return custom.trim();
  const envKey = process.env.GEMINI_API_KEY;
  if (envKey && envKey.trim() && envKey !== 'MY_GEMINI_API_KEY') {
    return envKey.trim();
  }
  return '';
}

function getGenAIClient(apiKey: string): GoogleGenAI {
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });
}

// Model fallback chain: gemini-flash-latest -> gemini-3.8-flash -> gemini-3.1-flash-lite
const PREFERRED_MODELS = ['gemini-flash-latest', 'gemini-3.8-flash', 'gemini-3.1-flash-lite'];

// Helper to generate text with model fallback
async function generateWithFallback(
  ai: GoogleGenAI,
  prompt: string,
  systemInstruction?: string,
  userModel?: string
): Promise<string> {
  const modelsToTry = userModel && PREFERRED_MODELS.includes(userModel)
    ? [userModel, ...PREFERRED_MODELS.filter(m => m !== userModel)]
    : PREFERRED_MODELS;
  let lastError: Error | null = null;

  for (const model of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: systemInstruction
          ? {
              systemInstruction,
              temperature: 0.1,
              maxOutputTokens: 120
            }
          : { temperature: 0.1, maxOutputTokens: 120 }
      });

      if (response && response.text) {
        return response.text.trim();
      }
    } catch (err: unknown) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.warn(`Model ${model} failed, trying next...`, lastError.message);
    }
  }

  throw lastError || new Error('Semua model Gemini sedang tidak dapat diakses.');
}

// Health & Status check endpoint with optional live testing
app.get('/api/gemini/status', async (req: Request, res: Response) => {
  const apiKey = resolveApiKey(req);
  const testRequested = req.query.test === 'true';
  const hasServerKey = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY';
  const source = req.headers['x-gemini-api-key'] ? 'custom' : hasServerKey ? 'server' : 'none';

  if (!apiKey) {
    return res.json({
      ok: false,
      hasServerKey,
      source: 'none',
      model: 'gemini-flash-latest',
      message: 'API Key belum disetel. Mode Cadangan Kamus Cerdas aktif otomatis.',
      code: 'NO_KEY'
    });
  }

  if (testRequested) {
    const startTime = Date.now();
    try {
      const ai = getGenAIClient(apiKey);
      const testRes = await ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: 'test',
        config: { maxOutputTokens: 5, temperature: 0.1 }
      });
      const latencyMs = Date.now() - startTime;
      return res.json({
        ok: true,
        hasServerKey,
        source,
        model: 'gemini-flash-latest',
        latencyMs,
        message: `Terhubung aktif ke Gemini AI (${latencyMs}ms)`
      });
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      let userMsg = 'Gagal terhubung ke Gemini AI: ' + errMsg;
      let code = 'ERROR';

      if (errMsg.includes('API_KEY_INVALID') || errMsg.includes('400')) {
        userMsg = 'API Key Gemini tidak valid atau dinonaktifkan.';
        code = 'INVALID_KEY';
      } else if (errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('429')) {
        userMsg = 'Batas kuota Gemini AI tercapai (Rate limit). Mode Cadangan Lokal siap digunakan.';
        code = 'QUOTA_EXCEEDED';
      } else if (errMsg.includes('PERMISSION_DENIED') || errMsg.includes('403')) {
        userMsg = 'Izin API ditolak. Pastikan Generative Language API aktif pada Cloud Console.';
        code = 'PERMISSION_DENIED';
      }

      return res.json({
        ok: false,
        hasServerKey,
        source,
        model: 'gemini-flash-latest',
        message: userMsg,
        code,
        rawError: errMsg
      });
    }
  }

  return res.json({
    ok: true,
    hasServerKey,
    source,
    model: 'gemini-flash-latest',
    message: apiKey ? 'API Gemini Terkonfigurasi' : 'API Key Gemini belum disetel'
  });
});

// Translation endpoint
app.post('/api/gemini/translate', async (req: Request, res: Response) => {
  try {
    const { word, model } = req.body;
    if (!word || typeof word !== 'string' || !word.trim()) {
      return res.status(400).json({ error: 'Parameter "word" diperlukan.' });
    }

    const apiKey = resolveApiKey(req);
    if (!apiKey) {
      return res.status(503).json({
        error: 'API Key Gemini belum terkonfigurasi pada server maupun browser.'
      });
    }

    const ai = getGenAIClient(apiKey);
    const systemInstruction =
      'Terjemahkan kata atau frasa Bahasa Inggris ke Bahasa Indonesia yang paling wajar, terutama sebagai nama benda. Berikan hanya terjemahan Bahasa Indonesia yang singkat dan padat, tanpa tanda kutip, tanpa penjelasan tambahan, tanpa tanda bintang.';

    const raw = await generateWithFallback(
      ai,
      `Terjemahkan ke Bahasa Indonesia: ${word.trim()}`,
      systemInstruction,
      model
    );

    const translation = raw
      .replace(/^["'`]|["'`]$/g, '')
      .replace(/^[\*\-•]\s*/, '')
      .split('\n')[0]
      .trim();

    return res.json({ translation });
  } catch (err: unknown) {
    console.error('Translate route error:', err);
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Gagal memproses terjemahan.'
    });
  }
});

// Pronunciation endpoint
app.post('/api/gemini/pronounce', async (req: Request, res: Response) => {
  try {
    const { word, model } = req.body;
    if (!word || typeof word !== 'string' || !word.trim()) {
      return res.status(400).json({ error: 'Parameter "word" diperlukan.' });
    }

    const apiKey = resolveApiKey(req);
    if (!apiKey) {
      return res.status(503).json({ error: 'API Key Gemini belum terkonfigurasi.' });
    }

    const ai = getGenAIClient(apiKey);
    const systemInstruction =
      'Anda membantu pelajar Indonesia membaca kata Bahasa Inggris. Berikan hanya ejaan bunyi yang mudah dibaca orang Indonesia, tanpa tanda kutip, tanpa IPA, tanpa penjelasan. Contoh: watering can -> wotering ken, mug -> mag, chair -> cer, shelf -> syelf.';

    const raw = await generateWithFallback(
      ai,
      `Buat ejaan cara baca Indonesia untuk: ${word.trim()}`,
      systemInstruction,
      model
    );

    const pronunciation = raw
      .replace(/["'`]/g, '')
      .replace(/^[\*\-•]\s*/, '')
      .split('\n')[0]
      .trim();

    return res.json({ pronunciation });
  } catch (err: unknown) {
    console.error('Pronounce route error:', err);
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Gagal memproses cara baca.'
    });
  }
});

// Example sentence endpoint
app.post('/api/gemini/sentence', async (req: Request, res: Response) => {
  try {
    const { word, model } = req.body;
    if (!word || typeof word !== 'string' || !word.trim()) {
      return res.status(400).json({ error: 'Parameter "word" diperlukan.' });
    }

    const apiKey = resolveApiKey(req);
    if (!apiKey) {
      return res.status(503).json({ error: 'API Key Gemini belum terkonfigurasi.' });
    }

    const ai = getGenAIClient(apiKey);
    const systemInstruction =
      'Buat 1 kalimat bahasa Inggris pendek, alami, dan sederhana yang menggunakan kata benda tersebut, diikuti terjemahan bahasa Indonesia di dalam kurung. Contoh: "She placed the watering can near the flowers. (Dia meletakkan penyiram tanaman di dekat bunga.)". Berikan hanya 1 kalimat tanpa tanda kutip.';

    const raw = await generateWithFallback(
      ai,
      `Buat 1 kalimat contoh untuk kata benda: ${word.trim()}`,
      systemInstruction,
      model
    );

    const sentence = raw.replace(/^["'`]|["'`]$/g, '').split('\n')[0].trim();
    return res.json({ sentence });
  } catch (err: unknown) {
    console.error('Sentence route error:', err);
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Gagal memproses kalimat.'
    });
  }
});

// Image object detection endpoint
app.post('/api/gemini/detect', async (req: Request, res: Response) => {
  try {
    const { imageBase64, model } = req.body;
    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return res.status(400).json({ error: 'Parameter "imageBase64" diperlukan.' });
    }

    const apiKey = resolveApiKey(req);
    if (!apiKey) {
      return res.status(503).json({ error: 'API Key Gemini belum terkonfigurasi.' });
    }

    const ai = getGenAIClient(apiKey);
    const targetModel = model || 'gemini-flash-latest';

    const response = await ai.models.generateContent({
      model: targetModel,
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: imageBase64
              }
            },
            {
              text: 'Sebutkan 3 hingga 6 benda atau bagian benda nyata yang terlihat jelas pada gambar ini. Kembalikan HANYA format JSON valid tanpa format markdown berupa array objek dengan struktur: [{"english": "nama inggris", "indonesian": "arti indonesia", "pronunciation": "ejaan bunyi indonesia (misal: wotering ken)"}].'
            }
          ]
        }
      ],
      config: {
        temperature: 0.1,
        responseMimeType: 'application/json'
      }
    });

    const text = response.text || '';
    const cleanJson = text.replace(/^```json/i, '').replace(/```$/i, '').trim();
    const parsed = JSON.parse(cleanJson);
    return res.json({ objects: Array.isArray(parsed) ? parsed : [] });
  } catch (err: unknown) {
    console.error('Detect route error:', err);
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Gagal memindai gambar.'
    });
  }
});

// Start Express server and mount Vite in development mode
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ObjectEnglish backend running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
