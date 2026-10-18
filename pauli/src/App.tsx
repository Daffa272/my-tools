import React, { useState, useEffect } from 'react';
import { TestConfig, SessionResult, PsychometricAnalysis, TestRecord } from './types';
import { DEFAULT_CONFIG, loadStoredConfig, saveStoredConfig, loadHistory, saveTestRecord, deleteHistoryItem, clearAllHistory } from './utils/storage';
import { calculatePsychometrics } from './utils/analytics';
import { sound } from './utils/audio';
import { Header } from './components/Header';
import { SetupView } from './components/SetupView';
import { TestView } from './components/TestView';
import { ResultView } from './components/ResultView';
import { GuideModal } from './components/GuideModal';
import { HistoryModal } from './components/HistoryModal';
import { ProjectMenu } from './components/ProjectMenu';

export default function App() {
  const [currentView, setCurrentView] = useState<'setup' | 'test' | 'result'>('setup');
  const [config, setConfig] = useState<TestConfig>(DEFAULT_CONFIG);
  const [sessionResults, setSessionResults] = useState<SessionResult[]>([]);
  const [analysis, setAnalysis] = useState<PsychometricAnalysis | null>(null);
  const [history, setHistory] = useState<TestRecord[]>([]);

  // Modals
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Initialize from LocalStorage
  useEffect(() => {
    const savedConfig = loadStoredConfig();
    setConfig(savedConfig);
    sound.setEnabled(savedConfig.soundEnabled);
    setHistory(loadHistory());
  }, []);

  const handleConfigChange = (newConfig: TestConfig) => {
    setConfig(newConfig);
    saveStoredConfig(newConfig);
    sound.setEnabled(newConfig.soundEnabled);
  };

  const handleToggleSound = () => {
    const newVal = !config.soundEnabled;
    handleConfigChange({ ...config, soundEnabled: newVal });
  };

  const handleStartTest = () => {
    setCurrentView('test');
    window.scrollTo(0, 0);
  };

  const handleAbortTest = () => {
    if (confirm('Batalkan simulasi tes yang sedang berjalan?')) {
      setCurrentView('setup');
    }
  };

  const handleFinishTest = (results: SessionResult[]) => {
    setSessionResults(results);
    const psychometrics = calculatePsychometrics(results, config.sessionDurationSec);
    setAnalysis(psychometrics);

    // Save record to history
    const record: TestRecord = {
      id: `record_${Date.now()}`,
      date: new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      config,
      sessionResults: results,
      analysis: psychometrics,
    };

    const updatedHistory = saveTestRecord(record);
    setHistory(updatedHistory);
    setCurrentView('result');
    window.scrollTo(0, 0);
  };

  const handleSelectRecord = (record: TestRecord) => {
    setConfig(record.config);
    setSessionResults(record.sessionResults);
    setAnalysis(record.analysis);
    setIsHistoryOpen(false);
    setCurrentView('result');
    window.scrollTo(0, 0);
  };

  const handleDeleteRecord = (id: string) => {
    const updated = deleteHistoryItem(id);
    setHistory(updated);
  };

  const handleClearAllHistory = () => {
    clearAllHistory();
    setHistory([]);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-indigo-500 selection:text-white">
      <ProjectMenu activeApp="pauli" />
      {/* Universal Top Bar */}
      <Header
        currentView={currentView}
        config={config}
        onToggleSound={handleToggleSound}
        onOpenGuide={() => setIsGuideOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onNewTest={() => setCurrentView('setup')}
      />

      {/* Main View Router */}
      <main className="flex-1 flex flex-col">
        {currentView === 'setup' && (
          <SetupView
            config={config}
            onChangeConfig={handleConfigChange}
            onStartTest={handleStartTest}
            onOpenGuide={() => setIsGuideOpen(true)}
          />
        )}

        {currentView === 'test' && (
          <TestView
            config={config}
            onFinish={handleFinishTest}
            onAbort={handleAbortTest}
          />
        )}

        {currentView === 'result' && analysis && (
          <ResultView
            config={config}
            sessionResults={sessionResults}
            analysis={analysis}
            onRetake={handleStartTest}
            onOpenHistory={() => setIsHistoryOpen(true)}
          />
        )}
      </main>

      {/* Modals */}
      <GuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onSelectRecord={handleSelectRecord}
        onDeleteRecord={handleDeleteRecord}
        onClearAll={handleClearAllHistory}
      />
    </div>
  );
}
