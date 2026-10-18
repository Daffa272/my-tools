import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Keyboard,
  Volume2,
  Sparkles,
  Delete,
  CornerDownLeft,
  X,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Loader2,
  Languages,
  BookOpen,
  Info
} from 'lucide-react';
import { speakChineseVoice, convertPinyinToHanzi } from '../utils/gemini';

// Offline Pinyin to Hanzi Candidate Dictionary for instant response
const PINYIN_DICT: Record<string, { char: string; pinyin: string; meaning: string }[]> = {
  // Common multi-syllable phrases
  nihao: [
    { char: '你好', pinyin: 'nǐ hǎo', meaning: 'halo / apa kabar' },
    { char: '您好', pinyin: 'nín hǎo', meaning: 'halo (sopan)' }
  ],
  xiexie: [
    { char: '谢谢', pinyin: 'xièxie', meaning: 'terima kasih' },
    { char: '谢谢你', pinyin: 'xièxie nǐ', meaning: 'terima kasih padamu' }
  ],
  zaijian: [
    { char: '再见', pinyin: 'zàijiàn', meaning: 'sampai jumpa' }
  ],
  bukeqi: [
    { char: '不客气', pinyin: 'bú kèqi', meaning: 'sama-sama' }
  ],
  duibuqi: [
    { char: '对不起', pinyin: 'duìbuqǐ', meaning: 'maaf' }
  ],
  meiguanxi: [
    { char: '没关系', pinyin: 'méi guānxi', meaning: 'tidak apa-apa' }
  ],
  qingwen: [
    { char: '请问', pinyin: 'qǐngwèn', meaning: 'permisi tanya' }
  ],
  haode: [
    { char: '好的', pinyin: 'hǎo de', meaning: 'baiklah / OK' }
  ],
  women: [
    { char: '我们', pinyin: 'wǒmen', meaning: 'kami / kita' }
  ],
  nimen: [
    { char: '你们', pinyin: 'nǐmen', meaning: 'kalian' }
  ],
  tamen: [
    { char: '他们', pinyin: 'tāmen', meaning: 'mereka (laki-laki / umum)' },
    { char: '她们', pinyin: 'tāmen', meaning: 'mereka (perempuan)' }
  ],
  duoshao: [
    { char: '多少', pinyin: 'duōshao', meaning: 'berapa' }
  ],
  duoshaoqian: [
    { char: '多少钱', pinyin: 'duōshao qián', meaning: 'berapa harganya' }
  ],
  chifan: [
    { char: '吃饭', pinyin: 'chī fàn', meaning: 'makan nasi / bersantap' }
  ],
  kafei: [
    { char: '咖啡', pinyin: 'kāfēi', meaning: 'kopi' }
  ],
  naicha: [
    { char: '奶茶', pinyin: 'nǎichá', meaning: 'teh susu / milk tea' }
  ],
  maidan: [
    { char: '买单', pinyin: 'mǎidān', meaning: 'minta bon / bayar' }
  ],
  jiezhang: [
    { char: '结账', pinyin: 'jiézhàng', meaning: 'bayar tagihan' }
  ],
  cesuo: [
    { char: '厕所', pinyin: 'cèsuǒ', meaning: 'toilet' }
  ],
  xishoujian: [
    { char: '洗手间', pinyin: 'xǐshǒujiān', meaning: 'kamar kecil / toilet' }
  ],
  ditie: [
    { char: '地铁', pinyin: 'dìtiě', meaning: 'MRT / kereta bawah tanah' }
  ],
  ditiezhan: [
    { char: '地铁站', pinyin: 'dìtiězhàn', meaning: 'stasiun MRT' }
  ],
  feijichang: [
    { char: '飞机场', pinyin: 'fēijīchǎng', meaning: 'bandara' }
  ],
  jintian: [
    { char: '今天', pinyin: 'jīntiān', meaning: 'hari ini' }
  ],
  mingtian: [
    { char: '明天', pinyin: 'míngtiān', meaning: 'besok' }
  ],
  zuotian: [
    { char: '昨天', pinyin: 'zuótiān', meaning: 'kemarin' }
  ],
  xianzai: [
    { char: '现在', pinyin: 'xiànzài', meaning: 'sekarang' }
  ],
  zhongwen: [
    { char: '中文', pinyin: 'zhōngwén', meaning: 'bahasa Mandarin' }
  ],
  hanyu: [
    { char: '汉语', pinyin: 'hànyǔ', meaning: 'bahasa Han / Mandarin' }
  ],
  zhongguo: [
    { char: '中国', pinyin: 'zhōngguó', meaning: 'Tiongkok' }
  ],
  laoshi: [
    { char: '老师', pinyin: 'lǎoshī', meaning: 'guru / pengajar' }
  ],
  pengyou: [
    { char: '朋友', pinyin: 'péngyou', meaning: 'teman / kawan' }
  ],
  xuexi: [
    { char: '学习', pinyin: 'xuéxí', meaning: 'belajar' }
  ],
  xihuan: [
    { char: '喜欢', pinyin: 'xǐhuan', meaning: 'suka' }
  ],
  keyi: [
    { char: '可以', pinyin: 'kěyǐ', meaning: 'boleh / bisa' }
  ],
  meiyou: [
    { char: '没有', pinyin: 'méiyǒu', meaning: 'tidak ada / belum' }
  ],
  bushi: [
    { char: '不是', pinyin: 'bú shì', meaning: 'bukan' }
  ],
  zenme: [
    { char: '怎么', pinyin: 'zěnme', meaning: 'bagaimana' }
  ],
  shenme: [
    { char: '什么', pinyin: 'shénme', meaning: 'apa' }
  ],
  weishénme: [
    { char: '为什么', pinyin: 'wèishénme', meaning: 'mengapa' }
  ],
  zheli: [
    { char: '这里', pinyin: 'zhèlǐ', meaning: 'di sini' },
    { char: '这儿', pinyin: 'zhèr', meaning: 'sini' }
  ],
  nali: [
    { char: '那里', pinyin: 'nàli', meaning: 'di sana' },
    { char: '哪里', pinyin: 'nǎli', meaning: 'di mana?' }
  ],
  mingbai: [
    { char: '明白', pinyin: 'míngbai', meaning: 'mengerti / paham' }
  ],
  zhidao: [
    { char: '知道', pinyin: 'zhīdào', meaning: 'tahu' }
  ],
  buhaoyisi: [
    { char: '不好意思', pinyin: 'bù hǎoyìsi', meaning: 'maaf / merasa tidak enak' }
  ],
  piaoliang: [
    { char: '漂亮', pinyin: 'piàoliang', meaning: 'cantik / indah' }
  ],
  gaoxing: [
    { char: '高兴', pinyin: 'gāoxìng', meaning: 'senang / gembira' }
  ],
  renshi: [
    { char: '认识', pinyin: 'rènshi', meaning: 'mengenal / kenal' }
  ],
  kuai: [
    { char: '块', pinyin: 'kuài', meaning: 'satuan uang Yuan / potong' },
    { char: '快', pinyin: 'kuài', meaning: 'cepat' },
    { char: '快乐', pinyin: 'kuàilè', meaning: 'bahagia / gembira' }
  ],

  // Single common syllables
  ni: [
    { char: '你', pinyin: 'nǐ', meaning: 'kamu' },
    { char: '您', pinyin: 'nín', meaning: 'Anda (hormat)' },
    { char: '呢', pinyin: 'ne', meaning: 'partikel tanya / bagaimana dengan' },
    { char: '泥', pinyin: 'ní', meaning: 'lumpur' }
  ],
  hao: [
    { char: '好', pinyin: 'hǎo', meaning: 'baik / bagus' },
    { char: '号', pinyin: 'hào', meaning: 'nomor / tanggal' },
    { char: '毫', pinyin: 'háo', meaning: 'sedikit' }
  ],
  wo: [
    { char: '我', pinyin: 'wǒ', meaning: 'saya / aku' },
    { char: '握', pinyin: 'wò', meaning: 'menggenggam' }
  ],
  ta: [
    { char: '他', pinyin: 'tā', meaning: 'dia (laki-laki)' },
    { char: '她', pinyin: 'tā', meaning: 'dia (perempuan)' },
    { char: '它', pinyin: 'tā', meaning: 'dia (benda/hewan)' },
    { char: '太', pinyin: 'tài', meaning: 'terlalu' }
  ],
  shi: [
    { char: '是', pinyin: 'shì', meaning: 'adalah / ya / benar' },
    { char: '十', pinyin: 'shí', meaning: 'sepuluh' },
    { char: '时', pinyin: 'shí', meaning: 'waktu / jam' },
    { char: '事', pinyin: 'shì', meaning: 'urusan / masalah' },
    { char: '市', pinyin: 'shì', meaning: 'kota / pasar' }
  ],
  bu: [
    { char: '不', pinyin: 'bù', meaning: 'tidak / bukan' },
    { char: '步', pinyin: 'bù', meaning: 'langkah' }
  ],
  you: [
    { char: '有', pinyin: 'yǒu', meaning: 'ada / punya' },
    { char: '友', pinyin: 'yǒu', meaning: 'teman' },
    { char: '又', pinyin: 'yòu', meaning: 'lagi' },
    { char: '右', pinyin: 'yòu', meaning: 'kanan' }
  ],
  zai: [
    { char: '在', pinyin: 'zài', meaning: 'di / sedang' },
    { char: '再', pinyin: 'zài', meaning: 'lagi / kemudian' }
  ],
  chi: [
    { char: '吃', pinyin: 'chī', meaning: 'makan' },
    { char: '迟', pinyin: 'chí', meaning: 'terlambat' }
  ],
  he: [
    { char: '喝', pinyin: 'hē', meaning: 'minum' },
    { char: '和', pinyin: 'hé', meaning: 'dan / bersama' },
    { char: '盒', pinyin: 'hé', meaning: 'kotak' }
  ],
  shui: [
    { char: '水', pinyin: 'shuǐ', meaning: 'air' },
    { char: '谁', pinyin: 'shéi', meaning: 'siapa' },
    { char: '睡', pinyin: 'shuì', meaning: 'tidur' }
  ],
  cha: [
    { char: '茶', pinyin: 'chá', meaning: 'teh' },
    { char: '差', pinyin: 'chà', meaning: 'kurang / buruk' }
  ],
  fan: [
    { char: '饭', pinyin: 'fàn', meaning: 'nasi / makanan' },
    { char: '反', pinyin: 'fǎn', meaning: 'berlawanan' }
  ],
  qian: [
    { char: '钱', pinyin: 'qián', meaning: 'uang' },
    { char: '前', pinyin: 'qián', meaning: 'depan / sebelum' },
    { char: '千', pinyin: 'qiān', meaning: 'seribu' }
  ],
  duo: [
    { char: '多', pinyin: 'duō', meaning: 'banyak / berapa' }
  ],
  shao: [
    { char: '少', pinyin: 'shǎo', meaning: 'sedikit' }
  ],
  da: [
    { char: '大', pinyin: 'dà', meaning: 'besar' }
  ],
  xiao: [
    { char: '小', pinyin: 'xiǎo', meaning: 'kecil' }
  ],
  gui: [
    { char: '贵', pinyin: 'guì', meaning: 'mahal / terhormat' }
  ],
  pian: [
    { char: '便宜', pinyin: 'piányi', meaning: 'murah' },
    { char: '片', pinyin: 'piàn', meaning: 'potongan / lembar' }
  ],
  qu: [
    { char: '去', pinyin: 'qù', meaning: 'pergi' }
  ],
  lai: [
    { char: '来', pinyin: 'lái', meaning: 'datang' }
  ],
  kan: [
    { char: '看', pinyin: 'kàn', meaning: 'melihat / membaca' }
  ],
  ting: [
    { char: '听', pinyin: 'tīng', meaning: 'mendengar' }
  ],
  shuo: [
    { char: '说', pinyin: 'shuō', meaning: 'berbicara / berkata' }
  ],
  xie: [
    { char: '写', pinyin: 'xiě', meaning: 'menulis' },
    { char: '些', pinyin: 'xiē', meaning: 'beberapa' },
    { char: '谢', pinyin: 'xiè', meaning: 'berterima kasih' }
  ],
  mai: [
    { char: '买', pinyin: 'mǎi', meaning: 'membeli' },
    { char: '卖', pinyin: 'mài', meaning: 'menjual' }
  ],
  xiang: [
    { char: '想', pinyin: 'xiǎng', meaning: 'ingin / rindu / berpikir' }
  ],
  yao: [
    { char: '要', pinyin: 'yào', meaning: 'mau / harus' }
  ],
  hui: [
    { char: '会', pinyin: 'huì', meaning: 'bisa / rapat' },
    { char: '回', pinyin: 'huí', meaning: 'kembali' }
  ],
  yi: [
    { char: '一', pinyin: 'yī', meaning: 'satu' },
    { char: '已', pinyin: 'yǐ', meaning: 'sudah' }
  ],
  er: [
    { char: '二', pinyin: 'èr', meaning: 'dua' },
    { char: '儿', pinyin: 'ér', meaning: 'anak' }
  ],
  san: [
    { char: '三', pinyin: 'sān', meaning: 'tiga' }
  ],
  si: [
    { char: '四', pinyin: 'sì', meaning: 'empat' }
  ],
  wu: [
    { char: '五', pinyin: 'wǔ', meaning: 'lima' }
  ],
  liu: [
    { char: '六', pinyin: 'liù', meaning: 'enam' }
  ],
  qi: [
    { char: '七', pinyin: 'qī', meaning: 'tujuh' },
    { char: '起', pinyin: 'qǐ', meaning: 'bangun / mulai' }
  ],
  ba: [
    { char: '八', pinyin: 'bā', meaning: 'delapan' },
    { char: '吧', pinyin: 'ba', meaning: 'partikel ajakan/saran' }
  ],
  jiu: [
    { char: '九', pinyin: 'jiǔ', meaning: 'sembilan' },
    { char: '就', pinyin: 'jiù', meaning: 'langsung / maka' },
    { char: '酒', pinyin: 'jiǔ', meaning: 'minuman keras / arak' }
  ],
  dian: [
    { char: '点', pinyin: 'diǎn', meaning: 'titik / jam / pesan' }
  ],
  fen: [
    { char: '分', pinyin: 'fēn', meaning: 'menit / bagi' }
  ],
  ge: [
    { char: '个', pinyin: 'gè', meaning: 'satuan buah/orang' }
  ],
  bei: [
    { char: '杯', pinyin: 'bēi', meaning: 'gelas / cangkir' }
  ],
  ping: [
    { char: '瓶', pinyin: 'píng', meaning: 'botol' }
  ],
  hen: [
    { char: '很', pinyin: 'hěn', meaning: 'sangat' }
  ],
  ma: [
    { char: '吗', pinyin: 'ma', meaning: 'partikel tanya apakah' },
    { char: '妈', pinyin: 'mā', meaning: 'ibu' }
  ],
  de: [
    { char: '的', pinyin: 'de', meaning: 'kepemilikan / penjelas' },
    { char: '得', pinyin: 'de', meaning: 'tingkat capai' }
  ],
  le: [
    { char: '了', pinyin: 'le', meaning: 'partikel sudah terjadi' }
  ]
};

