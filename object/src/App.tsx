/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { UploadPanel } from './components/UploadPanel';
import { GalleryPanel } from './components/GalleryPanel';
import { ImageViewerModal } from './components/ImageViewerModal';
import { ReviewSection, getAllReviewEntries, isReviewDue } from './components/ReviewSection';
import { SettingsModal } from './components/SettingsModal';
import { GuideSection } from './components/GuideSection';
import { Toast, ToastMessage } from './components/Toast';
import { ObjectCard, Category, CardWord } from './types';
import {
  openDatabase,
  allCards,
  allCategories,
  saveCard,
  deleteCard,
  saveCategory,
  clearStore,
  syncLocalChangesToAccount,
  syncObjectLibraryFromAccount,
  blobToDataUrl,
  dataUrlToBlob,
  safeFilename,
  TARGET_WIDTH,
  TARGET_HEIGHT
} from './services/db';
import { getStarterPackData } from './services/starterPack';

export default function App() {
  const [cards, setCards] = useState<ObjectCard[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [hideEnglish, setHideEnglish] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'library' | 'review' | 'guide'>('library');

  // Dark mode
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('object_english_theme') === 'dark';
  });

  // Modals
  const [activeViewerCard, setActiveViewerCard] = useState<ObjectCard | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Status & notifications
  const [storageStatusText, setStorageStatusText] = useState('Memeriksa penyimpanan...');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Apply dark mode class to root document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('object_english_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('object_english_theme', 'light');
    }
  }, [isDarkMode]);

  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3800);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Fetch all data from IndexedDB
  const refreshData = useCallback(async () => {
    try {
      const [fetchedCards, fetchedCategories] = await Promise.all([
        allCards(),
        allCategories()
      ]);
      setCards(fetchedCards);
      setCategories(fetchedCategories);

      // Keep activeViewerCard synced if open
      setActiveViewerCard(current => {
        if (!current) return null;
        return fetchedCards.find(c => c.id === current.id) || null;
      });
    } catch (err) {
      console.error('Gagal mengambil data:', err);
      addToast('Gagal memuat koleksi dari IndexedDB.', 'error');
    }
  }, [addToast]);

  // Initial load & account storage listener registration
  useEffect(() => {
    const initApp = async () => {
      const supported = 'indexedDB' in window && 'createImageBitmap' in window;
      setStorageStatusText(
        supported
          ? 'Data tersinkron ke akun; gambar tersimpan di perangkat ini'
          : 'Browser tidak mendukung penyimpanan gambar'
      );

      if (!supported) {
        addToast('Browser Anda tidak mendukung IndexedDB atau ImageBitmap.', 'error');
        return;
      }

      try {
        await openDatabase();
        if (window.__accountStorageReady) {
          await window.__accountStorageReady;
        }
        await refreshData();
      } catch (err) {
        console.error('Init error:', err);
        setStorageStatusText('Penyimpanan lokal tidak tersedia');
      }
    };

    if (typeof window.registerAccountStorageTask === 'function') {
      window.registerAccountStorageTask(async ({ uid }) => {
        await syncObjectLibraryFromAccount({ uid });
        await refreshData();
      });
    }

    initApp();
  }, [refreshData, addToast]);

  // Calculate review due count
  const allReviewEntries = useMemo(() => getAllReviewEntries(cards), [cards]);
  const dueEntries = useMemo(
    () => allReviewEntries.filter(entry => isReviewDue(entry)),
    [allReviewEntries]
  );

  // Card Operations
  const handleSaveCard = async (data: {
    english: string;
    indonesian: string;
    pronunciation?: string;
    category: string;
    imageBlob: Blob;
    exampleSentence?: string;
  }) => {
    const newCard: ObjectCard = {
      id: crypto.randomUUID(),
      english: data.english,
      indonesian: data.indonesian,
      pronunciation: data.pronunciation,
      category: data.category,
      image: data.imageBlob,
      createdAt: Date.now(),
      exampleSentence: data.exampleSentence,
      words: []
    };

    await saveCategory(data.category);
    await saveCard(newCard);
    await refreshData();

    syncLocalChangesToAccount().then(synced => {
      if (!synced) {
        addToast('Benda tersimpan lokal, tapi belum disinkronkan ke akun.', 'info');
      }
    });
  };

  const handleDeleteCard = async (id: string, name: string) => {
    try {
      if (activeViewerCard?.id === id) {
        setActiveViewerCard(null);
      }
      await deleteCard(id);
      await refreshData();
      addToast(`"${name}" dihapus dari koleksi.`, 'info');
      syncLocalChangesToAccount();
    } catch {
      addToast('Gagal menghapus kartu benda.', 'error');
    }
  };

  const handleAddCategory = async (name: string) => {
    await saveCategory(name);
    await refreshData();
    syncLocalChangesToAccount();
  };

  const handleUpdateWords = async (cardId: string, updatedWords: CardWord[]) => {
    const target = cards.find(c => c.id === cardId);
    if (!target) return;

    const updatedCard: ObjectCard = {
      ...target,
      words: updatedWords
    };

    await saveCard(updatedCard);
    await refreshData();
    syncLocalChangesToAccount();
  };

  const handleRateReviewEntry = async (
    cardId: string,
    wordIndex: number | undefined,
    schedule: { easiness: number; repetition: number; interval: number; nextReviewDate: string }
  ) => {
    const target = cards.find(c => c.id === cardId);
    if (!target) return;

    let updatedCard: ObjectCard;
    if (wordIndex === undefined) {
      updatedCard = {
        ...target,
        ...schedule
      };
    } else {
      const updatedWords = (target.words || []).map((w, idx) =>
        idx === wordIndex ? { ...w, ...schedule } : w
      );
      updatedCard = {
        ...target,
        words: updatedWords
      };
    }

    await saveCard(updatedCard);
    await refreshData();
    syncLocalChangesToAccount();
  };

  // Load starter pack sample data
  const handleLoadStarterPack = async () => {
    const sample = await getStarterPackData();
    await Promise.all(sample.categories.map(c => saveCategory(c.name)));
    await Promise.all(sample.cards.map(c => saveCard(c)));
    await refreshData();
    syncLocalChangesToAccount();
  };

  // Export category to directory with vocabulary.json
  const handleExportFolder = async (categoryName: string) => {
    if (!('showDirectoryPicker' in window)) {
      addToast(
        'Ekspor folder perlu browser Chrome atau Edge. Gunakan "Unduh Backup" sebagai alternatif.',
        'error'
      );
      return;
    }

    const cat = categoryName || activeCategory;
    if (!cat) {
      addToast('Pilih folder kategori yang ingin diekspor.', 'error');
      return;
    }

    const categoryCards = cards.filter(card => card.category === cat);
    const validCards = categoryCards.filter(card => card.image instanceof Blob);
    if (validCards.length === 0) {
      addToast(
        categoryCards.length > 0
          ? 'Gambar folder ini tidak tersimpan di perangkat ini.'
          : 'Folder kategori ini belum memiliki benda.',
        'error'
      );
      return;
    }

    try {
      // @ts-expect-error window.showDirectoryPicker is experimental API
      const root = await window.showDirectoryPicker({ mode: 'readwrite' });
      const folder = await root.getDirectoryHandle(safeFilename(cat), { create: true });
      const manifest: Array<{
        image: string;
        english: string;
        indonesian: string;
        category: string;
        width: number;
        height: number;
      }> = [];

      for (const card of validCards) {
        if (!card.image) continue;
        const filename = `${safeFilename(card.english)}.jpg`;
        const fileHandle = await folder.getFileHandle(filename, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(card.image);
        await writable.close();

        manifest.push({
          image: filename,
          english: card.english,
          indonesian: card.indonesian,
          category: card.category,
          width: TARGET_WIDTH,
          height: TARGET_HEIGHT
        });
      }

      const manifestHandle = await folder.getFileHandle('vocabulary.json', { create: true });
      const manifestFile = await manifestHandle.createWritable();
      await manifestFile.write(JSON.stringify({ category: cat, cards: manifest }, null, 2));
      await manifestFile.close();

      addToast(`${validCards.length} foto diekspor ke folder "${cat}".`, 'success');
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        addToast(err.message || 'Folder tidak dapat diekspor.', 'error');
      }
    }
  };

  // Download complete JSON backup
  const handleDownloadBackup = async () => {
    try {
      if (cards.some(card => !(card.image instanceof Blob))) {
        throw new Error('Sebagian gambar hanya tersedia di perangkat asal.');
      }
      const serializedCards = await Promise.all(
        cards.map(async card => ({
          ...card,
          image: card.image ? await blobToDataUrl(card.image) : null
        }))
      );

      const backup = new Blob(
        [
          JSON.stringify(
            {
              app: 'object-english',
              version: 1,
              categories,
              cards: serializedCards
            },
            null,
            2
          )
        ],
        { type: 'application/json' }
      );

      const link = document.createElement('a');
      const url = URL.createObjectURL(backup);
      link.href = url;
      link.download = `object-english-backup-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      addToast('Backup koleksi berhasil diunduh.', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Backup gagal dibuat.';
      addToast(msg, 'error');
    }
  };

  // Import backup JSON
  const handleImportBackup = async (file: File) => {
    try {
      const text = await file.text();
      const backup = JSON.parse(text);

      if (
        backup?.app !== 'object-english' ||
        !Array.isArray(backup.cards) ||
        !Array.isArray(backup.categories)
      ) {
        throw new Error('File bukan backup Object English yang valid.');
      }

      const proceed = window.confirm(
        `Import akan mengganti ${cards.length} kartu yang ada dengan ${backup.cards.length} kartu dari file backup. Lanjutkan?`
      );
      if (!proceed) return;

      const restoredCards = await Promise.all(
        backup.cards.map(async (card: Record<string, unknown>) => {
          const image =
            typeof card.image === 'string' ? dataUrlToBlob(card.image) : (card.image as Blob);
          return {
            ...card,
            image
          } as ObjectCard;
        })
      );

      await clearStore('cards');
      await clearStore('categories');

      const parsedCategories: string[] = backup.categories
        .map((cat: { name?: string } | string) =>
          typeof cat === 'string' ? cat.trim() : String(cat.name || '').trim()
        )
        .filter(Boolean);

      await Promise.all(parsedCategories.map(name => saveCategory(name)));
      await Promise.all(restoredCards.map(c => saveCard(c)));

      await refreshData();
      addToast(`Import sukses: ${restoredCards.length} kartu dipulihkan.`, 'success');
      syncLocalChangesToAccount();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Import backup gagal.';
      addToast(msg, 'error');
    }
  };

  return (
    <div className={`${isDarkMode ? 'dark' : ''} min-h-screen flex flex-col bg-[#fafaf8] dark:bg-stone-950 text-stone-900 dark:text-stone-100 selection:bg-emerald-500/20 transition-colors`}>
      {/* Top Bar Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        cardsCount={cards.length}
        dueCount={dueEntries.length}
        categoriesCount={categories.length}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenUpload={() => setIsUploadModalOpen(true)}
        storageStatusText={storageStatusText}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(prev => !prev)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* App Hero / Title Banner */}
        <section className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 tracking-wider uppercase">
                Picture Vocabulary · English
              </span>
              <span className="text-stone-300 dark:text-stone-700">·</span>
              <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">
                {storageStatusText}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold tracking-tight text-stone-900 dark:text-white">
              Belajar dari benda.
            </h1>
            <p className="text-sm sm:text-base text-stone-600 dark:text-stone-400 max-w-2xl mt-2 leading-relaxed">
              Buat koleksi visual benda dalam bahasa Inggris dari foto sekitarmu. Pasang pin kosakata detail,
              latih hafalan dengan spaced repetition, dan dengarkan pelafalannya.
            </p>
          </div>
        </section>

        {/* Tab 1: Library & Workspace */}
        {activeTab === 'library' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Upload Form (Desktop) */}
            <div className="hidden lg:block lg:col-span-4 sticky top-24">
              <UploadPanel
                categories={categories}
                onSaveCard={handleSaveCard}
                onAddCategory={handleAddCategory}
                onExportFolder={handleExportFolder}
                onDownloadBackup={handleDownloadBackup}
                onImportBackup={handleImportBackup}
                activeFilterCategory={activeCategory}
                onToast={addToast}
              />
            </div>

            {/* Right Column: Gallery Collection */}
            <div className="lg:col-span-8">
              <GalleryPanel
                cards={cards}
                categories={categories}
                activeCategory={activeCategory}
                onSelectCategory={setActiveCategory}
                onDeleteCard={handleDeleteCard}
                onOpenCardViewer={card => setActiveViewerCard(card)}
                onOpenUpload={() => setIsUploadModalOpen(true)}
                hideEnglish={hideEnglish}
                onToggleHideEnglish={() => setHideEnglish(prev => !prev)}
              />
            </div>
          </div>
        )}

        {/* Tab 2: Review / Spaced Repetition */}
        {activeTab === 'review' && (
          <ReviewSection
            cards={cards}
            onRateEntry={handleRateReviewEntry}
            onToast={addToast}
            onGoToCollection={() => setActiveTab('library')}
          />
        )}

        {/* Tab 3: Guide / Panduan */}
        {activeTab === 'guide' && (
          <GuideSection onGoToUpload={() => setIsUploadModalOpen(true)} />
        )}
      </main>

      {/* Mobile Upload Modal */}
      {isUploadModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs animate-in fade-in"
          onClick={e => {
            if (e.target === e.currentTarget) setIsUploadModalOpen(false);
          }}
        >
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl">
            <UploadPanel
              categories={categories}
              onSaveCard={handleSaveCard}
              onAddCategory={handleAddCategory}
              onExportFolder={handleExportFolder}
              onDownloadBackup={handleDownloadBackup}
              onImportBackup={handleImportBackup}
              activeFilterCategory={activeCategory}
              onToast={addToast}
              isOpenAsModal={true}
              onCloseModal={() => setIsUploadModalOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Image Viewer / Deep-Dive Vocabulary Modal with Interactive Hotspots */}
      {activeViewerCard && (
        <ImageViewerModal
          card={activeViewerCard}
          onClose={() => setActiveViewerCard(null)}
          onUpdateWords={handleUpdateWords}
          onDeleteCard={handleDeleteCard}
          onToast={addToast}
        />
      )}

      {/* Settings & Storage Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        categories={categories}
        cardsCount={cards.length}
        onExportFolder={handleExportFolder}
        onDownloadBackup={handleDownloadBackup}
        onImportBackup={handleImportBackup}
        onLoadStarterPack={handleLoadStarterPack}
        onToast={addToast}
      />

      {/* Global Toast System */}
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
