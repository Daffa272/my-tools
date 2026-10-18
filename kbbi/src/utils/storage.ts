import { KBBICard } from '../types';

export const STORAGE_KEY = 'kbbi_repetition_state_v1';

export const SAMPLE_CARDS: KBBICard[] = [
  {
    word: 'arkais',
    meaning: 'berhubungan dengan masa dahulu; kuno; tidak lazim dipakai lagi',
    example: 'Istilah arkais itu masih sering ditemukan dalam naskah sastra klasik Melayu.',
    note: 'Kata atau ungkapan kuno yang sudah jarang dituturkan dalam percakapan modern.',
    synonyms: ['kuno', 'kolot', 'baheula', 'antiquated'],
    antonyms: ['modern', 'kontemporer', 'mutakhir'],
    category: 'Sastra & Arkais',
    syllables: 'ar·ka·is',
    wordClass: 'a (Adjektiva)',
    etymology: 'Yunani / Melayu Klasik',
    repetition: 0,
    easiness: 2.5,
    interval: 0,
    nextReviewDate: new Date().toISOString()
  },
  {
    word: 'nirmala',
    meaning: 'tidak bernoda; suci; bersih; murni; tanpa cela',
    example: 'Masyarakat adat senantiasa menjaga keasrian hutan nirmala demi kelestarian mata air.',
    note: 'Sering digunakan dalam konteks puitis dan kesucian jiwa atau alam.',
    synonyms: ['suci', 'murni', 'bersih', 'bening'],
    antonyms: ['kotor', 'ternoda', 'cemar', 'najis'],
    category: 'Sastra & Arkais',
    syllables: 'nir·ma·la',
    wordClass: 'a (Adjektiva)',
    etymology: 'Sanskerta (nirmala)',
    repetition: 1,
    easiness: 2.6,
    interval: 2,
    nextReviewDate: new Date(Date.now() + 86400000 * 2).toISOString()
  },
  {
    word: 'saksama',
    meaning: 'teliti; cermat; tepat benar; tidak ada yang terlewat',
    example: 'Para peneliti forensik memeriksa bukti dokumen tersebut secara saksama di laboratorium.',
    note: 'Menunjukkan ketelitian tingkat tinggi dan kehati-hatian dalam pengerjaan.',
    synonyms: ['cermat', 'teliti', 'akurat', 'presisi'],
    antonyms: ['ceroboh', 'lalai', 'gegabah', 'sembrono'],
    category: 'Umum & Sehari-hari',
    syllables: 'sak·sa·ma',
    wordClass: 'a (Adjektiva)',
    etymology: 'Melayu Klasik',
    repetition: 2,
    easiness: 2.7,
    interval: 7,
    nextReviewDate: new Date(Date.now() + 86400000 * 7).toISOString()
  },
  {
    word: 'adrenalin',
    meaning: 'hormon yang memacu denyut jantung, tekanan darah, dan pernapasan saat tegang atau bersemangat',
    example: 'Menuruni jeram arung jeram yang deras memicu desakan adrenalin dalam tubuh.',
    note: 'Sering digunakan untuk menggambarkan sensasi kegembiraan atau ketegangan.',
    synonyms: ['epinefrin', 'stimulan'],
    antonyms: ['penenang', 'sedatif'],
    category: 'Sains & Alam',
    syllables: 'ad·re·na·lin',
    wordClass: 'n (Nomina)',
    etymology: 'Latin (ad renalis)',
    repetition: 4,
    easiness: 2.8,
    interval: 21,
    nextReviewDate: new Date(Date.now() + 86400000 * 21).toISOString()
  },
  {
    word: 'saujana',
    meaning: 'sejauh mata memandang; jarak pandang yang sangat luas dan membentang',
    example: 'Dari puncak bukit itu terbentang saujana hijau hamparan sawah dan perbukitan kapur.',
    note: 'Kata berbobot sastra untuk menggambarkan panorama pandangan alam luas.',
    synonyms: ['cakrawala', 'horizon', 'panorama', 'pandangan'],
    antonyms: ['sempit', 'terbatas'],
    category: 'Sastra & Arkais',
    syllables: 'sau·ja·na',
    wordClass: 'n (Nomina)',
    etymology: 'Sanskerta (sujana)',
    repetition: 0,
    easiness: 2.5,
    interval: 0,
    nextReviewDate: new Date().toISOString()
  }
];

export function loadCards(): KBBICard[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return SAMPLE_CARDS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return SAMPLE_CARDS;
  } catch (e) {
    console.error('Failed to parse saved cards:', e);
    return SAMPLE_CARDS;
  }
}