// Common categorized phrases
const COMMON_CATEGORIES = [
  {
    id: 'greetings',
    name: 'Salam & Sopan',
    chineseName: '问候礼貌',
    items: [
      { hanzi: '你好！', pinyin: 'Nǐ hǎo!', meaning: 'Halo!' },
      { hanzi: '早上好！', pinyin: 'Zǎoshang hǎo!', meaning: 'Selamat pagi!' },
      { hanzi: '晚上好！', pinyin: 'Wǎnshang hǎo!', meaning: 'Selamat malam!' },
      { hanzi: '谢谢你！', pinyin: 'Xièxie nǐ!', meaning: 'Terima kasih!' },
      { hanzi: '不客气！', pinyin: 'Bú kèqi!', meaning: 'Sama-sama!' },
      { hanzi: '对不起。', pinyin: 'Duìbuqǐ.', meaning: 'Maaf.' },
      { hanzi: '没关系。', pinyin: 'Méi guānxi.', meaning: 'Tidak apa-apa.' },
      { hanzi: '请问一下...', pinyin: 'Qǐngwèn yíxià...', meaning: 'Permisi tanya sebentar...' },
      { hanzi: '再见！', pinyin: 'Zàijiàn!', meaning: 'Sampai jumpa!' },
      { hanzi: '辛苦了！', pinyin: 'Xīnkǔ le!', meaning: 'Terima kasih atas kerja kerasnya!' }
    ]
  },
  {
    id: 'questions',
    name: 'Pertanyaan',
    chineseName: '实用疑问',
    items: [
      { hanzi: '这个多少钱？', pinyin: 'Zhège duōshao qián?', meaning: 'Berapa harga barang ini?' },
      { hanzi: '洗手间在哪里？', pinyin: 'Xǐshǒujiān zài nǎlǐ?', meaning: 'Di mana toiletnya?' },
      { hanzi: '怎么走？', pinyin: 'Zěnme zǒu?', meaning: 'Bagaimana arah jalannya?' },
      { hanzi: '可以吗？', pinyin: 'Kěyǐ ma?', meaning: 'Bolehkah?' },
      { hanzi: '为什么？', pinyin: 'Wèishénme?', meaning: 'Mengapa / Kenapa?' },
      { hanzi: '这是什么？', pinyin: 'Zhè shì shénme?', meaning: 'Apa ini?' },
      { hanzi: '你会说英语吗？', pinyin: 'Nǐ huì shuō yīngyǔ ma?', meaning: 'Apakah kamu bisa bahasa Inggris?' },
      { hanzi: '什么时候开始？', pinyin: 'Shénme shíhou kāishǐ?', meaning: 'Kapan mulai?' }
    ]
  },
  {
    id: 'dining',
    name: 'Kuliner & Belanja',
    chineseName: '美食购物',
    items: [
      { hanzi: '买单！', pinyin: 'Mǎidān!', meaning: 'Minta bon!' },
      { hanzi: '我要一杯奶茶。', pinyin: 'Wǒ yào yì bēi nǎichá.', meaning: 'Saya mau segelas milk tea.' },
      { hanzi: '一杯冰水，谢谢。', pinyin: 'Yì bēi bīng shuǐ, xièxie.', meaning: 'Segelas air es, terima kasih.' },
      { hanzi: '不要太辣。', pinyin: 'Bú yào tài là.', meaning: 'Jangan terlalu pedas.' },
      { hanzi: '可以便宜一点吗？', pinyin: 'Kěyǐ piányi yìdiǎn ma?', meaning: 'Boleh minta diskon sedikit?' },
      { hanzi: '打包带走。', pinyin: 'Dǎbāo dàizǒu.', meaning: 'Bungkus bawa pulang.' },
      { hanzi: '太贵了！', pinyin: 'Tài guì le!', meaning: 'Terlalu mahal!' },
      { hanzi: '很好吃！', pinyin: 'Hěn hǎochī!', meaning: 'Sangat enak!' }
    ]
  },
  {
    id: 'responses',
    name: 'Tanggapan & Afirmasi',
    chineseName: '日常回应',
    items: [
      { hanzi: '好的，没问题！', pinyin: 'Hǎo de, méi wèntí!', meaning: 'Baiklah, tidak ada masalah!' },
      { hanzi: '是的。', pinyin: 'Shì de.', meaning: 'Ya / Betul.' },
      { hanzi: '不是。', pinyin: 'Bú shì.', meaning: 'Bukan.' },
      { hanzi: '我明白了。', pinyin: 'Wǒ míngbai le.', meaning: 'Saya mengerti.' },
      { hanzi: '我不知道。', pinyin: 'Wǒ bù zhīdào.', meaning: 'Saya tidak tahu.' },
      { hanzi: '很高兴认识你！', pinyin: 'Hěn gāoxìng rènshi nǐ!', meaning: 'Senang berkenalan denganmu!' },
      { hanzi: '我也觉得。', pinyin: 'Wǒ yě juéde.', meaning: 'Saya juga merasa begitu.' },
      { hanzi: '加油！', pinyin: 'Jiāyóu!', meaning: 'Semangat!' }
    ]
  }
];

