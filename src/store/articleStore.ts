import { create } from 'zustand';
import type { Rating, ServiceType, SearchFilter } from '@/types';
import { mockArticles, type Article, type Case } from '@/data/mockArticles';
import { searchArticles, type SearchFilter as SearchFilterType } from '@/utils/search';

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
}

export const useArticleStore = create<ArticleStoreState>((set, get) => ({
  articles: mockArticles,
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

  incrementViewCount: (id) => set((state) => ({
    articles: state.articles.map((article) =>
      article.id === id
        ? { ...article, viewCount: article.viewCount + 1 }
        : article
    )
  })),

  addRating: (articleId, rating) => set((state) => ({
    articles: state.articles.map((article) => {
      if (article.id !== articleId) return article;
      const newRatingCount = article.ratingCount + 1;
      const newRatingAvg =
        (article.ratingAvg * article.ratingCount + rating.score) / newRatingCount;
      return {
        ...article,
        ratingAvg: Number(newRatingAvg.toFixed(1)),
        ratingCount: newRatingCount
      };
    })
  })),

  addCase: (articleId, caseItem) => set((state) => ({
    articles: state.articles.map((article) => {
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
    })
  })),

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
  }
}));
