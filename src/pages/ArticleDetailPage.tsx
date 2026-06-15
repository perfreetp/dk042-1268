import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  AlertCircle,
  Heart,
  Share2,
  Printer,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  User,
  Eye,
  Clock,
  Check,
  X,
  Info
} from 'lucide-react';
import MainLayout from '@/components/Layout/MainLayout';
import { Badge } from '@/components/UI/Badge';
import { Tag } from '@/components/UI/Tag';
import Button from '@/components/UI/Button';
import StarRating from '@/components/UI/StarRating';
import AttentionBox from '@/components/Article/AttentionBox';
import StepList from '@/components/Article/StepList';
import CommandBlock from '@/components/Article/CommandBlock';
import { useArticleStore } from '@/store/articleStore';
import { useFavoriteStore } from '@/store/favoriteStore';
import { useReviewStore } from '@/store/reviewStore';
import type { Article, ServiceType } from '@/data/mockArticles';
import type { Step, Command, Rating } from '@/types';
import { serviceLabels } from '@/data/mockArticles';
import { cn, formatRelativeTime } from '@/lib/utils';

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

const serviceLabelMap: Record<ServiceType, string> = serviceLabels;

type FeedbackReason = '内容过时' | '步骤错误' | '命令无效' | '描述不清' | '其他';

const feedbackReasons: FeedbackReason[] = ['内容过时', '步骤错误', '命令无效', '描述不清', '其他'];

interface TocItem {
  id: string;
  label: string;
}

const tocItems: TocItem[] = [
  { id: 'phenomenon', label: '故障现象' },
  { id: 'attention', label: '注意事项' },
  { id: 'steps', label: '排查步骤' },
  { id: 'commands', label: '常用命令' },
  { id: 'incidents', label: '关联事故' },
  { id: 'versionVotes', label: '版本投票' },
  { id: 'cases', label: '补充案例' },
];

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatViewCount(count: number): string {
  if (count >= 10000) return `${(count / 10000).toFixed(1)}w`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return String(count);
}

function adaptSteps(articleSteps: Article['steps']): Step[] {
  return articleSteps.map((s, index) => ({
    id: `step-${index}`,
    order: index + 1,
    description: s.description,
    checkCommand: undefined,
    expectedResult: undefined,
    abnormalHandle: undefined,
  }));
}

function adaptCommands(articleCmds: Article['commands']): Command[] {
  return articleCmds.map((c, index) => ({
    id: `cmd-${index}`,
    name: c.name,
    content: c.cmd,
    description: c.description,
    riskLevel: 'low' as const,
  }));
}

function adaptAttention(attention: string | string[]): string[] {
  if (Array.isArray(attention)) return attention;
  return [attention];
}

