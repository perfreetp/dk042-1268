import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Heart,
  Star,
  AlertCircle,
  ShoppingCart,
  CreditCard,
  User,
  MessageSquare,
  Search as SearchIcon,
  Network,
  Database,
  Cpu,
  Calendar,
  Download,
  Eye,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  Clock
} from 'lucide-react';
import MainLayout from '@/components/Layout/MainLayout';
import Badge from '@/components/UI/Badge';
import Button from '@/components/UI/Button';
import { useArticleStore } from '@/store/articleStore';
import { useFavoriteStore } from '@/store/favoriteStore';
import { useReviewStore } from '@/store/reviewStore';
import type { ServiceType } from '@/types';
import { cn } from '@/lib/utils';

const ALL_SERVICES: ServiceType[] = [
  'order',
  'payment',
  'user',
  'message',
  'search',
  'gateway',
  'database',
  'cache'
];

const SERVICE_LABELS: Record<ServiceType, string> = {
  order: '订单服务',
  payment: '支付服务',
  user: '用户服务',
  message: '消息服务',
  search: '搜索服务',
  gateway: '网关服务',
  database: '数据库',
  cache: '缓存服务'
};

const SERVICE_ICONS: Record<ServiceType, typeof ShoppingCart> = {
  order: ShoppingCart,
  payment: CreditCard,
  user: User,
  message: MessageSquare,
  search: SearchIcon,
  gateway: Network,
  database: Database,
  cache: Cpu
};

const SERVICE_BADGE_VARIANT: Record<ServiceType, 'default' | 'accent' | 'success' | 'warning' | 'danger'> = {
  order: 'accent',
  payment: 'success',
  user: 'default',
  message: 'warning',
  search: 'accent',
  gateway: 'default',
  database: 'danger',
  cache: 'warning'
};

type TimeRange = 'today' | 'week' | 'month' | 'all';

const TIME_RANGE_OPTIONS: Array<{ value: TimeRange; label: string }> = [
  { value: 'today', label: '今日' },
  { value: 'week', label: '本周' },
  { value: 'month', label: '本月' },
  { value: 'all', label: '全部' }
];

function formatNumber(num: number): string {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + 'w';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  return num.toString();
}

function getRatingColor(rating: number): string {
  if (rating >= 4) return 'text-green-600';
  if (rating >= 3) return 'text-amber-600';
  return 'text-red-600';
}

function getRatingBgColor(rating: number): string {
  if (rating >= 4) return 'bg-green-50';
  if (rating >= 3) return 'bg-amber-50';
  return 'bg-red-50';
}

