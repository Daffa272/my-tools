// Comprehensive Dictionary of Everyday English Objects to Indonesian
const COMMON_OBJECTS_DICTIONARY: Record<string, string> = {
  // Garden & Household Tools
  'watering can': 'penyiram tanaman',
  'water can': 'penyiram air',
  'spout': 'corong penyiram',
  'handle': 'gagang / pegangan',
  'lid': 'tutup / penutup',
  'rim': 'bibir wadah / tepi',
  'base': 'alas / dasar wadah',
  'nozzle': 'ujung semprotan',
  'hose': 'selang air',
  'bucket': 'ember',
  'pail': 'ember kecil',
  'shovel': 'sekop',
  'spade': 'sekop tanah',
  'rake': 'garu tanah',
  'broom': 'sapu',
  'mop': 'alat pel',
  'dustpan': 'pengki / serokan sampah',
  'trash can': 'tempat sampah',
  'garbage bin': 'tong sampah',
  'sponge': 'spons pembersih',
  'cloth': 'kain lap',
  'towel': 'handuk',
  'hanger': 'gantungan baju',
  'ladder': 'tangga',
  'flashlight': 'senter',
  'battery': 'baterai',
  'candle': 'lilin',
  'matchbox': 'kotak korek api',
  'lighter': 'korek gas',

  // Kitchen & Dining
  'coffee mug': 'cangkir kopi',
  'mug': 'cangkir',
  'cup': 'cangkir / gelas',
  'tea cup': 'cangkir teh',
  'saucer': 'piring kecil / tatakan',
  'teapot': 'teko teh',
  'kettle': 'ceret / teko listrik',
  'plate': 'piring',
  'bowl': 'mangkuk',
  'fork': 'garpu',
  'spoon': 'sendok',
  'teaspoon': 'sendok teh',
  'knife': 'pisau',
  'chopsticks': 'sumpit',
  'glass': 'gelas kaca',
  'water bottle': 'botol minum',
  'bottle': 'botol',
  'thermos': 'termos',
  'flask': 'botol termos',
  'pitcher': 'kendi / teko air',
  'jar': 'stoples / toples',
  'tray': 'nampan / baki',
  'pan': 'wajan penggorengan',
  'frying pan': 'wajan teflon',
  'pot': 'panci masak',
  'cutting board': 'talenan',
  'chopping board': 'talenan',
  'straw': 'sedotan',
  'napkin': 'serbet makan',
  'blender': 'blender',
  'toaster': 'pemanggang roti',
  'microwave': 'oven microwave',
  'refrigerator': 'kulkas / lemari es',
  'fridge': 'kulkas',
  'stove': 'kompor',
  'oven': 'oven pemanggang',
  'sink': 'bak cuci piring',
  'faucet': 'keran air',
  'tap': 'keran air',

  // Desk & Study & Office
  'desk lamp': 'lampu meja',
  'lamp': 'lampu',
  'table lamp': 'lampu meja',
  'lampshade': 'kap lampu',
  'bulb': 'bohlam',
  'light bulb': 'bohlam lampu',
  'switch': 'sakelar lampu',
  'cord': 'kabel listrik',
  'cable': 'kabel',
  'plug': 'steker / colokan',
  'socket': 'stopkontak',
  'charger': 'alat pengisi daya / charger',
  'desk': 'meja kerja / meja tulis',
  'table': 'meja',
  'chair': 'kursi',
  'swivel chair': 'kursi putar',
  'book': 'buku',
  'textbook': 'buku pelajaran',
  'notebook': 'buku catatan',
  'diary': 'buku harian',
  'pen': 'pulpen',
  'ballpoint': 'pulpen bolpoin',
  'pencil': 'pensil',
  'pencil case': 'tempat pensil',
  'eraser': 'penghapus',
  'sharpener': 'serutan pensil',
  'ruler': 'penggaris',
  'scissors': 'gunting',
  'glue': 'lem',
  'tape': 'selotip',
  'paperclip': 'klip kertas',
  'stapler': 'stapler / hekter',
  'calendar': 'kalender',
  'clock': 'jam dinding',
  'wall clock': 'jam dinding',
  'watch': 'jam tangan',
  'calculator': 'kalkulator',

  // Electronics & Gadgets
  'laptop': 'laptop',
  'computer': 'komputer',
  'monitor': 'layar monitor',
  'screen': 'layar',
  'keyboard': 'papan ketik / keyboard',
  'mouse': 'tetikus / mouse',
  'mousepad': 'tatakan mouse',
  'headphones': 'headphone / penyuara telinga',
  'earphones': 'earphone / headset',
  'earbuds': 'tws / earphone nirkabel',
  'speaker': 'pelantang / speaker',
  'phone': 'ponsel / hp',
  'smartphone': 'ponsel pintar',
  'tablet': 'tablet',
  'camera': 'kamera',
  'lens': 'lensa kamera',
  'tripod': 'kaki tiga kamera',
  'microphone': 'mikrofon',
  'remote': 'pengendali jarak jauh / remote',
  'remote control': 'remote kontrol',
  'powerbank': 'pengisi daya portabel / powerbank',
  'flash drive': 'flashdisk',
  'usb': 'usb drive',

  // Living Room & Furniture
  'sofa': 'sofa',
  'couch': 'kursi sofa',
  'cushion': 'bantal sofa',
  'pillow': 'bantal kepala',
  'bolster': 'guling',
  'blanket': 'selimut',
  'bed': 'tempat tidur / ranjang',
  'mattress': 'kasur',
  'bedsheet': 'sprei tempat tidur',
  'curtain': 'tirai / gorden',
  'carpet': 'karpet',
  'rug': 'permadani / karpet kecil',
  'mat': 'keset',
  'door': 'pintu',
  'doorknob': 'gagang pintu',
  'doorbell': 'bel pintu',
  'window': 'jendela',
  'shelf': 'rak',
  'bookshelf': 'rak buku',
  'cabinet': 'lemari kabinet',
  'wardrobe': 'lemari pakaian',
  'cupboard': 'lemari dapur',
  'drawer': 'laci meja',
  'mirror': 'cermin',
  'fan': 'kipas angin',
  'ceiling fan': 'kipas langit-langit',
  'air conditioner': 'ac / pendingin ruangan',
  'painting': 'lukisan dinding',
  'picture frame': 'bingkai foto',
  'vase': 'vas bunga',

  // Personal Items, Fashion & Accessories
  'backpack': 'tas ransel',
  'bag': 'tas',
  'tote bag': 'tas jinjing / tote bag',
  'handbag': 'tas tangan',
  'wallet': 'dompet',
  'purse': 'dompet kecil',
  'key': 'kunci',
  'keychain': 'gantungan kunci',
  'glasses': 'kacamata',
  'sunglasses': 'kacamata hitam',
  'shoes': 'sepatu',
  'shoe': 'sepatu',
  'sneakers': 'sepatu kets / sneaker',
  'sandals': 'sandal',
  'slippers': 'sandal rumah',
  'socks': 'kaus kaki',
  'hat': 'topi',
  'cap': 'topi pet',
  'helmet': 'helm pengaman',
  'jacket': 'jaket',
  'coat': 'mantel',
  'shirt': 'kemeja',
  't-shirt': 'kaus oblong',
  'pants': 'celana panjang',
  'trousers': 'celana panjang',
  'shorts': 'celana pendek',
  'skirt': 'rok',
  'dress': 'gaun terusan',
  'belt': 'ikat pinggang',
  'ring': 'cincin',
  'necklace': 'kalung',
  'bracelet': 'gelang',
  'earrings': 'anting-anting',
  'umbrella': 'payung',
  'raincoat': 'jas hujan',

  // Bathroom & Hygiene
  'soap': 'sabun mandi',
  'liquid soap': 'sabun cair',
  'shampoo': 'sampo rambut',
  'toothbrush': 'sikat gigi',
  'toothpaste': 'pasta gigi',
  'comb': 'sisir rambut',
  'hairbrush': 'sikat rambut',
  'hairdryer': 'pengering rambut',
  'razor': 'alat cukur',
  'mirror glass': 'kaca cermin',
  'tissue': 'tisu',
  'toilet paper': 'tisu toilet',

  // Nature & Plants
  'flower': 'bunga',
  'plant': 'tanaman',
  'houseplant': 'tanaman hias',
  'leaf': 'daun',
  'stem': 'batang tanaman',
  'branch': 'ranting pohon',
  'root': 'akar',
  'tree': 'pohon',
  'grass': 'rumput',
  'soil': 'tanah tanaman',
  'flowerpot': 'pot bunga',
  'seed': 'biji / benih',
  'stone': 'batu',
  'pebble': 'batu kerikil'
};