export default function ArticleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const getArticleById = useArticleStore((s) => s.getArticleById);
  const incrementViewCount = useArticleStore((s) => s.incrementViewCount);
  const addRating = useArticleStore((s) => s.addRating);
  const addCase = useArticleStore((s) => s.addCase);
  const submitVersionVote = useArticleStore((s) => s.submitVersionVote);
  const getVersionVoteSummary = useArticleStore((s) => s.getVersionVoteSummary);
  const getVersionVotes = useArticleStore((s) => s.getVersionVotes);

  const toggleFavorite = useFavoriteStore((s) => s.toggleFavorite);
  const isFavorite = useFavoriteStore((s) => s.isFavorite);
  const submitFeedback = useReviewStore((s) => s.submitFeedback);

  const article = id ? getArticleById(id) : undefined;
  const favorited = id ? isFavorite(id) : false;

  const [activeToc, setActiveToc] = useState<string>('phenomenon');
  const [caseFormOpen, setCaseFormOpen] = useState(false);
  const [caseScene, setCaseScene] = useState('');
  const [caseProcess, setCaseProcess] = useState('');
  const [caseVersions, setCaseVersions] = useState('');
  const [ratingValue, setRatingValue] = useState(0);
  const [solved, setSolved] = useState<boolean | null>(null);
  const [selectedReasons, setSelectedReasons] = useState<FeedbackReason[]>([]);
  const [feedbackText, setFeedbackText] = useState('');

  const contentRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    if (id) {
      incrementViewCount(id);
    }
  }, [id, incrementViewCount]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries.filter((e) => e.isIntersecting);
        if (visibleEntries.length > 0) {
          visibleEntries.sort((a, b) => b.intersectionRatio - a.intersectionRatio);
          setActiveToc(visibleEntries[0].target.id);
        }
      },
      { root: contentRef.current, rootMargin: '-20% 0px -60% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] }
    );

    tocItems.forEach((item) => {
      const el = sectionRefs.current[item.id];
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [article]);

  const scrollToSection = (sectionId: string) => {
    const el = sectionRefs.current[sectionId];
    if (el && contentRef.current) {
      contentRef.current.scrollTo({
        top: el.offsetTop - 24,
        behavior: 'smooth',
      });
      setActiveToc(sectionId);
    }
  };

  const handleFavorite = () => {
    if (id) toggleFavorite(id);
  };

  const handleShare = () => {
    if (navigator.share && article) {
      navigator.share({ title: article.title, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleReportInvalid = () => {
    if (!id) return;
    if (selectedReasons.length === 0 && !feedbackText.trim()) {
      alert('请至少选择一个失效原因或补充描述');
      return;
    }
    submitFeedback({
      articleId: id,
      reporter: '当前用户',
      reasons: selectedReasons.length > 0 ? selectedReasons : ['其他'],
      description: feedbackText.trim() || '用户未填写具体描述',
    });
    setSelectedReasons([]);
    setFeedbackText('');
    alert('失效反馈已提交，相关负责人会尽快处理，感谢您的贡献！');
  };

  const toggleReason = (reason: FeedbackReason) => {
    setSelectedReasons((prev) =>
      prev.includes(reason) ? prev.filter((r) => r !== reason) : [...prev, reason]
    );
  };

  const handleSubmitRating = () => {
    if (!id || ratingValue === 0 || solved === null) return;
    addRating(id, {
      score: ratingValue as Rating['score'],
      solved,
      feedback: `${selectedReasons.join(', ')} | ${feedbackText}`.trim(),
    });
    setRatingValue(0);
    setSolved(null);
    setSelectedReasons([]);
    setFeedbackText('');
    alert('评分反馈提交成功！');
  };

  const handleSubmitCase = () => {
    if (!id || !caseScene || !caseProcess) return;
    addCase(id, {
      submitter: '当前用户',
      scene: caseScene,
      process: caseProcess,
      description: caseScene,
      solution: caseProcess,
      environment: caseVersions || '通用环境',
    });
    setCaseScene('');
    setCaseProcess('');
    setCaseVersions('');
    setCaseFormOpen(false);
    alert('案例提交成功，感谢您的贡献！');
  };

  if (!article) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center text-slate-500">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-slate-400" />
            <p className="text-lg">文章不存在或已被删除</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  const adaptedSteps = adaptSteps(article.steps);
  const adaptedCommands = adaptCommands(article.commands);
  const adaptedAttention = adaptAttention(article.attention);

  return (
    <MainLayout>
      <div className="flex gap-8">
        <div
          ref={contentRef}
          className="flex-1 min-w-0 max-w-[850px] mx-auto space-y-8 overflow-y-auto pr-4"
          style={{ maxHeight: 'calc(100vh - 120px)' }}
        >
          {/* a) 文章头部 */}
          <header className="space-y-5 pb-6 border-b border-slate-200">
            <h1 className="text-2xl font-bold text-slate-900 leading-tight">
              {article.title}
            </h1>

            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={serviceBadgeVariant[article.service as ServiceType]}>
                {serviceLabelMap[article.service as ServiceType]}
              </Badge>
              {article.errorCodes.map((code) => (
                <Tag key={code}>{code}</Tag>
              ))}
              {article.versions.map((v) => (
                <Badge key={v} variant="default">{v}</Badge>
              ))}
              {article.source === 'contribution' ? (
                <Badge variant="success">
                  用户贡献
                </Badge>
              ) : (
                <Badge variant="default">
                  知识库初始收录
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-600">
              {article.source === 'contribution' && article.contributor && (
                <div className="flex items-center gap-1.5">
                  <User className="h-4 w-4 text-slate-400" />
                  <span>贡献人：<span className="font-medium text-slate-700">{article.contributor}</span></span>
                </div>
              )}
              {article.reviewer && (
                <div className="flex items-center gap-1.5">
                  <User className="h-4 w-4 text-slate-400" />
                  <span>审核人：<span className="font-medium text-slate-700">{article.reviewer}</span></span>
                </div>
              )}
              {article.lastReviewedAt && (
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-slate-400" />
                  <span>最近审核：{formatRelativeTime(article.lastReviewedAt)}</span>
                </div>
              )}
              {article.firstPublishedAt && (
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-slate-400" />
                  <span>首次发布：{formatRelativeTime(article.firstPublishedAt)}</span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-5 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center text-white text-xs font-semibold">
                  <User className="h-4 w-4" />
                </div>
                <span className="font-medium text-slate-700">{article.author}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-slate-400" />
                <span>更新于 {formatDate(article.updatedAt)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Eye className="h-4 w-4 text-slate-400" />
                <span>{formatViewCount(article.viewCount)} 阅读</span>
              </div>
              <StarRating
                value={article.ratingAvg}
                readOnly
                showScore
                size="md"
              />
              <span className="text-slate-400">({article.ratingCount}人评价)</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant={favorited ? 'danger' : 'secondary'}
                size="md"
                onClick={handleFavorite}
              >
                <Heart className={cn('h-4 w-4', favorited && 'fill-current')} />
                {favorited ? '已收藏' : '收藏'}
              </Button>
              <Button variant="secondary" size="md" onClick={handleShare}>
                <Share2 className="h-4 w-4" />
                分享
              </Button>
              <Button variant="secondary" size="md" onClick={handlePrint}>
                <Printer className="h-4 w-4" />
                打印
              </Button>
              <Button variant="ghost" size="md" onClick={handleReportInvalid}>
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <span className="text-amber-600">反馈失效</span>
              </Button>
            </div>
          </header>

          {/* b) 故障现象卡片 */}
          <section id="phenomenon" ref={(el) => (sectionRefs.current.phenomenon = el)}>
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
              <div className="flex items-start gap-3 px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-100 text-red-600 shrink-0">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-slate-900">故障现象</h3>
                </div>
              </div>
              <div className="p-5 space-y-4">
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {article.phenomenon}
                </p>
                <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
                  <div className="flex items-start gap-2.5">
                    <div className="h-2 w-2 rounded-full bg-blue-500 mt-2 shrink-0" />
                    <div>
                      <h4 className="text-sm font-semibold text-blue-800 mb-1">影响范围说明</h4>
                      <p className="text-sm text-blue-700 leading-relaxed">
                        涉及服务：{serviceLabelMap[article.service as ServiceType]}；
                        影响版本：{article.versions.join('、')}；
                        关联错误码：{article.errorCodes.join('、')}。
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* c) 注意事项 */}
          <section id="attention" ref={(el) => (sectionRefs.current.attention = el)}>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">注意事项</h3>
            <AttentionBox items={adaptedAttention} />
          </section>

          {/* d) 排查步骤 */}
          <section id="steps" ref={(el) => (sectionRefs.current.steps = el)}>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">排查步骤</h3>
            <StepList steps={adaptedSteps} />
          </section>

          {/* e) 常用命令 */}
          <section id="commands" ref={(el) => (sectionRefs.current.commands = el)}>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">常用命令</h3>
            <div className="space-y-4">
              {adaptedCommands.map((cmd) => (
                <CommandBlock key={cmd.id} command={cmd} />
              ))}
            </div>
          </section>

          {/* f) 关联历史事故 */}
          <section id="incidents" ref={(el) => (sectionRefs.current.incidents = el)}>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">关联历史事故</h3>
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-600">
                      <th className="px-5 py-3 font-semibold whitespace-nowrap">事故编号</th>
                      <th className="px-5 py-3 font-semibold whitespace-nowrap">发生时间</th>
                      <th className="px-5 py-3 font-semibold whitespace-nowrap">影响范围</th>
                      <th className="px-5 py-3 font-semibold whitespace-nowrap">处理总结</th>
                    </tr>
                  </thead>
                  <tbody>
                    {article.incidents.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-5 py-8 text-center text-slate-500">
                          暂无关联事故记录
                        </td>
                      </tr>
                    ) : (
                      article.incidents.map((inc, idx) => (
                        <tr key={idx} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50">
                          <td className="px-5 py-3.5 font-mono text-xs text-teal-700 whitespace-nowrap">
                            INC-{String(idx + 1).padStart(3, '0')}
                          </td>
                          <td className="px-5 py-3.5 text-slate-700 whitespace-nowrap">{inc.date}</td>
                          <td className="px-5 py-3.5 text-slate-700">{inc.impact}</td>
                          <td className="px-5 py-3.5">
                            <a
                              href={inc.title ? '#' : undefined}
                              className="text-teal-600 hover:text-teal-700 hover:underline font-medium"
                            >
                              {inc.title}
                            </a>
                            {inc.duration && (
                              <span className="ml-2 text-xs text-slate-400">持续 {inc.duration}</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* g) 版本适用性投票 */}
          <section id="versionVotes" ref={(el) => (sectionRefs.current.versionVotes = el)}>
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-lg font-semibold text-slate-900">版本适用性投票</h3>
              <div className="relative group">
                <Info className="h-4 w-4 text-slate-400 cursor-help" />
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-56 px-3 py-2 rounded-lg bg-slate-800 text-white text-xs opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 shadow-lg">
                  值班同学投票标记此方案在各版本的适用性
                  <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-slate-800" />
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
              <div className="divide-y divide-slate-100">
                {article.versions.map((version) => {
                  const summary = id ? getVersionVoteSummary(id) : {};
                  const votes = id ? getVersionVotes(id) : [];
                  const versionSummary = summary[version] ?? { applicable: 0, notApplicable: 0, rate: 0 };
                  const userVote = votes.find(v => v.version === version && v.voter === '当前用户');
                  const total = versionSummary.applicable + versionSummary.notApplicable;
                  const ratePercent = total > 0 ? Math.round(versionSummary.rate * 100) : 0;
                  const handleVote = (applicable: boolean) => {
                    if (!id) return;
                    submitVersionVote(id, version, applicable, '当前用户');
                  };
                  return (
                    <div key={version} className="px-5 py-4 flex flex-wrap items-center gap-4">
                      <Badge variant="default" className="!px-3 !py-1.5 !text-sm font-semibold">
                        {version}
                      </Badge>
                      <div className="flex-1 min-w-[200px]">
                        <div className="flex items-center justify-between mb-1.5 text-xs">
                          <div className="flex items-center gap-3">
                            <span className="text-emerald-600 font-semibold">
                              ✓ {versionSummary.applicable}
                            </span>
                            <span className="text-red-600 font-semibold">
                              ✗ {versionSummary.notApplicable}
                            </span>
                          </div>
                          <span className="text-slate-500">
                            适用率 <span className="font-semibold text-slate-700">{ratePercent}%</span>
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden flex">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-400 to-green-500 transition-all duration-500 ease-out"
                            style={{ width: `${ratePercent}%` }}
                          />
                          <div
                            className="h-full bg-gradient-to-r from-red-400 to-red-500 transition-all duration-500 ease-out"
                            style={{ width: `${100 - ratePercent}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleVote(true)}
                          className={cn(
                            'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium border transition-all',
                            userVote?.applicable === true
                              ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm shadow-emerald-500/20'
                              : 'bg-white text-emerald-600 border-emerald-300 hover:bg-emerald-50 hover:border-emerald-400'
                          )}
                        >
                          <Check className="h-4 w-4" />
                          适用
                        </button>
                        <button
                          type="button"
                          onClick={() => handleVote(false)}
                          className={cn(
                            'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium border transition-all',
                            userVote?.applicable === false
                              ? 'bg-red-500 text-white border-red-500 shadow-sm shadow-red-500/20'
                              : 'bg-white text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400'
                          )}
                        >
                          <X className="h-4 w-4" />
                          不适用
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* h) 补充案例列表 */}
          <section id="cases" ref={(el) => (sectionRefs.current.cases = el)}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">补充案例</h3>
              <Badge variant="accent">共 {article.cases.length} 个案例</Badge>
            </div>
            <div className="space-y-4">
              {article.cases.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-slate-500">
                  暂无补充案例，欢迎贡献您的实战经验
                </div>
              ) : (
                article.cases.map((c, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl border border-slate-200 bg-white p-5 hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-semibold shrink-0">
                          <User className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">
                            {c.title || `案例 ${idx + 1}`}
                          </p>
                          <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500">
                            <span>提交人：贡献者</span>
                            <span>环境：{c.environment}</span>
                          </div>
                        </div>
                      </div>
                      <Badge variant="default">#{idx + 1}</Badge>
                    </div>
                    <div className="space-y-3">
                      <div className="rounded-xl bg-slate-50 p-3.5">
                        <div className="text-xs font-semibold text-slate-500 mb-1.5">场景描述</div>
                        <p className="text-sm text-slate-700 leading-relaxed">{c.description}</p>
                      </div>
                      <div className="rounded-xl bg-teal-50/60 p-3.5">
                        <div className="text-xs font-semibold text-teal-700 mb-1.5">处理过程</div>
                        <p className="text-sm text-teal-800 leading-relaxed">{c.solution}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* h) 提交补充案例表单 */}
          <section>
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
              <button
                type="button"
                onClick={() => setCaseFormOpen((v) => !v)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Check className="h-5 w-5 text-teal-600" />
                  <span className="text-base font-semibold text-slate-900">提交补充案例</span>
                </div>
                {caseFormOpen ? (
                  <ChevronUp className="h-5 w-5 text-slate-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-slate-400" />
                )}
              </button>
              {caseFormOpen && (
                <div className="px-5 pb-5 pt-1 space-y-4 border-t border-slate-100">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">场景描述 *</label>
                    <textarea
                      value={caseScene}
                      onChange={(e) => setCaseScene(e.target.value)}
                      rows={3}
                      placeholder="详细描述问题发生的场景、触发条件、现象..."
                      className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">处理过程 *</label>
                    <textarea
                      value={caseProcess}
                      onChange={(e) => setCaseProcess(e.target.value)}
                      rows={4}
                      placeholder="详细描述排查思路、处理步骤、最终结果..."
                      className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">适用版本</label>
                    <input
                      type="text"
                      value={caseVersions}
                      onChange={(e) => setCaseVersions(e.target.value)}
                      placeholder="例如：v2.1.0、v2.2.0 或 生产-华东区"
                      className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="ghost" size="md" onClick={() => setCaseFormOpen(false)}>
                      <X className="h-4 w-4" />
                      取消
                    </Button>
                    <Button
                      variant="primary"
                      size="md"
                      onClick={handleSubmitCase}
                      disabled={!caseScene || !caseProcess}
                    >
                      <Check className="h-4 w-4" />
                      提交案例
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* i) 评分与反馈区 */}
          <section className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-6">
            <h3 className="text-base font-semibold text-slate-900 mb-5">
              这篇文章帮你解决问题了吗？
            </h3>

            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">整体评分</label>
                  <StarRating
                    value={ratingValue}
                    onChange={setRatingValue}
                    showScore={false}
                    size="lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">是否解决</label>
                  <div className="flex items-center gap-3">
                    <label
                      className={cn(
                        'flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-all',
                        solved === true
                          ? 'bg-teal-50 border-teal-400 text-teal-700 shadow-sm ring-2 ring-teal-500/20'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      )}
                    >
                      <input
                        type="radio"
                        name="solved"
                        className="sr-only"
                        checked={solved === true}
                        onChange={() => setSolved(true)}
                      />
                      <Check className={cn('h-4 w-4', solved === true ? 'text-teal-600' : 'text-slate-400')} />
                      <span className="text-sm font-medium">是</span>
                    </label>
                    <label
                      className={cn(
                        'flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-all',
                        solved === false
                          ? 'bg-red-50 border-red-400 text-red-700 shadow-sm ring-2 ring-red-500/20'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      )}
                    >
                      <input
                        type="radio"
                        name="solved"
                        className="sr-only"
                        checked={solved === false}
                        onChange={() => setSolved(false)}
                      />
                      <X className={cn('h-4 w-4', solved === false ? 'text-red-600' : 'text-slate-400')} />
                      <span className="text-sm font-medium">否</span>
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  反馈原因（可多选）
                </label>
                <div className="flex flex-wrap gap-2">
                  {feedbackReasons.map((r) => {
                    const active = selectedReasons.includes(r);
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => toggleReason(r)}
                        className={cn(
                          'px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all',
                          active
                            ? 'bg-teal-500 text-white border-teal-500 shadow-sm'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-teal-300 hover:text-teal-700'
                        )}
                      >
                        {r}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  补充说明
                </label>
                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  rows={3}
                  placeholder="请留下您的宝贵建议，帮助我们持续改进文档质量..."
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 resize-none"
                />
              </div>

              <div className="flex justify-end">
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleSubmitRating}
                  disabled={ratingValue === 0 || solved === null}
                >
                  <Check className="h-4 w-4" />
                  提交反馈
                </Button>
              </div>
            </div>
          </section>

          <div className="h-8" />
        </div>

        {/* j) 右侧TOC悬浮目录 */}
        <aside className="hidden lg:block shrink-0 w-56">
          <div className="sticky top-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                目录导航
              </h4>
              <nav className="space-y-1">
                {tocItems.map((item) => {
                  const active = activeToc === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => scrollToSection(item.id)}
                      className={cn(
                        'w-full text-left px-3 py-2 rounded-lg text-sm transition-all',
                        active
                          ? 'bg-teal-50 text-teal-700 font-semibold border-l-2 border-teal-500'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-l-2 border-transparent'
                      )}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </nav>
            </div>
            <div className="mt-4 text-xs text-slate-400 text-center">
              滚动时自动高亮当前章节
            </div>
          </div>
        </aside>
      </div>
    </MainLayout>
  );
}