// Pinyin Vowels with Tones
export interface VowelToneItem {
  char: string;
  toneNum: number;
  toneName: string;
  desc: string;
  mark: string;
}

export interface VowelToneGroup {
  letter: string;
  display: string;
  tones: VowelToneItem[];
}

export const VOWEL_TONE_MAP: Record<string, VowelToneGroup> = {
  a: {
    letter: 'a',
    display: 'A',
    tones: [
      { char: 'ā', toneNum: 1, toneName: 'Nada 1 (Datar)', desc: 'Tinggi rata (55)', mark: 'ˉ' },
      { char: 'á', toneNum: 2, toneName: 'Nada 2 (Naik)', desc: 'Menaik (35)', mark: 'ˊ' },
      { char: 'ǎ', toneNum: 3, toneName: 'Nada 3 (Lekuk)', desc: 'Turun-naik (214)', mark: 'ˇ' },
      { char: 'à', toneNum: 4, toneName: 'Nada 4 (Turun)', desc: 'Turun tajam (51)', mark: 'ˋ' },
      { char: 'a', toneNum: 5, toneName: 'Netral', desc: 'Ringan & pendek', mark: '·' },
    ]
  },
  e: {
    letter: 'e',
    display: 'E',
    tones: [
      { char: 'ē', toneNum: 1, toneName: 'Nada 1 (Datar)', desc: 'Tinggi rata (55)', mark: 'ˉ' },
      { char: 'é', toneNum: 2, toneName: 'Nada 2 (Naik)', desc: 'Menaik (35)', mark: 'ˊ' },
      { char: 'ě', toneNum: 3, toneName: 'Nada 3 (Lekuk)', desc: 'Turun-naik (214)', mark: 'ˇ' },
      { char: 'è', toneNum: 4, toneName: 'Nada 4 (Turun)', desc: 'Turun tajam (51)', mark: 'ˋ' },
      { char: 'e', toneNum: 5, toneName: 'Netral', desc: 'Ringan & pendek', mark: '·' },
    ]
  },
  i: {
    letter: 'i',
    display: 'I',
    tones: [
      { char: 'ī', toneNum: 1, toneName: 'Nada 1 (Datar)', desc: 'Tinggi rata (55)', mark: 'ˉ' },
      { char: 'í', toneNum: 2, toneName: 'Nada 2 (Naik)', desc: 'Menaik (35)', mark: 'ˊ' },
      { char: 'ǐ', toneNum: 3, toneName: 'Nada 3 (Lekuk)', desc: 'Turun-naik (214)', mark: 'ˇ' },
      { char: 'ì', toneNum: 4, toneName: 'Nada 4 (Turun)', desc: 'Turun tajam (51)', mark: 'ˋ' },
      { char: 'i', toneNum: 5, toneName: 'Netral', desc: 'Ringan & pendek', mark: '·' },
    ]
  },
  o: {
    letter: 'o',
    display: 'O',
    tones: [
      { char: 'ō', toneNum: 1, toneName: 'Nada 1 (Datar)', desc: 'Tinggi rata (55)', mark: 'ˉ' },
      { char: 'ó', toneNum: 2, toneName: 'Nada 2 (Naik)', desc: 'Menaik (35)', mark: 'ˊ' },
      { char: 'ǒ', toneNum: 3, toneName: 'Nada 3 (Lekuk)', desc: 'Turun-naik (214)', mark: 'ˇ' },
      { char: 'ò', toneNum: 4, toneName: 'Nada 4 (Turun)', desc: 'Turun tajam (51)', mark: 'ˋ' },
      { char: 'o', toneNum: 5, toneName: 'Netral', desc: 'Ringan & pendek', mark: '·' },
    ]
  },
  u: {
    letter: 'u',
    display: 'U',
    tones: [
      { char: 'ū', toneNum: 1, toneName: 'Nada 1 (Datar)', desc: 'Tinggi rata (55)', mark: 'ˉ' },
      { char: 'ú', toneNum: 2, toneName: 'Nada 2 (Naik)', desc: 'Menaik (35)', mark: 'ˊ' },
      { char: 'ǔ', toneNum: 3, toneName: 'Nada 3 (Lekuk)', desc: 'Turun-naik (214)', mark: 'ˇ' },
      { char: 'ù', toneNum: 4, toneName: 'Nada 4 (Turun)', desc: 'Turun tajam (51)', mark: 'ˋ' },
      { char: 'u', toneNum: 5, toneName: 'Netral', desc: 'Ringan & pendek', mark: '·' },
    ]
  },
  v: {
    letter: 'v',
    display: 'Ü / V',
    tones: [
      { char: 'ǖ', toneNum: 1, toneName: 'Nada 1 (Datar)', desc: 'Tinggi rata (55)', mark: 'ˉ' },
      { char: 'ǘ', toneNum: 2, toneName: 'Nada 2 (Naik)', desc: 'Menaik (35)', mark: 'ˊ' },
      { char: 'ǚ', toneNum: 3, toneName: 'Nada 3 (Lekuk)', desc: 'Turun-naik (214)', mark: 'ˇ' },
      { char: 'ǜ', toneNum: 4, toneName: 'Nada 4 (Turun)', desc: 'Turun tajam (51)', mark: 'ˋ' },
      { char: 'ü', toneNum: 5, toneName: 'Netral', desc: 'Ringan & pendek', mark: '·' },
    ]
  }
};

