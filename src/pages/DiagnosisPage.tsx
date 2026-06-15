import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Filter,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Sparkles,
  CircleDot,
  AlertTriangle,
  Bell,
  Users,
  Clock,
  Eye,
  CheckCircle2,
  ListChecks,
  ExternalLink,
  Hash,
  Heart
} from 'lucide-react';
import MainLayout from '@/components/Layout/MainLayout';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/Button';
import { Tag } from '@/components/UI/Tag';
import { useArticleStore } from '@/store/articleStore';
import { useFavoriteStore } from '@/store/favoriteStore';
import type { SearchFilter, ServiceType } from '@/types';
import type { Article } from '@/data/mockArticles';
import { serviceLabels } from '@/data/mockArticles';
import { cn } from '@/lib/utils';
import type { SearchResultItem } from '@/utils/search';

const serviceOptions: Array<{ value: ServiceType | 'all'; label: string }> = [
  { value: 'all', label: '全部服务' },
  { value: 'order', label: serviceLabels.order },
  { value: 'payment', label: serviceLabels.payment },
  { value: 'user', label: serviceLabels.user },
  { value: 'message', label: serviceLabels.message },
  { value: 'search', label: serviceLabels.search },
  { value: 'gateway', label: serviceLabels.gateway },
  { value: 'database', label: serviceLabels.database },
  { value: 'cache', label: serviceLabels.cache },
];

const versionOptions = [
  { value: '', label: '全部版本' },
  { value: 'v1', label: 'v1.x' },
  { value: 'v2', label: 'v2.x' },
  { value: 'v3', label: 'v3.x' },
];

const phenomenonTags = [
  '连接异常',
  '性能下降',
  '数据错误',
  '服务不可用',
  '超时',
  '权限问题',
];

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

const matchFieldLabels: Record<string, string> = {
  title: '标题',
  errorCodes: '错误码',
  versions: '版本',
  tags: '标签',
  phenomenon: '现象',
  author: '作者',
  service: '服务'
};

interface DiagnosisStep {
  id: number;
  title: string;
  icon: typeof Users;
  options: Array<{ value: string; label: string }>;
}

const diagnosisSteps: DiagnosisStep[] = [
  {
    id: 1,
    title: '影响范围',
    icon: Users,
    options: [
      { value: 'single', label: '单用户' },
      { value: 'partial', label: '部分用户' },
      { value: 'all', label: '全部用户' },
    ]
  },
  {
    id: 2,
    title: '持续时间',
    icon: Clock,
    options: [
      { value: 'just', label: '刚刚发生' },
      { value: '30min', label: '<30分钟' },
      { value: '4h', label: '1-4小时' },
      { value: 'over4h', label: '>4小时' },
    ]
  },
  {
    id: 3,
    title: '是否触发告警',
    icon: Bell,
    options: [
      { value: 'yes', label: '是' },
      { value: 'no', label: '否' },
    ]
  }
];

