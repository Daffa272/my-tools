import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Headphones,
  Play,
  Square,
  RotateCcw,
  Sparkles,
  Sun,
  Moon,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Volume2,
  VolumeX,
  Key,
  ChevronRight,
  BookOpen,
  Clock,
  Award,
  Layers,
  ArrowRight,
  User,
  Info,
  Timer,
  Zap,
  Bookmark,
  BookmarkCheck,
  History,
  GraduationCap,
  Sparkle,
  Sliders,
  ListFilter,
  Check,
  Coffee,
  X,
  Volume1,
  FileText,
  AlertTriangle,
  Lightbulb,
  Mic,
  MicOff,
  RotateCw,
  BarChart2,
  FastForward,
  Rewind,
  PieChart,
  RefreshCw,
  SkipForward,
  SkipBack,
} from 'lucide-react';
import { ProjectMenu } from './components/ProjectMenu';

// TOEFL Types
export type TOEFLPart = 'partA' | 'partB' | 'partC';
export type TestMode = 'practice' | 'exam' | 'minitest';

interface Segment {
  speaker: string;
  gender: 'female' | 'male' | 'neutral';
  text: string;
}

interface DistractorNote {
  option: string;
  trapType: string;
  reason: string;
}

interface VocabularyItem {
  phrase: string;
  meaning: string;
  context: string;
}

interface PracticeItem {
  id: string;
  part: TOEFLPart;
  topic: string;
  segments: Segment[];
  question: string;
  options: string[];
  answer: string;
  explanation: string;
  distractors?: DistractorNote[];
  vocabulary?: VocabularyItem[];
  timestamp?: number;
}

interface HistoryItem {
  practice: PracticeItem;
  userAnswer: string;
  isCorrect: boolean;
  timeSpentSeconds: number;
  date: string;
}

interface MiniTestResult {
  total: number;
  correct: number;
  accuracy: number;
  estimatedScore: number;
  partABreakdown: { total: number; correct: number };
  partBBreakdown: { total: number; correct: number };
  partCBreakdown: { total: number; correct: number };
  items: {
    practice: PracticeItem;
    userAnswer: string;
    isCorrect: boolean;
  }[];
}

// Built-in Sample Datasets for Part A, Part B, and Part C
const BUILT_IN_PRACTICES: PracticeItem[] = [
  {
    id: 'sample-partA-1',
    part: 'partA',
    topic: 'Campus Housing & Transportation',
    segments: [
      {
        speaker: 'Lucas',
        gender: 'male',
        text: 'Hey Maya, have you had any luck finding an apartment near the campus library for next semester?',
      },
      {
        speaker: 'Maya',
        gender: 'female',
        text: 'Not really. Everything within walking distance is way out of my budget, so I ended up signing a lease for a townhouse on Elm Street near the transit hub.',
      },
      {
        speaker: 'Lucas',
        gender: 'male',
        text: 'Oh, that is actually convenient! The university shuttle runs every ten minutes right past that corner.',
      },
    ],
    question: 'What does the woman imply about her living situation for next semester?',
    options: [
      'She decided to live in an apartment right next to the campus library.',
      'She chose a place further from campus because of high rental costs.',
      'She is still searching for a townhouse within walking distance.',
      'She refused to take the university shuttle due to irregular schedules.',
    ],
    answer: 'B',
    explanation:
      'The woman states that housing within walking distance was "way out of my budget," so she leased a place on Elm Street instead, implying financial constraints forced her to live further away.',
    distractors: [
      { option: 'A', trapType: 'Opposite statement', reason: 'She explicitly rejected apartments next to the library due to price.' },
      { option: 'C', trapType: 'Unfinished action trap', reason: 'She already signed a lease, so she is no longer actively searching.' },
      { option: 'D', trapType: 'Factually contrary', reason: 'The shuttle is actually convenient and passes her townhouse every ten minutes.' },
    ],
    vocabulary: [
      { phrase: 'way out of budget', meaning: 'Jauh melebihi anggaran dana yang dimiliki', context: 'Everything within walking distance is way out of my budget' },
      { phrase: 'transit hub', meaning: 'Pusat terminal pergantian moda transportasi umum', context: 'near the transit hub' },
      { phrase: 'shuttle', meaning: 'Bus antar-jemput rute pendek terjadwal', context: 'The university shuttle runs every ten minutes' },
    ],
  },
  {
    id: 'sample-partA-2',
    part: 'partA',
    topic: 'Professor Office Hours',
    segments: [
      {
        speaker: 'Professor Evans',
        gender: 'male',
        text: 'Good afternoon, Sarah. I reviewed your preliminary proposal for the environmental economics term paper.',
      },
      {
        speaker: 'Sarah',
        gender: 'female',
        text: 'Thank you, Professor Evans. Did the section on carbon taxation policies make sense?',
      },
      {
        speaker: 'Professor Evans',
        gender: 'male',
        text: 'Your theoretical grounding is solid, but you should narrow your scope to two specific European countries rather than examining the entire continent.',
      },
    ],
    question: 'What advice does the professor give to the student regarding her paper?',
    options: [
      'She should reconsider her theoretical framework entirely.',
      'She needs to focus on a more limited geographical area.',
      'She should abandon the carbon taxation topic.',
      'She must submit her final draft ahead of the deadline.',
    ],
    answer: 'B',
    explanation:
      'Professor Evans suggests narrowing her scope to two specific European countries instead of covering the entire continent, which is synonymous with limiting the geographical area.',
    distractors: [
      { option: 'A', trapType: 'Direct contradiction', reason: 'The professor praised her theoretical grounding as "solid".' },
      { option: 'C', trapType: 'Extreme overreaction', reason: 'He did not ask her to discard the carbon tax topic, only to refine the scope.' },
      { option: 'D', trapType: 'Not mentioned', reason: 'No submission deadline dates were discussed in the dialogue.' },
    ],
    vocabulary: [
      { phrase: 'narrow your scope', meaning: 'Mempersempit batasan atau fokus pembahasan penelitian', context: 'you should narrow your scope to two specific countries' },
      { phrase: 'theoretical grounding', meaning: 'Landasan teori / kerangka konseptual', context: 'Your theoretical grounding is solid' },
    ],
  },
  {
    id: 'sample-partB-1',
    part: 'partB',
    topic: 'Academic Advising & Internships',
    segments: [
      {
        speaker: 'Marcus',
        gender: 'male',
        text: 'Hi Advisor Daniels, I was wondering if students enrolled in the Biochemistry honors program are eligible for the summer clinical internship at the regional medical center.',
      },
      {
        speaker: 'Advisor Daniels',
        gender: 'female',
        text: 'Yes Marcus, but there are two mandatory prerequisites: you must complete Organic Chemistry II with at least a B plus, and you need a faculty recommendation letter.',
      },
      {
        speaker: 'Marcus',
        gender: 'male',
        text: 'I already finished Organic Chemistry with an A minus last semester, but Dr. Alvarez is currently on sabbatical in Chile until July.',
      },
      {
        speaker: 'Advisor Daniels',
        gender: 'female',
        text: 'An endorsement from your lab coordinator will be fully accepted as an alternative if your primary professor is overseas.',
      },
    ],
    question: 'What problem does Marcus encounter with the internship application requirements?',
    options: [
      'His grade in Organic Chemistry does not meet the minimum prerequisite.',
      'The faculty member he wants a recommendation from is currently abroad.',
      'The regional medical center canceled all biochemistry summer positions.',
      'The honors advising office rejected his lab coordinator as an alternative.',
    ],
    answer: 'B',
    explanation:
      'Marcus earned an A minus, which satisfies the prerequisite, but his intended recommender Dr. Alvarez is on sabbatical in Chile (overseas), creating a problem with getting the recommendation letter.',
    distractors: [
      { option: 'A', trapType: 'Factually wrong', reason: 'His grade (A minus) exceeds the required B plus.' },
      { option: 'C', trapType: 'Hallucinated claim', reason: 'The internship is still open and running.' },
      { option: 'D', trapType: 'Opposite resolution', reason: 'The advisor expressly stated the lab coordinator will be accepted.' },
    ],
    vocabulary: [
      { phrase: 'sabbatical', meaning: 'Cuti akademik berbayar untuk riset atau perjalanan ilmiah dosen', context: 'Dr. Alvarez is currently on sabbatical in Chile' },
      { phrase: 'prerequisites', meaning: 'Mata kuliah atau syarat wajib yang harus dipenuhi terlebih dahulu', context: 'there are two mandatory prerequisites' },
      { phrase: 'endorsement', meaning: 'Surat rekomendasi atau persetujuan resmi', context: 'An endorsement from your lab coordinator will be accepted' },
    ],
  },
  {
    id: 'sample-partB-2',
    part: 'partB',
    topic: 'Campus Bookstore & Textbook Exchange',
    segments: [
      {
        speaker: 'Elena',
        gender: 'female',
        text: 'Excuse me, are the custom lab manuals for General Biology 101 available for purchase yet?',
      },
      {
        speaker: 'Clerk Ryan',
        gender: 'male',
        text: 'The print shop delivered the spiral-bound manuals this morning, but our computer system has not logged them into active inventory yet.',
      },
      {
        speaker: 'Elena',
        gender: 'female',
        text: 'My first practical session begins tomorrow morning at eight. Will they be ready before the store closes today?',
      },
      {
        speaker: 'Clerk Ryan',
        gender: 'male',
        text: 'Yes, if you check back at three o’clock, our supervisor will have completed the barcode scanning.',
      },
    ],
    question: 'Why is Elena unable to purchase the lab manual immediately?',
    options: [
      'The print shop has not delivered the physical copies to campus.',
      'The bookstore inventory system has not processed the shipment yet.',
      'The General Biology course was rescheduled for next semester.',
      'The supervisor refused to authorize spiral-bound lab manuals.',
    ],
    answer: 'B',
    explanation:
      'The clerk clarifies that while physical manuals arrived, the store computer system has not logged them into active inventory yet until 3 PM.',
    distractors: [
      { option: 'A', trapType: 'Direct contradiction', reason: 'The copies arrived that morning.' },
      { option: 'C', trapType: 'Irrelevant fabrication', reason: 'The course starts tomorrow at 8 AM.' },
      { option: 'D', trapType: 'False conflict', reason: 'The supervisor is simply scanning barcodes.' },
    ],
    vocabulary: [
      { phrase: 'active inventory', meaning: 'Daftar stok barang siap jual di sistem toko', context: 'not logged them into active inventory yet' },
      { phrase: 'practical session', meaning: 'Sesi praktikum laboratorium mahasiswa', context: 'first practical session begins tomorrow morning' },
    ],
  },
  {
    id: 'sample-partC-1',
    part: 'partC',
    topic: 'Astronomy Mini-Lecture: Tidal Locking',
    segments: [
      {
        speaker: 'Professor Vance',
        gender: 'male',
        text: 'Today we explore the astronomical phenomenon known as tidal locking, which explains why the Earth always observes the exact same face of the Moon. Over millions of years, the gravitational torque exerted by Earth slowed down the Moon rotation period until it synchronized perfectly with its orbital period around Earth, lasting approximately twenty-seven point three days.',
      },
      {
        speaker: 'Professor Vance',
        gender: 'male',
        text: 'This synchronous rotation is not unique to our lunar neighbor. In fact, many close-in exoplanets orbiting red dwarf stars are tidally locked, meaning one hemisphere endures eternal searing daylight while the opposite side remains in perpetual frozen darkness.',
      },
    ],
    question: 'According to the professor, what causes the Moon to always show the same face toward Earth?',
    options: [
      'The Moon has ceased all axial rotation entirely over the millennia.',
      'Gravitational forces caused its rotational period to synchronize with its orbit.',
      'Solar radiation pressure locked the Moon into an elliptical stationary path.',
      'Magnetic fields from red dwarf stars halted its orbital velocity.',
    ],
    answer: 'B',
    explanation:
      'The professor explains that gravitational torque exerted by Earth caused the Moon rotation period to slow down until it synchronized with its orbital period (both lasting ~27.3 days).',
    distractors: [
      { option: 'A', trapType: 'Misconception trap', reason: 'The Moon still rotates on its axis once every ~27.3 days; it has not ceased rotation.' },
      { option: 'C', trapType: 'False mechanism', reason: 'Solar radiation is not the cause of tidal locking; gravitational torque is.' },
      { option: 'D', trapType: 'Out-of-context fusion', reason: 'Red dwarfs were mentioned only as a separate example of exoplanet locking, not Earth moon.' },
    ],
    vocabulary: [
      { phrase: 'tidal locking', meaning: 'Penguncian pasang surut: kondisi saat kala rotasi benda langit sama persis dengan kala revolusinya', context: 'phenomenon known as tidal locking' },
      { phrase: 'synchronous rotation', meaning: 'Rotasi sinkron seirama dengan orbit', context: 'This synchronous rotation is not unique to our lunar neighbor' },
      { phrase: 'gravitational torque', meaning: 'Torsi gaya gravitasi yang memperlambat laju putaran', context: 'gravitational torque exerted by Earth slowed down the Moon' },
    ],
  },
];

