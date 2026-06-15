import { useState } from 'react';
import { Eye, Heart, Clock, ChevronRight } from 'lucide-react';
import type { Article, ServiceType } from '@/types';
import { Badge } from '@/components/UI/Badge';
import { Tag } from '@/components/UI/Tag';
import StarRating from '@/components/UI/StarRating';
import { cn } from '@/lib/utils';

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

const serviceLabelMap: Record<ServiceType, string> = {
  order: '订单服务',
  payment: '支付服务',
  user: '用户服务',
  message: '消息服务',
  search: '搜索服务',
  gateway: '网关服务',
  database: '数据库',
  cache: '缓存服务',
};

interface ArticleCardProps {
  article: Article;
  onClick?: (article: Article) => void;
  className?: string;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return '今天';
  if (diffDays === 1) return '昨天';
  if (diffDays < 7) return `${diffDays} 天前`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} 周前`;
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatViewCount(count: number): string {
  if (count >= 10000) return `${(count / 10000).toFixed(1)}w`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return String(count);
}

export default function ArticleCard({ article, onClick, className }: ArticleCardProps) {
  const [isFavorited, setIsFavorited] = useState(false);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFavorited(!isFavorited);
  };

  const summary = article.phenomenon.length > 100
    ? `${article.phenomenon.slice(0, 100)}...`
    : article.phenomenon;

  return (
    <article
      onClick={() => onClick?.(article)}
      className={cn(
        'group relative flex flex-col gap-4 p-5 rounded-2xl border border-slate-200 bg-white',
        'cursor-pointer transition-all duration-300',
        'hover:-translate-y-[2px] hover:shadow-md hover:border-slate-300',
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant={serviceBadgeVariant[article.service]}>
              {serviceLabelMap[article.service]}
            </Badge>
            {article.versions.slice(0, 2).map((version) => (
              <Badge key={version} variant="default">
                {version}
              </Badge>
            ))}
          </div>
          <h3 className="text-lg font-semibold text-slate-900 leading-snug mb-2 group-hover:text-teal-700 transition-colors line-clamp-2">
            {article.title}
          </h3>
        </div>
        <ChevronRight className="h-5 w-5 text-slate-400 shrink-0 mt-1 group-hover:text-teal-600 group-hover:translate-x-0.5 transition-all" />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {article.errorCodes.map((code) => (
          <Tag key={code}>{code}</Tag>
        ))}
      </div>

      <p className="text-sm text-slate-600 leading-relaxed line-clamp-2">
        {summary}
      </p>

      <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-auto">
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <Eye className="h-3.5 w-3.5" />
            <span>{formatViewCount(article.viewCount)}</span>
          </div>
          <StarRating
            value={article.ratingAvg}
            readOnly
            showScore
            size="sm"
          />
          <div className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            <span>{formatDate(article.updatedAt)}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleFavoriteClick}
          className={cn(
            'p-1.5 rounded-lg transition-all duration-200',
            isFavorited
              ? 'text-red-500 bg-red-50'
              : 'text-slate-400 hover:text-red-500 hover:bg-red-50'
          )}
        >
          <Heart
            className={cn(
              'h-4 w-4 transition-transform',
              isFavorited && 'fill-red-500 scale-110'
            )}
          />
        </button>
      </div>
    </article>
  );
}