const PINYIN_TONES = [
  { label: 'Tone 1 (ˉ Datar)', vowels: ['ā', 'ō', 'ē', 'ī', 'ū', 'ǖ'] },
  { label: 'Tone 2 (ˊ Naik)', vowels: ['á', 'ó', 'é', 'í', 'ú', 'ǘ'] },
  { label: 'Tone 3 (ˇ Turun-Naik)', vowels: ['ǎ', 'ǒ', 'ě', 'ǐ', 'ǔ', 'ǚ'] },
  { label: 'Tone 4 (ˋ Turun Tegas)', vowels: ['à', 'ò', 'è', 'ì', 'ù', 'ǜ'] },
  { label: 'Netral & Khusus', vowels: ['a', 'o', 'e', 'i', 'u', 'ü', 'r', 'er', 'ér', 'èr'] }
];

// Common HSK High-frequency Characters
const HSK_CHARACTERS = [
  { group: 'Kata Ganti', chars: ['我', '你', '您', '他', '她', '它', '我们', '你们', '他们', '大家', '这', '那'] },
  { group: 'Kata Kerja', chars: ['是', '有', '在', '去', '来', '吃', '喝', '看', '听', '说', '写', '买', '想', '要', '会', '做', '喜欢', '认识', '知道', '工作'] },
  { group: 'Waktu & Tempat', chars: ['今天', '明天', '昨天', '现在', '年', '月', '日', '点', '分', '家', '学校', '饭店', '商店', '北京', '中国'] },
  { group: 'Angka & Satuan', chars: ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '百', '千', '万', '两', '个', '块', '杯', '瓶', '本'] },
  { group: 'Sifat & Lainnya', chars: ['好', '大', '小', '多', '少', '贵', '冷', '热', '高', '漂亮', '高兴', '很', '太', '不', '没', '吗', '呢', '了', '的'] }
];