const SUGGESTED_TOPICS = [
  'Campus housing',
  'Library reserves',
  'Professor office hours',
  'Internship advising',
  'Biology lab practical',
  'Study group deadline',
  'Cafeteria meal plans',
  'Astronomy: Tidal locking',
  'Geology: Glacier movement',
  'American history: Canals',
];

export default function App() {
  // Theme state: dark / light
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) return savedTheme === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Mode: Practice vs. Exam vs. Mini-Test
  const [testMode, setTestMode] = useState<TestMode>('practice');
  const [selectedPart, setSelectedPart] = useState<TOEFLPart>('partA');

  // Mini-Test State (5 Questions continuous diagnostic session)
  const [miniTestQueue, setMiniTestQueue] = useState<PracticeItem[]>([]);
  const [miniTestIndex, setMiniTestIndex] = useState<number>(0);
  const [miniTestAnswers, setMiniTestAnswers] = useState<{ [id: string]: string }>({});
  const [miniTestResult, setMiniTestResult] = useState<MiniTestResult | null>(null);

  // API Key state
  const [apiKey, setApiKey] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('gemini_api_key') || '';
    }
    return '';
  });
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [tempApiKey, setTempApiKey] = useState(apiKey);

  // Practice state
  const [topic, setTopic] = useState('Campus housing');
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'info' | 'error' | 'success' } | null>(null);

  const [practice, setPractice] = useState<PracticeItem>(BUILT_IN_PRACTICES[0]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isChecked, setIsChecked] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);

  // Audio Playback & Progress state
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(0.95);
  const [currentSpeakerIndex, setCurrentSpeakerIndex] = useState<number | null>(null);
  const [audioStatusText, setAudioStatusText] = useState('Siap diputar');
  const [speechVoices, setSpeechVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>('auto');
  const [hasPlayedInExam, setHasPlayedInExam] = useState(false);

  // Audio Ambient Noise generator (Campus / Library Ambient sound)
  const [isAmbientOn, setIsAmbientOn] = useState(false);
  const ambientAudioCtxRef = useRef<AudioContext | null>(null);
  const ambientGainRef = useRef<GainNode | null>(null);
  const ambientSourceRef = useRef<AudioNode | null>(null);

  // Exam Countdown Timer (12 seconds answering window after audio finishes)
  const [examTimer, setExamTimer] = useState<number | null>(null);
  const examTimerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Shadowing & Pronunciation State
  const [shadowingSegmentIndex, setShadowingSegmentIndex] = useState<number | null>(null);
  const [isRecordingShadow, setIsRecordingShadow] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');
  const [shadowScore, setShadowScore] = useState<number | null>(null);
  const recognitionRef = useRef<any>(null);

  // Bookmarks & Word Bank & History
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('toefl_bookmarks');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  const [history, setHistory] = useState<HistoryItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('toefl_history');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  // Drawers & Modals
  const [activeDrawer, setActiveDrawer] = useState<'none' | 'history' | 'wordbank' | 'settings'>('none');
  const [activeVocabPopup, setActiveVocabPopup] = useState<VocabularyItem | null>(null);

  // Pomodoro Mini-Timer state
  const [isPomodoroOpen, setIsPomodoroOpen] = useState(false);
  const [pomoSeconds, setPomoSeconds] = useState(25 * 60);
  const [isPomoRunning, setIsPomoRunning] = useState(false);
  const [pomoMode, setPomoMode] = useState<'study' | 'break'>('study');

  const speechTokenRef = useRef(0);
  const questionStartTimeRef = useRef<number>(Date.now());

  // Dark mode class sync
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Save Bookmarks and History
  useEffect(() => {
    localStorage.setItem('toefl_bookmarks', JSON.stringify(bookmarkedIds));
  }, [bookmarkedIds]);

  useEffect(() => {
    localStorage.setItem('toefl_history', JSON.stringify(history));
  }, [history]);

  // Load Voices on Mount
  useEffect(() => {
    const updateVoices = () => {
      if ('speechSynthesis' in window) {
        const voices = window.speechSynthesis.getVoices();
        setSpeechVoices(voices);
      }
    };
    updateVoices();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Web Audio Pink Noise for Campus Ambient
  const startAmbientNoise = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      if (!ambientAudioCtxRef.current) {
        ambientAudioCtxRef.current = new AudioCtx();
      }
      const ctx = ambientAudioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.04;
        b6 = white * 0.115926;
      }

      const noiseNode = ctx.createBufferSource();
      noiseNode.buffer = buffer;
      noiseNode.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 650;

      const gain = ctx.createGain();
      gain.gain.value = 0.18;

      noiseNode.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noiseNode.start();
      ambientSourceRef.current = noiseNode;
      ambientGainRef.current = gain;
      setIsAmbientOn(true);
    } catch (e) {
      console.warn('Web Audio Ambient error', e);
    }
  };

  const stopAmbientNoise = () => {
    try {
      if (ambientSourceRef.current) {
        (ambientSourceRef.current as any).stop();
        ambientSourceRef.current.disconnect();
        ambientSourceRef.current = null;
      }
      setIsAmbientOn(false);
    } catch (e) {
      console.warn(e);
    }
  };

  const toggleAmbientNoise = () => {
    if (isAmbientOn) {
      stopAmbientNoise();
    } else {
      startAmbientNoise();
    }
  };

  // Keyboard Shortcuts (Space: Play/Stop, 1-4 or A-D: Select, Enter: Check/Next)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      // Space: Toggle audio
      if (e.code === 'Space') {
        e.preventDefault();
        if (isPlaying) {
          stopAudio();
        } else if (testMode !== 'exam' || !hasPlayedInExam) {
          playPracticeAudio();
        }
      }

      // 1-4 or A-D: Select choices
      if (!isChecked && practice) {
        const key = e.key.toUpperCase();
        if (['A', 'B', 'C', 'D'].includes(key)) {
          setSelectedOption(key);
        } else if (['1', '2', '3', '4'].includes(e.key)) {
          const mapped = String.fromCharCode(65 + parseInt(e.key, 10) - 1);
          setSelectedOption(mapped);
        }
      }

      // Enter: Submit or Next
      if (e.key === 'Enter') {
        if (!isChecked && selectedOption) {
          handleCheckAnswer();
        } else if (isChecked) {
          if (testMode === 'minitest') {
            handleNextMiniTestQuestion();
          } else {
            handleGenerate();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, isChecked, selectedOption, practice, testMode, hasPlayedInExam, miniTestIndex, miniTestQueue]);

  // Pomodoro ticker
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPomoRunning && pomoSeconds > 0) {
      interval = setInterval(() => {
        setPomoSeconds((prev) => prev - 1);
      }, 1000);
    } else if (pomoSeconds === 0) {
      setIsPomoRunning(false);
      if (pomoMode === 'study') {
        alert('Waktu 25 menit sesi fokus selesai! Luangkan waktu 5 menit istirahat.');
        setPomoMode('break');
        setPomoSeconds(5 * 60);
      } else {
        alert('Istirahat selesai! Kembali ke latihan listening.');
        setPomoMode('study');
        setPomoSeconds(25 * 60);
      }
    }
    return () => clearInterval(interval);
  }, [isPomoRunning, pomoSeconds, pomoMode]);

  // Exam mode 12s countdown handler
  useEffect(() => {
    if (testMode === 'exam' && examTimer !== null) {
      if (examTimer > 0 && !isChecked) {
        examTimerIntervalRef.current = setTimeout(() => {
          setExamTimer((prev) => (prev !== null ? prev - 1 : null));
        }, 1000);
      } else if (examTimer === 0 && !isChecked) {
        handleCheckAnswer();
      }
    }
    return () => {
      if (examTimerIntervalRef.current) clearTimeout(examTimerIntervalRef.current);
    };
  }, [examTimer, testMode, isChecked]);

  // Voice Selection Helper
  const selectVoiceForGender = (gender: string) => {
    if (selectedVoiceName !== 'auto') {
      const explicit = speechVoices.find((v) => v.name === selectedVoiceName);
      if (explicit) return explicit;
    }

    const femaleNames = /zira|hazel|samantha|victoria|ava|zoe|susan|karen|moira|fiona|jenny|aria|libby|sonia|female|woman/i;
    const maleNames = /david|mark|daniel|alex|george|james|guy|male|man/i;

    const voices = speechVoices.length > 0 ? speechVoices : (typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis.getVoices() : []);
    const englishVoices = voices.filter((v) => /^en(-|_)/i.test(v.lang));
    const pool = englishVoices.length > 0 ? englishVoices : voices;

    if (gender === 'female') {
      return pool.find((v) => femaleNames.test(v.name)) || pool.find((v) => /en-US/i.test(v.lang)) || pool[0];
    }
    if (gender === 'male') {
      return pool.find((v) => maleNames.test(v.name)) || pool.find((v) => /en-GB|en-US/i.test(v.lang)) || pool[1] || pool[0];
    }
    return pool.find((v) => /en-US/i.test(v.lang)) || pool[0];
  };

  const stopAudio = () => {
    speechTokenRef.current += 1;
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setCurrentSpeakerIndex(null);
    setAudioStatusText('Audio dihentikan');
  };

  // Play Full Dialogue Audio (with optional starting segment index)
  const playPracticeAudio = (rate = playbackSpeed, startFromIndex = 0) => {
    if (!practice) return;
    if (testMode === 'exam' && hasPlayedInExam) {
      setStatusMessage({ text: 'Pada mode simulasi ujian resmi, audio hanya diperdengarkan 1 kali.', type: 'error' });
      return;
    }
    if (!('speechSynthesis' in window)) {
      setStatusMessage({ text: 'Browser tidak mendukung Speech Synthesis.', type: 'error' });
      return;
    }

    window.speechSynthesis.cancel();
    const token = ++speechTokenRef.current;
    setIsPlaying(true);
    if (testMode === 'exam') {
      setHasPlayedInExam(true);
      setExamTimer(null);
    }

    const speakSegment = (index: number) => {
      if (token !== speechTokenRef.current) return;

      if (index >= practice.segments.length) {
        setIsPlaying(false);
        setCurrentSpeakerIndex(null);
        setAudioStatusText('Audio selesai diputar');

        if (testMode === 'exam') {
          setExamTimer(12);
        }
        return;
      }

      const segment = practice.segments[index];
      const gender = (segment.gender || 'neutral').toLowerCase();
      setCurrentSpeakerIndex(index);
      setAudioStatusText(`Memutar: ${segment.speaker} (${gender === 'female' ? 'Wanita' : 'Pria'})`);

      const utterance = new SpeechSynthesisUtterance(segment.text);
      utterance.lang = 'en-US';
      utterance.rate = testMode === 'exam' ? 1.0 : rate;

      const chosenVoice = selectVoiceForGender(gender);
      if (chosenVoice) utterance.voice = chosenVoice;
      utterance.pitch = gender === 'female' ? (chosenVoice ? 1.08 : 1.2) : 0.96;

      utterance.onend = () => {
        setTimeout(() => {
          speakSegment(index + 1);
        }, 400);
      };

      utterance.onerror = () => {
        if (token === speechTokenRef.current) {
          setIsPlaying(false);
          setCurrentSpeakerIndex(null);
          setAudioStatusText('Kendala pemutaran audio');
        }
      };

      window.speechSynthesis.speak(utterance);
    };

    speakSegment(startFromIndex);
  };

  // Skip / Jump Segments (-1 or +1)
  const jumpSegment = (offset: number) => {
    if (!practice) return;
    stopAudio();
    const nextIdx = Math.max(0, Math.min(practice.segments.length - 1, (currentSpeakerIndex ?? 0) + offset));
    playPracticeAudio(playbackSpeed, nextIdx);
  };

  // Play Individual Segment (Review in transcript)
  const playSingleSegment = (segment: Segment, index: number) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const token = ++speechTokenRef.current;
    setIsPlaying(true);
    setCurrentSpeakerIndex(index);

    const gender = (segment.gender || 'neutral').toLowerCase();
    const utterance = new SpeechSynthesisUtterance(segment.text);
    utterance.lang = 'en-US';
    utterance.rate = playbackSpeed;

    const chosenVoice = selectVoiceForGender(gender);
    if (chosenVoice) utterance.voice = chosenVoice;
    utterance.pitch = gender === 'female' ? 1.08 : 0.96;

    utterance.onend = () => {
      if (token === speechTokenRef.current) {
        setIsPlaying(false);
        setCurrentSpeakerIndex(null);
      }
    };
    window.speechSynthesis.speak(utterance);
  };

  // Shadowing & Pronunciation Evaluation using Web Speech API
  const startShadowing = (targetText: string, segIndex: number) => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Browser Anda belum mendukung Web Speech Recognition API (Mic Shadowing). Coba gunakan Google Chrome atau Microsoft Edge desktop.');
      return;
    }

    if (isRecordingShadow) {
      recognitionRef.current?.stop();
      setIsRecordingShadow(false);
      return;
    }

    stopAudio();
    setShadowingSegmentIndex(segIndex);
    setRecognizedText('');
    setShadowScore(null);
    setIsRecordingShadow(true);

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setRecognizedText(transcript);

        // Word overlap accuracy score
        const cleanWords = (str: string) => str.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(/\s+/).filter(Boolean);
        const targetWords = cleanWords(targetText);
        const recognizedWords = cleanWords(transcript);

        let matches = 0;
        targetWords.forEach((word) => {
          if (recognizedWords.includes(word)) matches++;
        });

        const calculated = Math.min(100, Math.round((matches / Math.max(1, targetWords.length)) * 100));
        setShadowScore(calculated);
      };

      recognition.onerror = (e: any) => {
        console.warn('Speech Recognition error', e);
        setIsRecordingShadow(false);
      };

      recognition.onend = () => {
        setIsRecordingShadow(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.error(e);
      setIsRecordingShadow(false);
    }
  };

  // Helper validation & parsing
  const cleanJson = (val: string) => val.replace(/```json|```/gi, '').trim();

  const validatePractice = (item: any): boolean => {
    return (
      item &&
      Array.isArray(item.segments) &&
      item.segments.length > 0 &&
      item.segments.every(
        (seg: any) =>
          seg &&
          ['female', 'male', 'neutral'].includes(String(seg.gender).toLowerCase()) &&
          typeof seg.speaker === 'string' &&
          seg.speaker.trim() &&
          typeof seg.text === 'string' &&
          seg.text.trim()
      ) &&
      typeof item.question === 'string' &&
      item.question.trim() &&
      Array.isArray(item.options) &&
      item.options.length === 4 &&
      item.options.every((opt: any) => typeof opt === 'string' && opt.trim()) &&
      /^[A-D]$/i.test(String(item.answer || '').trim()) &&
      typeof item.explanation === 'string' &&
      item.explanation.trim()
    );
  };

  const normalizePractice = (item: any, part: TOEFLPart, topicName: string): PracticeItem => {
    return {
      id: `ai-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      part,
      topic: topicName,
      timestamp: Date.now(),
      question: item.question,
      options: item.options,
      answer: item.answer,
      explanation: item.explanation,
      distractors: item.distractors || [],
      vocabulary: item.vocabulary || [],
      segments: item.segments.map((seg: any, idx: number) => ({
        ...seg,
        speaker: String(seg.speaker || `Speaker ${idx + 1}`).trim(),
        text: seg.text.replace(/^\s*[A-Za-z][A-Za-z0-9 .'-]{0,30}:\s*/, '').trim(),
      })),
    };
  };

  const randomizeOptions = (item: PracticeItem): PracticeItem => {
    const correctIndex = String(item.answer).trim().toUpperCase().charCodeAt(0) - 65;
    const shuffled = item.options.map((text, idx) => ({ text, idx }));
    for (let i = shuffled.length - 1; i > 0; i--) {
      const r = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[r]] = [shuffled[r], shuffled[i]];
    }
    const newAnswer = String.fromCharCode(65 + shuffled.findIndex((o) => o.idx === correctIndex));
    return {
      ...item,
      options: shuffled.map((o) => o.text),
      answer: newAnswer,
    };
  };

  // Generation using Gemini 3.5 Flash Lite
  const handleGenerate = async (targetTopic = topic, part = selectedPart) => {
    const keyToUse = apiKey.trim();
    if (!keyToUse) {
      setStatusMessage({
        text: 'Masukkan Gemini API Key untuk generate soal baru.',
        type: 'error',
      });
      setIsKeyModalOpen(true);
      return;
    }

    stopAudio();
    setIsGenerating(true);
    setStatusMessage({ text: `Menghubungi Gemini 3.5 Flash Lite untuk TOEFL ${part.toUpperCase()}...`, type: 'info' });

    let partInstructions = '';
    if (part === 'partA') {
      partInstructions = 'Create a short campus conversation between two students or student/staff (2-3 spoken segments, 80-110 words total). Emphasize natural conversational idioms or implications.';
    } else if (part === 'partB') {
      partInstructions = 'Create a longer campus dialogue (3-4 spoken segments, 110-140 words total) discussing course registration, research internships, or campus policies.';
    } else {
      partInstructions = 'Create an introductory academic mini-lecture (1-2 spoken segments by a professor, 110-150 words total) on an introductory university subject (astronomy, ecology, history, or psychology).';
    }

    const prompt = `You are an expert TOEFL ITP Section 1 test developer.
Generate one original listening exercise about "${targetTopic}" for Section 1 ${part.toUpperCase()}.
${partInstructions}
Return VALID JSON ONLY with this schema:
{
  "segments": [
    {"speaker": "Lucas", "gender": "male", "text": "..."},
    {"speaker": "Maya", "gender": "female", "text": "..."}
  ],
  "question": "What does the woman imply about...?",
  "options": [
    "Option A description...",
    "Option B description...",
    "Option C description...",
    "Option D description..."
  ],
  "answer": "B",
  "explanation": "Detailed explanation of why B is correct...",
  "distractors": [
    {"option": "A", "trapType": "Opposite detail", "reason": "Why A is incorrect..."},
    {"option": "C", "trapType": "Unmentioned extreme", "reason": "Why C is incorrect..."},
    {"option": "D", "trapType": "Sound-alike trap", "reason": "Why D is incorrect..."}
  ],
  "vocabulary": [
    {"phrase": "idiom or academic word", "meaning": "Indonesian translation and brief definition", "context": "Sample sentence or usage"}
  ]
}
Requirements:
- All spoken texts, question, options, and explanation must be in natural, idiomatic academic English.
- No Indonesian in the question or options. Indonesian is only permitted in the vocabulary meaning definitions.
- Segment text must contain purely spoken words (no speaker labels or stage directions inside text).
- Do not output Markdown ticks or commentary.`;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${encodeURIComponent(
          keyToUse
        )}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.7,
            },
          }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error?.message || 'Gagal terhubung ke Gemini API.');
      }

      const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      const parsed = JSON.parse(cleanJson(raw));

      if (!validatePractice(parsed)) {
        throw new Error('Hasil generate AI belum sesuai standar format.');
      }

      const normalized = normalizePractice(parsed, part, targetTopic);
      const randomized = randomizeOptions(normalized);

      setPractice(randomized);
      setSelectedOption(null);
      setIsChecked(false);
      setShowTranscript(false);
      setHasPlayedInExam(false);
      setExamTimer(null);
      questionStartTimeRef.current = Date.now();

      setStatusMessage({
        text: `Latihan baru ${part.toUpperCase()} berhasil dibuat! Putar audio untuk memulai.`,
        type: 'success',
      });
    } catch (err: any) {
      console.error(err);
      setStatusMessage({
        text: err.message || 'Terjadi kesalahan saat memproses soal.',
        type: 'error',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Start Mini Diagnostic Test Session (5 questions curated across Part A, B, C)
  const startMiniTest = () => {
    stopAudio();
    const randomizedList = BUILT_IN_PRACTICES.map((p) => randomizeOptions(p));
    setMiniTestQueue(randomizedList);
    setMiniTestIndex(0);
    setMiniTestAnswers({});
    setMiniTestResult(null);

    setPractice(randomizedList[0]);
    setSelectedPart(randomizedList[0].part);
    setSelectedOption(null);
    setIsChecked(false);
    setShowTranscript(false);
    setHasPlayedInExam(false);
    setExamTimer(null);
    setTestMode('minitest');
    questionStartTimeRef.current = Date.now();
  };

  const handleNextMiniTestQuestion = () => {
    const nextIndex = miniTestIndex + 1;
    if (nextIndex < miniTestQueue.length) {
      stopAudio();
      setMiniTestIndex(nextIndex);
      const nextPractice = miniTestQueue[nextIndex];
      setPractice(nextPractice);
      setSelectedPart(nextPractice.part);
      setSelectedOption(null);
      setIsChecked(false);
      setShowTranscript(false);
      setHasPlayedInExam(false);
      setExamTimer(null);
      questionStartTimeRef.current = Date.now();
    } else {
      // Completed Mini Test! Calculate comprehensive Score Report
      finishMiniTest();
    }
  };

  const finishMiniTest = () => {
    let correctCount = 0;
    const partA = { total: 0, correct: 0 };
    const partB = { total: 0, correct: 0 };
    const partC = { total: 0, correct: 0 };

    const evaluatedItems = miniTestQueue.map((item) => {
      const userAns = miniTestAnswers[item.id] || 'None';
      const isCorr = userAns === item.answer;
      if (isCorr) correctCount++;

      if (item.part === 'partA') {
        partA.total++;
        if (isCorr) partA.correct++;
      } else if (item.part === 'partB') {
        partB.total++;
        if (isCorr) partB.correct++;
      } else {
        partC.total++;
        if (isCorr) partC.correct++;
      }

      return { practice: item, userAnswer: userAns, isCorrect: isCorr };
    });

    const total = miniTestQueue.length;
    const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    const estimatedScore = Math.min(68, Math.max(31, Math.round(31 + (accuracy / 100) * 37)));

    setMiniTestResult({
      total,
      correct: correctCount,
      accuracy,
      estimatedScore,
      partABreakdown: partA,
      partBBreakdown: partB,
      partCBreakdown: partC,
      items: evaluatedItems,
    });
  };

  // Check Answer Handler
  const handleCheckAnswer = () => {
    if (!practice || isChecked) return;
    setIsChecked(true);
    setExamTimer(null);
    if (examTimerIntervalRef.current) clearTimeout(examTimerIntervalRef.current);

    const isCorrect = selectedOption === practice.answer;
    const timeSpent = Math.round((Date.now() - questionStartTimeRef.current) / 1000);

    if (testMode === 'minitest') {
      setMiniTestAnswers((prev) => ({ ...prev, [practice.id]: selectedOption || 'None' }));
    }

    const newHistoryItem: HistoryItem = {
      practice,
      userAnswer: selectedOption || 'None',
      isCorrect,
      timeSpentSeconds: timeSpent,
      date: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    };

    setHistory((prev) => [newHistoryItem, ...prev.slice(0, 49)]);
  };

  const toggleBookmark = (id: string) => {
    setBookmarkedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const sessionStats = useMemo(() => {
    const total = history.length;
    const correct = history.filter((h) => h.isCorrect).length;
    const accuracy = total > 0 ? (correct / total) * 100 : 0;
    const estimatedScore = total === 0 ? 31 : Math.min(68, Math.max(31, Math.round(31 + (accuracy / 100) * 37)));

    let streak = 0;
    for (const item of history) {
      if (item.isCorrect) streak++;
      else break;
    }

    return { total, correct, accuracy: Math.round(accuracy), estimatedScore, streak };
  }, [history]);

  const allWordBankItems = useMemo(() => {
    const map = new Map<string, VocabularyItem>();
    BUILT_IN_PRACTICES.forEach((p) => {
      p.vocabulary?.forEach((v) => map.set(v.phrase.toLowerCase(), v));
    });
    history.forEach((h) => {
      h.practice.vocabulary?.forEach((v) => map.set(v.phrase.toLowerCase(), v));
    });
    return Array.from(map.values());
  }, [history]);

  const isCurrentBookmarked = practice ? bookmarkedIds.includes(practice.id) : false;
  const isCurrentCorrect = practice && selectedOption === practice.answer;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-slate-100 transition-colors">
      <ProjectMenu activeApp="listening" />
      {/* Top Bar */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-8 py-3 transition-colors">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-sm shadow-teal-600/30">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white block leading-none font-display">
                TOEFL Listening Studio
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                ITP Section 1 · Short Conversations & Academic Lectures
              </span>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-5 text-xs text-slate-600 dark:text-slate-300 font-medium">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/60">
              <Award className="w-3.5 h-3.5 text-amber-500" />
              <span>Skor Sesi:</span>
              <span className="font-bold tabular-nums text-slate-900 dark:text-white">
                {sessionStats.correct} / {sessionStats.total}
              </span>
              <span className="text-slate-400">·</span>
              <span className="text-teal-600 dark:text-teal-400 font-semibold tabular-nums">
                {sessionStats.accuracy}%
              </span>
              <span className="text-slate-400">·</span>
              <span className="text-amber-600 dark:text-amber-400 font-bold" title="Estimasi skor Section 1 skala 31-68">
                Est. TOEFL: {sessionStats.estimatedScore}
              </span>
            </div>

            {sessionStats.streak > 1 && (
              <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-semibold">
                <Zap className="w-3.5 h-3.5 animate-bounce" />
                <span>{sessionStats.streak} Streak!</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={toggleAmbientNoise}
              title={isAmbientOn ? 'Matikan Suara Ambien' : 'Aktifkan Suara Ambien Kampus / Perpustakaan'}
              className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors border ${
                isAmbientOn
                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <Coffee className="w-4 h-4" />
              <span className="hidden xl:inline text-[11px]">{isAmbientOn ? 'Ambien On' : 'Ambien'}</span>
            </button>

            <button
              onClick={() => setActiveDrawer(activeDrawer === 'wordbank' ? 'none' : 'wordbank')}
              title="Daftar Kosakata & Idiom TOEFL"
              className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors border ${
                activeDrawer === 'wordbank'
                  ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border-teal-300 dark:border-teal-700'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span className="hidden xl:inline text-[11px]">Word Bank</span>
            </button>

            <button
              onClick={() => setActiveDrawer(activeDrawer === 'history' ? 'none' : 'history')}
              title="Riwayat Latihan & Bookmark"
              className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors border ${
                activeDrawer === 'history'
                  ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border-teal-300 dark:border-teal-700'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <History className="w-4 h-4" />
              <span className="hidden xl:inline text-[11px]">Riwayat ({history.length})</span>
            </button>

            <button
              onClick={() => {
                setTempApiKey(apiKey);
                setIsKeyModalOpen(true);
              }}
              title="Pengaturan Gemini API Key"
              className={`px-2.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-colors ${
                apiKey
                  ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800/60'
                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{apiKey ? 'API Siap' : 'Set Key'}</span>
            </button>

            <button
              onClick={() => setDarkMode(!darkMode)}
              aria-label={darkMode ? 'Aktifkan Mode Terang' : 'Aktifkan Mode Gelap'}
              title={darkMode ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
              className="p-2 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Mode Selector & Spectrum Tabs */}
        <section className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
            <button
              onClick={() => {
                setTestMode('practice');
                setExamTimer(null);
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                testMode === 'practice'
                  ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Latihan Bebas</span>
            </button>
            <button
              onClick={() => {
                setTestMode('exam');
                stopAudio();
                setHasPlayedInExam(false);
                setExamTimer(null);
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                testMode === 'exam'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Simulasi Ujian (1× Audio)</span>
            </button>
            <button
              onClick={startMiniTest}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                testMode === 'minitest'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Mini Diagnostic Test</span>
            </button>
          </div>

          {/* Part A / B / C Spectrum Selector */}
          {testMode !== 'minitest' && (
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
              {[
                { id: 'partA' as TOEFLPart, label: 'Part A', subtitle: 'Short Dialogues' },
                { id: 'partB' as TOEFLPart, label: 'Part B', subtitle: 'Long Dialogues' },
                { id: 'partC' as TOEFLPart, label: 'Part C', subtitle: 'Mini-Lectures' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setSelectedPart(p.id);
                    const matchingSample = BUILT_IN_PRACTICES.find((s) => s.part === p.id);
                    if (matchingSample) {
                      stopAudio();
                      setPractice(randomizeOptions(matchingSample));
                      setSelectedOption(null);
                      setIsChecked(false);
                      setShowTranscript(false);
                      setHasPlayedInExam(false);
                      setExamTimer(null);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                    selectedPart === p.id
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <span>{p.label}</span>
                  <span className="hidden md:inline text-[10px] opacity-75">· {p.subtitle}</span>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Mini Test In-Progress Banner */}
        {testMode === 'minitest' && !miniTestResult && (
          <div className="bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 p-4 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-sm">
                {miniTestIndex + 1}/{miniTestQueue.length}
              </div>
              <div>
                <h4 className="font-bold text-sm text-purple-950 dark:text-purple-200">
                  Paket Mini Diagnostic Test Berlangsung
                </h4>
                <p className="text-xs text-purple-700 dark:text-purple-400">
                  Soal ke-{miniTestIndex + 1}: {practice.part.toUpperCase()} ({practice.topic})
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setTestMode('practice');
                setMiniTestResult(null);
              }}
              className="text-xs text-purple-700 dark:text-purple-300 font-semibold hover:underline"
            >
              Batalkan Tes
            </button>
          </div>
        )}

        {/* Mini Test Comprehensive Score Report */}
        {testMode === 'minitest' && miniTestResult && (
          <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-md space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-1">
                  <Award className="w-4 h-4" />
                  <span>Rapor Hasil Mini Diagnostic Test</span>
                </div>
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white font-display">
                  Evaluasi Skor & Diagnosis Kelemahan
                </h2>
              </div>
              <button
                onClick={startMiniTest}
                className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 transition-colors flex items-center gap-1.5 self-start sm:self-auto"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Ulangi Mini-Test Baru</span>
              </button>
            </div>

            {/* Score Grid Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 text-center">
                <span className="text-xs text-purple-700 dark:text-purple-300 font-semibold">Estimasi Skor Section 1</span>
                <span className="text-3xl font-black font-display text-purple-900 dark:text-purple-100 block mt-1 tabular-nums">
                  {miniTestResult.estimatedScore}
                </span>
                <span className="text-[11px] text-purple-600 dark:text-purple-400">Skala resmi TOEFL 31–68</span>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-center">
                <span className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold">Tingkat Akurasi</span>
                <span className="text-3xl font-black font-display text-emerald-900 dark:text-emerald-100 block mt-1 tabular-nums">
                  {miniTestResult.accuracy}%
                </span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400">
                  {miniTestResult.correct} dari {miniTestResult.total} Soal Benar
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center">
                <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold">Status Kesiapan</span>
                <span className="text-xl font-bold font-display text-slate-900 dark:text-white block mt-2">
                  {miniTestResult.accuracy >= 80 ? 'Sangat Siap' : miniTestResult.accuracy >= 60 ? 'Cukup Siap' : 'Perlu Latihan'}
                </span>
                <span className="text-[11px] text-slate-500">Berdasarkan Section 1 Diagnostic</span>
              </div>
            </div>

            {/* Skill Breakdown Diagnosis */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <PieChart className="w-3.5 h-3.5 text-purple-600" />
                <span>Analisis Titik Lemah per Bagian (Section 1 Spectrum)</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 text-xs">
                  <div className="flex justify-between font-bold mb-1">
                    <span>Part A (Short Dialogues)</span>
                    <span>{miniTestResult.partABreakdown.correct}/{miniTestResult.partABreakdown.total}</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-teal-500 h-full rounded-full"
                      style={{
                        width: `${miniTestResult.partABreakdown.total > 0 ? (miniTestResult.partABreakdown.correct / miniTestResult.partABreakdown.total) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">Fokus: Ungkapan idiom & implikasi</span>
                </div>

                <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 text-xs">
                  <div className="flex justify-between font-bold mb-1">
                    <span>Part B (Long Dialogues)</span>
                    <span>{miniTestResult.partBBreakdown.correct}/{miniTestResult.partBBreakdown.total}</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-500 h-full rounded-full"
                      style={{
                        width: `${miniTestResult.partBBreakdown.total > 0 ? (miniTestResult.partBBreakdown.correct / miniTestResult.partBBreakdown.total) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">Fokus: Alur percakapan & detail fakta</span>
                </div>

                <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 text-xs">
                  <div className="flex justify-between font-bold mb-1">
                    <span>Part C (Mini-Lectures)</span>
                    <span>{miniTestResult.partCBreakdown.correct}/{miniTestResult.partCBreakdown.total}</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-purple-500 h-full rounded-full"
                      style={{
                        width: `${miniTestResult.partCBreakdown.total > 0 ? (miniTestResult.partCBreakdown.correct / miniTestResult.partCBreakdown.total) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">Fokus: Ide pokok ceramah & kosakata ilmiah</span>
                </div>
              </div>
            </div>

            {/* Review All Questions in Test */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Pembedahan Jawaban Soal Diagnostic
              </h4>
              <div className="space-y-2">
                {miniTestResult.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-400">#{idx + 1}</span>
                        <span className="font-bold text-teal-600 uppercase">{item.practice.part}</span>
                        <span className="text-slate-300 dark:text-slate-700">·</span>
                        <span className="text-slate-500">{item.practice.topic}</span>
                      </div>
                      <p className="font-medium text-slate-800 dark:text-slate-200">
                        {item.practice.question}
                      </p>
                      <span className="text-slate-500 block">
                        Kunci: <strong className="text-slate-800 dark:text-slate-200">{item.practice.answer}</strong> ·
                        Jawaban Anda: <strong className={item.isCorrect ? 'text-emerald-600' : 'text-rose-600'}>{item.userAnswer}</strong>
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        setPractice(item.practice);
                        setSelectedPart(item.practice.part);
                        setSelectedOption(item.userAnswer);
                        setIsChecked(true);
                        setShowTranscript(true);
                        setTestMode('practice');
                        setMiniTestResult(null);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold hover:bg-teal-50 dark:hover:bg-teal-950 transition-colors shrink-0"
                    >
                      Buka Pembahasan
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Regular Practice Arena (When not showing mini test result) */}
        {(!miniTestResult || testMode !== 'minitest') && practice && (
          <div className="space-y-6">
            {/* Audio Stage Console with Interactive Waveform & Scrubbing */}
            <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-7 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
                    {practice.part.toUpperCase()} Passage
                  </span>
                  <span className="text-slate-300 dark:text-slate-700">·</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {practice.topic}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleBookmark(practice.id)}
                    title={isCurrentBookmarked ? 'Hapus Bookmark' : 'Simpan ke Bookmark'}
                    className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1 border transition-colors ${
                      isCurrentBookmarked
                        ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 border-amber-300 dark:border-amber-700'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {isCurrentBookmarked ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                    <span className="text-[11px]">{isCurrentBookmarked ? 'Tersimpan' : 'Bookmark'}</span>
                  </button>

                  {testMode === 'practice' && (
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                      {[
                        { label: '0.75×', value: 0.72 },
                        { label: '1.0×', value: 0.95 },
                        { label: '1.25×', value: 1.2 },
                      ].map((s) => (
                        <button
                          key={s.label}
                          onClick={() => {
                            setPlaybackSpeed(s.value);
                            if (isPlaying) playPracticeAudio(s.value);
                          }}
                          className={`px-2 py-0.5 text-xs font-semibold rounded-lg transition-colors ${
                            playbackSpeed === s.value
                              ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-300 shadow-xs'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Main Playback Bar with Navigation Controls (-5s, +5s, Segments) */}
              <div className="mt-5 p-5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 space-y-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-5">
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    {/* Big Play / Stop Button */}
                    <button
                      onClick={() => {
                        if (isPlaying) {
                          stopAudio();
                        } else {
                          playPracticeAudio();
                        }
                      }}
                      disabled={testMode === 'exam' && hasPlayedInExam && !isPlaying}
                      aria-label={isPlaying ? 'Hentikan audio' : 'Putar audio'}
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-md shrink-0 ${
                        isPlaying
                          ? 'bg-rose-500 text-white shadow-rose-500/30 hover:bg-rose-600 scale-95'
                          : testMode === 'exam' && hasPlayedInExam
                          ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed'
                          : 'bg-teal-600 text-white shadow-teal-600/30 hover:bg-teal-700 hover:scale-105'
                      }`}
                    >
                      {isPlaying ? <Square className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 ml-0.5 fill-current" />}
                    </button>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 dark:text-white font-display">
                          {isPlaying
                            ? 'Sedang Diputar'
                            : testMode === 'exam' && hasPlayedInExam
                            ? 'Audio Selesai (1× Putar)'
                            : audioStatusText}
                        </span>
                        {isPlaying && (
                          <div className="flex items-end gap-1 h-4 ml-1">
                            <span className="w-1 bg-teal-500 rounded-full animate-wave-1" />
                            <span className="w-1 bg-teal-500 rounded-full animate-wave-2" />
                            <span className="w-1 bg-teal-500 rounded-full animate-wave-3" />
                            <span className="w-1 bg-teal-500 rounded-full animate-wave-4" />
                            <span className="w-1 bg-teal-500 rounded-full animate-wave-5" />
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400 block mt-0.5">
                        {testMode === 'exam'
                          ? hasPlayedInExam
                            ? 'Audio telah diputar satu kali sesuai aturan ujian resmi.'
                            : 'Klik Play untuk memulai audio simulasi ujian (1× pemutaran).'
                          : isPlaying
                          ? audioStatusText
                          : 'Tekan [Spasi] untuk Play / Stop, atau lompat antar-segmen.'}
                      </span>
                    </div>
                  </div>

                  {/* Secondary Controls (Scrubbing / Jump buttons in practice mode) */}
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    {testMode === 'exam' && examTimer !== null && (
                      <div className="px-4 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-bold text-xs flex items-center gap-2 animate-pulse">
                        <Clock className="w-4 h-4" />
                        <span>Sisa Waktu Jawab: {examTimer} detik</span>
                      </div>
                    )}

                    {testMode === 'practice' && (
                      <>
                        <button
                          onClick={() => jumpSegment(-1)}
                          title="Lompat ke Pembicara Sebelumnya"
                          className="px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-1"
                        >
                          <SkipBack className="w-3.5 h-3.5" />
                          <span>Prev</span>
                        </button>

                        <button
                          onClick={() => jumpSegment(1)}
                          title="Lompat ke Pembicara Berikutnya"
                          className="px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-1"
                        >
                          <span>Next</span>
                          <SkipForward className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => playPracticeAudio()}
                          title="Putar Ulang dari Awal"
                          className="px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-1"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Ulang</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Interactive Segment Scrubber Bar */}
                <div className="pt-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5 font-medium">
                    <span>Posisi Dialog:</span>
                    <span>
                      {currentSpeakerIndex !== null
                        ? `Segmen ${currentSpeakerIndex + 1} dari ${practice.segments.length}`
                        : 'Belum diputar'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-1.5">
                    {practice.segments.map((seg, sIdx) => {
                      const isActive = currentSpeakerIndex === sIdx && isPlaying;
                      return (
                        <button
                          key={sIdx}
                          disabled={testMode === 'exam'}
                          onClick={() => playSingleSegment(seg, sIdx)}
                          className={`p-2 rounded-lg text-left transition-all border ${
                            isActive
                              ? 'bg-teal-100 dark:bg-teal-950/80 border-teal-500 text-teal-900 dark:text-teal-200 shadow-xs'
                              : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-teal-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[11px] truncate">{seg.speaker}</span>
                            <span className="text-[10px] opacity-75">
                              {seg.gender === 'female' ? 'F' : 'M'}
                            </span>
                          </div>
                          <span className="text-[10px] block text-slate-400 truncate mt-0.5">
                            {testMode === 'practice' && showTranscript
                              ? seg.text
                              : `Spoken Segment #${sIdx + 1}`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>

            {/* Comprehension Question Card */}
            <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-7 shadow-xs">
              <div className="mb-5">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Pertanyaan Pemahaman</span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Pintasan keyboard: [1-4] atau [A-D]
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-snug">
                  {practice.question}
                </h3>
              </div>

              {/* Multiple Choice Cards */}
              <div className="space-y-2.5">
                {practice.options.map((option, idx) => {
                  const letter = String.fromCharCode(65 + idx);
                  const isSelected = selectedOption === letter;
                  const isCorrectAnswer = letter === practice.answer;

                  let borderClass = 'border-slate-200 dark:border-slate-700/80 hover:border-teal-400 dark:hover:border-teal-500';
                  let bgClass = 'bg-white dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800';

                  if (isSelected && !isChecked) {
                    borderClass = 'border-teal-600 dark:border-teal-400 ring-2 ring-teal-500/20';
                    bgClass = 'bg-teal-50/60 dark:bg-teal-950/30';
                  }

                  if (isChecked) {
                    if (isCorrectAnswer) {
                      borderClass = 'border-emerald-500 dark:border-emerald-500 ring-2 ring-emerald-500/20';
                      bgClass = 'bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100';
                    } else if (isSelected && !isCorrectAnswer) {
                      borderClass = 'border-rose-500 dark:border-rose-500 ring-2 ring-rose-500/20';
                      bgClass = 'bg-rose-50/70 dark:bg-rose-950/40 text-rose-900 dark:text-rose-100';
                    } else {
                      bgClass = 'opacity-40 bg-slate-50 dark:bg-slate-900/40';
                    }
                  }

                  return (
                    <button
                      key={letter}
                      type="button"
                      disabled={isChecked}
                      onClick={() => setSelectedOption(letter)}
                      className={`w-full text-left p-4 rounded-xl border transition-all flex items-start gap-3.5 ${borderClass} ${bgClass}`}
                    >
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                          isChecked && isCorrectAnswer
                            ? 'bg-emerald-600 text-white'
                            : isChecked && isSelected && !isCorrectAnswer
                            ? 'bg-rose-600 text-white'
                            : isSelected
                            ? 'bg-teal-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {letter}
                      </div>
                      <div className="flex-1 text-sm sm:text-base font-medium text-slate-800 dark:text-slate-200 pt-0.5 leading-relaxed">
                        {option}
                      </div>

                      {isChecked && isCorrectAnswer && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      )}
                      {isChecked && isSelected && !isCorrectAnswer && (
                        <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Action and Evaluation Status */}
              <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                {!isChecked ? (
                  <button
                    onClick={handleCheckAnswer}
                    disabled={!selectedOption}
                    className="w-full sm:w-auto px-7 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Periksa Jawaban (Enter)
                  </button>
                ) : (
                  <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                    {testMode === 'minitest' ? (
                      <button
                        onClick={handleNextMiniTestQuestion}
                        className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm flex items-center gap-2 shadow-sm transition-all"
                      >
                        <span>
                          {miniTestIndex + 1 < miniTestQueue.length
                            ? 'Soal Tes Berikutnya →'
                            : 'Lihat Rapor Hasil Tes'}
                        </span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleGenerate(topic, selectedPart)}
                        disabled={isGenerating}
                        className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm flex items-center gap-2 shadow-sm transition-all"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>Latihan Berikutnya (Enter)</span>
                      </button>
                    )}

                    <button
                      onClick={() => setShowTranscript(!showTranscript)}
                      className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-xs transition-colors flex items-center gap-1.5"
                    >
                      <BookOpen className="w-4 h-4" />
                      <span>{showTranscript ? 'Tutup Transkrip' : 'Buka Skrip Dialog & Shadowing'}</span>
                    </button>
                  </div>
                )}

                {isChecked && (
                  <div
                    className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 ${
                      isCurrentCorrect
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                    }`}
                  >
                    {isCurrentCorrect ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span>Benar! Kunci: ({practice.answer})</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                        <span>Kurang Tepat. Jawaban Benar: {practice.answer}</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Detailed Explanation & Distractor Trap Analysis */}
              {isChecked && (
                <div className="mt-6 space-y-4 pt-4 border-t border-slate-200/80 dark:border-slate-800">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/60">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400 mb-1 flex items-center gap-1.5">
                      <Lightbulb className="w-4 h-4" />
                      <span>Penjelasan Kunci Jawaban (Opsi {practice.answer})</span>
                    </h4>
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                      {practice.explanation}
                    </p>
                  </div>

                  {practice.distractors && practice.distractors.length > 0 && (
                    <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-800/40">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 mb-2 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Analisis Jebakan Soal (Distractor Analysis)</span>
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                        {practice.distractors.map((dist, idx) => (
                          <div
                            key={idx}
                            className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-lg border border-amber-200/50 dark:border-amber-800/30 text-xs"
                          >
                            <div className="font-bold text-slate-900 dark:text-white mb-1 flex items-center justify-between">
                              <span>Pilihan {dist.option}</span>
                              <span className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950">
                                {dist.trapType}
                              </span>
                            </div>
                            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                              {dist.reason}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Revealed Transcript with Interactive Shadowing & Speech-to-Text */}
              {isChecked && (showTranscript || isChecked) && (
                <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                      <span>Transkrip Skrip Dialog & Latihan Shadowing</span>
                    </h4>
                    <span className="text-xs text-slate-400">Klik ikon Mic untuk latihan menirukan ucapan (*Shadowing*)</span>
                  </div>

                  <div className="space-y-3">
                    {practice.segments.map((seg, idx) => (
                      <div
                        key={idx}
                        className={`p-4 rounded-xl border transition-all space-y-2.5 ${
                          currentSpeakerIndex === idx && isPlaying
                            ? 'bg-teal-50 dark:bg-teal-950/50 border-teal-400 dark:border-teal-600'
                            : 'bg-white dark:bg-slate-800/40 border-slate-200/70 dark:border-slate-700/60'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                                seg.gender === 'female'
                                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
                                  : 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                              }`}
                            >
                              {seg.speaker.charAt(0)}
                            </div>

                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                  {seg.speaker}
                                </span>
                                <span className="text-[10px] text-slate-400 font-medium">
                                  ({seg.gender === 'female' ? 'Wanita' : 'Pria'})
                                </span>
                              </div>
                              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                                {seg.text}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {/* Listen segment button */}
                            <button
                              onClick={() => playSingleSegment(seg, idx)}
                              title="Dengarkan kalimat ini"
                              className="p-2 rounded-lg text-slate-500 hover:text-teal-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            >
                              <Volume2 className="w-4 h-4" />
                            </button>

                            {/* Shadowing Practice Mic Button */}
                            <button
                              onClick={() => startShadowing(seg.text, idx)}
                              title="Tirukan kalimat ini (Shadowing)"
                              className={`p-2 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold ${
                                shadowingSegmentIndex === idx && isRecordingShadow
                                  ? 'bg-rose-500 text-white animate-pulse'
                                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-teal-50 dark:hover:bg-teal-950 hover:text-teal-600'
                              }`}
                            >
                              {shadowingSegmentIndex === idx && isRecordingShadow ? (
                                <MicOff className="w-4 h-4" />
                              ) : (
                                <Mic className="w-4 h-4" />
                              )}
                              <span className="hidden sm:inline">
                                {shadowingSegmentIndex === idx && isRecordingShadow ? 'Merekam...' : 'Shadow'}
                              </span>
                            </button>
                          </div>
                        </div>

                        {/* Shadowing Evaluation Display */}
                        {shadowingSegmentIndex === idx && (recognizedText || shadowScore !== null) && (
                          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="text-slate-600 dark:text-slate-400">
                              <span className="font-semibold text-slate-800 dark:text-slate-200">Ucapan Anda: </span>
                              <span className="italic">"{recognizedText || 'Mendengarkan ucapan Anda...'}"</span>
                            </div>

                            {shadowScore !== null && (
                              <div
                                className={`px-2.5 py-1 rounded-md font-bold text-xs self-start sm:self-auto ${
                                  shadowScore >= 80
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                    : shadowScore >= 50
                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                }`}
                              >
                                {shadowScore}% Kemiripan ({shadowScore >= 80 ? 'Hebat!' : 'Coba Lagi'})
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Vocabulary Highlights */}
                  {practice.vocabulary && practice.vocabulary.length > 0 && (
                    <div className="mt-5 p-4 rounded-xl bg-teal-50/50 dark:bg-teal-950/30 border border-teal-200/60 dark:border-teal-800/50">
                      <h5 className="text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300 mb-2 flex items-center gap-1.5">
                        <Sparkle className="w-3.5 h-3.5 text-teal-600" />
                        <span>Kosakata & Idiom TOEFL dari Dialog Ini</span>
                      </h5>
                      <div className="flex flex-wrap gap-2">
                        {practice.vocabulary.map((vocab, vIdx) => (
                          <button
                            key={vIdx}
                            onClick={() => setActiveVocabPopup(vocab)}
                            className="text-left px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-teal-200 dark:border-teal-700/60 text-xs hover:border-teal-400 transition-colors flex items-center gap-1.5 shadow-xs"
                          >
                            <span className="font-bold text-teal-700 dark:text-teal-300">
                              {vocab.phrase}
                            </span>
                            <span className="text-slate-400">·</span>
                            <span className="text-slate-600 dark:text-slate-400">
                              {vocab.meaning.substring(0, 32)}...
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>
          </div>
        )}
      </main>

      {/* Vocabulary Detail Modal Popup */}
      {activeVocabPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 max-w-sm w-full shadow-2xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                Pembedahan Kosakata TOEFL
              </span>
              <button
                onClick={() => setActiveVocabPopup(null)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white font-display">
                "{activeVocabPopup.phrase}"
              </h4>
              <p className="text-sm font-medium text-teal-700 dark:text-teal-300 mt-1">
                {activeVocabPopup.meaning}
              </p>
            </div>
            {activeVocabPopup.context && (
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 text-xs text-slate-600 dark:text-slate-400 italic">
                "{activeVocabPopup.context}"
              </div>
            )}
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setActiveVocabPopup(null)}
                className="px-4 py-1.5 rounded-lg bg-teal-600 text-white font-semibold text-xs hover:bg-teal-700 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Drawer: History & Bookmarks */}
      {activeDrawer === 'history' && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 h-full p-6 shadow-2xl overflow-y-auto flex flex-col border-l border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white font-display">
                  Riwayat & Bookmark Latihan
                </h3>
              </div>
              <button
                onClick={() => setActiveDrawer('none')}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3 flex-1 overflow-y-auto">
              {history.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  Belum ada soal yang dikerjakan pada sesi ini.
                </div>
              ) : (
                history.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold uppercase tracking-wider text-[10px] text-teal-600">
                        {item.practice.part.toUpperCase()} · {item.practice.topic}
                      </span>
                      <span className="text-[10px] text-slate-400">{item.date}</span>
                    </div>

                    <p className="font-medium text-slate-800 dark:text-slate-200 line-clamp-2">
                      {item.practice.question}
                    </p>

                    <div className="flex items-center justify-between pt-1">
                      <span
                        className={`font-semibold ${
                          item.isCorrect ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {item.isCorrect ? 'Benar' : `Salah (Dijawab: ${item.userAnswer})`}
                      </span>
                      <button
                        onClick={() => {
                          setPractice(item.practice);
                          setActiveDrawer('none');
                        }}
                        className="text-teal-600 dark:text-teal-400 font-bold hover:underline"
                      >
                        Buka Soal Ini
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {history.length > 0 && (
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-between">
                <button
                  onClick={() => {
                    if (confirm('Bersihkan seluruh riwayat latihan?')) {
                      setHistory([]);
                    }
                  }}
                  className="text-xs text-rose-600 font-semibold hover:underline"
                >
                  Hapus Riwayat
                </button>
                <button
                  onClick={() => setActiveDrawer('none')}
                  className="px-4 py-1.5 rounded-lg bg-teal-600 text-white font-bold text-xs"
                >
                  Tutup
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Drawer: Word Bank */}
      {activeDrawer === 'wordbank' && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 h-full p-6 shadow-2xl overflow-y-auto flex flex-col border-l border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white font-display">
                  Word Bank & Idiom ({allWordBankItems.length})
                </h3>
              </div>
              <button
                onClick={() => setActiveDrawer('none')}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 py-3">
              Kumpulan ungkapan idiomatis dan kosakata akademis yang sering muncul di Section 1 TOEFL ITP.
            </p>

            <div className="space-y-3 flex-1 overflow-y-auto pb-4">
              {allWordBankItems.map((w, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-1 text-xs"
                >
                  <div className="font-bold text-teal-700 dark:text-teal-300 text-sm">
                    {w.phrase}
                  </div>
                  <div className="font-medium text-slate-700 dark:text-slate-300">
                    {w.meaning}
                  </div>
                  {w.context && (
                    <div className="text-[11px] text-slate-500 italic mt-1 bg-white dark:bg-slate-800 p-2 rounded border border-slate-200/50 dark:border-slate-700/50">
                      "{w.context}"
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setActiveDrawer('none')}
                className="px-5 py-2 rounded-lg bg-teal-600 text-white font-bold text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Gemini API Key Configuration Modal */}
      {isKeyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-slate-900 dark:text-white">
              <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg font-display">Konfigurasi Gemini API Key</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Menggunakan model Gemini 3.5 Flash Lite untuk Section 1 TOEFL
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                API Key Gemini
              </label>
              <input
                type="password"
                value={tempApiKey}
                onChange={(e) => setTempApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                Kunci ini disimpan langsung di penyimpanan lokal peramban (localStorage) dan hanya digunakan untuk memanggil endpoint resmi Google Generative AI.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setIsKeyModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Tutup
              </button>
              <button
                onClick={() => {
                  const trimmed = tempApiKey.trim();
                  setApiKey(trimmed);
                  localStorage.setItem('gemini_api_key', trimmed);
                  setIsKeyModalOpen(false);
                  if (trimmed) {
                    setStatusMessage({ text: 'API Key berhasil disimpan.', type: 'success' });
                  }
                }}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-xs transition-colors"
              >
                Simpan Kunci
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 py-6 px-4 text-center text-xs text-slate-500 dark:text-slate-400 transition-colors">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>TOEFL ITP Listening Studio · Powered by Gemini 3.5 Flash Lite</span>
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                setTempApiKey(apiKey);
                setIsKeyModalOpen(true);
              }}
              className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
            >
              Ubah API Key
            </button>
            <span aria-hidden="true">·</span>
            <span>Speech Recognition & Synthesis Enabled</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