function MiniSparkline({ data, color = '#0d9488' }: { data: number[]; color?: string }) {
  const width = 80;
  const height = 24;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const stepX = width / (data.length - 1 || 1);

  const points = data.map((value, i) => {
    const x = i * stepX;
    const y = height - ((value - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');

  const firstY = height - ((data[0] - min) / range) * (height - 4) - 2;
  const lastY = height - ((data[data.length - 1] - min) / range) * (height - 4) - 2;
  const areaPoints = `0,${height} ${points} ${width},${height}`;

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={`spark-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={areaPoints}
        fill={`url(#spark-${color.replace('#', '')})`}
      />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={width} cy={lastY} r="3" fill={color} />
      {data.length > 0 && data[0] < data[data.length - 1] ? (
        <circle cx={width} cy={lastY} r="2" fill="white" stroke={color} strokeWidth="1" />
      ) : null}
    </svg>
  );
}

interface StatCardProps {
  icon: typeof BookOpen;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string | number;
  subValue?: string;
  subTrend?: 'up' | 'down' | 'neutral';
  sparklineData?: number[];
  sparklineColor?: string;
  badge?: React.ReactNode;
}

function StatCard({
  icon: Icon,
  iconBg,
  iconColor,
  label,
  value,
  subValue,
  subTrend,
  sparklineData,
  sparklineColor,
  badge
}: StatCardProps) {
  return (
    <div className="relative rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
      {badge}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900 tracking-tight">{value}</p>
          {subValue && (
            <div className="mt-2 flex items-center gap-1 text-xs">
              {subTrend === 'up' && (
                <span className="inline-flex items-center text-green-600 font-medium">
                  <TrendingUp className="h-3 w-3 mr-0.5" />
                  {subValue}
                </span>
              )}
              {subTrend === 'down' && (
                <span className="inline-flex items-center text-red-600 font-medium">
                  <TrendingDown className="h-3 w-3 mr-0.5" />
                  {subValue}
                </span>
              )}
              {subTrend === 'neutral' && (
                <span className="text-slate-500">{subValue}</span>
              )}
            </div>
          )}
        </div>
        <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl', iconBg)}>
          <Icon className={cn('h-5 w-5', iconColor)} />
        </div>
      </div>
      {sparklineData && (
        <div className="mt-4 pt-3 border-t border-slate-100">
          <div className="flex items-end justify-end">
            <MiniSparkline data={sparklineData} color={sparklineColor} />
          </div>
        </div>
      )}
    </div>
  );
}

function getLast7Days(): Date[] {
  const days: Date[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    days.push(d);
  }
  return days;
}

function getDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatDayLabel(date: Date): string {
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { articles, setFilter } = useArticleStore();
  const { favorites } = useFavoriteStore();
  const { contributions, reviewRecords, feedbacks } = useReviewStore();

  const [timeRange, setTimeRange] = useState<TimeRange>('all');
  const [serviceFilter, setServiceFilter] = useState<ServiceType | 'all'>('all');

  const stats = useMemo(() => {
    const totalArticles = articles.length;

    const favoriteCount = favorites.length;

    let totalRatingWeight = 0;
    let totalRatingCount = 0;
    for (const article of articles) {
      if (article.ratingCount > 0) {
        totalRatingWeight += article.ratingAvg * article.ratingCount;
        totalRatingCount += article.ratingCount;
      }
    }
    const avgRating = totalRatingCount > 0
      ? Number((totalRatingWeight / totalRatingCount).toFixed(1))
      : 0;

    const pendingContributions = contributions.filter(c => c.status === 'pending').length;
    const pendingFeedbacks = feedbacks.filter(f => f.status === 'pending').length;
    const pendingTotal = pendingContributions + pendingFeedbacks;

    return {
      totalArticles,
      favoriteCount,
      avgRating,
      pendingTotal,
      pendingContributions,
      pendingFeedbacks,
      articleGrowth: 12
    };
  }, [articles, favorites, contributions, feedbacks]);

  const serviceStats = useMemo(() => {
    const result = ALL_SERVICES.map(service => {
      const serviceArticles = articles.filter(a => a.service === service);
      const articleCount = serviceArticles.length;
      const articlePercent = articles.length > 0
        ? Math.round((articleCount / articles.length) * 100)
        : 0;

      const articleIdSet = new Set(serviceArticles.map(a => a.id));
      const favoriteCount = favorites.filter(f => articleIdSet.has(f.articleId)).length;

      let totalRatingW = 0;
      let totalRatingC = 0;
      for (const a of serviceArticles) {
        if (a.ratingCount > 0) {
          totalRatingW += a.ratingAvg * a.ratingCount;
          totalRatingC += a.ratingCount;
        }
      }
      const avgRating = totalRatingC > 0
        ? Number((totalRatingW / totalRatingC).toFixed(1))
        : 0;

      const viewCount = serviceArticles.reduce((sum, a) => sum + a.viewCount, 0);

      const feedbackCount = feedbacks.filter(f => articleIdSet.has(f.articleId)).length;

      return {
        service,
        articleCount,
        articlePercent,
        favoriteCount,
        avgRating,
        viewCount,
        feedbackCount
      };
    });

    if (serviceFilter !== 'all') {
      return result.filter(s => s.service === serviceFilter);
    }
    return result;
  }, [articles, favorites, feedbacks, serviceFilter]);

  const reviewTrend = useMemo(() => {
    const days = getLast7Days();
    const result = days.map(day => {
      const dayEnd = new Date(day);
      dayEnd.setDate(dayEnd.getDate() + 1);
      const dayStartTs = day.getTime();
      const dayEndTs = dayEnd.getTime();

      let approved = 0;
      let rejected = 0;

      for (const record of reviewRecords) {
        const ts = new Date(record.reviewedAt).getTime();
        if (ts >= dayStartTs && ts < dayEndTs) {
          if (record.decision === 'approved') approved++;
          else if (record.decision === 'rejected') rejected++;
        }
      }

      return {
        date: day,
        dateKey: getDateKey(day),
        label: formatDayLabel(day),
        approved,
        rejected
      };
    });
    return result;
  }, [reviewRecords]);

  const maxReviewDay = useMemo(() => {
    return Math.max(...reviewTrend.map(d => d.approved + d.rejected), 1);
  }, [reviewTrend]);

  const topArticles = useMemo(() => {
    return [...articles]
      .sort((a, b) => b.viewCount - a.viewCount)
      .slice(0, 5)
      .map((article, index) => ({
        rank: index + 1,
        id: article.id,
        title: article.title,
        service: article.service as ServiceType,
        viewCount: article.viewCount,
        avgRating: article.ratingAvg
      }));
  }, [articles]);

  function handleViewServiceArticles(service: ServiceType) {
    setFilter({ service, keyword: '', errorCode: '', version: '', tags: [] });
    navigate('/diagnosis');
  }

  function handleViewArticleDetail(id: string) {
    navigate(`/article/${id}`);
  }

  function handleExportReviewTrend() {
    const rows = [
      ['日期', '通过数', '驳回数', '合计']
    ];
    reviewTrend.forEach(d => {
      rows.push([d.dateKey, d.approved.toString(), d.rejected.toString(), (d.approved + d.rejected).toString()]);
    });
    const csv = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const now = new Date();
    const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    link.download = `审核趋势报表_${timestamp}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const rankBgStyles = [
    'bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-amber-200',
    'bg-gradient-to-br from-slate-300 to-slate-500 text-white shadow-slate-200',
    'bg-gradient-to-br from-orange-300 to-orange-500 text-white shadow-orange-200',
    'bg-slate-100 text-slate-600',
    'bg-slate-100 text-slate-600'
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">知识库运营看板</h1>
            <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
              <Clock className="h-4 w-4" />
              <span>数据更新时间：实时</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
              {TIME_RANGE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setTimeRange(opt.value)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all',
                    timeRange === opt.value
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  )}
                >
                  <Calendar className="h-3.5 w-3.5" />
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-500">服务：</label>
              <select
                value={serviceFilter}
                onChange={e => setServiceFilter(e.target.value as ServiceType | 'all')}
                className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              >
                <option value="all">全部服务</option>
                {ALL_SERVICES.map(s => (
                  <option key={s} value={s}>{SERVICE_LABELS[s]}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={BookOpen}
            iconBg="bg-teal-50"
            iconColor="text-teal-600"
            label="知识总量"
            value={stats.totalArticles}
            subValue={`较上月 +${stats.articleGrowth}%`}
            subTrend="up"
            sparklineData={[8, 12, 15, 18, 22, 28, 35]}
            sparklineColor="#0d9488"
          />
          <StatCard
            icon={Heart}
            iconBg="bg-rose-50"
            iconColor="text-rose-600"
            label="累计收藏"
            value={stats.favoriteCount}
            subValue="用户收藏文章数"
            subTrend="neutral"
            sparklineData={[3, 5, 8, 12, 15, 18, 22]}
            sparklineColor="#e11d48"
          />
          <StatCard
            icon={Star}
            iconBg="bg-amber-50"
            iconColor="text-amber-600"
            label="平均评分"
            value={stats.avgRating || '-'}
            subValue={stats.avgRating >= 4 ? '用户满意度优秀' : stats.avgRating >= 3 ? '用户满意度良好' : '需关注'}
            subTrend={stats.avgRating >= 4 ? 'up' : stats.avgRating >= 3 ? 'neutral' : 'down'}
            sparklineData={[3.2, 3.5, 3.6, 3.8, 3.9, 4.1, 4.2]}
            sparklineColor="#d97706"
          />
          <StatCard
            icon={AlertCircle}
            iconBg="bg-orange-50"
            iconColor="text-orange-600"
            label="待处理事项"
            value={stats.pendingTotal}
            subValue={`贡献 ${stats.pendingContributions} · 反馈 ${stats.pendingFeedbacks}`}
            subTrend={stats.pendingTotal > 5 ? 'down' : 'neutral'}
            sparklineData={[2, 3, 5, 4, 6, 8, 5]}
            sparklineColor="#ea580c"
            badge={
              stats.pendingTotal > 0 ? (
                <span className="absolute top-4 right-4 inline-flex items-center gap-1.5">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500" />
                  </span>
                  <span className="text-xs font-medium text-orange-600">紧急</span>
                </span>
              ) : undefined
            }
          />
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
            <h2 className="text-base font-semibold text-slate-900">服务维度统计</h2>
            <div className="text-xs text-slate-500">
              共 {serviceStats.length} 个服务维度
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-sm">
                <tr className="text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-3 whitespace-nowrap">服务名称</th>
                  <th className="px-6 py-3 text-right whitespace-nowrap">文章数量</th>
                  <th className="px-6 py-3 text-right whitespace-nowrap">收藏数</th>
                  <th className="px-6 py-3 text-right whitespace-nowrap">平均评分</th>
                  <th className="px-6 py-3 text-right whitespace-nowrap">浏览量</th>
                  <th className="px-6 py-3 text-right whitespace-nowrap">反馈数</th>
                  <th className="px-6 py-3 text-right whitespace-nowrap">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {serviceStats.map((row, idx) => {
                  const IconComp = SERVICE_ICONS[row.service];
                  return (
                    <tr
                      key={row.service}
                      className={cn(
                        'text-sm transition-colors hover:bg-slate-50',
                        idx % 2 === 1 ? 'bg-slate-50/50' : ''
                      )}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            'flex h-9 w-9 items-center justify-center rounded-lg',
                            row.service === 'order' && 'bg-teal-50 text-teal-600',
                            row.service === 'payment' && 'bg-green-50 text-green-600',
                            row.service === 'user' && 'bg-blue-50 text-blue-600',
                            row.service === 'message' && 'bg-amber-50 text-amber-600',
                            row.service === 'search' && 'bg-purple-50 text-purple-600',
                            row.service === 'gateway' && 'bg-cyan-50 text-cyan-600',
                            row.service === 'database' && 'bg-red-50 text-red-600',
                            row.service === 'cache' && 'bg-orange-50 text-orange-600'
                          )}>
                            <IconComp className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-slate-900">{SERVICE_LABELS[row.service]}</span>
                              <Badge variant={SERVICE_BADGE_VARIANT[row.service]}>
                                {row.service}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex flex-col items-end gap-1.5">
                          <div className="flex items-baseline gap-1.5">
                            <span className="font-semibold text-slate-900">{row.articleCount}</span>
                            <span className="text-xs text-slate-400">篇</span>
                          </div>
                          <div className="w-24">
                            <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-teal-500 to-blue-500 transition-all"
                                style={{ width: `${row.articlePercent}%` }}
                              />
                            </div>
                            <div className="mt-0.5 text-[10px] text-slate-400 text-right">
                              {row.articlePercent}%
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <span className="font-medium text-rose-600">{row.favoriteCount}</span>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        {row.avgRating > 0 ? (
                          <span className={cn(
                            'inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-semibold',
                            getRatingBgColor(row.avgRating),
                            getRatingColor(row.avgRating)
                          )}>
                            <Star className="h-3.5 w-3.5 fill-current" />
                            {row.avgRating.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <span className="font-medium text-slate-700">{formatNumber(row.viewCount)}</span>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <span className={cn(
                          'font-medium',
                          row.feedbackCount > 0 ? 'text-red-600' : 'text-slate-400'
                        )}>
                          {row.feedbackCount}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewServiceArticles(row.service)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          查看文章
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h2 className="text-base font-semibold text-slate-900">最近7天审核处理趋势</h2>
              <Button variant="secondary" size="sm" onClick={handleExportReviewTrend}>
                <Download className="h-3.5 w-3.5" />
                导出
              </Button>
            </div>
            <div className="p-6">
              <div className="flex items-end gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-sm bg-blue-500" />
                  <span className="text-xs text-slate-600">通过</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-sm bg-red-400" />
                  <span className="text-xs text-slate-600">驳回</span>
                </div>
              </div>
              <div className="space-y-3">
                {reviewTrend.map(day => {
                  const total = day.approved + day.rejected;
                  const approvedWidth = total > 0 ? (day.approved / maxReviewDay) * 100 : 0;
                  const rejectedWidth = total > 0 ? (day.rejected / maxReviewDay) * 100 : 0;
                  return (
                    <div key={day.dateKey} className="flex items-center gap-3">
                      <div className="w-12 text-xs font-medium text-slate-500 shrink-0">
                        {day.label}
                      </div>
                      <div className="flex-1 flex items-center gap-1 h-8">
                        {approvedWidth > 0 && (
                          <div
                            className="h-full rounded-l bg-gradient-to-t from-blue-500 to-blue-400 transition-all flex items-center justify-end pr-1.5 min-w-[24px]"
                            style={{ width: `${Math.max(approvedWidth, 2)}%` }}
                            title={`通过: ${day.approved}`}
                          >
                            {day.approved > 0 && (
                              <span className="text-[10px] font-medium text-white drop-shadow-sm">
                                {day.approved}
                              </span>
                            )}
                          </div>
                        )}
                        {rejectedWidth > 0 && (
                          <div
                            className={cn(
                              'h-full transition-all flex items-center pl-1.5 min-w-[24px]',
                              approvedWidth > 0 ? 'rounded-r' : 'rounded'
                            )}
                            style={{
                              width: `${Math.max(rejectedWidth, 2)}%`,
                              background: 'linear-gradient(to top, #f87171, #fca5a5)'
                            }}
                            title={`驳回: ${day.rejected}`}
                          >
                            {day.rejected > 0 && (
                              <span className="text-[10px] font-medium text-white drop-shadow-sm">
                                {day.rejected}
                              </span>
                            )}
                          </div>
                        )}
                        {total === 0 && (
                          <div className="h-full w-8 rounded bg-slate-100 flex items-center justify-center">
                            <span className="text-[10px] text-slate-400">0</span>
                          </div>
                        )}
                      </div>
                      <div className="w-12 text-right text-xs text-slate-400 shrink-0">
                        {total > 0 ? `共${total}` : ''}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-6 grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                <div className="rounded-lg bg-blue-50 p-3">
                  <div className="text-xs text-blue-600 font-medium mb-1">7日总通过</div>
                  <div className="text-xl font-bold text-blue-700">
                    {reviewTrend.reduce((sum, d) => sum + d.approved, 0)}
                  </div>
                </div>
                <div className="rounded-lg bg-red-50 p-3">
                  <div className="text-xs text-red-600 font-medium mb-1">7日总驳回</div>
                  <div className="text-xl font-bold text-red-700">
                    {reviewTrend.reduce((sum, d) => sum + d.rejected, 0)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h2 className="text-base font-semibold text-slate-900">热门文章 TOP5</h2>
              <span className="text-xs text-slate-500">按浏览量排序</span>
            </div>
            <div className="divide-y divide-slate-100">
              {topArticles.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <BookOpen className="h-10 w-10 text-slate-300" />
                  <p className="mt-3 text-sm text-slate-500">暂无文章数据</p>
                </div>
              ) : (
                topArticles.map(article => {
                  const IconComp = SERVICE_ICONS[article.service];
                  return (
                    <div
                      key={article.id}
                      className="px-6 py-4 flex items-center gap-4 transition-colors hover:bg-slate-50"
                    >
                      <div className={cn(
                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold shadow-sm',
                        rankBgStyles[article.rank - 1]
                      )}>
                        {article.rank}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div
                          className="text-sm font-medium text-slate-900 truncate cursor-pointer hover:text-teal-600 transition-colors"
                          onClick={() => handleViewArticleDetail(article.id)}
                          title={article.title}
                        >
                          {article.title}
                        </div>
                        <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                          <Badge variant={SERVICE_BADGE_VARIANT[article.service]}>
                            <IconComp className="h-3 w-3 mr-1" />
                            {SERVICE_LABELS[article.service]}
                          </Badge>
                          <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                            <Eye className="h-3 w-3" />
                            {formatNumber(article.viewCount)}
                          </span>
                          {article.avgRating > 0 && (
                            <span className={cn(
                              'inline-flex items-center gap-0.5 text-xs font-medium',
                              getRatingColor(article.avgRating)
                            )}>
                              <Star className="h-3 w-3 fill-current" />
                              {article.avgRating.toFixed(1)}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewArticleDetail(article.id)}
                        className="shrink-0"
                      >
                        查看详情
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
