import { create } from 'zustand';
import type { Rating, ServiceType, SearchFilter } from '@/types';
import { mockArticles, type Article, type Case } from '@/data/mockArticles';
import { searchArticles, type SearchFilter as SearchFilterType } from '@/utils/search';
import { storage, StorageKeys } from '@/utils/storage';

type MockServiceType = typeof mockArticles[number]['service'];

interface NewCaseInput extends Partial<Case> {
  submitter?: string;
  scene?: string;
  process?: string;
  title?: string;
  environment?: string;
  description?: string;
  solution?: string;
}

const STORAGE_KEY_ARTICLES = StorageKeys.KNOWLEDGE_ARTICLES;

function loadArticles(): Article[] {
  const stored = storage.getItem<Article[]>(STORAGE_KEY_ARTICLES);
  return stored ?? mockArticles;
}

function persistArticles(articles: Article[]): void {
  storage.setItem(STORAGE_KEY_ARTICLES, articles);
}

interface ArticleStoreState {
  articles: Article[];
  filter: SearchFilter;
  selectedArticleId: string | null;
  setFilter: (filter: Partial<SearchFilter>) => void;
  getFilteredArticles: () => ReturnType<typeof searchArticles>;
  incrementViewCount: (id: string) => void;
  addRating: (articleId: string, rating: Omit<Rating, 'id' | 'articleId' | 'createdAt'>) => void;
  addCase: (articleId: string, caseItem: NewCaseInput) => void;
  getArticleById: (id: string) => Article | undefined;
  getArticlesByService: () => Record<ServiceType | 'all', number>;
  updateArticle: (id: string, patch: Partial<Article>) => void;
  addNewArticle: (article: Article) => void;
  updateArticleFromContribution: (id: string, patch: Partial<Article>) => void;
  addCaseToArticle: (articleId: string, caseData: Case) => void;
}

export const useArticleStore = create<ArticleStoreState>((set, get) => ({
  articles: loadArticles(),
  filter: {
    keyword: '',
    service: 'all',
    errorCode: '',
    version: '',
    tags: []
  },
  selectedArticleId: null,

  setFilter: (filter) => set((state) => ({
    filter: { ...state.filter, ...filter }
  })),

  getFilteredArticles: () => {
    const { articles, filter } = get();
    const searchFilter: SearchFilterType = {
      keyword: filter.keyword,
      service: filter.service && filter.service !== 'all' ? [filter.service as MockServiceType] : undefined,
      errorCodes: filter.errorCode ? [filter.errorCode] : undefined,
      versions: filter.version ? [filter.version] : undefined,
      tags: filter.tags
    };
    return searchArticles(articles, searchFilter);
  },

  incrementViewCount: (id) => {
    const { articles } = get();
    const newArticles = articles.map((article) =>
      article.id === id
        ? { ...article, viewCount: article.viewCount + 1 }
        : article
    );
    persistArticles(newArticles);
    set({ articles: newArticles });
  },

  addRating: (articleId, rating) => {
    const { articles } = get();
    const newArticles = articles.map((article) => {
      if (article.id !== articleId) return article;
      const newRatingCount = article.ratingCount + 1;
      const newRatingAvg =
        (article.ratingAvg * article.ratingCount + rating.score) / newRatingCount;
      return {
        ...article,
        ratingAvg: Number(newRatingAvg.toFixed(1)),
        ratingCount: newRatingCount
      };
    });
    persistArticles(newArticles);
    set({ articles: newArticles });
  },

  addCase: (articleId, caseItem) => {
    const { articles } = get();
    const newArticles = articles.map((article) => {
      if (article.id !== articleId) return article;
      const newCase: Case = {
        title: caseItem.title ?? caseItem.scene ?? '未命名案例',
        environment: caseItem.environment ?? '生产环境',
        description: caseItem.description ?? caseItem.process ?? caseItem.scene ?? '',
        solution: caseItem.solution ?? caseItem.process ?? '',
      };
      return {
        ...article,
        cases: [...article.cases, newCase]
      };
    });
    persistArticles(newArticles);
    set({ articles: newArticles });
  },

  getArticleById: (id) => {
    const { articles } = get();
    return articles.find((article) => article.id === id);
  },

  getArticlesByService: () => {
    const { articles } = get();
    const counts: Record<string, number> = { all: articles.length };
    for (const article of articles) {
      counts[article.service] = (counts[article.service] ?? 0) + 1;
    }
    return counts as Record<ServiceType | 'all', number>;
  },

  updateArticle: (id, patch) => {
    const { articles } = get();
    const newArticles = articles.map((article) =>
      article.id === id ? { ...article, ...patch } : article
    );
    persistArticles(newArticles);
    set({ articles: newArticles });
  },

  addNewArticle: (article) => {
    const { articles } = get();
    const newArticles = [...articles, article];
    persistArticles(newArticles);
    set({ articles: newArticles });
  },

  updateArticleFromContribution: (id, patch) => {
    const { articles } = get();
    const newArticles = articles.map((article) =>
      article.id === id ? { ...article, ...patch, updatedAt: new Date().toISOString() } : article
    );
    persistArticles(newArticles);
    set({ articles: newArticles });
  },

  addCaseToArticle: (articleId, caseData) => {
    const { articles } = get();
    const newArticles = articles.map((article) => {
      if (article.id !== articleId) return article;
      return {
        ...article,
        cases: [...article.cases, caseData]
      };
    });
    persistArticles(newArticles);
    set({ articles: newArticles });
  }
}));
