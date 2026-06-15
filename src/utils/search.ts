import type { Article, ServiceType } from '@/data/mockArticles';

export interface SearchFilter {
  keyword?: string;
  service?: ServiceType | ServiceType[];
  errorCodes?: string[];
  versions?: string[];
  tags?: string[];
}

export interface SearchResultItem {
  article: Article;
  score: number;
  matches: {
    field: string;
    text: string;
    highlight?: string;
  }[];
}

const WEIGHTS = {
  title: 50,
  exactErrorCode: 40,
  errorCode: 30,
  exactVersion: 35,
  version: 25,
  exactService: 35,
  exactTag: 30,
  tag: 20,
  phenomenon: 15,
  attention: 10,
  step: 12,
  command: 12,
  case: 10,
  incident: 8,
  author: 5
};

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function highlightText(text: string, keywords: string[]): string {
  let result = text;
  keywords.forEach(kw => {
    if (kw.trim()) {
      const regex = new RegExp(`(${escapeRegExp(kw)})`, 'gi');
      result = result.replace(regex, '**$1**');
    }
  });
  return result;
}

function countMatches(text: string, keyword: string): number {
  if (!keyword) return 0;
  const regex = new RegExp(escapeRegExp(keyword), 'gi');
  const matches = text.match(regex);
  return matches ? matches.length : 0;
}

function calculateBaseScore(article: Article): number {
  const recencyScore = (() => {
    const updatedAt = new Date(article.updatedAt).getTime();
    const now = Date.now();
    const diffDays = Math.max(1, (now - updatedAt) / (1000 * 60 * 60 * 24));
    return Math.max(0, 50 - diffDays * 0.1);
  })();

  const popularityScore = Math.min(30, Math.log10(article.viewCount + 1) * 6);
  const ratingScore = (article.ratingAvg / 5) * 20;

  return recencyScore + popularityScore + ratingScore;
}