// Smart algorithmic English -> Indonesian phonetic generator
export function toIndonesianPhonetic(text: string): string {
  if (!text || !text.trim()) return '';

  const words = text.toLowerCase().trim().split(/\s+/);
  const phoneticWords = words.map(w => {
    // Known vocabulary phonetic lookup
    const knownMap: Record<string, string> = {
      watering: 'wotering',
      water: 'woter',
      can: 'ken',
      coffee: 'kofi',
      mug: 'mag',
      cup: 'kap',
      lamp: 'lemp',
      desk: 'desk',
      table: 'teibel',
      chair: 'cer',
      door: 'dor',
      window: 'windou',
      book: 'buk',
      pen: 'pen',
      pencil: 'pensil',
      notebook: 'noutbuk',
      laptop: 'leptop',
      keyboard: 'kibord',
      mouse: 'maus',
      bottle: 'botel',
      clock: 'klok',
      watch: 'woc',
      phone: 'foun',
      smartphone: 'smartfoun',
      headphones: 'hedfouns',
      earphones: 'irfouns',
      speaker: 'spiker',
      backpack: 'bekpek',
      bag: 'beg',
      shoes: 'syus',
      shoe: 'syu',
      sneakers: 'snikers',
      sandals: 'sendels',
      slippers: 'slipers',
      socks: 'soks',
      plate: 'pleit',
      bowl: 'boul',
      fork: 'fork',
      spoon: 'spun',
      teaspoon: 'tispun',
      knife: 'naif',
      scissors: 'sizers',
      glasses: 'gleses',
      sunglasses: 'sengleses',
      mirror: 'miror',
      umbrella: 'ambrela',
      flower: 'flawer',
      plant: 'plent',
      pot: 'pot',
      spout: 'spaut',
      handle: 'hendel',
      lid: 'lid',
      rim: 'rim',
      base: 'beis',
      saucer: 'soser',
      lampshade: 'lempsyeid',
      switch: 'swic',
      bulb: 'balb',
      rose: 'rouz',
      hanger: 'henger',
      towel: 'tauel',
      comb: 'koum',
      soap: 'soup',
      shampoo: 'syempu',
      toothpaste: 'tutpeist',
      toothbrush: 'tutbrasy',
      cushion: 'kusyen',
      pillow: 'pilou',
      blanket: 'blenket',
      bed: 'bed',
      fan: 'fen',
      kettle: 'ketel',
      teapot: 'tipot',
      tray: 'trei',
      wallet: 'wolet',
      key: 'ki',
      keychain: 'kicein',
      helmet: 'helmet',
      jacket: 'jeket',
      shirt: 'syert',
      pants: 'pents',
      remote: 'rimout',
      charger: 'carjer',
      cable: 'keibel',
      plug: 'plag',
      socket: 'soket',
      battery: 'beteri',
      curtain: 'kerten',
      carpet: 'karpet',
      drawer: 'drower',
      cabinet: 'kebinet',
      refrigerator: 'refridjereitor',
      fridge: 'fridj',
      microwave: 'maikrowev',
      oven: 'aven',
      sink: 'singk'
    };

    if (knownMap[w]) return knownMap[w];

    // Systematic phonetic transformation rules for Indonesian pronunciation
    let p = w;
    p = p.replace(/^kn/, 'n');
    p = p.replace(/^wr/, 'r');
    p = p.replace(/^ps/, 's');
    p = p.replace(/^wh/, 'w');
    p = p.replace(/tion$/g, 'syen');
    p = p.replace(/sion$/g, 'syen');
    p = p.replace(/ture$/g, 'cer');
    p = p.replace(/ous$/g, 'es');
    p = p.replace(/ph/g, 'f');
    p = p.replace(/th/g, 't');
    p = p.replace(/sh/g, 'sy');
    p = p.replace(/ch/g, 'c');
    p = p.replace(/igh/g, 'ai');
    p = p.replace(/ee/g, 'i');
    p = p.replace(/ea/g, 'i');
    p = p.replace(/oo/g, 'u');
    p = p.replace(/ou/g, 'au');
    p = p.replace(/ow/g, 'ou');
    p = p.replace(/oa/g, 'ou');
    p = p.replace(/ai/g, 'ei');
    p = p.replace(/ay/g, 'ei');
    p = p.replace(/qu/g, 'kw');
    p = p.replace(/ck/g, 'k');
    p = p.replace(/c([eiy])/g, 's$1');
    p = p.replace(/c/g, 'k');
    p = p.replace(/a([b-df-hj-np-tv-z])e$/g, 'ei$1');
    p = p.replace(/i([b-df-hj-np-tv-z])e$/g, 'ai$1');
    p = p.replace(/o([b-df-hj-np-tv-z])e$/g, 'ou$1');
    p = p.replace(/u([b-df-hj-np-tv-z])e$/g, 'yu$1');
    p = p.replace(/e$/g, ''); // silent e at the end

    return p;
  });

  return phoneticWords.join(' ');
}