interface ChineseVirtualKeyboardProps {
  currentText: string;
  onInsertText: (inserted: string) => void;
  onBackspace: () => void;
  onClear: () => void;
  onClose?: () => void;
  hasApiKey?: boolean;
  onShowToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const ChineseVirtualKeyboard: React.FC<ChineseVirtualKeyboardProps> = ({
  currentText,
  onInsertText,
  onBackspace,
  onClear,
  onClose,
  hasApiKey = false,
  onShowToast
}) => {
  const [activeTab, setActiveTab] = useState<'ime' | 'tones' | 'phrases' | 'hanzi' | 'help'>('ime');
  const [pinyinBuffer, setPinyinBuffer] = useState('');
  const [activePhraseCat, setActivePhraseCat] = useState('greetings');
  const [copied, setCopied] = useState(false);
  const [isConvertingAi, setIsConvertingAi] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  // Tone Picker state for long-press or direct vowel tone selection
  const [activeToneKey, setActiveToneKey] = useState<string | null>(null);
  const [toneInsertTarget, setToneInsertTarget] = useState<'chat' | 'buffer'>('chat');
  const pressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef<boolean>(false);

  const handleSelectTone = (toneChar: string) => {
    if (toneInsertTarget === 'buffer') {
      setPinyinBuffer(prev => prev + toneChar);
      onShowToast?.(`Disisipkan '${toneChar}' ke buffer Pinyin`, 'success');
    } else {
      onInsertText(toneChar);
      onShowToast?.(`Disisipkan '${toneChar}' ke teks obrolan`, 'success');
    }
    setActiveToneKey(null);
  };

  // Listen for 1-5 number keys or Escape when Tone Picker modal/popover is active
  useEffect(() => {
    if (!activeToneKey) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveToneKey(null);
      } else if (['1', '2', '3', '4', '5'].includes(e.key)) {
        const idx = parseInt(e.key, 10) - 1;
        const group = VOWEL_TONE_MAP[activeToneKey];
        if (group && group.tones[idx]) {
          handleSelectTone(group.tones[idx].char);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeToneKey, toneInsertTarget]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (pressTimerRef.current) {
        clearTimeout(pressTimerRef.current);
      }
    };
  }, []);

  // Pointer event handlers for long-press on keys
  const handleKeyPointerDown = (k: string) => {
    if (VOWEL_TONE_MAP[k]) {
      isLongPressRef.current = false;
      if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
      pressTimerRef.current = setTimeout(() => {
        isLongPressRef.current = true;
        setActiveToneKey(k);
        if (window.navigator?.vibrate) {
          try { window.navigator.vibrate(20); } catch {}
        }
      }, 260);
    }
  };