export function saveCards(cards: KBBICard[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
}

export function exportKBBIData(cards: KBBICard[]): void {
  const data = {
    app: 'kbbi',
    version: 3,
    exportedAt: new Date().toISOString(),
    cards
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `kbbi-backup-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Anki Import Format: TSV (Tab Separated Values)
 * Front: Word <br> <small>[Class, Etymology, Syllables]</small>
 * Back: Meaning <br> <i>Example</i> <br> Synonyms/Antonyms
 */
export function exportAnkiTSV(cards: KBBICard[]): void {
  const lines: string[] = [];
  
  cards.forEach(c => {
    const frontParts: string[] = [`<b>${c.word}</b>`];
    if (c.syllables) frontParts.push(`[${c.syllables}]`);
    if (c.wordClass) frontParts.push(`<i>${c.wordClass}</i>`);
    if (c.etymology) frontParts.push(`<small>(${c.etymology})</small>`);
    const front = frontParts.join(' ');

    const backParts: string[] = [c.meaning];
    if (c.example) backParts.push(`<br><i>Contoh: "${c.example}"</i>`);
    if (c.synonyms && c.synonyms.length > 0) backParts.push(`<br>Sinonim: ${c.synonyms.join(', ')}`);
    if (c.antonyms && c.antonyms.length > 0) backParts.push(`<br>Antonim: ${c.antonyms.join(', ')}`);
    const back = backParts.join('');

    lines.push(`${front.replace(/\t/g, ' ')}\t${back.replace(/\t/g, ' ')}`);
  });

  const content = lines.join('\n');
  const blob = new Blob([content], { type: 'text/tab-separated-values;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `kbbi-anki-deck-${new Date().toISOString().slice(0, 10)}.txt`;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Excel / Spreadsheet CSV Format (with UTF-8 BOM)
 */
export function exportSpreadsheetCSV(cards: KBBICard[]): void {
  const headers = [
    'Kata',
    'Kelas Kata',
    'Etimologi / Asal',
    'Suku Kata',
    'Kategori',
    'Arti KBBI',
    'Contoh Kalimat',
    'Catatan Makna',
    'Sinonim',
    'Antonim',
    'Repetisi',
    'Jadwal Review'
  ];

  const escapeCSV = (val: any) => {
    const s = String(val || '').replace(/"/g, '""');
    return `"${s}"`;
  };

  const rows = cards.map(c => [
    escapeCSV(c.word),
    escapeCSV(c.wordClass || '-'),
    escapeCSV(c.etymology || '-'),
    escapeCSV(c.syllables || '-'),
    escapeCSV(c.category || 'Umum & Sehari-hari'),
    escapeCSV(c.meaning),
    escapeCSV(c.example),
    escapeCSV(c.note || ''),
    escapeCSV((c.synonyms || []).join(', ')),
    escapeCSV((c.antonyms || []).join(', ')),
    escapeCSV(c.repetition),
    escapeCSV(c.nextReviewDate ? new Date(c.nextReviewDate).toLocaleDateString('id-ID') : 'Hari ini')
  ].join(','));

  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `kbbi-daftar-kata-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function parseImportFile(file: File): Promise<KBBICard[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        const rawCards = Array.isArray(data) ? data : data.cards;
        if (!Array.isArray(rawCards)) {
          throw new Error('Format backup JSON tidak valid.');
        }
        const validCards: KBBICard[] = rawCards
          .filter(c => c && typeof c === 'object' && typeof c.word === 'string' && c.word.trim().length > 0)
          .map(c => ({
            word: String(c.word).trim(),
            meaning: String(c.meaning || c.definition || '').trim(),
            example: String(c.example || '').trim(),
            note: String(c.note || c.translation || '').trim(),
            synonyms: Array.isArray(c.synonyms) ? c.synonyms : [],
            antonyms: Array.isArray(c.antonyms) ? c.antonyms : [],
            category: typeof c.category === 'string' ? c.category : undefined,
            syllables: typeof c.syllables === 'string' ? c.syllables : undefined,
            wordClass: typeof c.wordClass === 'string' ? c.wordClass : undefined,
            etymology: typeof c.etymology === 'string' ? c.etymology : undefined,
            repetition: typeof c.repetition === 'number' ? c.repetition : 0,
            easiness: typeof c.easiness === 'number' ? c.easiness : 2.5,
            interval: typeof c.interval === 'number' ? c.interval : 0,
            nextReviewDate: c.nextReviewDate || new Date().toISOString()
          }));
        
        if (validCards.length === 0) {
          throw new Error('Tidak ada kosa kata valid dalam file.');
        }
        resolve(validCards);
      } catch (err: any) {
        reject(new Error(err.message || 'Gagal membaca berkas JSON.'));
      }
    };
    reader.onerror = () => reject(new Error('Gagal membaca berkas.'));
    reader.readAsText(file);
  });
}