export function searchArticles(
  articles: Article[],
  filter: SearchFilter = {}
): SearchResultItem[] {
  const { keyword, service, errorCodes, versions, tags } = filter;
  const keywords = keyword
    ? keyword
        .trim()
        .split(/\s+/)
        .filter(k => k.length > 0)
    : [];

  const services = Array.isArray(service) ? service : service ? [service] : [];
  const errorCodeList = errorCodes || [];
  const versionList = versions || [];
  const tagList = tags || [];

  const hasFilters =
    keywords.length > 0 ||
    services.length > 0 ||
    errorCodeList.length > 0 ||
    versionList.length > 0 ||
    tagList.length > 0;

  const results: SearchResultItem[] = [];

  for (const article of articles) {
    let score = 0;
    const matches: SearchResultItem['matches'] = [];

    if (services.length > 0) {
      if (services.includes(article.service)) {
        score += WEIGHTS.exactService;
        matches.push({ field: 'service', text: article.service });
      } else {
        continue;
      }
    }

    if (errorCodeList.length > 0) {
      const matchedErrorCodes = article.errorCodes.filter(ec =>
        errorCodeList.some(target => {
          if (ec.toLowerCase() === target.toLowerCase()) {
            score += WEIGHTS.exactErrorCode;
            return true;
          }
          if (ec.toLowerCase().includes(target.toLowerCase()) || target.toLowerCase().includes(ec.toLowerCase())) {
            score += WEIGHTS.errorCode;
            return true;
          }
          return false;
        })
      );
      if (matchedErrorCodes.length === 0) {
        continue;
      }
      matches.push({ field: 'errorCodes', text: matchedErrorCodes.join(', ') });
    }

    if (versionList.length > 0) {
      const matchedVersions = article.versions.filter(v =>
        versionList.some(target => {
          if (v.toLowerCase() === target.toLowerCase()) {
            score += WEIGHTS.exactVersion;
            return true;
          }
          if (v.toLowerCase().includes(target.toLowerCase()) || target.toLowerCase().includes(v.toLowerCase())) {
            score += WEIGHTS.version;
            return true;
          }
          return false;
        })
      );
      if (matchedVersions.length === 0) {
        continue;
      }
      matches.push({ field: 'versions', text: matchedVersions.join(', ') });
    }

    if (tagList.length > 0) {
      const matchedTags = article.tags.filter(t =>
        tagList.some(target => {
          if (t.toLowerCase() === target.toLowerCase()) {
            score += WEIGHTS.exactTag;
            return true;
          }
          if (t.toLowerCase().includes(target.toLowerCase()) || target.toLowerCase().includes(t.toLowerCase())) {
            score += WEIGHTS.tag;
            return true;
          }
          return false;
        })
      );
      if (matchedTags.length === 0) {
        continue;
      }
      matches.push({ field: 'tags', text: matchedTags.join(', ') });
    }

    if (keywords.length > 0) {
      let hasKeywordMatch = false;

      for (const kw of keywords) {
        const titleMatches = countMatches(article.title, kw);
        if (titleMatches > 0) {
          score += WEIGHTS.title * titleMatches;
          matches.push({
            field: 'title',
            text: article.title,
            highlight: highlightText(article.title, keywords)
          });
          hasKeywordMatch = true;
        }

        const errorCodeMatches = article.errorCodes.filter(ec =>
          ec.toLowerCase().includes(kw.toLowerCase())
        );
        if (errorCodeMatches.length > 0) {
          score += WEIGHTS.errorCode * errorCodeMatches.length;
          matches.push({ field: 'errorCodes', text: errorCodeMatches.join(', ') });
          hasKeywordMatch = true;
        }

        const versionMatches = article.versions.filter(v =>
          v.toLowerCase().includes(kw.toLowerCase())
        );
        if (versionMatches.length > 0) {
          score += WEIGHTS.version * versionMatches.length;
          matches.push({ field: 'versions', text: versionMatches.join(', ') });
          hasKeywordMatch = true;
        }

        const tagMatches = article.tags.filter(t =>
          t.toLowerCase().includes(kw.toLowerCase())
        );
        if (tagMatches.length > 0) {
          score += WEIGHTS.tag * tagMatches.length;
          matches.push({ field: 'tags', text: tagMatches.join(', ') });
          hasKeywordMatch = true;
        }

        const phenomenonMatches = countMatches(article.phenomenon, kw);
        if (phenomenonMatches > 0) {
          score += WEIGHTS.phenomenon * phenomenonMatches;
          matches.push({
            field: 'phenomenon',
            text: article.phenomenon.slice(0, 150) + (article.phenomenon.length > 150 ? '...' : ''),
            highlight: highlightText(article.phenomenon.slice(0, 150), keywords) + (article.phenomenon.length > 150 ? '...' : '')
          });
          hasKeywordMatch = true;
        }

        const attentionMatches = countMatches(article.attention, kw);
        if (attentionMatches > 0) {
          score += WEIGHTS.attention * attentionMatches;
          hasKeywordMatch = true;
        }

        const authorMatches = countMatches(article.author, kw);
        if (authorMatches > 0) {
          score += WEIGHTS.author * authorMatches;
          matches.push({ field: 'author', text: article.author });
          hasKeywordMatch = true;
        }

        for (const step of article.steps) {
          const stepMatches = countMatches(step.title + ' ' + step.description, kw);
          if (stepMatches > 0) {
            score += WEIGHTS.step * Math.min(stepMatches, 3);
            hasKeywordMatch = true;
          }
        }

        for (const cmd of article.commands) {
          const cmdMatches = countMatches(cmd.name + ' ' + cmd.cmd + ' ' + cmd.description, kw);
          if (cmdMatches > 0) {
            score += WEIGHTS.command * Math.min(cmdMatches, 3);
            hasKeywordMatch = true;
          }
        }

        for (const c of article.cases) {
          const caseMatches = countMatches(c.title + ' ' + c.description + ' ' + c.solution, kw);
          if (caseMatches > 0) {
            score += WEIGHTS.case * Math.min(caseMatches, 3);
            hasKeywordMatch = true;
          }
        }

        for (const inc of article.incidents) {
          const incMatches = countMatches(inc.title + ' ' + inc.impact, kw);
          if (incMatches > 0) {
            score += WEIGHTS.incident * Math.min(incMatches, 2);
            hasKeywordMatch = true;
          }
        }
      }

      if (!hasKeywordMatch && (keywords.length > 0)) {
        continue;
      }
    }

    if (hasFilters || keywords.length > 0) {
      score += calculateBaseScore(article) * 0.3;
    } else {
      score = calculateBaseScore(article);
    }

    results.push({ article, score, matches });
  }

  return results.sort((a, b) => b.score - a.score);
}

export function getAllErrorCodes(articles: Article[]): string[] {
  const set = new Set<string>();
  articles.forEach(a => a.errorCodes.forEach(ec => set.add(ec)));
  return Array.from(set).sort();
}

export function getAllVersions(articles: Article[]): string[] {
  const set = new Set<string>();
  articles.forEach(a => a.versions.forEach(v => set.add(v)));
  return Array.from(set).sort();
}

export function getAllTags(articles: Article[]): string[] {
  const set = new Set<string>();
  articles.forEach(a => a.tags.forEach(t => set.add(t)));
  return Array.from(set).sort();
}
