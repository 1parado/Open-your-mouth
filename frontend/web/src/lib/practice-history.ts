export interface PracticeHistoryItem {
  id: string;
  createdAt: string;
  referenceText: string;
  language: string;
  score: number;
  accuracy: number;
  fluency: number;
  completeness: number;
  prosody: number;
  naturalness: number;
}

const STORAGE_KEY = "practice-history";

export function readPracticeHistory(): PracticeHistoryItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as PracticeHistoryItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writePracticeHistory(items: PracticeHistoryItem[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function appendPracticeHistory(item: PracticeHistoryItem) {
  const current = readPracticeHistory();
  const next = [item, ...current].slice(0, 10);
  writePracticeHistory(next);
}