  const handleKeyPointerUp = (k: string) => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
    if (!isLongPressRef.current) {
      handleTypeLetter(k);
    }
  };

  const handleKeyPointerLeave = () => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
  };

  const handleKeyContextMenu = (e: React.MouseEvent, k: string) => {
    if (VOWEL_TONE_MAP[k]) {
      e.preventDefault();
      setActiveToneKey(k);
    }
  };

  // Compute IME Candidates based on pinyinBuffer
  const candidates = useMemo(() => {
    if (!pinyinBuffer) return [];
    const cleanKey = pinyinBuffer.toLowerCase().replace(/[^a-z]/g, '');
    if (!cleanKey) return [];

    // Exact match
    if (PINYIN_DICT[cleanKey]) {
      return PINYIN_DICT[cleanKey];
    }

    // Prefix match
    const matches: { char: string; pinyin: string; meaning: string }[] = [];
    for (const [key, list] of Object.entries(PINYIN_DICT)) {
      if (key.startsWith(cleanKey)) {
        for (const item of list) {
          if (!matches.some(m => m.char === item.char)) {
            matches.push(item);
          }
        }
      }
      if (matches.length >= 8) break;
    }

    return matches;
  }, [pinyinBuffer]);

  // Handle selecting candidate
  const handleSelectCandidate = (item: { char: string; pinyin?: string }) => {
    onInsertText(item.char);
    setPinyinBuffer('');
  };

  // Virtual typing of pinyin letter
  const handleTypeLetter = (letter: string) => {
    setPinyinBuffer(prev => prev + letter);
  };

  // Backspace in buffer or main
  const handleBufferBackspace = () => {
    if (pinyinBuffer.length > 0) {
      setPinyinBuffer(prev => prev.slice(0, -1));
    } else {
      onBackspace();
    }
  };

  // Space commits candidate 1 or inserts space
  const handleSpace = () => {
    if (candidates.length > 0) {
      handleSelectCandidate(candidates[0]);
    } else if (pinyinBuffer) {
      onInsertText(pinyinBuffer + ' ');
      setPinyinBuffer('');
    } else {
      onInsertText(' ');
    }
  };

  // Handle AI Pinyin to Hanzi conversion
  const handleAiConvert = async () => {
    const textToConvert = pinyinBuffer || currentText;
    if (!textToConvert.trim()) {
      onShowToast?.('Ketik pinyin atau kalimat terlebih dahulu untuk dikonversi ke Hanzi.', 'info');
      return;
    }

    setIsConvertingAi(true);
    try {
      const res = await convertPinyinToHanzi(textToConvert);
      if (res.hanzi) {
        if (pinyinBuffer) {
          onInsertText(res.hanzi);
          setPinyinBuffer('');
        } else {
          onClear();
          onInsertText(res.hanzi);
        }
        onShowToast?.(`Berhasil dikonversi: ${res.hanzi} (${res.pinyin})`, 'success');
      }
    } catch (err: unknown) {
      onShowToast?.(err instanceof Error ? err.message : 'Gagal mengonversi pinyin dengan AI.', 'error');
    } finally {
      setIsConvertingAi(false);
    }
  };

  const handleCopy = () => {
    if (!currentText) return;
    navigator.clipboard.writeText(currentText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onShowToast?.('Teks Mandarin berhasil disalin ke clipboard.', 'success');
  };

  const playVoice = (text: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    speakChineseVoice(text, { voiceGender: 'female', rate: 0.88 });
  };

  // Keyboard Rows for IME QWERTY
  const row1 = ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'];
  const row2 = ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'];
  const row3 = ['z', 'x', 'c', 'v', 'b', 'n', 'm'];

  // Render an individual QWERTY key with long-press & tone badge support
  const renderKeyButton = (k: string) => {
    const hasTones = !!VOWEL_TONE_MAP[k];
    const isToneActive = activeToneKey === k;
    const sampleTone = hasTones ? VOWEL_TONE_MAP[k].tones[0].char : null;

    return (
      <div key={k} className="relative">
        <button
          type="button"
          onMouseDown={() => handleKeyPointerDown(k)}
          onMouseUp={() => handleKeyPointerUp(k)}
          onMouseLeave={handleKeyPointerLeave}
          onTouchStart={() => handleKeyPointerDown(k)}
          onTouchEnd={() => handleKeyPointerUp(k)}
          onContextMenu={(e) => handleKeyContextMenu(e, k)}
          className={`relative w-8 sm:w-10 h-10 sm:h-11 rounded-xl font-mono text-sm sm:text-base font-semibold border transition-all active:scale-95 shadow-2xs flex items-center justify-center group ${
            isToneActive
              ? 'bg-rose-600 border-rose-400 text-white shadow-md shadow-rose-600/30 ring-2 ring-rose-400/50'
              : hasTones
              ? 'bg-slate-800 hover:bg-slate-700/90 active:bg-rose-600 border-slate-700 text-slate-100 hover:border-rose-500/70'
              : 'bg-slate-800 hover:bg-slate-700 active:bg-rose-600 border-slate-700/80 text-slate-100'
          }`}
          title={
            hasTones
              ? `Huruf ${k.toUpperCase()} (Tahan lama atau klik badge nada untuk memilih 4 bentuk nada: ${VOWEL_TONE_MAP[k].tones.map(t => t.char).join(' ')})`
              : `Huruf ${k.toUpperCase()}`
          }
        >
          <span>{k}</span>

          {/* Vowel tone badge indicator in top right */}
          {hasTones && sampleTone && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                setActiveToneKey(activeToneKey === k ? null : k);
              }}
              className="absolute -top-1 -right-1 px-1 py-0.2 rounded-md bg-rose-950/90 text-rose-300 group-hover:bg-rose-600 group-hover:text-white border border-rose-700 text-[9px] font-bold leading-none cursor-pointer transition-colors shadow-2xs"
              title={`Klik untuk buka opsi 4 nada (${VOWEL_TONE_MAP[k].tones.map(t => t.char).join(' ')})`}
            >
              {sampleTone}
            </span>
          )}
        </button>
      </div>
    );
  };

  return (
    <div className="bg-slate-900 text-white rounded-2xl border border-slate-700 shadow-2xl overflow-hidden transition-all duration-200">
      {/* Top Header Bar */}
      <div className="px-4 py-2.5 bg-slate-950 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-rose-600/30 border border-rose-500/40 text-rose-400 flex items-center justify-center">
            <Keyboard className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-semibold tracking-wide text-slate-100 flex items-center gap-1.5">
            <span>Keyboard Mandarin (中文键盘 & 拼音 IME)</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] bg-rose-950 border border-rose-800 text-rose-300 font-medium">
              Putonghua
            </span>
          </span>
        </div>

        <div className="flex items-center gap-1 text-xs">
          {currentText && (
            <button
              type="button"
              onClick={handleCopy}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              title="Salin teks yang sudah diketik"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            title={isMinimized ? 'Perluas Keyboard' : 'Kecilkan Keyboard'}
          >
            {isMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
              title="Tutup Keyboard"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Sub Navigation Tabs */}
          <div className="flex items-center gap-1 px-3 py-1.5 bg-slate-900 border-b border-slate-800 text-xs overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('ime')}
              className={`px-3 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'ime'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <span>拼音 IME (Ketik & Pilih Hanzi)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('tones')}
              className={`px-3 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'tones'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <span>声调 Nada (ā á ǎ à)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('phrases')}
              className={`px-3 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'phrases'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <BookOpen className="w-3 h-3" />
              <span>Frasa Cepat (常用短句)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('hanzi')}
              className={`px-3 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'hanzi'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <span>Hanzi HSK Populer (字表)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('help')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1 whitespace-nowrap ${
                activeTab === 'help'
                  ? 'bg-slate-700 text-slate-100 shadow-xs'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Panduan Keyboard OS"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Tips OS</span>
            </button>
          </div>

          {/* TAB 1: PINYIN IME */}
          {activeTab === 'ime' && (
            <div className="p-3 space-y-2.5 bg-slate-900/95">
              {/* Pinyin Buffer & Candidate Strip */}
              <div className="bg-slate-950 p-2 rounded-xl border border-slate-800 flex items-center justify-between gap-2 min-h-[46px]">
                <div className="flex items-center gap-2 overflow-x-auto flex-1">
                  {pinyinBuffer ? (
                    <div className="flex items-center gap-1.5 bg-rose-950/80 border border-rose-800/80 px-2 py-0.5 rounded-lg shrink-0">
                      <span className="text-[10px] text-rose-400 uppercase font-mono">Pinyin:</span>
                      <span className="font-mono text-sm font-bold text-rose-200">{pinyinBuffer}</span>
                      <button
                        type="button"
                        onClick={() => setPinyinBuffer('')}
                        className="text-slate-400 hover:text-rose-300 ml-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-500 italic">
                      Ketik huruf pinyin di bawah atau keyboard fisik kamu (contoh: "nihao", "xiexie", "wo", "kafei")...
                    </span>
                  )}

                  {/* Candidate List */}
                  {candidates.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectCandidate(item)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-rose-900/80 hover:border-rose-500 border border-slate-700 rounded-lg text-xs flex items-center gap-1.5 transition-colors shrink-0 shadow-2xs group"
                    >
                      <span className="text-[10px] text-rose-400 font-mono font-bold">{idx + 1}.</span>
                      <span className="font-bold text-slate-100 text-sm group-hover:text-rose-200 font-serif">
                        {item.char}
                      </span>
                      {item.pinyin && (
                        <span className="text-[10px] text-slate-400">({item.pinyin})</span>
                      )}
                      <span className="text-[10px] text-slate-500 hidden sm:inline">• {item.meaning}</span>
                    </button>
                  ))}
                </div>

                {/* AI Smart Convert Button */}
                <button
                  type="button"
                  disabled={isConvertingAi}
                  onClick={handleAiConvert}
                  title="Konversi pinyin atau kalimat menjadi Hanzi otomatis dengan AI"
                  className="px-2.5 py-1.5 bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white rounded-lg text-[11px] font-semibold flex items-center gap-1 shrink-0 transition-all shadow-xs disabled:opacity-50"
                >
                  {isConvertingAi ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Sparkles className="w-3 h-3" />
                  )}
                  <span>AI Konversi Hanzi</span>
                </button>
              </div>

              {/* Quick Tone Vowels Selection Strip */}
              <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs">
                <div className="flex items-center gap-1.5 overflow-x-auto">
                  <span className="text-[10px] text-slate-400 font-semibold shrink-0 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-rose-400" />
                    <span>Pilih Nada Vokal:</span>
                  </span>
                  {Object.keys(VOWEL_TONE_MAP).map(vKey => {
                    const vData = VOWEL_TONE_MAP[vKey];
                    const isSelected = activeToneKey === vKey;
                    return (
                      <button
                        key={vKey}
                        type="button"
                        onClick={() => setActiveToneKey(activeToneKey === vKey ? null : vKey)}
                        className={`px-2 py-0.5 rounded-lg font-mono text-xs font-bold transition-all border shrink-0 flex items-center gap-1 ${
                          isSelected
                            ? 'bg-rose-600 border-rose-500 text-white shadow-xs'
                            : 'bg-slate-800/90 hover:bg-slate-700 border-slate-700 text-slate-200 hover:text-rose-300'
                        }`}
                        title={`Pilih 4 bentuk nada huruf ${vData.display} (${vData.tones.map(t => t.char).join(' ')})`}
                      >
                        <span className="text-rose-400 font-bold">{vData.tones[0].char}</span>
                        <span className="text-slate-400 text-[10px]">({vData.display})</span>
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 hidden sm:inline">
                    (💡 Tahan tombol vokal untuk nada)
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('tones')}
                    className="text-[10px] text-rose-400 hover:text-rose-300 shrink-0 font-medium underline underline-offset-2"
                  >
                    Tabel Nada →
                  </button>
                </div>
              </div>

              {/* ACTIVE TONE PALETTE (If a vowel is long-pressed or clicked) */}
              {activeToneKey && VOWEL_TONE_MAP[activeToneKey] && (
                <div className="p-3 bg-gradient-to-b from-slate-800 to-slate-900 border-2 border-rose-500/80 rounded-2xl shadow-2xl space-y-2.5 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-700/60 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-rose-600/30 border border-rose-500/50 text-rose-300 flex items-center justify-center font-bold text-sm font-mono">
                        {VOWEL_TONE_MAP[activeToneKey].tones[0].char}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">
                            Pilih Nada Huruf [{VOWEL_TONE_MAP[activeToneKey].display}]
                          </span>
                          <span className="text-[10px] text-rose-300 font-mono bg-rose-950/80 px-1.5 py-0.2 rounded border border-rose-800">
                            {VOWEL_TONE_MAP[activeToneKey].tones.map(t => t.char).join(' ')}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400">
                          Klik bentuk nada untuk menyisipkan (atau tekan angka 1-5 di keyboard)
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Destination selector */}
                      <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-700 text-[10px]">
                        <button
                          type="button"
                          onClick={() => setToneInsertTarget('chat')}
                          className={`px-2 py-0.5 rounded-md font-medium transition-all ${
                            toneInsertTarget === 'chat'
                              ? 'bg-rose-600 text-white shadow-2xs'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                          title="Karakter nada akan langsung dimasukkan ke pesan obrolan"
                        >
                          💬 Ke Chat
                        </button>
                        <button
                          type="button"
                          onClick={() => setToneInsertTarget('buffer')}
                          className={`px-2 py-0.5 rounded-md font-medium transition-all ${
                            toneInsertTarget === 'buffer'
                              ? 'bg-rose-600 text-white shadow-2xs'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                          title="Karakter nada akan dimasukkan ke buffer Pinyin"
                        >
                          🔤 Ke Pinyin
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => setActiveToneKey(null)}
                        className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                        title="Tutup pilihan nada"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* The 5 Tone Option Cards */}
                  <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                    {VOWEL_TONE_MAP[activeToneKey].tones.map((t) => (
                      <div
                        key={t.char}
                        className="flex flex-col rounded-xl bg-slate-950/90 hover:bg-slate-800 border border-slate-700/80 hover:border-rose-500 transition-all p-1.5 sm:p-2 text-center group shadow-xs relative"
                      >
                        <div className="flex items-center justify-between text-[9px] font-mono font-bold text-rose-400 mb-0.5 px-0.5">
                          <span>{t.toneNum <= 4 ? `[${t.toneNum}]` : '[5]'}</span>
                          <span className="text-slate-400">{t.mark}</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleSelectTone(t.char)}
                          className="w-full py-1 sm:py-1.5 rounded-lg font-mono text-xl sm:text-2xl font-bold text-white group-hover:text-rose-300 hover:bg-rose-600/20 active:scale-95 transition-all"
                          title={`Pilih ${t.char} - ${t.toneName} (${t.desc})`}
                        >
                          {t.char}
                        </button>

                        <span className="text-[9px] text-slate-300 font-medium truncate">
                          {t.toneName.split(' ')[0]} {t.toneName.split(' ')[1] || ''}
                        </span>
                        <span className="text-[8px] text-slate-400 hidden sm:block truncate">
                          {t.desc}
                        </span>

                        <button
                          type="button"
                          onClick={(e) => playVoice(t.char, e)}
                          className="mt-1 py-1 w-full rounded-md text-[9px] text-slate-400 hover:text-rose-300 hover:bg-slate-700 transition-colors flex items-center justify-center gap-1 border border-slate-800 group-hover:border-slate-700"
                          title={`Dengarkan pelafalan nada ${t.char}`}
                        >
                          <Volume2 className="w-2.5 h-2.5 text-rose-400" />
                          <span className="hidden sm:inline">Dengar</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Virtual QWERTY Keyboard Keys */}
              <div className="space-y-1.5 select-none pt-1">
                {/* Row 1 */}
                <div className="flex justify-center gap-1 sm:gap-1.5">
                  {row1.map(k => renderKeyButton(k))}
                </div>

                {/* Row 2 */}
                <div className="flex justify-center gap-1 sm:gap-1.5">
                  {row2.map(k => renderKeyButton(k))}
                </div>

                {/* Row 3 */}
                <div className="flex justify-center gap-1 sm:gap-1.5">
                  {row3.map(k => renderKeyButton(k))}

                  {/* Backspace Button */}
                  <button
                    type="button"
                    onClick={handleBufferBackspace}
                    className="px-3 sm:px-4 h-10 sm:h-11 bg-slate-800 hover:bg-rose-950 text-rose-300 hover:text-white rounded-xl border border-slate-700 transition-all flex items-center justify-center"
                    title="Hapus karakter (Backspace)"
                  >
                    <Delete className="w-4 h-4" />
                  </button>
                </div>

                {/* Row 4: Spacebar & Function buttons */}
                <div className="flex justify-center items-center gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => onInsertText('，')}
                    className="px-3 h-10 bg-slate-800 hover:bg-slate-700 rounded-xl font-serif text-sm border border-slate-700"
                    title="Koma Mandarin (，)"
                  >
                    ，
                  </button>
                  <button
                    type="button"
                    onClick={() => onInsertText('。')}
                    className="px-3 h-10 bg-slate-800 hover:bg-slate-700 rounded-xl font-serif text-sm border border-slate-700"
                    title="Titik Mandarin (。)"
                  >
                    。
                  </button>
                  <button
                    type="button"
                    onClick={() => onInsertText('？')}
                    className="px-3 h-10 bg-slate-800 hover:bg-slate-700 rounded-xl font-serif text-sm border border-slate-700"
                    title="Tanda Tanya Mandarin (？)"
                  >
                    ？
                  </button>
                  <button
                    type="button"
                    onClick={handleSpace}
                    className="flex-1 max-w-sm h-10 bg-slate-800 hover:bg-slate-700 active:bg-rose-700 rounded-xl font-medium text-xs border border-slate-700 transition-all shadow-2xs flex items-center justify-center gap-2"
                  >
                    <CornerDownLeft className="w-3.5 h-3.5 text-slate-400" />
                    <span>Spasi / Pilih Kandidat [1]</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onInsertText('！')}
                    className="px-3 h-10 bg-slate-800 hover:bg-slate-700 rounded-xl font-serif text-sm border border-slate-700"
                    title="Tanda Seru Mandarin (！)"
                  >
                    ！
                  </button>
                  <button
                    type="button"
                    onClick={onClear}
                    className="px-3 h-10 bg-slate-800/80 hover:bg-rose-900 text-slate-400 hover:text-white rounded-xl text-xs border border-slate-700"
                    title="Bersihkan input"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TONE MARKS & PINYIN ACCENTS */}
          {activeTab === 'tones' && (
            <div className="p-3.5 space-y-3 bg-slate-900/95">
              <div className="p-2 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span>
                  Klik vokal bertanda nada untuk menyisipkannya. Klik ikon speaker untuk mendengarkan lafal nada:
                </span>
                <span className="text-[10px] text-rose-400 font-mono">1: ˉ | 2: ˊ | 3: ˇ | 4: ˋ</span>
              </div>

              <div className="space-y-2.5">
                {PINYIN_TONES.map(toneGroup => (
                  <div key={toneGroup.label} className="space-y-1">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                      {toneGroup.label}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {toneGroup.vowels.map(v => (
                        <div key={v} className="flex items-center rounded-xl bg-slate-800 border border-slate-700 overflow-hidden shadow-2xs hover:border-rose-500 transition-colors">
                          <button
                            type="button"
                            onClick={() => onInsertText(v)}
                            className="px-3 py-1.5 font-mono text-base font-bold text-slate-100 hover:text-rose-400 transition-colors"
                            title={`Sisipkan ${v}`}
                          >
                            {v}
                          </button>
                          <button
                            type="button"
                            onClick={e => playVoice(v, e)}
                            className="px-1.5 py-1.5 text-slate-500 hover:text-rose-400 border-l border-slate-700"
                            title={`Dengarkan nada ${v}`}
                          >
                            <Volume2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: COMMON PHRASES (1-CLICK INSERTION) */}
          {activeTab === 'phrases' && (
            <div className="p-3.5 space-y-3 bg-slate-900/95">
              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {COMMON_CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActivePhraseCat(cat.id)}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                      activePhraseCat === cat.id
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700'
                    }`}
                  >
                    {cat.name} ({cat.chineseName})
                  </button>
                ))}
              </div>

              {/* Phrase Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                {COMMON_CATEGORIES.find(c => c.id === activePhraseCat)?.items.map((phrase, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-rose-500 transition-all flex items-center justify-between gap-2 shadow-2xs group"
                  >
                    <button
                      type="button"
                      onClick={() => onInsertText(phrase.hanzi)}
                      className="text-left flex-1"
                      title="Klik untuk menyisipkan ke pesan obrolan"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-serif font-bold text-sm text-slate-100 group-hover:text-rose-300">
                          {phrase.hanzi}
                        </span>
                        <span className="text-[11px] text-rose-400 font-mono">
                          {phrase.pinyin}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{phrase.meaning}</p>
                    </button>

                    <button
                      type="button"
                      onClick={e => playVoice(phrase.hanzi, e)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-700 rounded-lg shrink-0 transition-colors"
                      title="Dengarkan pengucapan audio Mandarin"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: HSK CHARACTER GRID */}
          {activeTab === 'hanzi' && (
            <div className="p-3.5 space-y-3 bg-slate-900/95 max-h-60 overflow-y-auto">
              {HSK_CHARACTERS.map(group => (
                <div key={group.group} className="space-y-1">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    {group.group}:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {group.chars.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => onInsertText(c)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-rose-900/80 border border-slate-700 hover:border-rose-500 rounded-xl text-xs font-serif font-bold text-slate-100 hover:text-rose-200 transition-colors shadow-2xs"
                        title={`Sisipkan karakter ${c}`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 5: OS KEYBOARD SETUP TIPS */}
          {activeTab === 'help' && (
            <div className="p-4 space-y-3 bg-slate-900/95 text-xs text-slate-300 leading-relaxed max-h-60 overflow-y-auto">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                <Languages className="w-4 h-4 text-rose-400" />
                <h4 className="font-semibold text-white">Panduan Mengaktifkan Keyboard Mandarin di Perangkat Kamu:</h4>
              </div>

              <div className="space-y-2">
                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                  <p className="font-semibold text-rose-400 mb-0.5">🪟 Windows 10 & 11:</p>
                  <p className="text-slate-400">
                    Buka <strong>Settings &gt; Time &amp; Language &gt; Language &amp; Region</strong> &gt; Klik <strong>Add a language</strong> &gt; Pilih <strong>Chinese (Simplified, China) / 中文(简体)</strong>.
                    <br />
                    Ganti bahasa cepat kapan saja dengan menekan tombol: <kbd className="px-1.5 py-0.5 bg-slate-800 text-slate-200 rounded border border-slate-700 font-mono text-[10px]">Win + Space</kbd>.
                  </p>
                </div>

                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                  <p className="font-semibold text-rose-400 mb-0.5">🍎 Mac / macOS:</p>
                  <p className="text-slate-400">
                    Buka <strong>System Settings &gt; Keyboard &gt; Text Input &gt; Edit...</strong> &gt; Klik tombol <strong>+</strong> &gt; Pilih <strong>Chinese, Simplified &gt; Pinyin - Simplified</strong>.
                    <br />
                    Ganti bahasa dengan tombol: <kbd className="px-1.5 py-0.5 bg-slate-800 text-slate-200 rounded border border-slate-700 font-mono text-[10px]">Control + Space</kbd> atau tombol Fn / Globe.
                  </p>
                </div>

                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                  <p className="font-semibold text-rose-400 mb-0.5">📱 Android &amp; iPhone (iOS):</p>
                  <p className="text-slate-400">
                    Di keyboard HP (Gboard / iOS Keyboard), tahan tombol <strong>Bola Dunia (🌐)</strong> atau buka <strong>Pengaturan Keyboard &gt; Tambah Bahasa</strong> &gt; Tambahkan <strong>Chinese Pinyin (Simplified)</strong>.
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
