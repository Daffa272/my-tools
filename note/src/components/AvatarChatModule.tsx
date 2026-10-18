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
  Sliders,
  AudioLines
} from 'lucide-react';
import { AvatarPersona, ChatMessage, ConversationCard, ScenarioOption, FluencyScorecard } from '../types';
import { generateAvatarReply, speakAvatarVoice, evaluateConversationSession } from '../utils/gemini';
import { logActivity } from '../utils/srs';
import { ScorecardModal } from './ScorecardModal';

const DEFAULT_AVATAR_PERSONAS: AvatarPersona[] = [
  {
    id: 'emma',
    name: 'Emma',
    role: 'Conversational Partner & Storyteller',
    accent: 'British English',
    voiceGender: 'female',
    bio: 'Ramah, bersahabat, menyukai topik buku, seni, travelling, dan obrolan santai sehari-hari.',
    imagePath: '/src/assets/images/avatar_tutor_emma_1792241990226.jpg',
    defaultGreeting: "Hello there! It's so lovely to meet you. What would you like to talk about today?"
  },
  {
    id: 'david',
    name: 'David',
    role: 'Daily Casual & Tech Companion',
    accent: 'American English',
    voiceGender: 'male',
    bio: 'Santai, penuh energi, menyukai topik teknologi, olahraga, musik, dan obrolan kasual.',
    imagePath: '/src/assets/images/avatar_tutor_david_1792241991004.jpg',
    defaultGreeting: "Hey! Great to connect with you. How is your day going so far?"
  },
  {
    id: 'maya',
    name: 'Maya',
    role: 'Language Coach & Interview Specialist',
    accent: 'International English',
    voiceGender: 'female',
    bio: 'Penuh perhatian, pelafalan sangat jelas, ahli dalam latihan wawancara kerja dan percakapan terstruktur.',
    imagePath: '/src/assets/images/avatar_tutor_maya_1792241990300.jpg',
    defaultGreeting: "Hi! Welcome. I'm here to help you practice speaking naturally and with confidence. Shall we start?"
  }
];

const DEFAULT_SCENARIOS: ScenarioOption[] = [
  {
    id: 'cafe',
    title: 'Santai di Kafe',
    category: 'Casual',
    description: 'Obrolan santai sambil menikmati kopi tentang akhir pekan dan hobi.',
    starterPrompt: "I just grabbed a cup of hot cappuccino. What's your favorite drink when you relax?"
  },
  {
    id: 'interview',
    title: 'Latihan Interview',
    category: 'Career',
    description: 'Simulasi wawancara kerja: perkenalan diri, pengalaman, dan rencana karier.',
    starterPrompt: "Welcome to our practice interview! Could you please introduce yourself and your background?"
  },
  {
    id: 'travel',
    title: 'Liburan & Travelling',
    category: 'Travel',
    description: 'Bercerita tentang destinasi impian, pengalaman terbang, dan jalan-jalan.',
    starterPrompt: "If you could catch a flight to anywhere in the world right now, where would you go?"
  },
  {
    id: 'movies',
    title: 'Film & Musik',
    category: 'Culture',
    description: 'Mendiskusikan film, serial favorit, atau musik yang sedang didengarkan.',
    starterPrompt: "Have you watched any good movies or TV shows lately? I'd love a recommendation!"
  },
  {
    id: 'free',
    title: 'Obrolan Bebas',
    category: 'Open',
    description: 'Bicarakan apa saja yang sedang kamu pikirkan secara santai dan tanpa batas.',
    starterPrompt: "Feel free to share whatever is on your mind today. How are you feeling right now?"
  }
];

interface AvatarChatModuleProps {
  hasApiKey: boolean;
  onOpenApiKeyModal: () => void;
  onShowToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  onSaveToCards: (card: ConversationCard) => void;
  onInsertToNotes?: (sentence: string, translation: string) => void;
  onActivityLogged?: () => void;
}

