import { ObjectCard, Category } from '../types';

export const DB_NAME = 'object_english_library';
export const DB_VERSION = 2;
export const CLOUD_CARD_IDS_KEY = 'object_english_cloud_card_ids_v1';
export const CLOUD_CATEGORIES_KEY = 'object_english_cloud_categories_v1';
export const RATIO = 2 / 3;
export const TARGET_WIDTH = 1024;
export const TARGET_HEIGHT = 1536;

let databasePromise: Promise<IDBDatabase> | null = null;

export function openDatabase(): Promise<IDBDatabase> {
  if (databasePromise) return databasePromise;

  databasePromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('cards')) {
        db.createObjectStore('cards', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('categories')) {
        db.createObjectStore('categories', { keyPath: 'name' });
      }
      if (!db.objectStoreNames.contains('accountMetadata')) {
        db.createObjectStore('accountMetadata', { keyPath: 'key' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return databasePromise;
}

export async function storeRequest<T>(
  storeName: 'cards' | 'categories' | 'accountMetadata',
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, mode);
    const request = action(transaction.objectStore(storeName));
    let result: T;
    request.onsuccess = () => {
      result = request.result;
    };
    request.onerror = () => reject(request.error || new Error('Operasi penyimpanan gagal.'));
    transaction.oncomplete = () => resolve(result);
    transaction.onerror = () => reject(transaction.error || request.error || new Error('Penyimpanan gagal.'));
    transaction.onabort = () => reject(transaction.error || request.error || new Error('Penyimpanan gagal.'));
  });
}

export const allCards = () => storeRequest<ObjectCard[]>('cards', 'readonly', store => store.getAll());
export const allCategories = () => storeRequest<Category[]>('categories', 'readonly', store => store.getAll());
export const saveCard = (card: ObjectCard) => storeRequest('cards', 'readwrite', store => store.put(card));
export const deleteCard = (id: string) => storeRequest('cards', 'readwrite', store => store.delete(id));
export const saveCategory = (name: string) => storeRequest('categories', 'readwrite', store => store.put({ name }));
export const deleteCategory = (name: string) => storeRequest('categories', 'readwrite', store => store.delete(name));
export const clearStore = (storeName: 'cards' | 'categories' | 'accountMetadata') =>
  storeRequest(storeName, 'readwrite', store => store.clear());

export const getLocalOwnerUid = async (): Promise<string> => {
  const meta = await storeRequest<{ key: string; uid?: string } | undefined>(
    'accountMetadata',
    'readonly',
    store => store.get('ownerUid')
  );
  return meta?.uid || '';
};

export const setLocalOwnerUid = (uid: string) =>
  storeRequest('accountMetadata', 'readwrite', store => store.put({ key: 'ownerUid', uid }));

export const cloudCardKey = (id: string) => `object_english_cloud_card_${id}`;

export async function writeCloudValue(key: string, value: unknown): Promise<void> {
  if (!window.__accountStorageBridge) return;
  const saved = await window.__accountStorageBridge.writeAccountValue(key, JSON.stringify(value));
  if (!saved) throw new Error('Metadata gagal disimpan ke akun.');
}

export async function syncObjectLibraryToAccount(): Promise<void> {
  if (!window.__accountStorageBridge) return;
  const [cards, categories] = await Promise.all([allCards(), allCategories()]);
  const previousIds: string[] = JSON.parse(localStorage.getItem(CLOUD_CARD_IDS_KEY) || '[]');
  const cardIds: string[] = [];

  for (const card of cards) {
    const key = cloudCardKey(card.id);
    const { image, cloudImageHash, cloudUpdatedAt, imagePath, imageHash, ...fields } = card;
    const metadata = { ...fields, updatedAt: new Date().toISOString() };
    await writeCloudValue(key, metadata);
    cardIds.push(card.id);
  }

  if (window.__accountStorageRemote) {
    for (const staleId of previousIds.filter(id => !cardIds.includes(id))) {
      await window.__accountStorageRemote.remove(cloudCardKey(staleId));
    }
  }

  await Promise.all([
    writeCloudValue(CLOUD_CARD_IDS_KEY, cardIds),
    writeCloudValue(CLOUD_CATEGORIES_KEY, categories.map(category => category.name))
  ]);
}

