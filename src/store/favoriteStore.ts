import { create } from 'zustand';
import type { Favorite } from '@/types';
import type { Article } from '@/data/mockArticles';
import { storage, StorageKeys } from '@/utils/storage';
import { useArticleStore } from './articleStore';

interface FavoriteStoreState {
  favorites: Favorite[];
  toggleFavorite: (articleId: string) => void;
  isFavorite: (articleId: string) => boolean;
  removeFavorite: (articleId: string) => void;
  getFavoriteArticles: () => Article[];
}

const loadFavorites = (): Favorite[] => {
  const stored = storage.getItem<Favorite[]>(StorageKeys.FAVORITE_ARTICLES, []);
  return stored ?? [];
};

const persistFavorites = (favorites: Favorite[]) => {
  storage.setItem(StorageKeys.FAVORITE_ARTICLES, favorites);
};

export const useFavoriteStore = create<FavoriteStoreState>((set, get) => ({
  favorites: loadFavorites(),

  toggleFavorite: (articleId) => {
    const { favorites, isFavorite } = get();
    let newFavorites: Favorite[];
    if (isFavorite(articleId)) {
      newFavorites = favorites.filter((f) => f.articleId !== articleId);
    } else {
      const newFavorite: Favorite = {
        id: `FAV-${Date.now()}`,
        articleId,
        createdAt: new Date().toISOString()
      };
      newFavorites = [...favorites, newFavorite];
    }
    persistFavorites(newFavorites);
    set({ favorites: newFavorites });
  },

  isFavorite: (articleId) => {
    const { favorites } = get();
    return favorites.some((f) => f.articleId === articleId);
  },

  removeFavorite: (articleId) => {
    const { favorites } = get();
    const newFavorites = favorites.filter((f) => f.articleId !== articleId);
    persistFavorites(newFavorites);
    set({ favorites: newFavorites });
  },

  getFavoriteArticles: () => {
    const { favorites } = get();
    const { getArticleById } = useArticleStore.getState();
    const articles: Article[] = [];
    for (const fav of favorites) {
      const article = getArticleById(fav.articleId);
      if (article) {
        articles.push(article);
      }
    }
    return articles;
  }
}));
