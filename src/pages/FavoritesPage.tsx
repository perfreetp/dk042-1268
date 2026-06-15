import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Heart,
  Search,
  Trash2,
  Download,
  FileText,
  ChevronDown,
  CheckSquare,
  Square,
  Check,
  X,
  Home,
  Sparkles,
  FileDown,
  Copy,
  ArrowLeft,
  ArrowRight,
  Settings,
  Eye,
  FileDigit,
  User,
  CheckCircle2
} from 'lucide-react';
import MainLayout from '@/components/Layout/MainLayout';
import ArticleCard from '@/components/Article/ArticleCard';
import { Badge } from '@/components/UI/Badge';
import Button from '@/components/UI/Button';
import Modal from '@/components/UI/Modal';
import { useFavoriteStore } from '@/store/favoriteStore';
import type { Article, ServiceType } from '@/data/mockArticles';
import { generateOnCallManual, downloadMarkdown, type ExportOptions } from '@/utils/export';
import { serviceLabels } from '@/data/mockArticles';
import { cn } from '@/lib/utils';

type SortOption = 'time' | 'service' | 'views';

const sortLabels: Record<SortOption, string> = {
  time: '按收藏时间',
  service: '按服务分类',
  views: '按阅读量',
};

interface ManualConfig {
  includeSteps: boolean;
  includeCommands: boolean;
  includeIncidents: boolean;
  includeCases: boolean;
}

const defaultConfig: ManualConfig = {
  includeSteps: true,
  includeCommands: true,
  includeIncidents: true,
  includeCases: true,
};

function formatFavDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function FavoritesPage() {
  const navigate = useNavigate();

  const { favorites, getFavoriteArticles, removeFavorite } = useFavoriteStore();
  const allArticles = getFavoriteArticles();

  const [sortBy, setSortBy] = useState<SortOption>('time');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [sortOpen, setSortOpen] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [config, setConfig] = useState<ManualConfig>(defaultConfig);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [step1Search, setStep1Search] = useState('');
  const [manualTitle, setManualTitle] = useState('故障处理值班手册');
  const [compiler, setCompiler] = useState('知识库系统');
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  useEffect(() => {
    if (modalOpen) {
      setSelectedIds(new Set(allArticles.map((a) => a.id)));
      setConfig(defaultConfig);
      setGenerating(false);
      setProgress(0);
      setCurrentStep(1);
      setStep1Search('');
      setManualTitle('故障处理值班手册');
      setCompiler('知识库系统');
      setCopiedSuccess(false);
    }
  }, [modalOpen, allArticles]);

  const favoriteTimeMap = useMemo(() => {
    const map = new Map<string, string>();
    favorites.forEach((f) => map.set(f.articleId, f.createdAt));
    return map;
  }, [favorites]);

  const filteredArticles = useMemo(() => {
    let list = allArticles;

    if (searchKeyword.trim()) {
      const kw = searchKeyword.trim().toLowerCase();
      list = list.filter((a) => {
        return (
          a.title.toLowerCase().includes(kw) ||
          a.phenomenon.toLowerCase().includes(kw) ||
          a.errorCodes.some((c) => c.toLowerCase().includes(kw)) ||
          a.tags.some((t) => t.toLowerCase().includes(kw))
        );
      });
    }

    const sorted = [...list];
    switch (sortBy) {
      case 'time':
        sorted.sort((a, b) => {
          const ta = favoriteTimeMap.get(a.id) ?? a.createdAt;
          const tb = favoriteTimeMap.get(b.id) ?? b.createdAt;
          return new Date(tb).getTime() - new Date(ta).getTime();
        });
        break;
      case 'service':
        sorted.sort((a, b) => {
          const la = serviceLabels[a.service as ServiceType] ?? a.service;
          const lb = serviceLabels[b.service as ServiceType] ?? b.service;
          if (la !== lb) return la.localeCompare(lb, 'zh-CN');
          return b.viewCount - a.viewCount;
        });
        break;
      case 'views':
        sorted.sort((a, b) => b.viewCount - a.viewCount);
        break;
    }

    return sorted;
  }, [allArticles, searchKeyword, sortBy, favoriteTimeMap]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === allArticles.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allArticles.map((a) => a.id)));
    }
  };

  const invertSelection = () => {
    setSelectedIds((prev) => {
      const next = new Set<string>();
      allArticles.forEach((a) => {
        if (!prev.has(a.id)) next.add(a.id);
      });
      return next;
    });
  };

  const toggleConfig = (key: keyof ManualConfig) => {
    setConfig((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const step1FilteredArticles = useMemo(() => {
    if (!step1Search.trim()) return allArticles;
    const kw = step1Search.trim().toLowerCase();
    return allArticles.filter((a) => {
      return (
        a.title.toLowerCase().includes(kw) ||
        a.phenomenon.toLowerCase().includes(kw) ||
        a.errorCodes.some((c) => c.toLowerCase().includes(kw)) ||
        a.tags.some((t) => t.toLowerCase().includes(kw))
      );
    });
  }, [allArticles, step1Search]);

  const selectedArticles = useMemo(() => {
    return allArticles.filter((a) => selectedIds.has(a.id));
  }, [allArticles, selectedIds]);

  const previewContent = useMemo(() => {
    const articles = selectedArticles;
    const now = new Date();
    const dateStr = now.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const serviceGroup = new Map<string, Article[]>();
    articles.forEach(a => {
      const label = serviceLabels[a.service as ServiceType];
      if (!serviceGroup.has(label)) {
        serviceGroup.set(label, []);
      }
      serviceGroup.get(label)!.push(a);
    });

    const firstArticle = articles[0];
    let attentionList: string[] = [];
    if (firstArticle?.attention) {
      const attentionVal = firstArticle.attention as unknown;
      attentionList = Array.isArray(attentionVal)
        ? (attentionVal as string[])
        : typeof attentionVal === 'string' && attentionVal
        ? [attentionVal as string]
        : [];
    }

    return { dateStr, serviceGroup, firstArticle, attentionList, count: articles.length };
  }, [selectedArticles, manualTitle, compiler]);

  const markdownContent = useMemo(() => {
    const exportOptions: ExportOptions = {
      title: manualTitle,
      author: compiler,
      includeSteps: config.includeSteps,
      includeCommands: config.includeCommands,
      includeIncidents: config.includeIncidents,
      includeCases: config.includeCases,
    };
    return generateOnCallManual(selectedArticles, exportOptions);
  }, [selectedArticles, manualTitle, compiler, config]);

  const handleStep1Next = () => {
    if (selectedIds.size === 0) {
      alert('请至少选择一篇文章');
      return;
    }
    setCurrentStep(2);
  };

  const handleStep2Next = () => {
    setCurrentStep(3);
  };

  const handleDownloadMarkdown = () => {
    setGenerating(true);
    setProgress(0);
    let current = 0;
    const total = selectedArticles.length + 3;
    const timer = setInterval(() => {
      current += 1;
      const p = Math.min(100, Math.round((current / total) * 100));
      setProgress(p);
      if (current >= total) {
        clearInterval(timer);
        downloadMarkdown(markdownContent);
        setTimeout(() => {
          setGenerating(false);
        }, 500);
      }
    }, 200);
  };

  const handleCopyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(markdownContent);
      setCopiedSuccess(true);
      setTimeout(() => setCopiedSuccess(false), 2500);
    } catch {
      alert('复制失败，请手动复制');
    }
  };

  const handleCardClick = (article: unknown) => {
    navigate(`/article/${(article as Article).id}`);
  };

  const handleRemove = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    removeFavorite(id);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* a) 顶部操作栏 */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-rose-400 to-red-500 text-white shadow-md shadow-rose-500/20">
                <Heart className="h-5 w-5 fill-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-slate-900">我的收藏夹</h1>
                  <Badge variant="accent">
                    <Heart className="h-3 w-3 mr-1 fill-teal-600" />
                    {allArticles.length}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">共收藏 {favorites.length} 篇故障处理知识</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setSortOpen((v) => !v)}
                  className="inline-flex items-center gap-2 h-10 px-4 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all"
                >
                  <span>{sortLabels[sortBy]}</span>
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 text-slate-400 transition-transform',
                      sortOpen && 'rotate-180'
                    )}
                  />
                </button>
                {sortOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setSortOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 z-50 min-w-[140px] rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl">
                      {(Object.keys(sortLabels) as SortOption[]).map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => {
                            setSortBy(opt);
                            setSortOpen(false);
                          }}
                          className={cn(
                            'w-full flex items-center gap-2 px-3.5 py-2 text-sm transition-colors',
                            sortBy === opt
                              ? 'bg-teal-50 text-teal-700 font-medium'
                              : 'text-slate-700 hover:bg-slate-50'
                          )}
                        >
                          {sortBy === opt && <Check className="h-3.5 w-3.5" />}
                          <span className={sortBy !== opt ? 'ml-[22px]' : ''}>
                            {sortLabels[opt]}
                          </span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder="搜索收藏的文章..."
                  className="h-10 w-56 pl-9 pr-4 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
                />
              </div>

              <Button
                variant="primary"
                size="md"
                onClick={() => setModalOpen(true)}
                disabled={allArticles.length === 0}
              >
                <Sparkles className="h-4 w-4" />
                生成值班手册
              </Button>
            </div>
          </div>

          {searchKeyword && (
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-sm text-slate-500">
                搜索"<span className="font-medium text-slate-700">{searchKeyword}</span>"
                共找到 {filteredArticles.length} 篇匹配
              </span>
              <button
                type="button"
                onClick={() => setSearchKeyword('')}
                className="text-sm text-teal-600 hover:text-teal-700 font-medium"
              >
                清除搜索
              </button>
            </div>
          )}
        </div>

        {/* c) 收藏列表 */}
        {filteredArticles.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-16">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-rose-50 mb-5">
                <Heart className="h-10 w-10 text-rose-300" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">
                {allArticles.length === 0 ? '暂无收藏' : '未找到匹配的收藏文章'}
              </h3>
              <p className="text-sm text-slate-500 mb-6 max-w-md">
                {allArticles.length === 0
                  ? '收藏优质故障处理文章，方便值班时快速查阅，第一时间响应问题'
                  : '试试更换关键词，或清除搜索条件查看全部收藏'}
              </p>
              {allArticles.length === 0 && (
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => navigate('/')}
                >
                  <Home className="h-4 w-4" />
                  去首页发现优质内容
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredArticles.map((article) => (
              <div key={article.id} className="relative group">
                <ArticleCard
                  article={article as unknown as Parameters<typeof ArticleCard>[0]['article']}
                  onClick={handleCardClick}
                  className="h-full"
                />
                <button
                  type="button"
                  onClick={(e) => handleRemove(e, article.id)}
                  className={cn(
                    'absolute top-3 right-3 z-10',
                    'flex h-8 w-8 items-center justify-center rounded-lg',
                    'bg-white/90 backdrop-blur-sm border border-slate-200',
                    'text-slate-400 hover:text-red-500 hover:bg-red-50 hover:border-red-200',
                    'shadow-sm transition-all duration-200',
                    'opacity-0 group-hover:opacity-100 focus:opacity-100'
                  )}
                  title="取消收藏"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <div className="absolute bottom-3 right-3 text-[10px] text-slate-400 opacity-60">
                  收藏于 {formatFavDate(favoriteTimeMap.get(article.id) ?? article.createdAt)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* b) 手册生成Modal - 3步向导 */}
      <Modal
        open={modalOpen}
        onClose={() => !generating && setModalOpen(false)}
        title={
          <div className="flex flex-col gap-3">
            <h2 className="text-lg font-bold text-slate-900">生成值班手册</h2>
            <div className="flex items-center gap-2">
              {[1, 2, 3].map((step, idx) => (
                <div key={step} className="flex items-center gap-2 flex-1">
                  <div
                    className={cn(
                      'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold border-2 transition-all duration-300',
                      currentStep >= step
                        ? 'bg-teal-500 border-teal-500 text-white'
                        : 'bg-white border-slate-300 text-slate-400'
                    )}
                  >
                    {currentStep > step ? <Check className="h-4 w-4" /> : step}
                  </div>
                  <span
                    className={cn(
                      'text-xs font-medium shrink-0',
                      currentStep >= step ? 'text-slate-700' : 'text-slate-400'
                    )}
                  >
                    {step === 1 ? '选择文章' : step === 2 ? '配置预览' : '导出'}
                  </span>
                  {idx < 2 && (
                    <div
                      className={cn(
                        'flex-1 h-0.5 rounded transition-colors duration-300',
                        currentStep > step ? 'bg-teal-400' : 'bg-slate-200'
                      )}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        }
        contentClassName="!max-w-5xl"
        footer={
          currentStep === 1 ? (
            <div className="flex items-center justify-between w-full">
              <div className="text-xs text-slate-500">
                已选择 <span className="font-semibold text-teal-600">{selectedIds.size}</span> 篇文章
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="md"
                  onClick={() => setModalOpen(false)}
                  disabled={generating}
                >
                  <X className="h-4 w-4" />
                  取消
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleStep1Next}
                  disabled={generating || selectedIds.size === 0}
                >
                  下一步：配置预览
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : currentStep === 2 ? (
            <div className="flex items-center justify-between w-full">
              <div className="text-xs text-slate-500">
                收录 <span className="font-semibold text-teal-600">{selectedIds.size}</span> 篇 · 标题：<span className="font-medium">{manualTitle}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="md"
                  onClick={() => setCurrentStep(1)}
                  disabled={generating}
                >
                  <ArrowLeft className="h-4 w-4" />
                  上一步
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleStep2Next}
                  disabled={generating || selectedIds.size === 0}
                >
                  下一步：选择导出方式
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full">
              {copiedSuccess && (
                <div className="flex items-center gap-1.5 text-emerald-600 text-sm font-medium">
                  <CheckCircle2 className="h-4 w-4" />
                  ✓ 已复制
                </div>
              )}
              <div className="ml-auto flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="md"
                  onClick={() => setCurrentStep(2)}
                  disabled={generating}
                >
                  <ArrowLeft className="h-4 w-4" />
                  上一步
                </Button>
                <Button
                  variant="ghost"
                  size="md"
                  onClick={() => setModalOpen(false)}
                  disabled={generating}
                >
                  <X className="h-4 w-4" />
                  取消
                </Button>
              </div>
            </div>
          )
        }
      >
        <div className="max-h-[70vh] overflow-y-auto pr-1">
          {/* Step 1: 选择文章 */}
          {currentStep === 1 && (
            <div className="space-y-5">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={step1Search}
                  onChange={(e) => setStep1Search(e.target.value)}
                  placeholder="搜索收藏的文章..."
                  className="w-full h-10 pl-9 pr-4 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-slate-800">
                  选择收录的文章
                  {step1Search && (
                    <span className="ml-2 text-xs font-normal text-slate-500">
                      (匹配 {step1FilteredArticles.length} 篇)
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="text-teal-600 hover:text-teal-700 font-medium"
                  >
                    {selectedIds.size === allArticles.length ? '取消全选' : '全选'}
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={invertSelection}
                    className="text-slate-500 hover:text-slate-700 font-medium"
                  >
                    反选
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                <div className="max-h-[420px] overflow-y-auto divide-y divide-slate-100">
                  {step1FilteredArticles.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-sm">
                      暂无匹配的文章
                    </div>
                  ) : (
                    step1FilteredArticles.map((article) => {
                      const checked = selectedIds.has(article.id);
                      return (
                        <label
                          key={article.id}
                          className={cn(
                            'flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors',
                            checked ? 'bg-teal-50/40' : 'hover:bg-slate-50'
                          )}
                        >
                          <button
                            type="button"
                            onClick={() => toggleSelect(article.id)}
                            className="mt-0.5 shrink-0"
                          >
                            {checked ? (
                              <CheckSquare className="h-5 w-5 text-teal-600" />
                            ) : (
                              <Square className="h-5 w-5 text-slate-300 hover:text-slate-400" />
                            )}
                          </button>
                          <div className="flex-1 min-w-0">
                            <div
                              className={cn(
                                'text-sm font-medium truncate',
                                checked ? 'text-teal-700' : 'text-slate-800'
                              )}
                            >
                              {article.title}
                            </div>
                            <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500 flex-wrap">
                              <Badge variant="default" className="!py-0 !text-[10px]">
                                {serviceLabels[article.service as ServiceType]}
                              </Badge>
                              {article.errorCodes.slice(0, 2).map((c) => (
                                <span key={c} className="font-mono text-slate-400">{c}</span>
                              ))}
                              <span>收藏于 {formatFavDate(favoriteTimeMap.get(article.id) ?? article.createdAt)}</span>
                            </div>
                          </div>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: 配置预览 */}
          {currentStep === 2 && (
            <div className="grid grid-cols-10 gap-5">
              {/* 左侧配置栏 30% */}
              <div className="col-span-3 space-y-5">
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-4">
                  <div className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                    <Settings className="h-4 w-4 text-teal-600" />
                    内容配置
                  </div>
                  <div className="space-y-2.5">
                    {(Object.keys(defaultConfig) as (keyof ManualConfig)[]).map((key) => {
                      const labelMap: Record<keyof ManualConfig, string> = {
                        includeSteps: '排查步骤',
                        includeCommands: '常用命令',
                        includeIncidents: '历史事故',
                        includeCases: '典型案例',
                      };
                      const active = config[key];
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => toggleConfig(key)}
                          className={cn(
                            'w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg border text-left transition-all',
                            active
                              ? 'bg-teal-50 border-teal-300 text-teal-700 ring-2 ring-teal-500/10'
                              : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                          )}
                        >
                          <div
                            className={cn(
                              'flex h-4 w-4 items-center justify-center rounded border transition-all shrink-0',
                              active
                                ? 'bg-teal-500 border-teal-500'
                                : 'bg-white border-slate-300'
                            )}
                          >
                            {active && <Check className="h-3 w-3 text-white" />}
                          </div>
                          <span className="text-sm font-medium">{labelMap[key]}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
                  <div className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                    <FileDigit className="h-4 w-4 text-teal-600" />
                    文档信息
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">手册标题</label>
                      <input
                        type="text"
                        value={manualTitle}
                        onChange={(e) => setManualTitle(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg border border-slate-300 bg-white text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">整理人</label>
                      <input
                        type="text"
                        value={compiler}
                        onChange={(e) => setCompiler(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg border border-slate-300 bg-white text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 右侧预览区 70% */}
              <div className="col-span-7">
                <div className="text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1.5">
                  <Eye className="h-3.5 w-3.5" />
                  实时预览
                </div>
                <div className="rounded-2xl bg-slate-50 border border-slate-200 p-6 max-h-[520px] overflow-y-auto shadow-[0_10px_40px_-12px_rgba(15,23,42,0.12)]">
                  {/* 封面信息 */}
                  <div className="text-center space-y-3 pb-6 mb-6 border-b border-slate-200">
                    <h1 className="text-2xl font-bold text-slate-900">{manualTitle || '故障处理值班手册'}</h1>
                    <div className="space-y-1 text-sm text-slate-600">
                      <p>生成时间：{previewContent.dateStr}</p>
                      <p>整理人：{compiler || '知识库系统'}</p>
                      <p>收录文章：<span className="font-semibold text-teal-600">{previewContent.count}</span> 篇</p>
                    </div>
                    <div className="pt-2">
                      <p className="text-xs font-semibold text-slate-500 mb-2">服务分布：</p>
                      <div className="flex flex-wrap justify-center gap-2">
                        {Array.from(previewContent.serviceGroup.entries()).map(([label, list]) => (
                          <Badge key={label} variant="default" className="!text-xs">
                            {label} · {list.length}篇
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 目录列表 */}
                  <div className="pb-6 mb-6 border-b border-slate-200">
                    <h2 className="text-base font-bold text-slate-800 mb-3">📋 目录</h2>
                    <div className="space-y-3">
                      {Array.from(previewContent.serviceGroup.entries()).map(([label, list]) => (
                        <div key={label}>
                          <h3 className="text-sm font-semibold text-slate-700 mb-1.5">
                            {label}
                          </h3>
                          <ol className="ml-4 space-y-1 text-xs text-slate-600 list-decimal">
                            {list.slice(0, 3).map((a, i) => (
                              <li key={a.id} className="truncate">
                                <span className="hover:text-teal-600 cursor-pointer">
                                  {i + 1}. {a.title}
                                </span>
                              </li>
                            ))}
                            {list.length > 3 && (
                              <li className="text-slate-400">... 还有 {list.length - 3} 篇</li>
                            )}
                          </ol>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 第一篇正文片段 */}
                  {previewContent.firstArticle && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="accent">{serviceLabels[previewContent.firstArticle.service as ServiceType]}</Badge>
                        <h2 className="text-base font-bold text-slate-800">
                          1. {previewContent.firstArticle.title}
                        </h2>
                      </div>

                      {config.includeSteps || config.includeCommands || config.includeIncidents || config.includeCases ? (
                        <div className="space-y-4">
                          <div>
                            <h3 className="text-sm font-semibold text-slate-700 mb-1.5">故障现象</h3>
                            <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                              {previewContent.firstArticle.phenomenon}
                            </p>
                          </div>

                          {previewContent.attentionList.length > 0 && (
                            <div>
                              <h3 className="text-sm font-semibold text-slate-700 mb-1.5">⚠️ 注意事项</h3>
                              <ul className="space-y-1">
                                {previewContent.attentionList.slice(0, 3).map((item, idx) => (
                                  <li key={idx} className="text-xs text-amber-700 bg-amber-50 px-2.5 py-1.5 rounded border border-amber-200">
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          <div className="pt-2 border-t border-slate-200 text-xs text-slate-400 italic text-center">
                            — 以下内容将在完整手册中继续 —
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-slate-400 italic text-center py-8">
                          请在左侧配置中至少选择一项内容
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: 选择导出方式 */}
          {currentStep === 3 && (
            <div className="space-y-5">
              {/* 进度条 */}
              {generating && (
                <div className="rounded-xl border border-teal-200 bg-teal-50/60 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-teal-700">
                      <Sparkles className="h-4 w-4 animate-pulse" />
                      正在生成值班手册...
                    </div>
                    <span className="text-sm font-mono font-semibold text-teal-600">{progress}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-teal-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-teal-400 to-blue-500 transition-all duration-300 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 下载 Markdown */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 hover:border-teal-300 hover:shadow-md transition-all">
                  <div className="flex flex-col items-start gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-blue-500 text-white shadow-md shadow-teal-500/20">
                      <FileDown className="h-6 w-6" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900">导出 Markdown 文件</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">
                      .md格式，带UTF-8 BOM，兼容Typora/Notion等主流Markdown编辑器
                    </p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <Button
                      variant="primary"
                      size="md"
                      onClick={handleDownloadMarkdown}
                      disabled={generating || selectedIds.size === 0}
                      className="w-full"
                    >
                      <Download className="h-4 w-4" />
                      {generating ? '生成中...' : '开始下载'}
                    </Button>
                  </div>
                </div>

                {/* 复制到剪贴板 */}
                <div className={cn(
                  'rounded-2xl border bg-white p-5 hover:shadow-md transition-all',
                  copiedSuccess ? 'border-emerald-300' : 'border-slate-200 hover:border-emerald-300'
                )}>
                  <div className="flex flex-col items-start gap-3">
                    <div className={cn(
                      'flex h-12 w-12 items-center justify-center rounded-xl text-white shadow-md',
                      copiedSuccess
                        ? 'bg-gradient-to-br from-emerald-400 to-green-500 shadow-emerald-500/20'
                        : 'bg-gradient-to-br from-indigo-400 to-purple-500 shadow-indigo-500/20'
                    )}>
                      {copiedSuccess ? (
                        <Check className="h-6 w-6" />
                      ) : (
                        <Copy className="h-6 w-6" />
                      )}
                    </div>
                    <h3 className="text-base font-bold text-slate-900">复制 Markdown 内容</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">
                      直接粘贴到文档编辑器，飞书/语雀/Confluence等在线文档
                    </p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <Button
                      variant={copiedSuccess ? 'primary' : 'secondary'}
                      size="md"
                      onClick={handleCopyMarkdown}
                      disabled={generating || selectedIds.size === 0}
                      className={cn(
                        'w-full',
                        copiedSuccess && '!from-emerald-500 !to-green-600 hover:!from-emerald-600 hover:!to-green-700'
                      )}
                    >
                      {copiedSuccess ? (
                        <>
                          <Check className="h-4 w-4" />
                          ✓ 已复制
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          复制内容
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* 底部信息摘要 */}
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-teal-600" />
                    <span>标题：<span className="font-medium">{manualTitle}</span></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-teal-600" />
                    <span>整理人：<span className="font-medium">{compiler}</span></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <FileDigit className="h-3.5 w-3.5 text-teal-600" />
                    <span>收录：<span className="font-semibold text-teal-600">{selectedIds.size}</span> 篇</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-teal-600" />
                    <span>
                      包含：
                      {config.includeSteps && <span className="ml-1">步骤</span>}
                      {config.includeCommands && <span className="ml-1">命令</span>}
                      {config.includeIncidents && <span className="ml-1">事故</span>}
                      {config.includeCases && <span className="ml-1">案例</span>}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </MainLayout>
  );
}