export async function syncLocalChangesToAccount(): Promise<boolean> {
  if (!window.__accountStorageBridge) return true;
  try {
    await syncObjectLibraryToAccount();
    return true;
  } catch (error) {
    console.error('Perubahan tersimpan di perangkat, tetapi sinkronisasi akun gagal.', error);
    return false;
  }
}

export async function syncObjectLibraryFromAccount({ uid }: { uid: string }): Promise<void> {
  await openDatabase();
  const ownerUid = await getLocalOwnerUid();
  const ids: string[] | null = JSON.parse(localStorage.getItem(CLOUD_CARD_IDS_KEY) || 'null');
  if (!Array.isArray(ids)) {
    if (ownerUid && ownerUid !== uid) {
      await clearStore('cards');
      await clearStore('categories');
    }
    await syncObjectLibraryToAccount();
    await setLocalOwnerUid(uid);
    return;
  }

  if (ownerUid && ownerUid !== uid) {
    await clearStore('cards');
    await clearStore('categories');
  }
  const localCards = new Map((await allCards()).map(card => [card.id, card]));
  const cloudCards: ObjectCard[] = [];
  for (const id of ids) {
    const metadata = JSON.parse(localStorage.getItem(cloudCardKey(id)) || 'null');
    if (!metadata?.id) continue;
    const localCard = localCards.get(id);
    cloudCards.push({ ...metadata, image: localCard?.image instanceof Blob ? localCard.image : null });
  }
  const categories: Category[] = JSON.parse(localStorage.getItem(CLOUD_CATEGORIES_KEY) || '[]').map(
    (name: string) => ({ name })
  );
  await clearStore('cards');
  await clearStore('categories');
  await Promise.all(categories.map(c => saveCategory(c.name)));
  await Promise.all(cloudCards.map(saveCard));
  await setLocalOwnerUid(uid);
}

// Helpers for processing image to 2:3 ratio, 1024x1536 resolution
export async function prepareImage(file: File): Promise<Blob> {
  if (!file || !file.type.startsWith('image/')) {
    throw new Error('Pilih file gambar yang valid.');
  }
  const bitmap = await createImageBitmap(file);
  const width = bitmap.width;
  const height = bitmap.height;

  // Check 2:3 ratio
  const ratioDelta = Math.abs(width / height - RATIO);
  if (ratioDelta > 0.05) {
    bitmap.close();
    throw new Error(
      `Rasio gambar saat ini ${width} × ${height} (${(width / height).toFixed(2)}:1), bukan 2:3 (0.67:1). Gunakan gambar portrait berasio 2:3.`
    );
  }

  const canvas = document.createElement('canvas');
  canvas.width = TARGET_WIDTH;
  canvas.height = TARGET_HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    bitmap.close();
    throw new Error('Canvas 2D context tidak tersedia.');
  }

  // Draw scaled
  ctx.drawImage(bitmap, 0, 0, TARGET_WIDTH, TARGET_HEIGHT);
  bitmap.close();

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => {
        if (blob) resolve(blob);
        else reject(new Error('Gambar tidak dapat diproses.'));
      },
      'image/jpeg',
      0.9
    );
  });
}

// Backup utilities
export async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const [header, encoded] = String(dataUrl).split(',');
  if (!header || !encoded || !header.startsWith('data:')) {
    throw new Error('Format gambar backup tidak valid.');
  }
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const match = header.match(/data:([^;]+)/);
  return new Blob([bytes], { type: match ? match[1] : 'image/jpeg' });
}

export function safeFilename(value: string): string {
  return (
    value
      .normalize('NFKD')
      .replace(/[\\/:*?"<>|]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 70) || 'object'
  );
}
