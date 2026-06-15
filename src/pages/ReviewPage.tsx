import { useState, useMemo } from 'react';
import {
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  ChevronUp,
  ChevronDown,
  Filter,
  Download,
  Plus,
  User,
  Calendar,
  FileText,
  AlertCircle,
  ArrowRight,
  Search,
  ChevronLeft,
  ChevronRight,
  SortDesc,
  SortAsc
} from 'lucide-react';
import MainLayout from '@/components/Layout/MainLayout';
import Badge from '@/components/UI/Badge';
import Button from '@/components/UI/Button';
import Modal from '@/components/UI/Modal';
import { useReviewStore } from '@/store/reviewStore';
import type { Contribution, ContributionType, ReviewRecord } from '@/types';
import { cn } from '@/lib/utils';

type TabKey = 'pending' | 'history';

const CURRENT_REVIEWER = '当前审核人';

const CONTRIBUTION_TYPE_LABELS: Record<ContributionType, string> = {
  new_article: '新文章',
  update_article: '更新文章',
  new_case: '新案例'
};

const CONTRIBUTION_TYPE_COLORS: Record<ContributionType, 'default' | 'accent' | 'warning'> = {
  new_article: 'accent',
  update_article: 'warning',
  new_case: 'default'
};

function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function getInitials(name: string): string {
  return name.charAt(0);
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

interface DiffSegment {
  type: 'equal' | 'added' | 'removed';
  text: string;
}

function computeDiff(oldText: string, newText: string): DiffSegment[] {
  const segments: DiffSegment[] = [];
  const oldChars = oldText.split('');
  const newChars = newText.split('');

  if (oldChars.length === 0 && newChars.length === 0) return segments;
  if (oldChars.length === 0) return [{ type: 'added', text: newText }];
  if (newChars.length === 0) return [{ type: 'removed', text: oldText }];

  const maxLen = Math.max(oldChars.length, newChars.length);
  const minLen = Math.min(oldChars.length, newChars.length);

  let equalBuffer = '';
  for (let i = 0; i < minLen; i++) {
    if (oldChars[i] === newChars[i]) {
      equalBuffer += oldChars[i];
    } else {
      if (equalBuffer) {
        segments.push({ type: 'equal', text: equalBuffer });
        equalBuffer = '';
      }
      segments.push({ type: 'removed', text: oldChars[i] });
      segments.push({ type: 'added', text: newChars[i] });
    }
  }

  if (equalBuffer) {
    segments.push({ type: 'equal', text: equalBuffer });
  }

  if (oldChars.length > minLen) {
    segments.push({ type: 'removed', text: oldChars.slice(minLen).join('') });
  }
  if (newChars.length > minLen) {
    segments.push({ type: 'added', text: newChars.slice(minLen).join('') });
  }

  return segments;
}

function DiffRenderer({ segments }: { segments: DiffSegment[] }) {
  return (
    <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">
      {segments.map((seg, idx) => {
        if (seg.type === 'added') {
          return (
            <span
              key={idx}
              className="bg-green-100 text-green-800 underline decoration-green-500 decoration-2 underline-offset-2 rounded px-0.5"
            >
              {seg.text}
            </span>
          );
        }
        if (seg.type === 'removed') {
          return (
            <span
              key={idx}
              className="bg-red-100 text-red-700 line-through decoration-red-500 decoration-2 rounded px-0.5"
            >
              {seg.text}
            </span>
          );
        }
        return <span key={idx} className="text-slate-700">{seg.text}</span>;
      })}
    </div>
  );
}

export default function ReviewPage() {
  const {
    contributions,
    reviewRecords,
    submitContribution,
    approveContribution,
    rejectContribution,
    getPendingContributions,
    getContributionHistory
  } = useReviewStore();

  const [activeTab, setActiveTab] = useState<TabKey>('pending');
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [selectedContribution, setSelectedContribution] = useState<(Contribution & { reviewRecord?: ReviewRecord }) | null>(null);
  const [reviewRemark, setReviewRemark] = useState('');
  const [quickRemark, setQuickRemark] = useState<Record<string, string>>({});
  const [typeFilter, setTypeFilter] = useState<ContributionType | 'all'>('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [historyPage, setHistoryPage] = useState(1);
  const [historySortAsc, setHistorySortAsc] = useState(false);

  const [submitForm, setSubmitForm] = useState({
    type: 'new_article' as ContributionType,
    articleId: '',
    title: '',
    summary: '',
    content: ''
  });

  const pendingList = useMemo(() => {
    let list = getPendingContributions();
    if (typeFilter !== 'all') {
      list = list.filter(c => c.type === typeFilter);
    }
    if (dateRange.start) {
      const start = new Date(dateRange.start).getTime();
      list = list.filter(c => new Date(c.createdAt).getTime() >= start);
    }
    if (dateRange.end) {
      const end = new Date(dateRange.end).getTime() + 86400000;
      list = list.filter(c => new Date(c.createdAt).getTime() < end);
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [getPendingContributions, typeFilter, dateRange]);

  const historyList = useMemo(() => {
    let list = getContributionHistory();
    if (typeFilter !== 'all') {
      list = list.filter(c => c.type === typeFilter);
    }
    if (dateRange.start) {
      const start = new Date(dateRange.start).getTime();
      list = list.filter(c => new Date(c.createdAt).getTime() >= start);
    }
    if (dateRange.end) {
      const end = new Date(dateRange.end).getTime() + 86400000;
      list = list.filter(c => new Date(c.createdAt).getTime() < end);
    }
    const sorted = [...list].sort((a, b) => {
      const dateA = a.reviewRecord?.reviewedAt ?? a.createdAt;
      const dateB = b.reviewRecord?.reviewedAt ?? b.createdAt;
      const diff = new Date(dateB).getTime() - new Date(dateA).getTime();
      return historySortAsc ? -diff : diff;
    });
    return sorted;
  }, [getContributionHistory, typeFilter, dateRange, historySortAsc]);

  const stats = useMemo(() => {
    const pending = contributions.filter(c => c.status === 'pending').length;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const monthApproved = reviewRecords.filter(
      r => r.decision === 'approved' && new Date(r.reviewedAt).getTime() >= monthStart
    ).length;
    const totalReviewed = reviewRecords.length;
    const approvedCount = reviewRecords.filter(r => r.decision === 'approved').length;
    const rate = totalReviewed > 0 ? Math.round((approvedCount / totalReviewed) * 100) : 0;
    const trend = rate >= 70 ? 'up' : rate >= 40 ? 'flat' : 'down';
    return { pending, monthApproved, rate, trend };
  }, [contributions, reviewRecords]);

  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(historyList.length / pageSize));
  const pagedHistory = historyList.slice((historyPage - 1) * pageSize, historyPage * pageSize);

  function openDetail(contribution: Contribution & { reviewRecord?: ReviewRecord }) {
    setSelectedContribution(contribution);
    setReviewRemark('');
    setDetailModalOpen(true);
  }

  function handleApprove(id: string, remark?: string) {
    approveContribution(id, CURRENT_REVIEWER, remark);
    setDetailModalOpen(false);
    setSelectedContribution(null);
    setQuickRemark(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  function handleReject(id: string, remark: string) {
    if (!remark.trim()) return;
    rejectContribution(id, CURRENT_REVIEWER, remark);
    setDetailModalOpen(false);
    setSelectedContribution(null);
    setQuickRemark(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  function handleSubmitContribution() {
    if (!submitForm.title.trim() || !submitForm.summary.trim() || !submitForm.content.trim()) return;
    const data: Omit<Contribution, 'id' | 'status' | 'createdAt'> = {
      type: submitForm.type,
      submitter: CURRENT_REVIEWER,
      title: submitForm.title.trim(),
      summary: submitForm.summary.trim(),
      diffContent: submitForm.content.trim()
    };
    if ((submitForm.type === 'update_article' || submitForm.type === 'new_case') && submitForm.articleId.trim()) {
      data.articleId = submitForm.articleId.trim();
    }
    submitContribution(data);
    setSubmitModalOpen(false);
    setSubmitForm({ type: 'new_article', articleId: '', title: '', summary: '', content: '' });
  }

  function handleExport() {
    const rows = [
      ['贡献ID', '类型', '标题', '提交人', '提交时间', '状态', '审核人', '审核结果', '审核时间', '审核备注']
    ];
    const combined: Array<Contribution & { reviewRecord?: ReviewRecord }> = [
      ...getContributionHistory(),
      ...getPendingContributions().map(c => ({ ...c, reviewRecord: undefined }))
    ];
    combined.forEach(c => {
      rows.push([
        c.id,
        CONTRIBUTION_TYPE_LABELS[c.type],
        c.title,
        c.submitter,
        formatDateTime(c.createdAt),
        c.status === 'pending' ? '待审核' : c.status === 'approved' ? '已通过' : '已驳回',
        c.reviewRecord?.reviewer ?? '',
        c.reviewRecord?.decision === 'approved' ? '通过' : c.reviewRecord?.decision === 'rejected' ? '驳回' : '',
        c.reviewRecord?.reviewedAt ? formatDateTime(c.reviewRecord.reviewedAt) : '',
        c.reviewRecord?.remark ?? ''
      ]);
    });
    const csv = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const now = new Date();
    const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    link.download = `贡献审核报表_${timestamp}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const originalContent = selectedContribution
    ? `# ${selectedContribution.title}\n\n${selectedContribution.summary}\n\n` +
      (selectedContribution.type === 'update_article'
        ? `## 原文内容\n\n这是关联文章「${selectedContribution.articleId ?? '关联文章'}」的原始内容。包含原有排查步骤、常用命令、注意事项等章节...`
        : selectedContribution.type === 'new_case'
        ? `## 原文内容\n\n案例关联文章「${selectedContribution.articleId ?? '关联文章'}」的正文内容...`
        : '（新文章无原文）')
    : '';

  const proposedContent = selectedContribution
    ? `# ${selectedContribution.title}\n\n${selectedContribution.summary}\n\n## 提议内容\n\n${selectedContribution.diffContent ?? selectedContribution.summary}`
    : '';

  const diffSegments = useMemo(
    () => computeDiff(originalContent, proposedContent),
    [originalContent, proposedContent]
  );

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">贡献审核</h1>
            <p className="mt-1 text-sm text-slate-500">审核社区用户提交的文章更新、新增内容和案例</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">待审核</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{stats.pending}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
            </div>
            <div className="mt-3 flex items-center text-xs">
              <Badge variant="warning">需及时处理</Badge>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">本月通过</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{stats.monthApproved}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-500">当月审核通过的贡献数量</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">通过驳回率</p>
                <p className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-slate-900">{stats.rate}%</span>
                  {stats.trend === 'up' && (
                    <span className="inline-flex items-center text-sm font-medium text-green-600">
                      <ChevronUp className="h-4 w-4" />
                      良好
                    </span>
                  )}
                  {stats.trend === 'flat' && (
                    <span className="inline-flex items-center text-sm font-medium text-slate-500">
                      <ArrowRight className="h-4 w-4" />
                      持平
                    </span>
                  )}
                  {stats.trend === 'down' && (
                    <span className="inline-flex items-center text-sm font-medium text-red-600">
                      <ChevronDown className="h-4 w-4" />
                      偏低
                    </span>
                  )}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-500">审核通过率 = 通过数 / 总审核数</p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
              <button
                onClick={() => setActiveTab('pending')}
                className={cn(
                  'inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all',
                  activeTab === 'pending'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                )}
              >
                待审核
                {stats.pending > 0 && (
                  <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-amber-100 px-1.5 text-xs font-medium text-amber-700">
                    {stats.pending}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={cn(
                  'inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all',
                  activeTab === 'history'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                )}
              >
                审核记录
                <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-slate-200 px-1.5 text-xs font-medium text-slate-600">
                  {reviewRecords.length}
                </span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-slate-400" />
                <select
                  value={typeFilter}
                  onChange={e => setTypeFilter(e.target.value as ContributionType | 'all')}
                  className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                >
                  <option value="all">全部类型</option>
                  <option value="new_article">新文章</option>
                  <option value="update_article">更新文章</option>
                  <option value="new_case">新案例</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-400" />
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={e => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  placeholder="开始日期"
                />
                <span className="text-slate-400">至</span>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={e => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  placeholder="结束日期"
                />
              </div>

              {(typeFilter !== 'all' || dateRange.start || dateRange.end) && (
                <Button variant="ghost" size="sm" onClick={() => { setTypeFilter('all'); setDateRange({ start: '', end: '' }); }}>
                  重置
                </Button>
              )}

              <Button variant="secondary" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4" />
                导出报表
              </Button>
            </div>
          </div>

          {activeTab === 'pending' && (
            <div className="p-6">
              {pendingList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
                    <CheckCircle2 className="h-8 w-8 text-green-500" />
                  </div>
                  <p className="mt-4 text-base font-medium text-slate-700">太棒了，所有内容都已审核！</p>
                  <p className="mt-1 text-sm text-slate-500">暂无待审核的贡献内容</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingList.map(contribution => (
                    <div
                      key={contribution.id}
                      className="rounded-xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-md"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant={CONTRIBUTION_TYPE_COLORS[contribution.type]}>
                            {CONTRIBUTION_TYPE_LABELS[contribution.type]}
                          </Badge>
                          <Badge variant="warning">
                            <AlertCircle className="mr-1 h-3 w-3" />
                            待审核
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-blue-500 text-xs font-medium text-white">
                              {getInitials(contribution.submitter)}
                            </div>
                            <span className="font-medium text-slate-700">{contribution.submitter}</span>
                          </div>
                          <span className="text-slate-300">|</span>
                          <span>{formatDateTime(contribution.createdAt)}</span>
                        </div>
                      </div>

                      <div className="mt-4 space-y-3">
                        <h3 className="text-base font-semibold text-slate-900">{contribution.title}</h3>
                        <p className="text-sm text-slate-600 leading-relaxed">
                          {truncateText(contribution.summary, 200)}
                        </p>
                        {contribution.articleId && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-slate-500">关联文章：</span>
                            <a
                              href="#/article"
                              className="inline-flex items-center gap-1 text-teal-600 hover:text-teal-700 hover:underline"
                            >
                              <FileText className="h-3.5 w-3.5" />
                              {contribution.articleId} - 查看关联文章
                            </a>
                          </div>
                        )}
                      </div>

                      <div className="mt-5 space-y-4 border-t border-slate-100 pt-4">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="添加审核备注（可选，快速通过时使用）"
                            value={quickRemark[contribution.id] ?? ''}
                            onChange={e => setQuickRemark(prev => ({
                              ...prev,
                              [contribution.id]: e.target.value
                            }))}
                            className="flex-1 h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                          />
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <Button variant="secondary" size="sm" onClick={() => openDetail(contribution)}>
                            <Eye className="h-4 w-4" />
                            查看详情
                          </Button>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => {
                                setSelectedContribution(contribution);
                                setReviewRemark('');
                                setDetailModalOpen(true);
                              }}
                            >
                              <XCircle className="h-4 w-4" />
                              驳回
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleApprove(contribution.id, quickRemark[contribution.id])}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                              通过
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                      <th className="px-6 py-3">贡献类型</th>
                      <th className="px-6 py-3">标题</th>
                      <th className="px-6 py-3">提交人</th>
                      <th className="px-6 py-3">提交时间</th>
                      <th className="px-6 py-3">审核人</th>
                      <th className="px-6 py-3">审核结果</th>
                      <th className="px-6 py-3 cursor-pointer select-none" onClick={() => setHistorySortAsc(prev => !prev)}>
                        <div className="flex items-center gap-1">
                          审核时间
                          {historySortAsc ? (
                            <SortAsc className="h-3.5 w-3.5" />
                          ) : (
                            <SortDesc className="h-3.5 w-3.5" />
                          )}
                        </div>
                      </th>
                      <th className="px-6 py-3 text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pagedHistory.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-16">
                          <div className="flex flex-col items-center justify-center">
                            <Search className="h-8 w-8 text-slate-300" />
                            <p className="mt-3 text-sm text-slate-500">暂无审核记录</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      pagedHistory.map(item => (
                        <tr key={item.id} className="text-sm transition-colors hover:bg-slate-50">
                          <td className="px-6 py-4">
                            <Badge variant={CONTRIBUTION_TYPE_COLORS[item.type]}>
                              {CONTRIBUTION_TYPE_LABELS[item.type]}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 max-w-xs">
                            <div className="truncate font-medium text-slate-900" title={item.title}>
                              {item.title}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-medium text-slate-600">
                                {getInitials(item.submitter)}
                              </div>
                              <span className="text-slate-700">{item.submitter}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-500">{formatDateTime(item.createdAt)}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-100 text-xs font-medium text-teal-700">
                                {item.reviewRecord ? getInitials(item.reviewRecord.reviewer) : '?'}
                              </div>
                              <span className="text-slate-700">{item.reviewRecord?.reviewer ?? '-'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {item.reviewRecord?.decision === 'approved' ? (
                              <Badge variant="success">
                                <CheckCircle2 className="mr-1 h-3 w-3" />
                                通过
                              </Badge>
                            ) : (
                              <Badge variant="danger">
                                <XCircle className="mr-1 h-3 w-3" />
                                驳回
                              </Badge>
                            )}
                          </td>
                          <td className="px-6 py-4 text-slate-500">
                            {item.reviewRecord ? formatDateTime(item.reviewRecord.reviewedAt) : '-'}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Button variant="ghost" size="sm" onClick={() => openDetail(item)}>
                              <Eye className="h-4 w-4" />
                              查看详情
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {historyList.length > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 px-6 py-4">
                  <div className="text-sm text-slate-500">
                    共 <span className="font-medium text-slate-700">{historyList.length}</span> 条记录，
                    第 <span className="font-medium text-slate-700">{historyPage}</span> / {totalPages} 页
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={historyPage <= 1}
                      onClick={() => setHistoryPage(prev => Math.max(1, prev - 1))}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      上一页
                    </Button>
                    <div className="flex items-center gap-1 px-2">
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        let pageNum: number;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (historyPage <= 3) {
                          pageNum = i + 1;
                        } else if (historyPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = historyPage - 2 + i;
                        }
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setHistoryPage(pageNum)}
                            className={cn(
                              'h-8 min-w-[32px] rounded-md px-2 text-sm font-medium transition-colors',
                              historyPage === pageNum
                                ? 'bg-gradient-to-r from-teal-500 to-blue-600 text-white shadow-sm'
                                : 'text-slate-600 hover:bg-slate-100'
                            )}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={historyPage >= totalPages}
                      onClick={() => setHistoryPage(prev => Math.min(totalPages, prev + 1))}
                    >
                      下一页
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <button
        onClick={() => setSubmitModalOpen(true)}
        className="fixed bottom-8 right-8 z-40 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-teal-500 to-blue-600 px-5 py-3 text-sm font-medium text-white shadow-lg shadow-teal-500/30 transition-all hover:shadow-xl hover:shadow-teal-500/40 active:scale-95"
      >
        <Plus className="h-4 w-4" />
        提交贡献
      </button>

      <Modal
        open={detailModalOpen && selectedContribution !== null}
        onClose={() => { setDetailModalOpen(false); setSelectedContribution(null); }}
        title={selectedContribution ? `审核详情 - ${selectedContribution.title}` : ''}
        contentClassName="max-w-6xl"
        footer={
          selectedContribution && selectedContribution.status === 'pending' ? (
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1">
                <textarea
                  placeholder="请输入审核备注（驳回必填）"
                  value={reviewRemark}
                  onChange={e => setReviewRemark(e.target.value)}
                  rows={2}
                  className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </div>
              <div className="flex items-center gap-2 sm:shrink-0">
                <Button
                  variant="danger"
                  onClick={() => selectedContribution && handleReject(selectedContribution.id, reviewRemark)}
                  disabled={!reviewRemark.trim()}
                >
                  <XCircle className="h-4 w-4" />
                  审核驳回
                </Button>
                <Button onClick={() => selectedContribution && handleApprove(selectedContribution.id, reviewRemark)}>
                  <CheckCircle2 className="h-4 w-4" />
                  审核通过
                </Button>
              </div>
            </div>
          ) : selectedContribution && selectedContribution.reviewRecord ? (
            <div className="flex w-full flex-col gap-2">
              <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-4 py-3">
                <User className="h-4 w-4 text-slate-500" />
                <span className="text-sm text-slate-600">
                  审核人：<span className="font-medium text-slate-800">{selectedContribution.reviewRecord.reviewer}</span>
                </span>
                <span className="text-slate-300">·</span>
                {selectedContribution.reviewRecord.decision === 'approved' ? (
                  <Badge variant="success">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    通过
                  </Badge>
                ) : (
                  <Badge variant="danger">
                    <XCircle className="mr-1 h-3 w-3" />
                    驳回
                  </Badge>
                )}
                <span className="text-slate-300">·</span>
                <span className="text-xs text-slate-500">
                  {formatDateTime(selectedContribution.reviewRecord.reviewedAt)}
                </span>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-medium text-slate-500">审核备注：</p>
                <p className="mt-1 text-sm text-slate-700">{selectedContribution.reviewRecord.remark}</p>
              </div>
            </div>
          ) : undefined
        }
      >
        {selectedContribution && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-slate-50 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={CONTRIBUTION_TYPE_COLORS[selectedContribution.type]}>
                  {CONTRIBUTION_TYPE_LABELS[selectedContribution.type]}
                </Badge>
                {selectedContribution.status === 'pending' && (
                  <Badge variant="warning">待审核</Badge>
                )}
                {selectedContribution.status === 'approved' && (
                  <Badge variant="success">已通过</Badge>
                )}
                {selectedContribution.status === 'rejected' && (
                  <Badge variant="danger">已驳回</Badge>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-[10px] font-medium text-slate-700">
                    {getInitials(selectedContribution.submitter)}
                  </div>
                  <span>{selectedContribution.submitter}</span>
                </div>
                <span className="text-slate-300">·</span>
                <span>{formatDateTime(selectedContribution.createdAt)}</span>
                {selectedContribution.articleId && (
                  <>
                    <span className="text-slate-300">·</span>
                    <span>关联：{selectedContribution.articleId}</span>
                  </>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-900">贡献摘要</h4>
              <p className="mt-2 rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-600 leading-relaxed">
                {selectedContribution.summary}
              </p>
            </div>

            <div>
              <h4 className="mb-3 text-sm font-semibold text-slate-900">内容对比</h4>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="rounded-lg border border-slate-200 bg-slate-50">
                  <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2">
                    <span className="text-xs font-medium text-slate-500">原文内容</span>
                    <Badge variant="default">Original</Badge>
                  </div>
                  <div className="h-80 overflow-auto p-4 text-sm leading-relaxed text-slate-600 whitespace-pre-wrap">
                    {originalContent || <span className="text-slate-400">（无原文内容）</span>}
                  </div>
                </div>

                <div className="rounded-lg border-2 border-green-300 bg-green-50/30">
                  <div className="flex items-center justify-between border-b border-green-200 bg-green-50 px-4 py-2">
                    <span className="text-xs font-medium text-green-700">提议修改内容</span>
                    <Badge variant="success">Proposed</Badge>
                  </div>
                  <div className="h-80 overflow-auto p-4">
                    <DiffRenderer segments={diffSegments} />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <div className="text-xs text-amber-800">
                <p className="font-medium">图例说明</p>
                <p className="mt-1">
                  <span className="inline-block rounded bg-green-100 px-1 text-green-800 underline">绿色下划线</span> 表示新增内容，
                  <span className="ml-1 inline-block rounded bg-red-100 px-1 text-red-700 line-through">红色删除线</span> 表示删除内容。
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={submitModalOpen}
        onClose={() => setSubmitModalOpen(false)}
        title="提交贡献"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="secondary" onClick={() => setSubmitModalOpen(false)}>
              取消
            </Button>
            <Button
              onClick={handleSubmitContribution}
              disabled={!submitForm.title.trim() || !submitForm.summary.trim() || !submitForm.content.trim()}
            >
              提交
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">贡献类型</label>
            <div className="grid grid-cols-3 gap-2">
              {(['new_article', 'update_article', 'new_case'] as ContributionType[]).map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSubmitForm(prev => ({ ...prev, type }))}
                  className={cn(
                    'rounded-lg border px-3 py-2.5 text-sm font-medium transition-all',
                    submitForm.type === type
                      ? 'border-teal-500 bg-teal-50 text-teal-700 ring-2 ring-teal-500/20'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                  )}
                >
                  {CONTRIBUTION_TYPE_LABELS[type]}
                </button>
              ))}
            </div>
          </div>

          {(submitForm.type === 'update_article' || submitForm.type === 'new_case') && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                关联文章 {submitForm.type === 'new_case' ? '(可选)' : ''}
              </label>
              <input
                type="text"
                placeholder="请输入文章ID，例如 ART-003"
                value={submitForm.articleId}
                onChange={e => setSubmitForm(prev => ({ ...prev, articleId: e.target.value }))}
                className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">标题 <span className="text-red-500">*</span></label>
            <input
              type="text"
              placeholder="请输入贡献标题"
              value={submitForm.title}
              onChange={e => setSubmitForm(prev => ({ ...prev, title: e.target.value }))}
              className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">摘要 <span className="text-red-500">*</span></label>
            <textarea
              rows={2}
              placeholder="请简要描述本次贡献的内容概要（建议100字以内）"
              value={submitForm.summary}
              onChange={e => setSubmitForm(prev => ({ ...prev, summary: e.target.value }))}
              className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">详细内容 <span className="text-red-500">*</span></label>
            <textarea
              rows={6}
              placeholder="请输入详细内容，支持完整 Markdown 文本..."
              value={submitForm.content}
              onChange={e => setSubmitForm(prev => ({ ...prev, content: e.target.value }))}
              className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 font-mono"
            />
          </div>
        </div>
      </Modal>
    </MainLayout>
  );
}