export function getCustomApiKey(): string {
  return localStorage.getItem('gemini_api_key') || '';
}

export function getSelectedModel(): string {
  return localStorage.getItem('english_ai_model_gemini') || 'gemini-flash-latest';
}

export interface ApiStatusResult {
  ok: boolean;
  message: string;
  model: string;
  source: 'server' | 'custom' | 'none';
  latencyMs?: number;
  code?: string;
  rawError?: string;
}

// Check connectivity to Gemini API (both server proxy and custom key)
export async function checkGeminiApiStatus(testLive: boolean = false): Promise<ApiStatusResult> {
  const customKey = getCustomApiKey();
  const model = getSelectedModel();

  try {
    const url = `/api/gemini/status${testLive ? '?test=true' : ''}`;
    const res = await fetch(url, {
      headers: customKey ? { 'x-gemini-api-key': customKey } : {}
    });

    if (res.ok) {
      const data = await res.json();
      return {
        ok: data.ok,
        message: data.message || (data.ok ? 'Terhubung aktif ke Gemini AI' : 'API Key belum disetel'),
        model: data.model || model,
        source: data.source || (customKey ? 'custom' : data.hasServerKey ? 'server' : 'none'),
        latencyMs: data.latencyMs,
        code: data.code,
        rawError: data.rawError
      };
    }
  } catch (err) {
    console.warn('API status check network error:', err);
  }

  // If backend endpoint is unavailable or returned error, evaluate custom key directly
  if (customKey) {
    return {
      ok: true,
      message: 'Menggunakan API Key kustom dari browser',
      model,
      source: 'custom'
    };
  }

  return {
    ok: false,
    message: 'API belum terhubung (Mode Cadangan Kamus Cerdas aktif 100%)',
    model,
    source: 'none',
    code: 'FALLBACK_ACTIVE'
  };
}

