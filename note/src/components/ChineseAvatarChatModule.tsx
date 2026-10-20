import React, { useState, useEffect, useRef } from 'react';
import {
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Send,
  RotateCcw,
  Sparkles,
  BookmarkPlus,
  Languages,
  CheckCircle2,
  Loader2,
  Award,
  Plus,
  X,
  BookOpen,
  HelpCircle,
  Keyboard
} from 'lucide-react';
import { ChineseAvatarPersona, ChineseChatMessage, ChineseScenarioOption, ConversationCard, FluencyScorecard } from '../types';
import { generateChineseAvatarReply, speakChineseVoice, evaluateChineseConversationSession } from '../utils/gemini';
import { logActivity } from '../utils/srs';
import { ScorecardModal } from './ScorecardModal';
import { ChineseVirtualKeyboard, VOWEL_TONE_MAP } from './ChineseVirtualKeyboard';
import avatarChineseLin from '../assets/images/avatar_chinese_lin_1792244188711.jpg';
import avatarChineseWei from '../assets/images/avatar_chinese_wei_1792244206599.jpg';

const CHINESE_PERSONAS: ChineseAvatarPersona[] = [
  {
    id: 'lin_laoshi',
    name: 'Lin Laoshi',
    chineseName: '林老师 (Lin Laoshi)',
    role: 'Tutor Mandarin Standar & Pelatih HSK',
    accent: 'Standard Mandarin (普通话 - Beijing)',
    voiceGender: 'female',
    bio: 'Ramah, sabar, pelafalan nada sangat jelas dan presisi, ahli membimbing pemula hingga tingkat lanjut.',
    imagePath: avatarChineseLin,
    defaultGreetingHanzi: '你好！欢迎和我一起练习中文。今天想聊些什么？',
    defaultGreetingPinyin: 'Nǐ hǎo! Huānyíng hé wǒ yīqǐ liànxí zhōngwén. Jīntiān xiǎng liáo xiē shénme?',
    defaultGreetingTranslation: 'Halo! Selamat datang untuk latihan bahasa Mandarin bersamaku. Apa yang ingin kamu bicarakan hari ini?'
  },
  {
    id: 'li_wei',
    name: 'Li Wei',
    chineseName: '李伟 (Li Wei)',
    role: 'Teman Percakapan Kasual, Kuliner & Wisata',
    accent: 'Standard Mandarin (普通话 - Universal)',
    voiceGender: 'male',
    bio: 'Santai, penuh semangat, menyukai obrolan tentang makanan khas Tiongkok, travelling, budaya, dan teknologi.',
    imagePath: avatarChineseWei,
    defaultGreetingHanzi: '嘿，你好！今天过得怎么样？你想喝杯咖啡还是聊聊天？',
    defaultGreetingPinyin: 'Hēi, nǐ hǎo! Jīntiān guò de zěnmeyàng? Nǐ xiǎng hē bēi kāfēi háishì liáoliáo tiān?',
    defaultGreetingTranslation: 'Hei, halo! Bagaimana harimu? Mau minum kopi atau ngobrol santai?'
  }
];