export const AvatarChatModule: React.FC<AvatarChatModuleProps> = ({
  hasApiKey,
  onOpenApiKeyModal,
  onShowToast,
  onSaveToCards,
  onInsertToNotes,
  onActivityLogged
}) => {
  const [selectedPersona, setSelectedPersona] = useState<AvatarPersona>(DEFAULT_AVATAR_PERSONAS[0]);
  
  // Scenarios with custom support
  const [scenarios, setScenarios] = useState<ScenarioOption[]>(() => {
    try {
      const saved = localStorage.getItem('custom_scenarios_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return [...DEFAULT_SCENARIOS, ...parsed];
        }
      }
    } catch {
      // ignore
    }
    return DEFAULT_SCENARIOS;
  });

  const [selectedScenario, setSelectedScenario] = useState<ScenarioOption>(DEFAULT_SCENARIOS[0]);
  const [autoVoice, setAutoVoice] = useState(true);
  const [speechRate, setSpeechRate] = useState<number>(0.92);
  const [isAvatarSpeaking, setIsAvatarSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isLoadingReply, setIsLoadingReply] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [showTranslations, setShowTranslations] = useState<Record<string, boolean>>({});

  // Scorecard state
  const [scorecard, setScorecard] = useState<FluencyScorecard | null>(null);
  const [isScorecardOpen, setIsScorecardOpen] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);

  // Custom scenario modal state
  const [showAddScenarioModal, setShowAddScenarioModal] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customCategory, setCustomCategory] = useState('Khusus');
  const [customContext, setCustomContext] = useState('');
  const [customStarter, setCustomStarter] = useState('');

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'greeting-1',
      sender: 'avatar',
      text: DEFAULT_AVATAR_PERSONAS[0].defaultGreeting,
      translation: 'Halo di sana! Senang sekali bisa bertemu denganmu. Apa yang ingin kamu bicarakan hari ini?',
      timestamp: Date.now()
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoadingReply]);

  // Voice speech synthesis for avatar
  const speakText = (text: string) => {
    speakAvatarVoice(
      text,
      { voiceGender: selectedPersona.voiceGender, accent: selectedPersona.accent, rate: speechRate },
      () => setIsAvatarSpeaking(true),
      () => setIsAvatarSpeaking(false)
    );
  };

  // Voice speech for user utterances (standard US/native English pronunciation check)
  const speakUserSentence = (text: string) => {
    speakAvatarVoice(
      text,
      { voiceGender: 'male', accent: 'American English', rate: speechRate },
      undefined,
      undefined
    );
  };

  // Change persona
  const handleSelectPersona = (persona: AvatarPersona) => {
    setSelectedPersona(persona);
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setIsAvatarSpeaking(false);
    const initialMsg: ChatMessage = {
      id: `greeting-${Date.now()}`,
      sender: 'avatar',
      text: persona.defaultGreeting,
      timestamp: Date.now()
    };
    setMessages([initialMsg]);
    if (autoVoice) {
      setTimeout(() => speakText(persona.defaultGreeting), 300);
    }
  };

  // Change scenario
  const handleSelectScenario = (scenario: ScenarioOption) => {
    setSelectedScenario(scenario);
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setIsAvatarSpeaking(false);
    const starterMsg: ChatMessage = {
      id: `scenario-${Date.now()}`,
      sender: 'avatar',
      text: scenario.starterPrompt,
      timestamp: Date.now()
    };
    setMessages([starterMsg]);
    if (autoVoice) {
      setTimeout(() => speakText(scenario.starterPrompt), 300);
    }
  };

  // Create custom scenario
  const handleSaveCustomScenario = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim() || !customContext.trim()) {
      onShowToast('Mohon isi judul dan konteks skenario.', 'info');
      return;
    }

    const newScenario: ScenarioOption = {
      id: `custom-${Date.now()}`,
      title: customTitle.trim(),
      category: customCategory.trim() || 'Custom',
      description: customContext.trim(),
      starterPrompt: customStarter.trim() || `Hello! Let's talk about ${customTitle.trim()}. How can I help you?`,
      isCustom: true
    };

    const updated = [...scenarios, newScenario];
    setScenarios(updated);
    
    // Save only custom ones to storage
    const customOnly = updated.filter(s => s.isCustom);
    localStorage.setItem('custom_scenarios_v1', JSON.stringify(customOnly));

    setSelectedScenario(newScenario);
    setShowAddScenarioModal(false);
    setCustomTitle('');
    setCustomContext('');
    setCustomStarter('');

    // Start with the new scenario
    handleSelectScenario(newScenario);
    onShowToast(`Skenario "${newScenario.title}" berhasil dibuat!`, 'success');
  };

  // Toggle voice recognition (Speech-to-Text)
  const toggleListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      onShowToast('Browser kamu belum mendukung Speech Recognition. Silakan ketik langsung pesanmu.', 'info');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
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

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
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
      const chatHistory = messages.map(m => ({ sender: m.sender, text: m.text }));
      const response = await generateAvatarReply({
        personaName: selectedPersona.name,
        personaRole: selectedPersona.role,
        personaBio: selectedPersona.bio,
        scenarioTitle: selectedScenario.title,
        scenarioContext: selectedScenario.description,
        chatHistory,
        userMessage: text
      });

      const avatarMsg: ChatMessage = {
        id: `avatar-${Date.now()}`,
        sender: 'avatar',
        text: response.englishReply,
        translation: response.indonesianTranslation,
        quickTip: response.quickTip,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, avatarMsg]);
      logActivity('review');
      onActivityLogged?.();

      if (autoVoice) {
        speakText(response.englishReply);
      }
    } catch (err: unknown) {
      onShowToast(err instanceof Error ? err.message : 'Gagal mendapatkan balasan dari avatar.', 'error');
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
    onShowToast('Gemini sedang menganalisis sesi percakapanmu...', 'info');

    try {
      const result = await evaluateConversationSession({
        personaName: selectedPersona.name,
        scenarioTitle: selectedScenario.title,
        chatMessages: messages.map(m => ({ sender: m.sender, text: m.text }))
      });
      setScorecard(result);
      setIsScorecardOpen(true);
      onShowToast('Rapor evaluasi percakapan siap dilihat!', 'success');
    } catch (err: unknown) {
      onShowToast(err instanceof Error ? err.message : 'Gagal mengevaluasi percakapan.', 'error');
    } finally {
      setIsEvaluating(false);
    }
  };

  // Toggle individual translation
  const toggleTranslation = (id: string) => {
    setShowTranslations(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // 1-click Save to Conversation Card
  const handleSaveToCards = (msg: ChatMessage) => {
    const card: ConversationCard = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      sentence: msg.text,
      translationId: msg.translation || 'Arti percakapan bersama avatar',
      situation: `${selectedScenario.title} bersama ${selectedPersona.name}`,
      condition: `percakapan interaktif bahasa Inggris`,
      repetition: 0,
      interval: 0,
      easiness: 2.5,
      nextReviewDate: new Date().toISOString()
    };
    onSaveToCards(card);
    onShowToast(`Kalimat dari ${selectedPersona.name} disimpan ke Flashcard!`, 'success');
  };

  // 1-click Insert to Note
  const handleInsertToNote = (msg: ChatMessage) => {
    if (onInsertToNotes) {
      onInsertToNotes(msg.text, msg.translation || '');
      onShowToast(`Disalin ke Catatan aktif!`, 'success');
    } else {
      navigator.clipboard?.writeText(`"${msg.text}" - ${msg.translation || ''}`);
      onShowToast('Teks disalin ke papan klip!', 'info');
    }
  };

  const userTurnsCount = messages.filter(m => m.sender === 'user').length;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[720px] transition-colors">
      {/* Left Stage: Realistic Human Avatar Presentation */}
      <aside className="lg:col-span-5 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 p-6 flex flex-col justify-between">
        <div className="space-y-5">
          {/* Persona Switcher Chips */}
          <div className="flex items-center gap-2 p-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
            {DEFAULT_AVATAR_PERSONAS.map(p => {
              const active = p.id === selectedPersona.id;
              return (
                <button
                  key={p.id}
                  onClick={() => handleSelectPersona(p)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                    active
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  <span>{p.name}</span>
                </button>
              );
            })}
          </div>

          {/* Avatar Realistic Human Portrait Stage */}
          <div className="relative mx-auto w-48 h-48 sm:w-56 sm:h-56">
            {/* Waveform Halo when Speaking */}
            {isAvatarSpeaking && (
              <div className="absolute inset-0 rounded-full border-4 border-emerald-500/60 animate-ping pointer-events-none" />
            )}

            <div
              className={`relative w-full h-full rounded-full overflow-hidden border-4 transition-all duration-300 shadow-md ${
                isAvatarSpeaking
                  ? 'border-emerald-500 shadow-emerald-500/20'
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
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                    Sedang Berbicara...
                  </span>
                </>
              ) : isListening ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-400">
                    Mendengarkan Kamu...
                  </span>
                </>
              ) : isLoadingReply ? (
                <>
                  <Loader2 className="w-3 h-3 text-slate-400 animate-spin" />
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    Sedang Berpikir...
                  </span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600" />
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    Siap Mengobrol
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Persona Info */}
          <div className="text-center pt-2">
            <h3 className="font-serif font-bold text-lg text-slate-900 dark:text-slate-100">
              {selectedPersona.name}
            </h3>
            <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
              {selectedPersona.role} · {selectedPersona.accent}
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
                className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>+ Buat Skenario</span>
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
                        ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 shadow-2xs font-semibold'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <p className="truncate">{s.title}</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                      {s.category} {s.isCustom && '· Kustom'}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Voice and Controls footer */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setAutoVoice(!autoVoice)}
              className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 font-medium"
            >
              {autoVoice ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
              <span>Suara Otomatis: {autoVoice ? 'Nyala' : 'Mati'}</span>
            </button>

            {/* Speech rate selection */}
            <div className="flex items-center gap-1 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px]">
              <span className="text-slate-400">Kecepatan:</span>
              {[0.8, 0.95, 1.15].map(rate => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => setSpeechRate(rate)}
                  className={`px-1 rounded ${
                    speechRate === rate
                      ? 'font-bold text-emerald-600 dark:text-emerald-400'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  {rate === 0.8 ? '0.8x' : rate === 0.95 ? '1.0x' : '1.2x'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between text-slate-400 pt-1">
            <span className="text-[10px]">
              {userTurnsCount} giliran berbicara dalam sesi ini
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

      {/* Right Stage: Interactive Chat Stream */}
      <section className="lg:col-span-7 flex flex-col bg-white dark:bg-slate-900 justify-between">
        {/* Header Bar of Chat Stream */}
        <div className="p-3.5 px-4 sm:px-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <div>
              <h4 className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                <span>{selectedScenario.title}</span>
                <span className="text-slate-400 font-normal">bersama {selectedPersona.name}</span>
              </h4>
              <p className="text-[10px] text-slate-400 line-clamp-1">{selectedScenario.description}</p>
            </div>
          </div>

          {/* Fluency Scorecard Button */}
          <button
            type="button"
            disabled={isEvaluating || userTurnsCount === 0}
            onClick={handleEvaluateSession}
            title={userTurnsCount === 0 ? 'Kirim pesan terlebih dahulu untuk evaluasi' : 'Dapatkan rapor evaluasi kelancaran & tata bahasa'}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 rounded-xl transition-all shadow-2xs disabled:opacity-50 shrink-0"
          >
            {isEvaluating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
            ) : (
              <Award className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            )}
            <span className="hidden sm:inline">{isEvaluating ? 'Menganalisis...' : 'Rapor Sesi AI'}</span>
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
                    <span>·</span>
                    <span className="tabular-nums">
                      {new Date(msg.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Speech Bubble */}
                  <div
                    className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                      isUser
                        ? 'bg-emerald-600 text-white rounded-br-xs shadow-xs'
                        : 'bg-slate-100/90 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-xs border border-slate-200/80 dark:border-slate-700/80 shadow-2xs'
                    }`}
                  >
                    <p className="font-normal">{msg.text}</p>

                    {/* Indonesian translation */}
                    {!isUser && msg.translation && isTranslating && (
                      <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 font-medium italic">
                        {msg.translation}
                      </p>
                    )}

                    {/* Quick Grammar / Vocabulary Tip */}
                    {!isUser && msg.quickTip && (
                      <div className="mt-2.5 p-2 bg-amber-50 dark:bg-amber-950/60 rounded-xl border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                        <span>{msg.quickTip}</span>
                      </div>
                    )}
                  </div>

                  {/* Quick Actions for User Message: Pronunciation Check */}
                  {isUser && (
                    <div className="flex items-center justify-end gap-1 text-[11px] text-slate-400 pt-0.5">
                      <button
                        type="button"
                        onClick={() => speakUserSentence(msg.text)}
                        className="flex items-center gap-1 hover:text-emerald-600 dark:hover:text-emerald-400 p-1 rounded"
                        title="Dengarkan cara pelafalan standar kalimat ini"
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
                        onClick={() => speakText(msg.text)}
                        className="flex items-center gap-1 hover:text-emerald-600 dark:hover:text-emerald-400 p-1 rounded"
                        title="Dengarkan pengucapan"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>Dengarkan</span>
                      </button>

                      <span>·</span>

                      {msg.translation && (
                        <button
                          type="button"
                          onClick={() => toggleTranslation(msg.id)}
                          className="flex items-center gap-1 hover:text-emerald-600 dark:hover:text-emerald-400 p-1 rounded"
                        >
                          <Languages className="w-3.5 h-3.5" />
                          <span>{isTranslating ? 'Tutup Arti' : 'Lihat Arti'}</span>
                        </button>
                      )}

                      <span>·</span>

                      <button
                        type="button"
                        onClick={() => handleSaveToCards(msg)}
                        className="flex items-center gap-1 hover:text-emerald-600 dark:hover:text-emerald-400 p-1 rounded"
                        title="Simpan kalimat ini ke koleksi Flashcard SRS"
                      >
                        <BookmarkPlus className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Simpan Kalimat</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isLoadingReply && (
            <div className="flex gap-3 items-center text-xs text-slate-400 pl-11">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.2s]" />
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.4s]" />
              <span className="text-[11px] text-slate-500">{selectedPersona.name} sedang menyusun balasan...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar: Voice + Text */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30">
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            {/* Microphone Button (Speech Recognition) */}
            <button
              type="button"
              onClick={toggleListening}
              className={`p-2.5 rounded-xl border transition-all ${
                isListening
                  ? 'bg-rose-500 text-white border-rose-600 animate-pulse shadow-md shadow-rose-500/20'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
              title={isListening ? 'Berhenti merekam' : 'Bicara lewat Mikrofon (English speech)'}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-emerald-600" />}
            </button>

            {/* Input field */}
            <input
              type="text"
              value={userInput}
              onChange={e => setUserInput(e.target.value)}
              placeholder={isListening ? 'Mendengarkan ucapanmu...' : `Ketik pesan bahasa Inggris untuk ${selectedPersona.name}...`}
              className="flex-1 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={isLoadingReply || !userInput.trim()}
              className="p-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl shadow-xs transition-all disabled:opacity-50"
              title="Kirim pesan (Enter)"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 text-center">
            Tips: Gunakan mikrofon untuk melatih berbicara (*speaking*), atau ketik langsung dalam bahasa Inggris.
          </p>
        </div>
      </section>

      {/* Fluency Scorecard Modal */}
      <ScorecardModal
        isOpen={isScorecardOpen}
        onClose={() => setIsScorecardOpen(false)}
        scorecard={scorecard}
        personaName={selectedPersona.name}
      />

      {/* Custom Scenario Modal */}
      {showAddScenarioModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
                Buat Skenario Percakapan Kustom
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
                  Judul Skenario:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Check-in Hotel di London"
                  value={customTitle}
                  onChange={e => setCustomTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="font-medium text-slate-700 dark:text-slate-300 block mb-1">
                  Kategori:
                </label>
                <input
                  type="text"
                  placeholder="Misal: Travel / Belanja / Kantor"
                  value={customCategory}
                  onChange={e => setCustomCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="font-medium text-slate-700 dark:text-slate-300 block mb-1">
                  Konteks & Detail Peran Avatar:
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Misal: Kamu adalah resepsionis hotel bintang 5 yang ramah membantu tamu memesan kamar..."
                  value={customContext}
                  onChange={e => setCustomContext(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 resize-none"
                />
              </div>

              <div>
                <label className="font-medium text-slate-700 dark:text-slate-300 block mb-1">
                  Kalimat Pembuka Avatar (Bahasa Inggris):
                </label>
                <input
                  type="text"
                  placeholder="Misal: Good evening! Welcome to The Grand Hotel. How may I assist you?"
                  value={customStarter}
                  onChange={e => setCustomStarter(e.target.value)}
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
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-sm"
                >
                  Mulai Latihan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