// Free online public fallback translator (used seamlessly when Gemini API is down, rate-limited, or unconfigured)
async function fetchPublicTranslationFallback(word: string): Promise<string> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500); // Fast 2.5s timeout

    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=en|id`,
      { signal: controller.signal }
    );
    clearTimeout(timer);

    if (res.ok) {
      const data = await res.json();
      const text = data?.responseData?.translatedText;
      if (text && typeof text === 'string' && !text.toUpperCase().includes('MYMEMORY WARNING')) {
        // Clean up quotes and unwanted punctuation
        return text.replace(/^["'`]|["'`]$/g, '').trim().toLowerCase();
      }
    }
  } catch {
    // Network fallback failed, will use local dictionary
  }
  return '';
}

// Translate English word to Indonesian (Multi-Tier Resilient Engine)
export async function translateEnglishToIndonesian(word: string): Promise<string> {
  const trimmed = word.trim().toLowerCase();
  if (!trimmed) return '';

  // 1. Instant Direct Dictionary Match (Zero Latency)
  if (COMMON_OBJECTS_DICTIONARY[trimmed]) {
    return COMMON_OBJECTS_DICTIONARY[trimmed];
  }

  const customKey = getCustomApiKey();
  const model = getSelectedModel();

  // 2. Try Primary Gemini Backend Endpoint
  try {
    const response = await fetch('/api/gemini/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(customKey ? { 'x-gemini-api-key': customKey } : {})
      },
      body: JSON.stringify({ word: trimmed, model })
    });

    if (response.ok) {
      const data = await response.json();
      if (data.translation && typeof data.translation === 'string') {
        return data.translation.trim();
      }
    }
  } catch (err) {
    console.warn('API translation route unavailable, switching to fallbacks...', err);
  }

  // 3. Direct Gemini REST endpoint if user configured a custom key
  if (customKey) {
    try {
      const directRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
          model
        )}:generateContent?key=${encodeURIComponent(customKey)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: {
              parts: [
                {
                  text: 'Terjemahkan kata atau frasa Bahasa Inggris ke Bahasa Indonesia yang paling wajar, terutama sebagai nama benda. Berikan hanya terjemahan Bahasa Indonesia, tanpa tanda kutip atau penjelasan.'
                }
              ]
            },
            contents: [{ role: 'user', parts: [{ text: trimmed }] }],
            generationConfig: { temperature: 0.1, maxOutputTokens: 60 }
          })
        }
      );

      if (directRes.ok) {
        const data = await directRes.json();
        const translation = String(
          data.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || '').join('') || ''
        )
          .replace(/^["'`]|["'`]$/g, '')
          .trim();
        if (translation) return translation;
      }
    } catch (e) {
      console.warn('Direct Gemini call failed:', e);
    }
  }

  // 4. Free Online Translation Fallback (Zero Setup Required)
  const publicTrans = await fetchPublicTranslationFallback(trimmed);
  if (publicTrans) {
    return publicTrans;
  }

  // 5. Compound words breaker & dictionary combination
  // e.g. "coffee cup handle" -> "gagang cangkir kopi"
  const tokens = trimmed.split(/\s+/);
  if (tokens.length > 1) {
    const translatedTokens = tokens.map(t => COMMON_OBJECTS_DICTIONARY[t] || t);
    // Reverse order often fits Indonesian grammar (Noun + Adjective/Modifier)
    if (tokens.length === 2 && COMMON_OBJECTS_DICTIONARY[tokens[1]] && COMMON_OBJECTS_DICTIONARY[tokens[0]]) {
      return `${COMMON_OBJECTS_DICTIONARY[tokens[1]]} ${COMMON_OBJECTS_DICTIONARY[tokens[0]]}`;
    }
    return translatedTokens.join(' ');
  }

  return '';
}

