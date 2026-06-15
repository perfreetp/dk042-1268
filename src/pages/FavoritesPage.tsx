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
  Sparkles
} from 'lucide-react';
import MainLayout from '@/components/Layout/MainLayout';
import ArticleCard from '@/components/Article/ArticleCard';
import { Badge } from '@/components/UI/Badge';
import Button from '@/components/UI/Button';
import Modal from '@/components/UI/Modal';
import { useFavoriteStore } from '@/store/favoriteStore';
import type { Article, ServiceType } from '@/data/mockArticles';
import { exportOnCallManual, type ExportOptions } from '@/utils/export';
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

  useEffect(() => {
    if (modalOpen) {
      setSelectedIds(new Set(allArticles.map((a) => a.id)));
      setConfig(defaultConfig);
      setGenerating(false);
      setProgress(0);
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

  const handleGenerate = () => {
    if (selectedIds.size === 0) return;
    setGenerating(true);
    setProgress(0);

    const selectedArticles = allArticles.filter((a) => selectedIds.has(a.id));
    let current = 0;
    const total = selectedArticles.length + 3;

    const timer = setInterval(() => {
      current += 1;
      const p = Math.min(100, Math.round((current / total) * 100));
      setProgress(p);
      if (current >= total) {
        clearInterval(timer);
        const exportOptions: ExportOptions = {
          includeSteps: config.includeSteps,
          includeCommands: config.includeCommands,
          includeIncidents: config.includeIncidents,
          includeCases: config.includeCases,
        };
        exportOnCallManual(selectedArticles, exportOptions);
        setTimeout(() => {
          setGenerating(false);
        }, 500);
      }
    }, 200);
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

      {/* b) 手册生成Modal */}
      <Modal
        open={modalOpen}
        onClose={() => !generating && setModalOpen(false)}
        title="生成值班手册"
        contentClassName="!max-w-2xl"
        footer={
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
                onClick={handleGenerate}
                disabled={generating || selectedIds.size === 0}
              >
                <Download className="h-4 w-4" />
                {generating ? '生成中...' : '生成并下载'}
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-1">
          {/* 配置项 */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
            <div className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4 text-teal-600" />
              手册内容配置
            </div>
            <div className="grid grid-cols-2 gap-3">
              {(Object.keys(defaultConfig) as (keyof ManualConfig)[]).map((key) => {
                const labelMap: Record<keyof ManualConfig, string> = {
                  includeSteps: '包含排查步骤',
                  includeCommands: '包含常用命令',
                  includeIncidents: '包含关联事故',
                  includeCases: '包含案例',
                };
                const active = config[key];
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleConfig(key)}
                    className={cn(
                      'flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg border text-left transition-all',
                      active
                        ? 'bg-teal-50 border-teal-300 text-teal-700 ring-2 ring-teal-500/10'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                    )}
                  >
                    <div
                      className={cn(
                        'flex h-4 w-4 items-center justify-center rounded border transition-all',
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

          {/* 勾选文章列表 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold text-slate-800">
                选择收录的文章
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
              <div className="max-h-[320px] overflow-y-auto divide-y divide-slate-100">
                {allArticles.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-sm">
                    暂无收藏的文章
                  </div>
                ) : (
                  allArticles.map((article) => {
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
        </div>
      </Modal>
    </MainLayout>
  );
}
