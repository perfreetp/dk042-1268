import { create } from 'zustand';
import type { Contribution, ReviewRecord } from '@/types';
import { storage } from '@/utils/storage';

const STORAGE_KEY_CONTRIBUTIONS = 'review_contributions';
const STORAGE_KEY_RECORDS = 'review_records';

const mockContributions: Contribution[] = [
  {
    id: 'CONTRIB-001',
    type: 'new_article',
    submitter: '李小明',
    title: '新增：Kafka消息积压问题排查指南',
    summary: '针对Kafka消费端Lag持续升高问题，整理了定位思路和常用处理方案，包含3个实际案例。',
    status: 'pending',
    createdAt: '2026-06-10T09:15:00Z'
  },
  {
    id: 'CONTRIB-002',
    type: 'update_article',
    articleId: 'ART-003',
    submitter: '王大力',
    title: '更新：支付回调失败处理-补充银联通道配置',
    summary: '在原有支付回调处理方案中，补充了银联商务的签名算法配置说明和常见验签失败原因。',
    diffContent: '在步骤2"排查回调链路"后新增银联通道专用调试指令...',
    status: 'approved',
    createdAt: '2026-06-05T14:30:00Z'
  },
  {
    id: 'CONTRIB-003',
    type: 'new_case',
    articleId: 'ART-009',
    submitter: '赵雪',
    title: '案例：连接池泄漏-批量任务未释放连接',
    summary: '补充一个数据库连接池耗尽的真实案例：夜间批量报表任务异常中断导致连接未归还。',
    status: 'pending',
    createdAt: '2026-06-12T11:45:00Z'
  },
  {
    id: 'CONTRIB-004',
    type: 'update_article',
    articleId: 'ART-005',
    submitter: '孙悦',
    title: '更新：用户登录排查-新增生物识别异常分支',
    summary: '建议补充面容ID、指纹识别失败时的降级处理方案，以及设备安全校验相关的错误码。',
    status: 'rejected',
    createdAt: '2026-06-08T16:20:00Z'
  },
  {
    id: 'CONTRIB-005',
    type: 'new_article',
    submitter: '周建国',
    title: '新增：灰度发布故障快速回滚操作手册',
    summary: '整理了网关层灰度发布异常时的快速回滚SOP，包含Nginx/Envoy/Spring Cloud Gateway三种网关的操作指令。',
    status: 'pending',
    createdAt: '2026-06-13T08:00:00Z'
  }
];

const mockReviewRecords: ReviewRecord[] = [
  {
    id: 'REVIEW-001',
    contributionId: 'CONTRIB-002',
    reviewer: '张主管',
    decision: 'approved',
    remark: '补充内容准确，与原有方案衔接良好，已合并。',
    reviewedAt: '2026-06-06T10:00:00Z'
  },
  {
    id: 'REVIEW-002',
    contributionId: 'CONTRIB-004',
    reviewer: '李主管',
    decision: 'rejected',
    remark: '生物识别方案属于账号体系2.0规划，当前版本暂未上线，请待功能上线后再提交相关文档。',
    reviewedAt: '2026-06-09T09:30:00Z'
  }
];

const loadContributions = (): Contribution[] => {
  const stored = storage.getItem<Contribution[]>(STORAGE_KEY_CONTRIBUTIONS);
  return stored ?? mockContributions;
};

const loadReviewRecords = (): ReviewRecord[] => {
  const stored = storage.getItem<ReviewRecord[]>(STORAGE_KEY_RECORDS);
  return stored ?? mockReviewRecords;
};

const persistContributions = (data: Contribution[]) => {
  storage.setItem(STORAGE_KEY_CONTRIBUTIONS, data);
};

const persistReviewRecords = (data: ReviewRecord[]) => {
  storage.setItem(STORAGE_KEY_RECORDS, data);
};

interface ReviewStoreState {
  contributions: Contribution[];
  reviewRecords: ReviewRecord[];
  submitContribution: (data: Omit<Contribution, 'id' | 'status' | 'createdAt'>) => void;
  approveContribution: (id: string, reviewer: string, remark?: string) => void;
  rejectContribution: (id: string, reviewer: string, remark: string) => void;
  getPendingContributions: () => Contribution[];
  getContributionHistory: () => Array<Contribution & { reviewRecord?: ReviewRecord }>;
}

export const useReviewStore = create<ReviewStoreState>((set, get) => ({
  contributions: loadContributions(),
  reviewRecords: loadReviewRecords(),

  submitContribution: (data) => {
    const { contributions } = get();
    const newContribution: Contribution = {
      ...data,
      id: `CONTRIB-${Date.now()}`,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    const newContributions = [...contributions, newContribution];
    persistContributions(newContributions);
    set({ contributions: newContributions });
  },

  approveContribution: (id, reviewer, remark) => {
    const { contributions, reviewRecords } = get();
    const newContributions = contributions.map((c) =>
      c.id === id ? { ...c, status: 'approved' as const } : c
    );
    const newRecord: ReviewRecord = {
      id: `REVIEW-${Date.now()}`,
      contributionId: id,
      reviewer,
      decision: 'approved',
      remark: remark ?? '审核通过',
      reviewedAt: new Date().toISOString()
    };
    const newReviewRecords = [...reviewRecords, newRecord];
    persistContributions(newContributions);
    persistReviewRecords(newReviewRecords);
    set({ contributions: newContributions, reviewRecords: newReviewRecords });
  },

  rejectContribution: (id, reviewer, remark) => {
    const { contributions, reviewRecords } = get();
    const newContributions = contributions.map((c) =>
      c.id === id ? { ...c, status: 'rejected' as const } : c
    );
    const newRecord: ReviewRecord = {
      id: `REVIEW-${Date.now()}`,
      contributionId: id,
      reviewer,
      decision: 'rejected',
      remark,
      reviewedAt: new Date().toISOString()
    };
    const newReviewRecords = [...reviewRecords, newRecord];
    persistContributions(newContributions);
    persistReviewRecords(newReviewRecords);
    set({ contributions: newContributions, reviewRecords: newReviewRecords });
  },

  getPendingContributions: () => {
    const { contributions } = get();
    return contributions.filter((c) => c.status === 'pending');
  },

  getContributionHistory: () => {
    const { contributions, reviewRecords } = get();
    return contributions
      .filter((c) => c.status !== 'pending')
      .map((c) => ({
        ...c,
        reviewRecord: reviewRecords.find((r) => r.contributionId === c.id)
      }))
      .sort((a, b) => {
        const dateA = a.reviewRecord?.reviewedAt ?? a.createdAt;
        const dateB = b.reviewRecord?.reviewedAt ?? b.createdAt;
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      });
  }
}));