// Generate Indonesian phonetic guide for English word
export async function generatePronunciationGuide(word: string): Promise<string> {
  const trimmed = word.trim().toLowerCase();
  if (!trimmed) return '';

  const customKey = getCustomApiKey();
  const model = getSelectedModel();

  // Try Gemini Backend Endpoint first
  try {
    const response = await fetch('/api/gemini/pronounce', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(customKey ? { 'x-gemini-api-key': customKey } : {})
      },
      body: JSON.stringify({ word: trimmed, model })
    });

    if (response.ok) {
      const data = await response.json();
      if (data.pronunciation && typeof data.pronunciation === 'string') {
        return data.pronunciation.trim();
      }
    }
  } catch (err) {
    console.warn('Pronounce API failed, generating phonetic offline...', err);
  }

  // Direct client fetch if custom key exists
  if (customKey) {
    try {
      const directRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
          model
        )}:generateContent?key=${encodeURIComponent(customKey)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: {
              parts: [
                {
                  text: 'Anda membantu pelajar Indonesia membaca kata Bahasa Inggris. Berikan hanya ejaan bunyi yang mudah dibaca orang Indonesia, tanpa tanda kutip, tanpa IPA, tanpa penjelasan. Contoh: watering can -> wotering ken.'
                }
              ]
            },
            contents: [{ role: 'user', parts: [{ text: `Buat cara baca: ${trimmed}` }] }],
            generationConfig: { temperature: 0.1, maxOutputTokens: 40 }
          })
        }
      );

      if (directRes.ok) {
        const data = await directRes.json();
        const pronunciation = String(
          data.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || '').join('') || ''
        )
          .replace(/["'`]/g, '')
          .trim();
        if (pronunciation) return pronunciation;
      }
    } catch {
      // ignore
    }
  }

  // High quality offline phonetic fallback (guaranteed to return readable Indonesian pronunciation)
  return toIndonesianPhonetic(trimmed);
}

