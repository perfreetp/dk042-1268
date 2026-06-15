import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  TrendingUp,
  Clock,
  CheckCircle,
  ArrowRight,
  ShoppingCart,
  CreditCard,
  Users,
  MessageSquare,
  Search as SearchIcon,
  Globe,
  Database,
  HardDrive,
  ChevronRight,
  Eye,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import MainLayout from '@/components/Layout/MainLayout';
import SearchBar from '@/components/Search/SearchBar';
import ArticleCard from '@/components/Article/ArticleCard';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/Button';
import StarRating from '@/components/UI/StarRating';
import { useArticleStore } from '@/store/articleStore';
import { mockArticles, serviceLabels as mockServiceLabels } from '@/data/mockArticles';
import type { Article } from '@/data/mockArticles';
import type { ServiceType } from '@/types';
import { cn } from '@/lib/utils';

const serviceLabels: Record<ServiceType, string> = {
  order: '订单服务',
  payment: '支付服务',
  user: '用户服务',
  message: '消息服务',
  search: '搜索服务',
  gateway: '网关服务',
  database: '数据库',
  cache: '缓存服务'
};

const allServices: ServiceType[] = ['order', 'payment', 'user', 'message', 'search', 'gateway', 'database', 'cache'];

const serviceIcons: Record<ServiceType, typeof ShoppingCart> = {
  order: ShoppingCart,
  payment: CreditCard,
  user: Users,
  message: MessageSquare,
  search: SearchIcon,
  gateway: Globe,
  database: Database,
  cache: HardDrive
};

const serviceBadgeVariant: Record<ServiceType, 'default' | 'accent' | 'success' | 'warning' | 'danger'> = {
  order: 'accent',
  payment: 'success',
  user: 'default',
  message: 'warning',
  search: 'accent',
  gateway: 'default',
  database: 'danger',
  cache: 'warning',
};

const hotKeywords = ['连接超时', '500错误', 'OOM', '死锁', '回调失败', '慢查询', '缓存击穿', '401未授权'];

const rankBadgeStyles: Record<number, string> = {
  1: 'bg-gradient-to-br from-yellow-400 to-amber-500 text-white shadow-lg shadow-amber-500/30',
  2: 'bg-gradient-to-br from-slate-300 to-slate-400 text-white shadow-lg shadow-slate-400/30',
  3: 'bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-lg shadow-orange-500/30'
};

function formatViewCount(count: number): string {
  if (count >= 10000) return `${(count / 10000).toFixed(1)}w`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return String(count);
}

function getThisMonthCount(articles: Article[]): number {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  return articles.filter((a) => {
    const d = new Date(a.createdAt);
    return d.getFullYear() === year && d.getMonth() === month;
  }).length;
}