const DEFAULT_CHINESE_SCENARIOS: ChineseScenarioOption[] = [
  {
    id: 'ordering_food',
    title: 'Pesan Minuman & Makanan',
    chineseTitle: '点餐与咖啡馆 (Diǎn Cān)',
    category: 'Kuliner',
    description: 'Pesan boba milk tea, kopi, atau makanan favorit di kafe/restoran.',
    starterPromptHanzi: '您好！欢迎光临。请问您想喝点什么？我们今天的招牌奶茶很好喝！',
    starterPromptPinyin: 'Nínhǎo! Huānyíng guānglín. Qǐngwèn nín xiǎng hē diǎn shénme? Wǒmen jīntiān de zhāopái nǎichá hěn hǎohē!',
    starterPromptTranslation: 'Halo! Selamat datang. Mau minum apa? Milk tea andalan kami hari ini sangat enak!'
  },
  {
    id: 'shopping_bargain',
    title: 'Belanja & Menawar Harga',
    chineseTitle: '买东西与砍价 (Mǎi Dōngxi)',
    category: 'Belanja',
    description: 'Menanyakan harga barang, warna, ukuran, dan menawar dengan sopan.',
    starterPromptHanzi: '老板好！这件红色的衣服真好看，请问多少钱一件？',
    starterPromptPinyin: 'Lǎobǎn hǎo! Zhè jiàn hóngsè de yīfu zhēn hǎokàn, qǐngwèn duōshao qián yí jiàn?',
    starterPromptTranslation: 'Halo bos! Pakaian warna merah ini bagus sekali, harganya berapa satu potong?'
  },
  {
    id: 'asking_directions',
    title: 'Tanya Jalan & Naik Kereta',
    chineseTitle: '问路与搭乘地铁 (Wèn Lù)',
    category: 'Travel',
    description: 'Menanyakan arah ke stasiun MRT, hotel, atau objek wisata terkenal.',
    starterPromptHanzi: '请问一下，去最近的地铁站怎么走？需要坐公交车吗？',
    starterPromptPinyin: 'Qǐngwèn yíxià, qù zuìjìn de dìtiězhàn zěnme zǒu? Xūyào zuò gōngjiāochē ma?',
    starterPromptTranslation: 'Permisi, bagaimana cara pergi ke stasiun MRT terdekat? Apakah perlu naik bus?'
  },
  {
    id: 'making_friends',
    title: 'Kenalan & Hobi Sehari-hari',
    chineseTitle: '交朋友与日常 (Jiāo Péngyou)',
    category: 'Kasual',
    description: 'Perkenalan diri, menanyakan asal, hobi, dan obrolan santai.',
    starterPromptHanzi: '很高兴认识你！我平常喜欢听音乐和旅行，你的爱好是什么呢？',
    starterPromptPinyin: 'Hěn gāoxìng rènshi nǐ! Wǒ píngcháng xǐhuan tīng yīnyuè hé lǚxíng, nǐ de àihào shì shénme ne?',
    starterPromptTranslation: 'Senang berkenalan denganmu! Biasanya aku suka dengar musik dan jalan-jalan, hobimu apa?'
  },
  {
    id: 'business_work',
    title: 'Pertemuan Bisnis & Kantor',
    chineseTitle: '职场与商务交流 (Zhíchǎng)',
    category: 'Karier',
    description: 'Simulasi percakapan formal kantor, perkenalan tim, dan rencana kerja.',
    starterPromptHanzi: '您好！非常荣幸今天能与贵团队沟通合作方案。请问我们从哪一部分开始？',
    starterPromptPinyin: 'Nínhǎo! Fēicháng róngxìng jīntiān néng yǔ guì tuánduì gōutōng hézuò fāng\'àn. Qǐngwèn wǒmen cóng nǎ yí bùfen kāishǐ?',
    starterPromptTranslation: 'Halo! Suatu kehormatan hari ini bisa berkomunikasi mengenai rencana kerja sama dengan tim Anda. Dari bagian mana kita mulai?'
  }
];

interface ChineseAvatarChatModuleProps {
  hasApiKey: boolean;
  onOpenApiKeyModal: () => void;
  onShowToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  onSaveToCards: (card: ConversationCard) => void;
  onInsertToNotes?: (sentence: string, translation: string) => void;
  onActivityLogged?: () => void;
}