// Generate example sentence
export async function generateExampleSentence(word: string): Promise<string> {
  const trimmed = word.trim();
  if (!trimmed) return '';

  const customKey = getCustomApiKey();
  const model = getSelectedModel();

  try {
    const response = await fetch('/api/gemini/sentence', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(customKey ? { 'x-gemini-api-key': customKey } : {})
      },
      body: JSON.stringify({ word: trimmed, model })
    });

    if (response.ok) {
      const data = await response.json();
      if (data.sentence) return data.sentence;
    }
  } catch {
    // ignore
  }

  // Smart natural offline example sentence fallback
  return `This is a useful ${trimmed}. (Ini adalah ${trimmed} yang berguna.)`;
}

// Detect objects in image
export async function detectObjectsInImage(
  imageBlob: Blob
): Promise<Array<{ english: string; indonesian: string; pronunciation: string }>> {
  const arrayBuffer = await imageBlob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64Data = btoa(binary);

  const customKey = getCustomApiKey();
  const model = getSelectedModel();

  try {
    const response = await fetch('/api/gemini/detect', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(customKey ? { 'x-gemini-api-key': customKey } : {})
      },
      body: JSON.stringify({ imageBase64: base64Data, model })
    });

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data.objects) && data.objects.length > 0) {
        return data.objects;
      }
    }
  } catch (err) {
    console.warn('AI detect failed, falling back to candidate items...', err);
  }

  // Graceful fallback suggestion set if image detection fails or has no API key
  return [
    { english: 'handle', indonesian: 'gagang / pegangan', pronunciation: 'hendel' },
    { english: 'lid', indonesian: 'tutup', pronunciation: 'lid' },
    { english: 'base', indonesian: 'bagian dasar / alas', pronunciation: 'beis' },
    { english: 'body', indonesian: 'bagian badan wadah', pronunciation: 'badi' }
  ];
}
