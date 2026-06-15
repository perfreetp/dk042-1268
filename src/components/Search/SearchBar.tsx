import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, Filter, ChevronDown } from 'lucide-react';
import type { ServiceType } from '@/types';
import { useArticleStore } from '@/store/articleStore';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils';

const serviceOptions: Array<{ value: ServiceType | 'all'; label: string }> = [
  { value: 'all', label: '全部服务' },
  { value: 'order', label: '订单服务' },
  { value: 'payment', label: '支付服务' },
  { value: 'user', label: '用户服务' },
  { value: 'message', label: '消息服务' },
  { value: 'search', label: '搜索服务' },
  { value: 'gateway', label: '网关服务' },
  { value: 'database', label: '数据库' },
  { value: 'cache', label: '缓存服务' },
];

interface SearchSuggestion {
  id: string;
  type: 'title' | 'errorCode';
  text: string;
  articleId: string;
}

export default function SearchBar() {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [serviceDropdownOpen, setServiceDropdownOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const serviceDropdownRef = useRef<HTMLDivElement>(null);

  const { filter, setFilter, articles } = useArticleStore();
  const debouncedKeyword = useDebounce(inputValue, 300);

  const suggestions = useMemo<SearchSuggestion[]>(() => {
    if (!debouncedKeyword.trim()) return [];
    const keyword = debouncedKeyword.toLowerCase();
    const result: SearchSuggestion[] = [];

    for (const article of articles) {
      if (article.title.toLowerCase().includes(keyword)) {
        result.push({
          id: `title-${article.id}`,
          type: 'title',
          text: article.title,
          articleId: article.id,
        });
      }
      for (const code of article.errorCodes) {
        if (code.toLowerCase().includes(keyword)) {
          result.push({
            id: `code-${article.id}-${code}`,
            type: 'errorCode',
            text: code,
            articleId: article.id,
          });
        }
      }
    }

    return result.slice(0, 8);
  }, [debouncedKeyword, articles]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
      if (
        serviceDropdownRef.current &&
        !serviceDropdownRef.current.contains(e.target as Node)
      ) {
        setServiceDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setFilter({ keyword: debouncedKeyword });
  }, [debouncedKeyword, setFilter]);

  const handleServiceSelect = (service: ServiceType | 'all') => {
    setFilter({ service });
    setServiceDropdownOpen(false);
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setInputValue(suggestion.text);
    setShowSuggestions(false);
  };

  const currentServiceLabel =
    serviceOptions.find((o) => o.value === filter.service)?.label || '全部服务';

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="flex flex-col sm:flex-row gap-3">
        <div ref={containerRef} className="relative flex-1">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              placeholder="搜索故障标题、错误码..."
              className={cn(
                'w-full h-12 pl-12 pr-4 rounded-xl border border-slate-200',
                'bg-white text-slate-900 placeholder-slate-400',
                'text-base shadow-sm',
                'focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500',
                'transition-all duration-200'
              )}
            />
          </div>

          {showSuggestions && suggestions.length > 0 && (
            <div
              className={cn(
                'absolute top-full left-0 right-0 mt-2 z-50',
                'bg-white rounded-xl border border-slate-200 shadow-xl',
                'overflow-hidden animate-in slide-in-from-top-2 duration-200'
              )}
            >
              <div className="px-3 py-2 text-xs font-medium text-slate-500 border-b border-slate-100 bg-slate-50">
                搜索建议
              </div>
              <ul className="max-h-80 overflow-y-auto py-1">
                {suggestions.map((suggestion) => (
                  <li key={suggestion.id}>
                    <button
                      type="button"
                      onClick={() => handleSuggestionClick(suggestion)}
                      className={cn(
                        'w-full px-4 py-2.5 text-left flex items-center gap-3',
                        'hover:bg-slate-50 transition-colors'
                      )}
                    >
                      <span
                        className={cn(
                          'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                          suggestion.type === 'title'
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-purple-50 text-purple-700'
                        )}
                      >
                        {suggestion.type === 'title' ? '标题' : '错误码'}
                      </span>
                      <span className="flex-1 text-sm text-slate-700 truncate">
                        {suggestion.text}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div ref={serviceDropdownRef} className="relative">
          <button
            type="button"
            onClick={() => setServiceDropdownOpen(!serviceDropdownOpen)}
            className={cn(
              'h-12 px-4 rounded-xl border border-slate-200 bg-white',
              'flex items-center gap-2 shadow-sm',
              'text-slate-700 font-medium text-sm',
              'hover:bg-slate-50 transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500'
            )}
          >
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">{currentServiceLabel}</span>
            <ChevronDown
              className={cn(
                'h-4 w-4 transition-transform duration-200',
                serviceDropdownOpen && 'rotate-180'
              )}
            />
          </button>

          {serviceDropdownOpen && (
            <div
              className={cn(
                'absolute top-full right-0 mt-2 z-50 w-48',
                'bg-white rounded-xl border border-slate-200 shadow-xl',
                'overflow-hidden animate-in slide-in-from-top-2 duration-200'
              )}
            >
              <ul className="py-1 max-h-72 overflow-y-auto">
                {serviceOptions.map((option) => (
                  <li key={option.value}>
                    <button
                      type="button"
                      onClick={() => handleServiceSelect(option.value)}
                      className={cn(
                        'w-full px-4 py-2.5 text-left text-sm transition-colors',
                        filter.service === option.value
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
      </div>
    </div>
  );
}
