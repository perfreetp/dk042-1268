import type { Article as MockArticle, Case as MockCase } from '@/data/mockArticles';

export type ServiceType =
  | 'order'
  | 'payment'
  | 'user'
  | 'message'
  | 'search'
  | 'gateway'
  | 'database'
  | 'cache';

export interface Step {
  id: string;
  order: number;
  description: string;
  checkCommand?: string;
  expectedResult?: string;
  abnormalHandle?: string;
}

export interface Command {
  id: string;
  name: string;
  content: string;
  description: string;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface Incident {
  id: string;
  incidentNo: string;
  happenedAt: string;
  impact: string;
  summaryUrl: string;
}

export interface CaseItem {
  id: string;
  submitter: string;
  scene: string;
  process: string;
  createdAt: string;
}

export interface Article {
  id: string;
  title: string;
  service: ServiceType;
  errorCodes: string[];
  versions: string[];
  phenomenon: string;
  attention: string[];
  tags: string[];
  viewCount: number;
  ratingAvg: number;
  ratingCount: number;
  createdAt: string;
  updatedAt: string;
  author: string;
  steps: Step[];
  commands: Command[];
  incidents: Incident[];
  cases: CaseItem[];
}

export interface Rating {
  id: string;
  articleId: string;
  score: 1 | 2 | 3 | 4 | 5;
  solved: boolean;
  feedback?: string;
  createdAt: string;
}

export interface Favorite {
  id: string;
  articleId: string;
  createdAt: string;
}

export type ContributionType = 'new_article' | 'update_article' | 'new_case';
export type ContributionStatus = 'pending' | 'approved' | 'rejected';

export interface Contribution {
  id: string;
  type: ContributionType;
  articleId?: string;
  submitter: string;
  title: string;
  summary: string;
  diffContent?: string;
  status: ContributionStatus;
  createdAt: string;
  articleData?: MockArticle;
  patch?: Partial<MockArticle>;
  caseData?: MockCase;
}

export interface ReviewRecord {
  id: string;
  contributionId: string;
  reviewer: string;
  decision: 'approved' | 'rejected';
  remark: string;
  reviewedAt: string;
}

export interface SearchFilter {
  keyword?: string;
  service?: ServiceType | 'all';
  errorCode?: string;
  version?: string;
  tags?: string[];
}

export type FeedbackStatus = 'pending' | 'resolved' | 'rejected';

export interface InvalidFeedback {
  id: string;
  articleId: string;
  reporter: string;
  reasons: string[];
  description: string;
  status: FeedbackStatus;
  createdAt: string;
  handler?: string;
  handleRemark?: string;
  handledAt?: string;
}
