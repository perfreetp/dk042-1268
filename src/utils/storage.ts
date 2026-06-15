const isBrowser = typeof window !== 'undefined';

export const storage = {
  getItem<T>(key: string, defaultValue?: T): T | null {
    if (!isBrowser) {
      return defaultValue ?? null;
    }

    try {
      const value = window.localStorage.getItem(key);
      if (value === null) {
        return defaultValue ?? null;
      }
      return JSON.parse(value) as T;
    } catch {
      return defaultValue ?? null;
    }
  },

  setItem<T>(key: string, value: T): boolean {
    if (!isBrowser) {
      return false;
    }

    try {
      const serialized = JSON.stringify(value);
      window.localStorage.setItem(key, serialized);
      return true;
    } catch {
      return false;
    }
  },

  removeItem(key: string): boolean {
    if (!isBrowser) {
      return false;
    }

    try {
      window.localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  },

  clear(): boolean {
    if (!isBrowser) {
      return false;
    }

    try {
      window.localStorage.clear();
      return true;
    } catch {
      return false;
    }
  },

  hasKey(key: string): boolean {
    if (!isBrowser) {
      return false;
    }
    return window.localStorage.getItem(key) !== null;
  },

  keys(): string[] {
    if (!isBrowser) {
      return [];
    }
    const result: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key !== null) {
        result.push(key);
      }
    }
    return result;
  }
};

export const StorageKeys = {
  THEME: 'theme',
  FAVORITE_ARTICLES: 'favorite_articles',
  VIEW_HISTORY: 'view_history',
  SEARCH_HISTORY: 'search_history',
  SELECTED_ARTICLES: 'selected_articles',
  USER_SETTINGS: 'user_settings'
} as const;

export type StorageKeyType = typeof StorageKeys[keyof typeof StorageKeys];