export default function HomePage() {
  const navigate = useNavigate();
  const { articles, setFilter } = useArticleStore();

  const topArticles = useMemo(
    () => [...articles].sort((a, b) => b.viewCount - a.viewCount).slice(0, 10),
    [articles]
  );

  const latestArticles = useMemo(
    () => [...articles].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 6),
    [articles]
  );

  const serviceCounts = useMemo(() => {
    const counts: Record<ServiceType, number> = {
      order: 0, payment: 0, user: 0, message: 0, search: 0, gateway: 0, database: 0, cache: 0
    };
    for (const a of articles) {
      if (a.service in counts) {
        counts[a.service]++;
      }
    }
    return counts;
  }, [articles]);

  const handleHotKeywordClick = (keyword: string) => {
    setFilter({ keyword, service: 'all', errorCode: '', version: '', tags: [] });
    navigate('/diagnosis');
  };

  const handleServiceClick = (service: ServiceType) => {
    setFilter({ service, keyword: '', errorCode: '', version: '', tags: [] });
    navigate('/diagnosis');
  };

  const handleArticleClick = (article: Article) => {
    navigate(`/article/${article.id}`);
  };

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Hero Search Area */}
        <section className="relative -mx-4 md:-mx-6 lg:-mx-8 -mt-4 md:-mt-6 lg:-mt-8 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
              backgroundSize: '40px 40px'
            }}
          />
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />

          <div className="relative px-4 md:px-6 lg:px-8 py-16 md:py-20 lg:py-24">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 tracking-tight">
                故障知识库 · 快速定位解决问题
              </h1>
              <p className="text-base md:text-lg text-slate-300 mb-8 max-w-2xl mx-auto">
                汇聚一线经验，缩短MTTR，助力高效运维
              </p>

              <div className="mb-6">
                <SearchBar />
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2">
                <span className="text-sm text-slate-400 mr-1">热门搜索:</span>
                {hotKeywords.map((kw) => (
                  <button
                    key={kw}
                    onClick={() => handleHotKeywordClick(kw)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200',
                      'bg-white/10 text-slate-200 border border-white/10',
                      'hover:bg-teal-500/20 hover:text-teal-300 hover:border-teal-400/30'
                    )}
                  >
                    {kw}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Stats Panel */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              icon: BookOpen,
              label: '知识总量',
              value: articles.length,
              trend: '+12%',
              trendUp: true,
              color: 'from-teal-500 to-blue-600'
            },
            {
              icon: TrendingUp,
              label: '本月新增',
              value: getThisMonthCount(articles),
              trend: '+8%',
              trendUp: true,
              color: 'from-emerald-500 to-green-600'
            },
            {
              icon: Clock,
              label: '平均解决时长',
              value: '12.5分钟',
              trend: '-15%',
              trendUp: true,
              color: 'from-amber-500 to-orange-600'
            },
            {
              icon: CheckCircle,
              label: '累计解决次数',
              value: '8,934',
              trend: '+23%',
              trendUp: true,
              color: 'from-rose-500 to-pink-600'
            }
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className={cn(
                  'relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5',
                  'hover:shadow-md transition-shadow duration-300'
                )}
              >
                <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full bg-gradient-to-br ${stat.color} opacity-10 blur-xl`} />
                <div className="relative flex items-start justify-between">
                  <div>
                    <p className="text-sm text-slate-500 mb-1">{stat.label}</p>
                    <p className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">{stat.value}</p>
                  </div>
                  <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${stat.color} text-white shadow-sm`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <div className="relative mt-3 flex items-center gap-1">
                  <span
                    className={cn(
                      'inline-flex items-center gap-0.5 text-xs font-semibold rounded-md px-2 py-0.5',
                      stat.trendUp ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                    )}
                  >
                    {stat.trendUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {stat.trend}
                  </span>
                  <span className="text-xs text-slate-400">上月环比</span>
                </div>
              </div>
            );
          })}
        </section>

        {/* Hot TOP 10 & Service Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Hot TOP 10 */}
          <section className="lg:col-span-3 rounded-2xl border border-slate-200 bg-white overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="h-5 w-1 rounded-full bg-gradient-to-b from-orange-500 to-red-500" />
                <h2 className="text-lg font-semibold text-slate-900">热门问题 TOP10</h2>
              </div>
              <TrendingUp className="h-5 w-5 text-orange-500" />
            </div>
            <ul className="divide-y divide-slate-100">
              {topArticles.map((article, idx) => {
                const rank = idx + 1;
                const isTrendUp = idx < 5;
                return (
                  <li key={article.id}>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => handleArticleClick(article)}
                      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleArticleClick(article)}
                      className={cn(
                        'w-full flex items-center gap-4 px-5 py-3.5 text-left cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-inset',
                        'hover:bg-slate-50 transition-colors group'
                      )}
                    >
                      <div
                        className={cn(
                          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold',
                          rank <= 3
                            ? rankBadgeStyles[rank]
                            : 'bg-slate-100 text-slate-600'
                        )}
                      >
                        {rank}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={serviceBadgeVariant[article.service]}>
                            {mockServiceLabels[article.service as keyof typeof mockServiceLabels] || serviceLabels[article.service]}
                          </Badge>
                        </div>
                        <h3 className="text-sm font-medium text-slate-900 truncate group-hover:text-teal-700 transition-colors">
                          {article.title}
                        </h3>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        <StarRating value={article.ratingAvg} readOnly size="sm" />
                        <div className="flex items-center gap-1 text-xs text-slate-500 w-14">
                          <Eye className="h-3.5 w-3.5" />
                          <span>{formatViewCount(article.viewCount)}</span>
                        </div>
                        <div className={cn(
                          'flex items-center gap-0.5 text-xs font-medium w-10',
                          isTrendUp ? 'text-emerald-600' : 'text-slate-400'
                        )}>
                          {isTrendUp ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                          <span>{isTrendUp ? '↑' : '↓'}</span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-teal-600 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* Service Navigation */}
          <section className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="h-5 w-1 rounded-full bg-gradient-to-b from-teal-500 to-blue-600" />
                <h2 className="text-lg font-semibold text-slate-900">服务分类</h2>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 p-4">
              {allServices.map((service) => {
                const Icon = serviceIcons[service];
                const count = serviceCounts[service];
                return (
                  <button
                    key={service}
                    onClick={() => handleServiceClick(service)}
                    className={cn(
                      'group relative flex flex-col items-start p-4 rounded-xl border transition-all duration-200 text-left',
                      'border-slate-200 bg-white hover:border-teal-300 hover:shadow-sm'
                    )}
                  >
                    <div className={cn(
                      'inline-flex h-10 w-10 items-center justify-center rounded-lg mb-3',
                      'bg-slate-100 group-hover:bg-gradient-to-br group-hover:from-teal-500 group-hover:to-blue-600',
                      'text-slate-600 group-hover:text-white transition-all duration-200'
                    )}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex items-center justify-between w-full gap-2">
                      <span className="text-sm font-semibold text-slate-900 group-hover:text-teal-700 transition-colors">
                        {serviceLabels[service]}
                      </span>
                      <span className="text-xs font-medium text-slate-500 bg-slate-100 group-hover:bg-teal-50 group-hover:text-teal-700 px-2 py-0.5 rounded-full transition-colors">
                        {count}篇
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        {/* Latest Updates */}
        <section className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="h-5 w-1 rounded-full bg-gradient-to-b from-violet-500 to-purple-600" />
              <h2 className="text-lg font-semibold text-slate-900">最新更新</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/diagnosis')}>
              查看更多
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {latestArticles.map((article) => (
                <ArticleCard
                  key={article.id}
                  article={article as unknown as any}
                  onClick={handleArticleClick as unknown as any}
                />
              ))}
            </div>
          </div>
        </section>
      </div>
    </MainLayout>
  );
}
