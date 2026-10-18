export interface CardWord {
  english: string;
  indonesian?: string;
  pronunciation?: string;
  exampleSentence?: string;
  x?: number; // percentage 0-100 on image
  y?: number; // percentage 0-100 on image
  repetition?: number;
  easiness?: number;
  interval?: number;
  nextReviewDate?: string;
}

export interface ObjectCard {
  id: string;
  english: string;
  indonesian: string;
  category: string;
  image: Blob | null;
  createdAt: number;
  pronunciation?: string;
  exampleSentence?: string;
  words?: CardWord[];
  repetition?: number;
  easiness?: number;
  interval?: number;
  nextReviewDate?: string;
  cloudImageHash?: string;
  cloudUpdatedAt?: string;
  imagePath?: string;
  imageHash?: string;
}

export interface Category {
  name: string;
}

export interface ReviewEntry {
  cardId: string;
  wordIndex?: number;
  english: string;
  indonesian?: string;
  category: string;
  image: Blob | null;
  repetition: number;
  easiness: number;
  interval: number;
  nextReviewDate?: string;
}

declare global {
  interface Window {
    __accountStorageBridge?: {
      writeAccountValue: (key: string, value: string) => Promise<boolean>;
    };
    __accountStorageRemote?: {
      remove: (key: string) => Promise<boolean>;
    };
    __accountStorageReady?: Promise<void>;
    registerAccountStorageTask?: (fn: (arg: { uid: string }) => Promise<void>) => void;
  }
}