function normalizeScore(score: number, maxScore: number): number {
  if (maxScore === 0) return 0;
  return Math.min(100, Math.round((score / maxScore) * 100));
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function highlightText(text: string, keywords: string[], tags: string[]): string {
  const allTerms = [...keywords, ...tags].filter(Boolean);
  if (allTerms.length === 0) return text;
  let result = text;
  const used = new Set<string>();
  allTerms.forEach(term => {
    if (term.trim() && !used.has(term.toLowerCase())) {
      used.add(term.toLowerCase());
      const regex = new RegExp(`(${escapeRegExp(term)})`, 'gi');
      result = result.replace(regex, '|||MARK|||$1|||/MARK|||');
    }
  });
  return result;
}

function renderHighlighted(text: string): React.ReactNode[] {
  const parts = text.split(/(\|\|\|MARK\|\|\|.*?\|\|\|\/MARK\|\|\|)/g);
  return parts.map((part, i) => {
    const match = part.match(/^\|\|\|MARK\|\|\|(.*?)\|\|\|\/MARK\|\|\|$/);
    if (match) {
      return (
        <mark
          key={i}
          className="bg-yellow-200/70 text-yellow-900 rounded px-0.5 font-medium"
        >
          {match[1]}
        </mark>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

function getMatchScoreColor(score: number): string {
  if (score >= 80) return 'from-emerald-500 to-green-600';
  if (score >= 60) return 'from-teal-500 to-blue-600';
  if (score >= 40) return 'from-amber-500 to-orange-500';
  return 'from-slate-400 to-slate-500';
}

export default function DiagnosisPage() {
  const navigate = useNavigate();
  const { filter, setFilter, getFilteredArticles, getVersionVoteSummary } = useArticleStore();
  const favorites = useFavoriteStore(s => s.favorites);
  const toggleFavorite = useFavoriteStore(s => s.toggleFavorite);

  const [selectedPhenomena, setSelectedPhenomena] = useState<string[]>(filter.tags ?? []);
  const [serviceDropdownOpen, setServiceDropdownOpen] = useState(false);
  const [versionDropdownOpen, setVersionDropdownOpen] = useState(false);
  const [errorCodeInput, setErrorCodeInput] = useState(filter.errorCode ?? '');
  const [diagnosisSelections, setDiagnosisSelections] = useState<Record<number, string>>({});
  const [localFilter, setLocalFilter] = useState<SearchFilter>({ ...filter });
  const [filterSource, setFilterSource] = useState<{ name: string; timeRange?: string } | null>(
    filter.source === 'dashboard'
      ? { name: '运营看板', timeRange: filter.timeRangeLabel }
      : null
  );

  useEffect(() => {
    setFilter({
      ...localFilter,
      tags: selectedPhenomena.length > 0 ? selectedPhenomena : undefined,
      errorCode: errorCodeInput || undefined,
    });
  }, [localFilter, selectedPhenomena, errorCodeInput, setFilter]);

  const clearFilterSource = () => {
    setFilterSource(null);
    setFilter({ source: undefined, timeRangeLabel: undefined });
  };

  const results = useMemo(() => getFilteredArticles(), [getFilteredArticles]);

  const maxScore = useMemo(() => {
    if (results.length === 0) return 0;
    return Math.max(...results.map(r => r.score));
  }, [results]);

  const normalizedResults = useMemo(() => {
    return results.map(r => ({
      ...r,
      normalizedScore: normalizeScore(r.score, maxScore)
    }));
  }, [results, maxScore]);

  const diagnosisProgress = useMemo(() => {
    const filled = Object.keys(diagnosisSelections).length;
    return Math.round((filled / diagnosisSteps.length) * 100);
  }, [diagnosisSelections]);

  const keywords = useMemo(() => {
    return filter.keyword?.trim().split(/\s+/).filter(Boolean) ?? [];
  }, [filter.keyword]);

  const togglePhenomenon = (tag: string) => {
    setSelectedPhenomena(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
    clearFilterSource();
  };

  const handleServiceSelect = (service: ServiceType | 'all') => {
    setLocalFilter(prev => ({ ...prev, service }));
    setServiceDropdownOpen(false);
    clearFilterSource();
  };

  const handleVersionSelect = (version: string) => {
    setLocalFilter(prev => ({ ...prev, version: version || undefined }));
    setVersionDropdownOpen(false);
    clearFilterSource();
  };

  const handleResetFilters = () => {
    setSelectedPhenomena([]);
    setErrorCodeInput('');
    setDiagnosisSelections({});
    setLocalFilter({
      keyword: '',
      service: 'all',
      errorCode: '',
      version: '',
      tags: [],
    });
    setFilter({
      keyword: '',
      service: 'all',
      errorCode: '',
      version: '',
      tags: [],
    });
    clearFilterSource();
  };

  const handleDiagnosisSelect = (stepId: number, value: string) => {
    setDiagnosisSelections(prev => {
      const next = { ...prev };
      if (next[stepId] === value) {
        delete next[stepId];
      } else {
        next[stepId] = value;
      }
      const newTags = new Set<string>(selectedPhenomena);
      if (stepId === 1) {
        if (value === 'all') newTags.add('服务不可用');
        if (value === 'partial') newTags.add('性能下降');
        if (value === 'single') newTags.add('权限问题');
      }
      if (stepId === 2) {
        if (value === 'over4h') newTags.add('数据错误');
        if (value === 'just' || value === '30min' || value === '4h') newTags.add('超时');
      }
      if (stepId === 3) {
        if (value === 'yes') newTags.add('连接异常');
      }
      setSelectedPhenomena(Array.from(newTags));
      return next;
    });
  };

  const currentServiceLabel =
    serviceOptions.find((o) => o.value === localFilter.service)?.label || '全部服务';

  const currentVersionLabel =
    versionOptions.find((o) => o.value === (localFilter.version || ''))?.label || '全部版本';

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Sticky Filter Bar */}
        <section
          className={cn(
            'sticky top-16 z-40 -mx-4 md:-mx-6 lg:-mx-8 px-4 md:px-6 lg:px-8 py-4',
            'bg-white/90 backdrop-blur-sm border-b border-slate-200'
          )}
        >
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="h-4 w-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-700">筛选条件</span>
              {filterSource && (
                <button
                  onClick={() => navigate('/dashboard')}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200 text-xs font-medium hover:bg-teal-100 transition-colors"
                >
                  <ExternalLink className="h-3 w-3" />
                  来自{filterSource.name}
                  {filterSource.timeRange && ` · ${filterSource.timeRange}`}
                </button>
              )}
            </div>

            {/* Phenomenon Tags */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-500 w-16 shrink-0">现象标签:</span>
              <div className="flex flex-wrap gap-1.5">
                {phenomenonTags.map((tag) => {
                  const isActive = selectedPhenomena.includes(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => togglePhenomenon(tag)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 border',
                        isActive
                          ? 'bg-teal-500 text-white border-teal-500 shadow-sm shadow-teal-500/20'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-teal-300 hover:text-teal-700'
                      )}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Other Filters Row */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Service Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setServiceDropdownOpen(!serviceDropdownOpen);
                    setVersionDropdownOpen(false);
                  }}
                  className={cn(
                    'h-9 px-3 rounded-lg border border-slate-200 bg-white',
                    'flex items-center gap-2',
                    'text-sm text-slate-700',
                    'hover:bg-slate-50 transition-colors',
                    'focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500'
                  )}
                >
                  <span className="text-slate-500">服务</span>
                  <span className="font-medium">{currentServiceLabel}</span>
                  {serviceDropdownOpen ? (
                    <ChevronUp className="h-4 w-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  )}
                </button>
                {serviceDropdownOpen && (
                  <div className={cn(
                    'absolute top-full left-0 mt-1 z-50 w-40',
                    'bg-white rounded-lg border border-slate-200 shadow-lg',
                    'overflow-hidden animate-in slide-in-from-top-2 duration-200'
                  )}>
                    <ul className="py-1 max-h-60 overflow-y-auto">
                      {serviceOptions.map((option) => (
                        <li key={option.value}>
                          <button
                            type="button"
                            onClick={() => handleServiceSelect(option.value)}
                            className={cn(
                              'w-full px-3 py-2 text-left text-sm transition-colors',
                              localFilter.service === option.value
                                ? 'bg-teal-50 text-teal-700 font-medium'
                                : 'text-slate-700 hover:bg-slate-50'
                            )}
                          >
                            {option.label}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Error Code Input */}
              <div className="relative">
                <div className="flex items-center h-9 px-3 rounded-lg border border-slate-200 bg-white focus-within:ring-2 focus-within:ring-teal-500/20 focus-within:border-teal-500">
                  <Hash className="h-4 w-4 text-slate-400 mr-2" />
                  <span className="text-sm text-slate-500">错误码</span>
                  <input
                    type="text"
                    value={errorCodeInput}
                    onChange={(e) => {
                      setErrorCodeInput(e.target.value);
                      clearFilterSource();
                    }}
                    placeholder="如: ORD-5001"
                    className="ml-2 bg-transparent text-sm text-slate-900 placeholder-slate-400 outline-none w-32"
                  />
                </div>
              </div>

              {/* Version Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setVersionDropdownOpen(!versionDropdownOpen);
                    setServiceDropdownOpen(false);
                  }}
                  className={cn(
                    'h-9 px-3 rounded-lg border border-slate-200 bg-white',
                    'flex items-center gap-2',
                    'text-sm text-slate-700',
                    'hover:bg-slate-50 transition-colors',
                    'focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500'
                  )}
                >
                  <span className="text-slate-500">版本</span>
                  <span className="font-medium">{currentVersionLabel}</span>
                  {versionDropdownOpen ? (
                    <ChevronUp className="h-4 w-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  )}
                </button>
                {versionDropdownOpen && (
                  <div className={cn(
                    'absolute top-full left-0 mt-1 z-50 w-32',
                    'bg-white rounded-lg border border-slate-200 shadow-lg',
                    'overflow-hidden animate-in slide-in-from-top-2 duration-200'
                  )}>
                    <ul className="py-1">
                      {versionOptions.map((option) => (
                        <li key={option.value || 'all'}>
                          <button
                            type="button"
                            onClick={() => handleVersionSelect(option.value)}
                            className={cn(
                              'w-full px-3 py-2 text-left text-sm transition-colors',
                              (localFilter.version || '') === option.value
                                ? 'bg-teal-50 text-teal-700 font-medium'
                                : 'text-slate-700 hover:bg-slate-50'
                            )}
                          >
                            {option.label}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Reset Button */}
              <Button
                variant="secondary"
                size="sm"
                onClick={handleResetFilters}
                className="ml-auto"
              >
                <RefreshCw className="h-4 w-4" />
                重置筛选
              </Button>
            </div>
          </div>
        </section>

        {/* Main Content: Diagnosis Guide + Results */}
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
          {/* Left: Diagnosis Guide - 30% */}
          <aside className="lg:col-span-3">
            <div className="sticky top-[240px] rounded-2xl border border-slate-200 bg-white overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-teal-50 to-blue-50">
                <div className="flex items-center gap-2">
                  <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-blue-600 text-white">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">智能诊断引导</h3>
                    <p className="text-xs text-slate-500 mt-0.5">逐步排查，快速定位</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium text-slate-600">诊断进度</span>
                    <span className="text-xs font-bold text-teal-600">{diagnosisProgress}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-teal-500 to-blue-600 transition-all duration-500 ease-out"
                      style={{ width: `${diagnosisProgress}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 space-y-5">
                {diagnosisSteps.map((step, idx) => {
                  const StepIcon = step.icon;
                  const selectedValue = diagnosisSelections[step.id];
                  const isCompleted = !!selectedValue;
                  return (
                    <div key={step.id} className="relative">
                      {idx < diagnosisSteps.length - 1 && (
                        <div
                          className={cn(
                            'absolute left-[11px] top-7 w-0.5 h-[calc(100%-20px)] transition-colors duration-300',
                            isCompleted ? 'bg-teal-300' : 'bg-slate-200'
                          )}
                        />
                      )}
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            'relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300',
                            isCompleted
                              ? 'bg-teal-500 border-teal-500 text-white'
                              : 'bg-white border-slate-300 text-slate-400'
                          )}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            <CircleDot className="h-3 w-3" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <StepIcon
                              className={cn(
                                'h-4 w-4',
                                isCompleted ? 'text-teal-600' : 'text-slate-400'
                              )}
                            />
                            <span
                              className={cn(
                                'text-sm font-semibold',
                                isCompleted ? 'text-slate-900' : 'text-slate-600'
                              )}
                            >
                              步骤{step.id}：{step.title}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1.5 ml-1">
                            {step.options.map((opt) => {
                              const isSelected = selectedValue === opt.value;
                              return (
                                <button
                                  key={opt.value}
                                  onClick={() => handleDiagnosisSelect(step.id, opt.value)}
                                  className={cn(
                                    'px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 border',
                                    isSelected
                                      ? 'bg-teal-50 text-teal-700 border-teal-300 shadow-sm'
                                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-teal-200 hover:text-teal-600'
                                  )}
                                >
                                  {opt.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Warning Hint */}
              {diagnosisProgress > 0 && diagnosisProgress < 100 && (
                <div className="mx-4 mb-4 mt-2">
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700 leading-relaxed">
                      完成全部步骤可获得更精准的诊断匹配结果
                    </p>
                  </div>
                </div>
              )}
            </div>
          </aside>

          {/* Right: Results List - 70% */}
          <section className="lg:col-span-7 space-y-4">
            {/* Results Count */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ListChecks className="h-5 w-5 text-teal-600" />
                <span className="text-base font-semibold text-slate-900">
                  诊断结果
                  <span className="ml-2 text-sm font-normal text-slate-500">
                    共 <span className="font-semibold text-teal-600">{normalizedResults.length}</span> 条匹配结果
                  </span>
                </span>
              </div>
              <div className="text-xs text-slate-500">
                按匹配度排序
              </div>
            </div>

            {/* Results Cards */}
            {normalizedResults.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16">
                <div className="text-center">
                  <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-4">
                    <Eye className="h-8 w-8" />
                  </div>
                  <h4 className="text-lg font-semibold text-slate-900 mb-1">暂无匹配结果</h4>
                  <p className="text-sm text-slate-500">尝试调整筛选条件或重置筛选</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {normalizedResults.map((item: SearchResultItem & { normalizedScore: number }) => {
                  const { article, matches, normalizedScore: score } = item;
                  const colorClass = getMatchScoreColor(score);
                  const previewSteps = (article as any).steps?.slice(0, 2) ?? [];
                  const keywords = filter.keyword?.trim().split(/\s+/).filter(Boolean) ?? [];

                  const titleHighlighted = highlightText(article.title, keywords, selectedPhenomena);
                  const phenomenonHighlighted = highlightText(
                    article.phenomenon.slice(0, 80) + (article.phenomenon.length > 80 ? '...' : ''),
                    keywords,
                    selectedPhenomena
                  );

                  const uniqueMatchFields = Array.from(
                    new Set(matches.map(m => m.field))
                  ).slice(0, 5);

                  return (
                    <article
                      key={article.id}
                      className={cn(
                        'relative rounded-2xl border border-slate-200 bg-white p-5',
                        'hover:shadow-md hover:border-slate-300 transition-all duration-300'
                      )}
                    >
                      {/* Match Score Bar */}
                      <div className="flex items-center gap-4 mb-4">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-slate-500">匹配度</span>
                            <span className="text-sm font-bold text-slate-900">{score}%</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className={cn(
                                'h-full rounded-full bg-gradient-to-r transition-all duration-700 ease-out',
                                colorClass
                              )}
                              style={{ width: `${score}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Title + Badges */}
                      <div className="mb-3">
                        <div className="flex items-start gap-3">
                          <Badge variant={serviceBadgeVariant[article.service]}>
                            {serviceLabels[article.service]}
                          </Badge>
                          {article.versions.slice(0, 2).map(v => (
                            <Badge key={v} variant="default">{v}</Badge>
                          ))}
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 mt-2 leading-snug group-hover:text-teal-700">
                          {renderHighlighted(titleHighlighted)}
                        </h3>
                      </div>

                      {/* Phenomenon Preview */}
                      <p className="text-sm text-slate-600 leading-relaxed mb-4 line-clamp-2">
                        {renderHighlighted(phenomenonHighlighted)}
                      </p>

                      {/* Match Fields */}
                      {uniqueMatchFields.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 mb-4">
                          <span className="text-xs text-slate-500">匹配字段:</span>
                          {uniqueMatchFields.map(field => (
                            <span
                              key={field}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"
                            >
                              {matchFieldLabels[field] || field}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Version Applicability Reference */}
                      {(() => {
                        const summary = getVersionVoteSummary(article.id);
                        const versionEntries = Object.entries(summary)
                          .filter(([, s]) => s.applicable + s.notApplicable >= 1)
                          .sort((a, b) => (b[1].applicable + b[1].notApplicable) - (a[1].applicable + a[1].notApplicable))
                          .slice(0, 3);
                        if (versionEntries.length === 0) return null;
                        return (
                          <div className="flex flex-wrap items-center gap-2 mb-4">
                            <span className="text-xs text-slate-500">版本适用性参考:</span>
                            {versionEntries.map(([version, s]) => {
                              const rate = Math.round(s.rate * 100);
                              return (
                                <span
                                  key={version}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200"
                                >
                                  <span className="font-mono">{version}</span>
                                  <span className="font-semibold">{rate}%</span>
                                  <CheckCircle2 className="h-3 w-3" />
                                </span>
                              );
                            })}
                          </div>
                        );
                      })()}

                      {/* Error Codes Tags */}
                      {article.errorCodes.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {article.errorCodes.map(code => {
                            const shouldHighlight = keywords.some(
                              kw => code.toLowerCase().includes(kw.toLowerCase())
                            ) || errorCodeInput && code.toLowerCase().includes(errorCodeInput.toLowerCase());
                            return (
                              <Tag
                                key={code}
                                className={cn(
                                  shouldHighlight && 'ring-2 ring-yellow-400 ring-offset-1 bg-yellow-50 text-yellow-800 border-yellow-300'
                                )}
                              >
                                {code}
                              </Tag>
                            );
                          })}
                        </div>
                      )}

                      {/* Quick Steps Preview */}
                      {previewSteps.length > 0 && (
                        <div className="mb-4 p-3 rounded-xl bg-slate-50 border border-slate-100">
                          <p className="text-xs font-medium text-slate-500 mb-2 flex items-center gap-1">
                            <ListChecks className="h-3.5 w-3.5" />
                            排查步骤预览
                          </p>
                          <ol className="space-y-1.5">
                            {previewSteps.map((step: any, idx: number) => (
                              <li key={idx} className="flex items-start gap-2 text-xs text-slate-600">
                                <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-teal-500 text-white text-[10px] font-bold mt-0.5">
                                  {idx + 1}
                                </span>
                                <span className="line-clamp-1">{step.title || step.description}</span>
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}

                      {/* Action */}
                      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <div className="flex items-center gap-1">
                            <Eye className="h-3.5 w-3.5" />
                            <span>{article.viewCount}</span>
                          </div>
                          <span>评分: {article.ratingAvg.toFixed(1)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(article.id);
                            }}
                            className={cn(
                              'p-1.5 rounded-lg transition-all duration-200',
                              favorites.some(f => f.articleId === article.id)
                                ? 'text-red-500 bg-red-50'
                                : 'text-slate-400 hover:text-red-500 hover:bg-red-50'
                            )}
                          >
                            <Heart
                              className={cn(
                                'h-4 w-4 transition-transform',
                                favorites.some(f => f.articleId === article.id) && 'fill-red-500 scale-110'
                              )}
                            />
                          </button>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => navigate(`/article/${article.id}`)}
                          >
                            查看详情
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </MainLayout>
  );
}