export const ChineseAvatarChatModule: React.FC<ChineseAvatarChatModuleProps> = ({
  hasApiKey,
  onOpenApiKeyModal,
  onShowToast,
  onSaveToCards,
  onInsertToNotes,
  onActivityLogged
}) => {
  const [selectedPersona, setSelectedPersona] = useState<ChineseAvatarPersona>(CHINESE_PERSONAS[0]);

  // Scenarios state with custom persistence
  const [scenarios, setScenarios] = useState<ChineseScenarioOption[]>(() => {
    try {
      const saved = localStorage.getItem('custom_chinese_scenarios_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return [...DEFAULT_CHINESE_SCENARIOS, ...parsed];
        }
      }
    } catch {
      // ignore
    }
    return DEFAULT_CHINESE_SCENARIOS;
  });

  const [selectedScenario, setSelectedScenario] = useState<ChineseScenarioOption>(DEFAULT_CHINESE_SCENARIOS[0]);
  const [autoVoice, setAutoVoice] = useState(true);
  const [showPinyin, setShowPinyin] = useState(true);
  const [speechRate, setSpeechRate] = useState<number>(0.88);
  const [isAvatarSpeaking, setIsAvatarSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isLoadingReply, setIsLoadingReply] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [showTranslations, setShowTranslations] = useState<Record<string, boolean>>({});
  const [showVirtualKeyboard, setShowVirtualKeyboard] = useState<boolean>(() => {
    return localStorage.getItem('chinese_virtual_keyboard_open') !== 'false';
  });
  const [activeInputVowel, setActiveInputVowel] = useState<string | null>(null);
  const [toneStripMode, setToneStripMode] = useState<'grouped' | 'all'>('grouped');

  // Scorecard modal state
  const [scorecard, setScorecard] = useState<FluencyScorecard | null>(null);
  const [isScorecardOpen, setIsScorecardOpen] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);

  // Custom scenario modal state
  const [showAddScenarioModal, setShowAddScenarioModal] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customChineseTitle, setCustomChineseTitle] = useState('');
  const [customCategory, setCustomCategory] = useState('Khusus');
  const [customContext, setCustomContext] = useState('');
  const [customStarterHanzi, setCustomStarterHanzi] = useState('');
  const [customStarterPinyin, setCustomStarterPinyin] = useState('');
  const [customStarterTrans, setCustomStarterTrans] = useState('');

  const [messages, setMessages] = useState<ChineseChatMessage[]>(() => [
    {
      id: 'zh-greeting-1',
      sender: 'avatar',
      hanzi: CHINESE_PERSONAS[0].defaultGreetingHanzi,
      pinyin: CHINESE_PERSONAS[0].defaultGreetingPinyin,
      translation: CHINESE_PERSONAS[0].defaultGreetingTranslation,
      hskLevel: 'HSK 1',
      vocabularyList: [
        { word: '练习', pinyin: 'liànxí', meaning: 'berlatih / latihan' },
        { word: '中文', pinyin: 'zhōngwén', meaning: 'bahasa Mandarin' },
        { word: '今天', pinyin: 'jīntiān', meaning: 'hari ini' }
      ],
      timestamp: Date.now()
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoadingReply]);

  // Voice speech synthesis for Chinese avatar
  const speakText = (text: string) => {
    speakChineseVoice(
      text,
      { voiceGender: selectedPersona.voiceGender, rate: speechRate },
      () => setIsAvatarSpeaking(true),
      () => setIsAvatarSpeaking(false)
    );
  };

  // Change persona
  const handleSelectPersona = (persona: ChineseAvatarPersona) => {
    setSelectedPersona(persona);
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setIsAvatarSpeaking(false);
    const initialMsg: ChineseChatMessage = {
      id: `zh-greeting-${Date.now()}`,
      sender: 'avatar',
      hanzi: persona.defaultGreetingHanzi,
      pinyin: persona.defaultGreetingPinyin,
      translation: persona.defaultGreetingTranslation,
      hskLevel: 'HSK 1',
      timestamp: Date.now()
    };
    setMessages([initialMsg]);
    if (autoVoice) {
      setTimeout(() => speakText(persona.defaultGreetingHanzi), 300);
    }
  };

  // Change scenario
  const handleSelectScenario = (scenario: ChineseScenarioOption) => {
    setSelectedScenario(scenario);
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setIsAvatarSpeaking(false);
    const starterMsg: ChineseChatMessage = {
      id: `zh-scenario-${Date.now()}`,
      sender: 'avatar',
      hanzi: scenario.starterPromptHanzi,
      pinyin: scenario.starterPromptPinyin,
      translation: scenario.starterPromptTranslation,
      hskLevel: 'HSK 1-2',
      timestamp: Date.now()
    };
    setMessages([starterMsg]);
    if (autoVoice) {
      setTimeout(() => speakText(scenario.starterPromptHanzi), 300);
    }
  };

  // Create custom scenario
  const handleSaveCustomScenario = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim() || !customContext.trim()) {
      onShowToast('Mohon isi judul dan deskripsi skenario.', 'info');
      return;
    }

    const newScenario: ChineseScenarioOption = {
      id: `custom-zh-${Date.now()}`,
      title: customTitle.trim(),
      chineseTitle: customChineseTitle.trim() || customTitle.trim(),
      category: customCategory.trim() || 'Custom',
      description: customContext.trim(),
      starterPromptHanzi: customStarterHanzi.trim() || '你好！很高兴和你聊天，我们开始吧！',
      starterPromptPinyin: customStarterPinyin.trim() || 'Nǐ hǎo! Hěn gāoxìng hé nǐ liáotiān, wǒmen kāishǐ ba!',
      starterPromptTranslation: customStarterTrans.trim() || 'Halo! Senang bisa mengobrol denganmu, mari kita mulai!',
      isCustom: true
    };

    const updated = [...scenarios, newScenario];
    setScenarios(updated);

    const customOnly = updated.filter(s => s.isCustom);
    localStorage.setItem('custom_chinese_scenarios_v1', JSON.stringify(customOnly));

    setSelectedScenario(newScenario);
    setShowAddScenarioModal(false);
    setCustomTitle('');
    setCustomChineseTitle('');
    setCustomContext('');
    setCustomStarterHanzi('');
    setCustomStarterPinyin('');
    setCustomStarterTrans('');

    handleSelectScenario(newScenario);
    onShowToast(`Skenario Mandarin "${newScenario.title}" berhasil dibuat!`, 'success');
  };

  // Toggle voice recognition with zh-CN
  const toggleListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      onShowToast('Browser kamu belum mendukung Speech Recognition. Silakan ketik langsung pesanmu (Hanzi atau Pinyin).', 'info');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'zh-CN';
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
        setIsAvatarSpeaking(false);
      };

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((res: any) => res[0].transcript)
          .join('');
        setUserInput(transcript);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  // Send message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = userInput.trim();
    if (!text || isLoadingReply) return;

    if (!hasApiKey) {
      onOpenApiKeyModal();
      return;
    }

    // Stop listening if active
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    const userMsg: ChineseChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      hanzi: text,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setUserInput('');
    setIsLoadingReply(true);

    // Save avatar interaction counter
    try {
      const current = Number(localStorage.getItem('avatar_messages_count_v1') || 0) + 1;
      localStorage.setItem('avatar_messages_count_v1', String(current));
    } catch {
      // ignore
    }

    try {
      const chatHistory = messages.map(m => ({ sender: m.sender, text: m.hanzi }));
      const response = await generateChineseAvatarReply({
        personaName: selectedPersona.name,
        chineseName: selectedPersona.chineseName,
        personaRole: selectedPersona.role,
        personaBio: selectedPersona.bio,
        scenarioTitle: `${selectedScenario.title} (${selectedScenario.chineseTitle})`,
        scenarioContext: selectedScenario.description,
        chatHistory,
        userMessage: text
      });

      const avatarMsg: ChineseChatMessage = {
        id: `avatar-${Date.now()}`,
        sender: 'avatar',
        hanzi: response.hanzi,
        pinyin: response.pinyin,
        translation: response.indonesianTranslation,
        hskLevel: response.hskLevel,
        vocabularyList: response.vocabularyList,
        quickTip: response.quickTip,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, avatarMsg]);
      logActivity('review');
      onActivityLogged?.();

      if (autoVoice) {
        speakText(response.hanzi);
      }
    } catch (err: unknown) {
      onShowToast(err instanceof Error ? err.message : 'Gagal mendapatkan balasan dari tutor Mandarin.', 'error');
    } finally {
      setIsLoadingReply(false);
    }
  };

  // Evaluate conversation session (Scorecard)
  const handleEvaluateSession = async () => {
    const userMsgCount = messages.filter(m => m.sender === 'user').length;
    if (userMsgCount === 0) {
      onShowToast('Belum ada pesan dari kamu untuk dievaluasi. Kirim minimal satu balasan.', 'info');
      return;
    }

    if (!hasApiKey) {
      onOpenApiKeyModal();
      return;
    }

    setIsEvaluating(true);
    onShowToast('Gemini sedang menganalisis sesi percakapan Mandarin kamu...', 'info');

    try {
      const result = await evaluateChineseConversationSession({
        personaName: selectedPersona.name,
        scenarioTitle: selectedScenario.title,
        chatMessages: messages.map(m => ({ sender: m.sender, text: m.hanzi }))
      });
      setScorecard(result);
      setIsScorecardOpen(true);
      onShowToast('Rapor evaluasi Mandarin siap dilihat!', 'success');
    } catch (err: unknown) {
      onShowToast(err instanceof Error ? err.message : 'Gagal mengevaluasi percakapan Mandarin.', 'error');
    } finally {
      setIsEvaluating(false);
    }
  };

  // Toggle individual translation
  const toggleTranslation = (id: string) => {
    setShowTranslations(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // 1-click Save to Conversation Card
  const handleSaveToCards = (msg: ChineseChatMessage) => {
    const card: ConversationCard = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      sentence: msg.hanzi,
      translationId: `${msg.pinyin ? `[${msg.pinyin}] ` : ''}${msg.translation || 'Bahasa Mandarin'}`,
      situation: `${selectedScenario.title} bersama ${selectedPersona.chineseName}`,
      condition: `percakapan bahasa Mandarin (HSK ${msg.hskLevel || 'Dasar'})`,
      repetition: 0,
      interval: 0,
      easiness: 2.5,
      nextReviewDate: new Date().toISOString()
    };
    onSaveToCards(card);
    onShowToast(`Kalimat dari ${selectedPersona.name} disimpan ke Flashcard!`, 'success');
  };

  // 1-click Insert to Note
  const handleInsertToNote = (msg: ChineseChatMessage) => {
    if (onInsertToNotes) {
      const formatted = `${msg.hanzi} (${msg.pinyin || ''})`;
      onInsertToNotes(formatted, msg.translation || '');
      onShowToast(`Disalin ke Catatan aktif!`, 'success');
    } else {
      navigator.clipboard?.writeText(`${msg.hanzi}\n${msg.pinyin || ''}\n${msg.translation || ''}`);
      onShowToast('Teks Mandarin disalin ke papan klip!', 'info');
    }
  };

  const userTurnsCount = messages.filter(m => m.sender === 'user').length;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[720px] transition-colors">
      {/* Left Stage: Realistic Human Mandarin Avatar Presentation */}
      <aside className="lg:col-span-5 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 p-6 flex flex-col justify-between">
        <div className="space-y-5">
          {/* Persona Switcher Chips */}
          <div className="flex items-center gap-2 p-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
            {CHINESE_PERSONAS.map(p => {
              const active = p.id === selectedPersona.id;
              return (
                <button
                  key={p.id}
                  onClick={() => handleSelectPersona(p)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                    active
                      ? 'bg-rose-600 text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  <span>{p.chineseName}</span>
                </button>
              );
            })}
          </div>

          {/* Avatar Realistic Human Portrait Stage */}
          <div className="relative mx-auto w-48 h-48 sm:w-56 sm:h-56">
            {/* Waveform Halo when Speaking */}
            {isAvatarSpeaking && (
              <div className="absolute inset-0 rounded-full border-4 border-rose-500/60 animate-ping pointer-events-none" />
            )}

            <div
              className={`relative w-full h-full rounded-full overflow-hidden border-4 transition-all duration-300 shadow-md ${
                isAvatarSpeaking
                  ? 'border-rose-500 shadow-rose-500/20'
                  : isListening
                  ? 'border-blue-500 shadow-blue-500/20'
                  : 'border-white dark:border-slate-800'
              }`}
            >
              <img
                src={selectedPersona.imagePath}
                alt={selectedPersona.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center"
              />
            </div>

            {/* Speaking Status Pill */}
            <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full shadow-xs flex items-center gap-1.5 whitespace-nowrap">
              {isAvatarSpeaking ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  <span className="text-[11px] font-semibold text-rose-700 dark:text-rose-400">
                    正在说话 (Berbicara)...
                  </span>
                </>
              ) : isListening ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-400">
                    在听你说 (Mendengarkan)...
                  </span>
                </>
              ) : isLoadingReply ? (
                <>
                  <Loader2 className="w-3 h-3 text-slate-400 animate-spin" />
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    在思考中 (Berpikir)...
                  </span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600" />
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    准备好交流 (Siap Mengobrol)
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Persona Info */}
          <div className="text-center pt-2">
            <h3 className="font-serif font-bold text-lg text-slate-900 dark:text-slate-100 flex items-center justify-center gap-1.5">
              <span>{selectedPersona.chineseName}</span>
              <span className="text-xs px-2 py-0.5 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 rounded-md border border-rose-200 dark:border-rose-900">
                中文母语
              </span>
            </h3>
            <p className="text-xs text-rose-700 dark:text-rose-400 font-medium mt-0.5">
              {selectedPersona.role}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
              {selectedPersona.bio}
            </p>
          </div>

          {/* Scenario Selector */}
          <div className="space-y-1.5 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                Pilih Skenario Percakapan:
              </span>
              <button
                type="button"
                onClick={() => setShowAddScenarioModal(true)}
                className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>+ Skenario Baru</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-0.5">
              {scenarios.map(s => {
                const active = s.id === selectedScenario.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => handleSelectScenario(s)}
                    className={`text-left p-2 rounded-xl border text-xs transition-all ${
                      active
                        ? 'bg-rose-50 dark:bg-rose-950/70 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 shadow-2xs font-semibold'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <p className="truncate font-medium">{s.chineseTitle}</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                      {s.title} · {s.category}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Voice, Pinyin and Controls footer */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setAutoVoice(!autoVoice)}
              className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 font-medium"
            >
              {autoVoice ? <Volume2 className="w-4 h-4 text-rose-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
              <span>Suara: {autoVoice ? 'Nyala' : 'Mati'}</span>
            </button>

            {/* Pinyin Toggle */}
            <button
              type="button"
              onClick={() => setShowPinyin(!showPinyin)}
              className={`px-2.5 py-1 rounded-lg border font-semibold text-xs transition-all ${
                showPinyin
                  ? 'bg-rose-50 dark:bg-rose-950/70 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 shadow-2xs'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
              }`}
              title="Tampilkan tanda baca Pinyin di atas atau bawah Hanzi"
            >
              拼音 Pinyin: {showPinyin ? 'ON' : 'OFF'}
            </button>

            {/* Speech rate selection */}
            <div className="flex items-center gap-1 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px]">
              {[0.8, 0.88, 1.1].map(rate => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => setSpeechRate(rate)}
                  className={`px-1 rounded ${
                    speechRate === rate
                      ? 'font-bold text-rose-600 dark:text-rose-400'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  {rate === 0.8 ? '0.8x' : rate === 0.88 ? '1.0x' : '1.2x'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between text-slate-400 pt-1">
            <span className="text-[10px]">
              {userTurnsCount} giliran percakapan dalam sesi ini
            </span>

            <button
              type="button"
              onClick={() => handleSelectScenario(selectedScenario)}
              className="flex items-center gap-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              title="Mulai Ulang Percakapan"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Obrolan</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Right Stage: Interactive Chinese Chat Stream */}
      <section className="lg:col-span-7 flex flex-col bg-white dark:bg-slate-900 justify-between">
        {/* Header Bar of Chat Stream */}
        <div className="p-3.5 px-4 sm:px-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            <div>
              <h4 className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                <span>{selectedScenario.chineseTitle}</span>
                <span className="text-slate-400 font-normal">({selectedScenario.title})</span>
              </h4>
              <p className="text-[10px] text-slate-400 line-clamp-1">{selectedScenario.description}</p>
            </div>
          </div>

          {/* Fluency Scorecard Button */}
          <button
            type="button"
            disabled={isEvaluating || userTurnsCount === 0}
            onClick={handleEvaluateSession}
            title={userTurnsCount === 0 ? 'Kirim pesan terlebih dahulu untuk evaluasi' : 'Dapatkan rapor evaluasi kelancaran & kosakata Mandarin'}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-800 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800 rounded-xl transition-all shadow-2xs disabled:opacity-50 shrink-0"
          >
            {isEvaluating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-600" />
            ) : (
              <Award className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            )}
            <span className="hidden sm:inline">{isEvaluating ? 'Menganalisis...' : 'Rapor Sesi Mandarin'}</span>
            <span className="sm:hidden">Rapor</span>
          </button>
        </div>

        {/* Chat Feed */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 max-h-[540px]">
          {messages.map(msg => {
            const isUser = msg.sender === 'user';
            const isTranslating = showTranslations[msg.id];

            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in duration-200`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 mt-1">
                    <img
                      src={selectedPersona.imagePath}
                      alt={selectedPersona.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className={`max-w-[85%] sm:max-w-[75%] space-y-1.5 ${isUser ? 'items-end' : 'items-start'}`}>
                  {/* Sender Name */}
                  <div className={`flex items-center gap-2 text-[10px] text-slate-400 ${isUser ? 'justify-end' : ''}`}>
                    <span>{isUser ? 'Kamu' : selectedPersona.name}</span>
                    {msg.hskLevel && (
                      <span className="px-1.5 py-0.2 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-semibold rounded text-[9px] border border-rose-200 dark:border-rose-900">
                        {msg.hskLevel}
                      </span>
                    )}
                    <span>·</span>
                    <span className="tabular-nums">
                      {new Date(msg.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Speech Bubble */}
                  <div
                    className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                      isUser
                        ? 'bg-rose-600 text-white rounded-br-xs shadow-xs'
                        : 'bg-slate-100/90 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-xs border border-slate-200/80 dark:border-slate-700/80 shadow-2xs'
                    }`}
                  >
                    {/* Hanzi Text */}
                    <p className={`font-medium tracking-wide ${!isUser ? 'text-base sm:text-lg font-serif' : 'text-sm'}`}>
                      {msg.hanzi}
                    </p>

                    {/* Pinyin Text */}
                    {!isUser && msg.pinyin && showPinyin && (
                      <p className="text-xs text-rose-700 dark:text-rose-300 mt-1 font-mono tracking-tight font-medium">
                        {msg.pinyin}
                      </p>
                    )}

                    {/* Indonesian translation */}
                    {!isUser && msg.translation && isTranslating && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 font-normal italic">
                        {msg.translation}
                      </p>
                    )}

                    {/* Key Vocabulary Breakdown */}
                    {!isUser && msg.vocabularyList && msg.vocabularyList.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-slate-200/80 dark:border-slate-700/80">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                          Kosakata Kunci:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {msg.vocabularyList.map((item, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => speakChineseVoice(item.word, { voiceGender: selectedPersona.voiceGender })}
                              className="px-2 py-0.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] flex items-center gap-1 hover:border-rose-400 transition-colors shadow-2xs"
                              title="Klik untuk dengarkan pelafalan"
                            >
                              <span className="font-bold text-rose-700 dark:text-rose-400">{item.word}</span>
                              <span className="text-[10px] text-slate-400">({item.pinyin})</span>
                              <span className="text-slate-600 dark:text-slate-300 text-[10px]">• {item.meaning}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Quick Tone / Grammar Tip */}
                    {!isUser && msg.quickTip && (
                      <div className="mt-2.5 p-2 bg-amber-50 dark:bg-amber-950/60 rounded-xl border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                        <span>{msg.quickTip}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions for User bubble */}
                  {isUser && (
                    <div className="flex items-center justify-end gap-1 text-[11px] text-slate-400 pt-0.5">
                      <button
                        type="button"
                        onClick={() => speakChineseVoice(msg.hanzi, { voiceGender: 'female', rate: speechRate })}
                        className="flex items-center gap-1 hover:text-rose-600 dark:hover:text-rose-400 p-1 rounded"
                        title="Dengarkan pelafalan standar bahasa Mandarin"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>Pelafalan</span>
                      </button>
                    </div>
                  )}

                  {/* Avatar Message Quick Actions */}
                  {!isUser && (
                    <div className="flex items-center gap-1 text-[11px] text-slate-400 pt-0.5">
                      <button
                        type="button"
                        onClick={() => speakText(msg.hanzi)}
                        className="flex items-center gap-1 hover:text-rose-600 dark:hover:text-rose-400 p-1 rounded"
                        title="Dengarkan pengucapan audio Mandarin"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>Dengarkan</span>
                      </button>

                      <span>·</span>

                      {msg.translation && (
                        <button
                          type="button"
                          onClick={() => toggleTranslation(msg.id)}
                          className="flex items-center gap-1 hover:text-rose-600 dark:hover:text-rose-400 p-1 rounded"
                        >
                          <Languages className="w-3.5 h-3.5" />
                          <span>{isTranslating ? 'Tutup Arti' : 'Lihat Arti'}</span>
                        </button>
                      )}

                      <span>·</span>

                      <button
                        type="button"
                        onClick={() => handleSaveToCards(msg)}
                        className="flex items-center gap-1 hover:text-rose-600 dark:hover:text-rose-400 p-1 rounded"
                        title="Simpan kalimat ini ke koleksi Flashcard SRS"
                      >
                        <BookmarkPlus className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Simpan Flashcard</span>
                      </button>

                      <span>·</span>

                      <button
                        type="button"
                        onClick={() => handleInsertToNote(msg)}
                        className="flex items-center gap-1 hover:text-rose-600 dark:hover:text-rose-400 p-1 rounded"
                        title="Sisipkan kalimat Mandarin ini ke Catatan aktif"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Ke Catatan</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isLoadingReply && (
            <div className="flex gap-3 items-center text-xs text-slate-400 pl-11">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-bounce [animation-delay:0.2s]" />
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-bounce [animation-delay:0.4s]" />
              <span className="text-[11px] text-slate-500">{selectedPersona.name} sedang menyusun balasan bahasa Mandarin...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar: Voice + Text + Chinese Virtual Keyboard */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 space-y-2.5">
          {/* Quick Tone vowels helper & Keyboard Mandarin Toggle */}
          <div className="flex flex-col gap-1.5 pb-0.5 text-[11px] text-slate-500 dark:text-slate-400">
            <div className="flex items-center justify-between gap-2 overflow-x-auto">
              <div className="flex items-center gap-1.5 overflow-x-auto shrink-0 relative">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold shrink-0 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-rose-500" />
                  <span>Pilih Nada:</span>
                </span>

                {toneStripMode === 'grouped' ? (
                  // Grouped by vowel with dropdown: [A] [E] [I] [O] [U] [Ü]
                  <div className="flex items-center gap-1">
                    {Object.keys(VOWEL_TONE_MAP).map(vKey => {
                      const vGroup = VOWEL_TONE_MAP[vKey];
                      const isOpen = activeInputVowel === vKey;
                      return (
                        <div key={vKey} className="relative">
                          <button
                            type="button"
                            onClick={() => setActiveInputVowel(isOpen ? null : vKey)}
                            className={`px-2 py-0.5 rounded-lg border font-mono text-xs font-bold flex items-center gap-1 transition-all ${
                              isOpen
                                ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-rose-400 hover:text-rose-600 dark:hover:text-rose-400'
                            }`}
                            title={`Klik untuk pilih 4 nada huruf ${vGroup.display} (${vGroup.tones.map(t => t.char).join(' ')})`}
                          >
                            <span className="text-rose-600 dark:text-rose-400 font-bold">{vGroup.tones[0].char}</span>
                            <span className="text-[10px] opacity-75 font-normal">({vGroup.display})</span>
                            <span className="text-[8px] opacity-60">▾</span>
                          </button>

                          {/* Flyout popup for this vowel */}
                          {isOpen && (
                            <div className="absolute bottom-full left-0 mb-2 z-50 bg-slate-900 border border-slate-700 text-white rounded-xl shadow-xl p-2 flex items-center gap-1 animate-in fade-in zoom-in-95 duration-100 min-w-[250px]">
                              <div className="text-[10px] text-rose-300 font-bold px-1.5 border-r border-slate-700 font-mono">
                                {vGroup.display}
                              </div>
                              {vGroup.tones.map(t => (
                                <div key={t.char} className="flex items-center bg-slate-800 rounded-lg border border-slate-700 overflow-hidden hover:border-rose-500">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setUserInput(prev => prev + t.char);
                                      setActiveInputVowel(null);
                                    }}
                                    className="px-2 py-1 font-mono text-sm font-bold text-slate-100 hover:text-rose-300 hover:bg-slate-700 transition-colors"
                                    title={`Sisipkan '${t.char}' (${t.toneName})`}
                                  >
                                    {t.char}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      speakChineseVoice(t.char, { voiceGender: 'female', rate: 0.88 });
                                    }}
                                    className="px-1 py-1 text-slate-400 hover:text-rose-400 border-l border-slate-700 hover:bg-slate-700"
                                    title={`Dengarkan nada ${t.char}`}
                                  >
                                    <Volume2 className="w-2.5 h-2.5" />
                                  </button>
                                </div>
                              ))}
                              <button
                                type="button"
                                onClick={() => setActiveInputVowel(null)}
                                className="p-1 text-slate-400 hover:text-white ml-auto"
                                title="Tutup"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  // Flat 21 characters view
                  <div className="flex items-center gap-1 overflow-x-auto">
                    {['ā', 'á', 'ǎ', 'à', 'ē', 'é', 'ě', 'è', 'ī', 'í', 'ǐ', 'ì', 'ō', 'ó', 'ǒ', 'ò', 'ū', 'ú', 'ǔ', 'ù', 'ü'].map(char => (
                      <button
                        key={char}
                        type="button"
                        onClick={() => setUserInput(prev => prev + char)}
                        className="px-1.5 py-0.5 bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/60 border border-slate-200 dark:border-slate-700 rounded text-slate-700 dark:text-slate-200 font-mono transition-colors"
                      >
                        {char}
                      </button>
                    ))}
                  </div>
                )}

                {/* View toggle button */}
                <button
                  type="button"
                  onClick={() => {
                    setToneStripMode(prev => prev === 'grouped' ? 'all' : 'grouped');
                    setActiveInputVowel(null);
                  }}
                  className="text-[10px] text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 underline underline-offset-2 ml-1 shrink-0"
                >
                  {toneStripMode === 'grouped' ? '21 Nada' : 'Per Vokal'}
                </button>
              </div>

              {/* Toggle Dedicated Chinese Keyboard */}
              <button
                type="button"
                onClick={() => {
                  const next = !showVirtualKeyboard;
                  setShowVirtualKeyboard(next);
                  try {
                    localStorage.setItem('chinese_virtual_keyboard_open', String(next));
                  } catch {
                    // ignore
                  }
                }}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl border text-xs font-semibold shrink-0 transition-all ${
                  showVirtualKeyboard
                    ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-rose-400 shadow-2xs'
                }`}
                title={showVirtualKeyboard ? 'Sembunyikan Keyboard Mandarin' : 'Buka Keyboard Khusus Mandarin (IME Pinyin & Hanzi)'}
              >
                <Keyboard className="w-3.5 h-3.5" />
                <span>{showVirtualKeyboard ? 'Tutup Keyboard' : '⌨️ Keyboard Mandarin'}</span>
                <span className="text-[9px] px-1 py-0.2 rounded bg-black/20 font-mono">IME</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            {/* Microphone Button (Speech Recognition zh-CN) */}
            <button
              type="button"
              onClick={toggleListening}
              className={`p-2.5 rounded-xl border transition-all ${
                isListening
                  ? 'bg-rose-600 text-white border-rose-700 animate-pulse shadow-md shadow-rose-600/20'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
              title={isListening ? 'Berhenti merekam' : 'Bicara bahasa Mandarin lewat Mikrofon (zh-CN)'}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-rose-600" />}
            </button>

            {/* Input field */}
            <input
              type="text"
              value={userInput}
              onChange={e => setUserInput(e.target.value)}
              placeholder={isListening ? 'Sedang mendengarkan ucapan Mandarin kamu...' : `Ketik Hanzi atau Pinyin (misal: "Ni hao" atau "我想喝咖啡")...`}
              className="flex-1 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-sans"
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={isLoadingReply || !userInput.trim()}
              className="p-2.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white rounded-xl shadow-xs transition-all disabled:opacity-50"
              title="Kirim pesan (Enter)"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          {/* Embedded Chinese Virtual Keyboard Panel */}
          {showVirtualKeyboard && (
            <div className="pt-1 animate-in fade-in slide-in-from-bottom-2 duration-150">
              <ChineseVirtualKeyboard
                currentText={userInput}
                onInsertText={text => setUserInput(prev => prev + text)}
                onBackspace={() => setUserInput(prev => prev.slice(0, -1))}
                onClear={() => setUserInput('')}
                onClose={() => {
                  setShowVirtualKeyboard(false);
                  try {
                    localStorage.setItem('chinese_virtual_keyboard_open', 'false');
                  } catch {
                    // ignore
                  }
                }}
                hasApiKey={hasApiKey}
                onShowToast={onShowToast}
              />
            </div>
          )}

          <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center">
            Tips: Gunakan <strong>Keyboard Mandarin</strong> di atas untuk mengetik Pinyin dan memilih karakter Hanzi (1-klik), menyisipkan nada, atau bicara via mikrofon!
          </p>
        </div>
      </section>

      {/* Scorecard Modal */}
      <ScorecardModal
        isOpen={isScorecardOpen}
        onClose={() => setIsScorecardOpen(false)}
        scorecard={scorecard}
        personaName={selectedPersona.chineseName}
      />

      {/* Custom Scenario Modal */}
      {showAddScenarioModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
                Buat Skenario Mandarin Kustom
              </h3>
              <button
                type="button"
                onClick={() => setShowAddScenarioModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomScenario} className="space-y-3.5 text-xs">
              <div>
                <label className="font-medium text-slate-700 dark:text-slate-300 block mb-1">
                  Judul Skenario (Bahasa Indonesia):
                </label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Pesan Tiket Kereta Cepat ke Beijing"
                  value={customTitle}
                  onChange={e => setCustomTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="font-medium text-slate-700 dark:text-slate-300 block mb-1">
                  Judul Bahasa Mandarin (Hanzi):
                </label>
                <input
                  type="text"
                  placeholder="Misal: 买高铁票 (Mǎi Gāotiě Piào)"
                  value={customChineseTitle}
                  onChange={e => setCustomChineseTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="font-medium text-slate-700 dark:text-slate-300 block mb-1">
                  Kategori:
                </label>
                <input
                  type="text"
                  placeholder="Misal: Travel / Kuliner / Kerja"
                  value={customCategory}
                  onChange={e => setCustomCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="font-medium text-slate-700 dark:text-slate-300 block mb-1">
                  Konteks & Peran Tutor Mandarin:
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Misal: Anda adalah petugas loket stasiun kereta api di Shanghai yang ramah membantu turis membeli tiket..."
                  value={customContext}
                  onChange={e => setCustomContext(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 resize-none"
                />
              </div>

              <div>
                <label className="font-medium text-slate-700 dark:text-slate-300 block mb-1">
                  Kalimat Pembuka Tutor (Hanzi):
                </label>
                <input
                  type="text"
                  placeholder="Misal: 您好！请问您需要购买去哪里的车票？"
                  value={customStarterHanzi}
                  onChange={e => setCustomStarterHanzi(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddScenarioModal(false)}
                  className="px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg shadow-sm"
                >
                  Mulai Latihan Mandarin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
